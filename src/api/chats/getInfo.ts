import { ServerError } from '$server';
import { Error, Ok, Result } from '$utils/result';
import { SupabaseClient } from '@supabase/supabase-js';
import { getRequestJSON, parseToken } from '$utils/general';
import { ChatInfoRequest } from '$users/types';

export async function getInfo(
	request: Request,
	dbClient: SupabaseClient
): Promise<Result<Response, ServerError>> {
	const requestBody = await getRequestJSON<ChatInfoRequest, ServerError>(
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

	const { data: chatUsers } = await dbClient
		.from('chats')
		.select('users')
		.eq('id', options.id);

	if (!chatUsers?.length) {
		return Error(new ServerError('User', 'Chat not found.', 400));
	} else if (!chatUsers[0].users.includes(user[0].id)) {
		return Error(new ServerError('User', 'User not part of that chat.', 400));
	}

	const { data: chatName } = await dbClient
		.from('chats')
		.select('name')
		.eq('id', options.id);

	const response = {
		users: chatUsers[0].users,
		name: chatName![0].name
	};

	return Ok(new Response(JSON.stringify(response)));
}
