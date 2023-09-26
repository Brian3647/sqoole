import { ServerError, UserError } from '$server';
import { SupabaseClient } from '@supabase/supabase-js';
import { Chat } from './types';
import { createB64ID, getOptions, getUser } from '$utils';
import { ChatCreationRequest } from '$users/types';

export async function createChat(
	req: Request,
	dbClient: SupabaseClient
): Promise<Response> {
	const fields = ['name', 'token'];
	const options = await getOptions<ChatCreationRequest>(req, fields);

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

	const newChat: Chat = {
		id: id!,
		users: [user.id],
		name: options.name,
		messages: [
			{
				author: 'system',
				text: `~> ${user.username} created #${options.name}! (id: ${id!})`,
				created_at: Date.now()
			}
		],
		owner: user.id
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

	return new Response('{}');
}
