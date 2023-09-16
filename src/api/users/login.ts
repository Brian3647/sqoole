import { ServerError } from '$server';
import { Error, Ok, Result } from '$utils/result';
import { SupabaseClient } from '@supabase/supabase-js';
import { User } from './types';
import { createToken, getRequestJSON } from '$utils/general';

export async function login(
	request: Request,
	dbClient: SupabaseClient
): Promise<Result<Response, ServerError>> {
	const requestBody = await getRequestJSON<User, ServerError>(
		request,
		new ServerError('User', 'Invalid JSON object.', 400)
	);

	if (requestBody.isError()) {
		return Error(requestBody.unwrapError());
	}

	const options = requestBody.unwrap();

	if (!options || !options.username || !options.password) {
		return Error(new ServerError('User', 'Missing fields.', 400));
	}

	const { data: users } = await dbClient
		.from('users')
		.select('*')
		.eq('username', options.username);

	if (!users?.length) {
		return Error(
			new ServerError(
				'User',
				`No user found with username ${options.username}`,
				400
			)
		);
	}

	const user = users[0];

	const validPassword = await Bun.password.verify(
		options.password,
		user.password
	);

	if (!validPassword) {
		return Error(new ServerError('User', 'Invalid password provided.', 400));
	}

	const returnObject = JSON.stringify({
		token: createToken(user.username, user.password)
	});

	return Ok(new Response(returnObject));
}
