import { ServerError, UserError } from '$server';
import { SupabaseClient } from '@supabase/supabase-js';
import { AuthorisedRequest, User } from './types';
import { getRequestJSON, parseToken } from '$utils';

export async function deleteUser(
	request: Request,
	dbClient: SupabaseClient
): Promise<Response> {
	const options = await getRequestJSON<AuthorisedRequest>(request);

	if (!options || !options.token) {
		throw UserError('Missing fields.');
	}

	const userData = parseToken(options.token);

	const { data: user } = await dbClient
		.from('users')
		.select('*')
		.eq('username', userData.username)
		.eq('password', userData.password);

	if (!user?.length) {
		throw new ServerError(
			'User',
			'Invalid username or password in token.',
			400
		);
	}

	const { error } = await dbClient.from('users').delete().eq('id', user[0].id);

	if (error) {
		throw new ServerError(
			'Database',
			'Internal server error updating the database.',
			500
		);
	}

	return new Response(JSON.stringify({}));
}
