import { ServerError } from '$server';
import { Error, Ok, Result } from '$utils/result';
import { SupabaseClient } from '@supabase/supabase-js';
import { getRequestJSON, parseToken } from '$utils/general';
import { ChatDeletionRequest } from '$users/types';

export async function deleteChat(
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

	const { data: requestedChat } = await dbClient
		.from('chats')
		.select('owner')
		.eq('id', options.id);

	if (!requestedChat?.length) {
		return Error(new ServerError('User', 'Requested chat not found.', 400));
	} else if (requestedChat[0].owner !== user[0].id) {
		return Error(
			new ServerError(
				'User',
				'Invalid token: user is not the owner of the chat.',
				400
			)
		);
	}

	await dbClient.from('chats').delete().eq('id', options.id);

	return Ok(new Response('OK.'));
}
