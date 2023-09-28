import { ServerError, UserError } from '$server';
import { SupabaseClient } from '@supabase/supabase-js';
import { Chat } from './types';
import { Fields, createB64ID, getOptions, getSession, getUser } from '$utils';

interface ChatCreationRequest {
	name: string;
	days_until_deletion: number;
	session: string;
}

export async function createChat(
	req: Request,
	dbClient: SupabaseClient
): Promise<Response> {
	const fields: Fields<ChatCreationRequest> = ['name', 'days_until_deletion'];
	const options = await getOptions<ChatCreationRequest>(req, fields);
	const session = getSession(options.session);

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

	const user = await getUser(dbClient, session.token, [
		'in_chats',
		'id',
		'username'
	]);

	if (!user || (user.in_chats || []).length >= 50) {
		throw new ServerError(
			'User',
			'User is in too many chats or has not been found.',
			400
		);
	}

	let id: string = createB64ID();
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

	await dbClient.from('chats').insert([newChat]).select();

	await dbClient
		.from('users')
		.update({ in_chats: [...user.in_chats, newChat.id] })
		.eq('id', user.id);

	return new Response(JSON.stringify(newChat));
}
