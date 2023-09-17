import { ServerError } from '$server';
import { Error, Ok, Result } from '$utils/result';
import { SupabaseClient } from '@supabase/supabase-js';
import { Chat } from './types';
import { createB64ID, getRequestJSON, parseToken } from '$utils/general';
import { ChatCreationRequest } from '$users/types';

export async function createChat(
	request: Request,
	dbClient: SupabaseClient
): Promise<Result<Response, ServerError>> {
	const requestBody = await getRequestJSON<ChatCreationRequest, ServerError>(
		request,
		new ServerError('User', 'Invalid JSON object.', 400)
	);

	if (requestBody.isError()) {
		return Error(requestBody.unwrapError());
	}

	const options = requestBody.unwrap();

	if (!options || !options.name || !options.token) {
		return Error(new ServerError('User', 'Missing fields.', 400));
	} else if (options.name.length > 80) {
		return Error(new ServerError('User', 'Chat name too long.', 400));
	}

	const userData = parseToken(options.token).unwrapOr({
		username: '',
		password: ''
	});

	const { data: user } = await dbClient
		.from('users')
		.select('*')
		.eq('username', userData.username)
		.eq('password', userData.password);

	if (!user || (user[0].in_chats || []).length >= 50) {
		return Error(
			new ServerError(
				'User',
				'User is in too many chats or has not been found.',
				400
			)
		);
	}

	let id: string = '';
	let possibleChat: Array<Chat> = [
		{ id: '', messages: [], users: [], name: '', owner: '' }
	];

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
		users: [user[0].id],
		name: options.name,
		messages: [
			{
				author: 'system',
				text: `~> ${user[0].username} created #${options.name}! (id: ${id!})`,
				created_at: Date.now()
			}
		],
		owner: user[0].id
	};

	const { error } = await dbClient.from('chats').insert([newChat]).select();

	if (error) {
		console.error(error);
		return Error(
			new ServerError('Database', 'Internal database error creating chat.', 500)
		);
	}

	await dbClient
		.from('users')
		.update({ in_chats: [...user[0].in_chats, newChat.id] })
		.eq('id', user[0].id);

	return Ok(new Response('OK.'));
}
