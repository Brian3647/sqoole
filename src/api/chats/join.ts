import { ServerError } from '$server';
import { Error, Ok, Result } from '$utils/result';
import { SupabaseClient } from '@supabase/supabase-js';
import { debug, getRequestJSON, parseToken } from '$utils/general';
import { ChatDeletionRequest } from '$users/types';

export async function joinChat(
	request: Request,
	dbClient: SupabaseClient
): Promise<Result<Response, ServerError>> {
	const requestBody = await getRequestJSON<ChatDeletionRequest, ServerError>(
		request,
		new ServerError('User', 'Invalid JSON object.', 400)
	);

	if (requestBody.isError()) {
		return Error(requestBody.unwrapError());
	}

	const options = requestBody.unwrap();

	if (!options || !options.id || !options.token) {
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
		.select('users')
		.eq('id', options.id);

	if (!chat?.length) {
		return Error(new ServerError('User', 'Requested chat not found.', 400));
	} else if (chat[0].users.includes(user[0].id)) {
		return Error(
			new ServerError('User', 'User is already in specified chat.', 400)
		);
	}

	await dbClient
		.from('chats')
		.update({ users: [...chat[0].users, user[0].id] })
		.eq('id', options.id);

	return Ok(new Response('OK.'));
}
