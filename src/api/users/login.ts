import { ServerError } from '../../server';
import { Error, Ok, Result } from '../../utils/result';
import { SupabaseClient } from '@supabase/supabase-js';
import { User } from './types';

export async function login(
	request: Request,
	dbClient: SupabaseClient
): Promise<Result<Response, ServerError>> {
	const requestBody = await request.text();

	if (!requestBody) {
		return Error(new ServerError('User', 'Missing body in request', 400));
	}

	let options: User;

	try {
		options = JSON.parse(requestBody);
	} catch (optionsError) {
		return Error(
			new ServerError(
				'User',
				'Invalid body: needs to be able to be parsed by `JSON.parse`.',
				400
			)
		);
	}

	if (!options || !options.username || !options.password) {
		return Error(
			new ServerError('User', 'Missing fields on required JSON object', 400)
		);
	}

	const { data: users } = await dbClient
		.from('users')
		.select('*')
		.eq('username', options.username);

	if (users!.length === 0) {
		return Error(
			new ServerError(
				'User',
				`No user found with username ${options.username}`,
				400
			)
		);
	}

	const validPassword = await Bun.password.verify(
		options.password,
		users![0].password
	);

	if (!validPassword) {
		return Error(new ServerError('User', 'Invalid password provided.', 400));
	}

	const returnObject = JSON.stringify({
		token: users![0].password
	});

	return Ok(new Response(returnObject));
}
