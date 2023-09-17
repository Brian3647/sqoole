import { ServerError } from '$server';
import { Error, Ok, Result } from '$utils/result';
import { SupabaseClient } from '@supabase/supabase-js';
import { getRequestJSON, parseToken } from '$utils/general';
import { AuthorisedRequest } from '$users/types';

export async function getChatsWithUser(
	request: Request,
	dbClient: SupabaseClient
): Promise<Result<Response, ServerError>> {
	const requestBody = await getRequestJSON<AuthorisedRequest, ServerError>(
		request,
		new ServerError('User', 'Invalid JSON object.', 400)
	);

	if (requestBody.isError()) {
		return Error(requestBody.unwrapError());
	}

	const options = requestBody.unwrap();

	if (!options || !options.token) {
		return Error(new ServerError('User', 'Missing fields.', 400));
	}

	const userData = parseToken(options.token).unwrapOr({
		username: '',
		password: ''
	});

	const { data: possibleUser } = await dbClient
		.from('users')
		.select('*')
		.eq('username', userData.username)
		.eq('password', userData.password);

	if (!possibleUser?.length) {
		return Error(
			new ServerError('User', 'Invalid token: user not found.', 400)
		);
	}

	const chats = possibleUser[0].in_chats;
	return Ok(new Response(JSON.stringify(chats)));
}
