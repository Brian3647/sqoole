import { ServerError } from '$server';
import { Error, Ok, Result } from '$utils/result';
import { SupabaseClient } from '@supabase/supabase-js';
import { User } from './types';
import { createB64ID, createToken, getRequestJSON } from '$utils/general';

export async function createUser(
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

	if (options.password.length > 80 || options.username.length > 80) {
		return Error(
			new ServerError(
				'User',
				'Username or password too long. Max size is 80.',
				400
			)
		);
	}

	const password = await Bun.password.hash(options.password);
	let id;
	let possibleUser: Array<User> = [{ id: '', username: '', password: '' }];

	while (possibleUser.length !== 0) {
		const { data: possibleUserTry } = await dbClient
			.from('users')
			.select('*')
			.eq('id', id);

		id = createB64ID();
		possibleUser = possibleUserTry || [];
	}

	const newUser: User = {
		id: id!,
		password: password.toString(),
		username: options.username
	};

	const { error } = await dbClient.from('users').insert([newUser]).select();

	if (error) {
		console.error(error);
		return Error(
			new ServerError('Database', 'Internal database error creating user.', 500)
		);
	}

	const returnObject = JSON.stringify({
		token: createToken(newUser.username, newUser.password)
	});

	return Ok(new Response(returnObject));
}
