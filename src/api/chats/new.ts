import { ServerError, UserError } from '$server';
import { SupabaseClient } from '@supabase/supabase-js';
import { Chat } from './types';
import { createB64ID, getOptions, getUser } from '$utils';
import { ChatCreationRequest } from '$users/types';

export async function createChat(
	req: Request,
	dbClient: SupabaseClient
): Promise<Response> {
	const fields = ['name', 'token', 'days_until_deletion'];
	const options = await getOptions<ChatCreationRequest>(req, fields);

	const daysUntilDeletion = Number(options.days_until_deletion);
	if (
		Number.isNaN(daysUntilDeletion) ||
		!daysUntilDeletion ||
		daysUntilDeletion <= 0 ||
		daysUntilDeletion >= 7
	) {
		throw UserError(
			'Invalid days_until_deletion field. Must be a number greater than 0 and smaller than 7.'
		);
	}

	if (options.name.length > 80) {
		throw UserError('Chat name too long.');
	}

	const user = await getUser(dbClient, options.token);

	if (!user || (user.in_chats || []).length >= 50) {
		throw new ServerError(
			'User',
			'User is in too many chats or has not been found.',
			400
		);
	}

	let id: string = '';
	let possibleChat = [{ hello: ':)' }];

	while (possibleChat.length !== 0) {
		const { data: possibleChatTry } = await dbClient
			.from('chats')
			.select('*')
			.eq('id', id);

		id = createB64ID();
		possibleChat = possibleChatTry || [];
	}

	let deletedAt: string | number = Date.now();
	deletedAt = deletedAt + daysUntilDeletion * 86400000;
	deletedAt = new Date(deletedAt).toISOString();

	const newChat: Chat = {
		id: id!,
		users: [user.id],
		name: options.name,
		messages: [
			{
				author: 'system',
				text: `~> ${user.username} created **${options.name}**! (id: ${id!})`,
				created_at: Date.now()
			}
		],
		owner: user.id,
		deleted_at: deletedAt
	};

	const { error } = await dbClient.from('chats').insert([newChat]).select();

	if (error) {
		console.error(error);
		throw new ServerError(
			'Database',
			'Internal database error creating chat.',
			500
		);
	}

	await dbClient
		.from('users')
		.update({ in_chats: [...user.in_chats, newChat.id] })
		.eq('id', user.id);

	return new Response(JSON.stringify({ id: newChat.id }));
}
