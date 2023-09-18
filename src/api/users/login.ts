import { UserError } from '$server';
import { SupabaseClient } from '@supabase/supabase-js';
import { User } from './types';
import { createToken, getRequestJSON } from '$utils';

export async function login(
	request: Request,
	dbClient: SupabaseClient
): Promise<Response> {
	const options = await getRequestJSON<User>(request);

	if (!options || !options.username || !options.password) {
		throw UserError('Missing fields.');
	}

	const { data: users } = await dbClient
		.from('users')
		.select('*')
		.eq('username', options.username);

	if (!users?.length) {
		throw UserError(`No user found with username ${options.username}`);
	}

	const user = users[0];

	const validPassword = await Bun.password.verify(
		options.password,
		user.password
	);

	if (!validPassword) {
		throw UserError('Invalid password provided.');
	}

	const returnObject = JSON.stringify({
		token: createToken(user.username, user.password)
	});

	return new Response(returnObject);
}
