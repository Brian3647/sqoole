import { ServerError } from '$server';
import { Error, Ok, Result } from '$utils/result';
import { SupabaseClient } from '@supabase/supabase-js';
import { getRequestJSON, parseToken } from '$utils/general';
import { MessageSendRequest } from '$users/types';
import { Message } from './types';

export async function sendMessage(
	request: Request,
	dbClient: SupabaseClient
): Promise<Result<Response, ServerError>> {
	const requestBody = await getRequestJSON<MessageSendRequest, ServerError>(
		request,
		new ServerError('User', 'Invalid JSON object.', 400)
	);

	if (requestBody.isError()) {
		return Error(requestBody.unwrapError());
	}

	const options = requestBody.unwrap();

	if (!options || !options.token || !options.text || !options.channel) {
		return Error(new ServerError('User', 'Missing fields.', 400));
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

	if (!user?.length) {
		return Error(
			new ServerError('User', 'Invalid token: user not found.', 400)
		);
	}

	const { data: chat } = await dbClient
		.from('chats')
		.select('*')
		.eq('id', options.channel);

	if (!chat?.length) {
		return Error(new ServerError('User', 'Requested chat not found.', 400));
	} else if (!chat[0].users.includes(user[0].id)) {
		return Error(
			new ServerError('User', 'User is not in specified chat.', 400)
		);
	}

	const newMessage: Message = {
		author: user[0].id,
		text: options.text,
		created_at: Date.now()
	};

	await dbClient
		.from('chats')
		.update({ messages: [...chat[0].messages, newMessage] })
		.eq('id', options.channel);

	return Ok(new Response(JSON.stringify(newMessage)));
}
