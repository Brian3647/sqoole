import { ServerError, UserError } from '$server';
import { SupabaseClient } from '@supabase/supabase-js';
import { NameChangeRequest, User } from './types';
import { createToken, debug, getRequestJSON, parseToken } from '$utils';

export async function usernameChange(
	request: Request,
	dbClient: SupabaseClient
): Promise<Response> {
	const options = await getRequestJSON<NameChangeRequest>(request);

	if (!options || !options.new_username || !options.token) {
		throw UserError('Missing fields.');
	}

	const userData = parseToken(options.token);

	const { data: usersFound } = await dbClient
		.from('users')
		.select('*')
		.eq('username', userData.username)
		.eq('password', userData.password);

	if (!usersFound?.length) {
		throw new ServerError(
			'User',
			'Invalid username or password in token.',
			400
		);
	}

	const user: User = usersFound[0];

	if (user.updated_at !== user.created_at && user.updated_at !== null) {
		const lastUpdated = Date.parse(user.updated_at || user.created_at!);
		const oneDay = 24 * 60 * 60 * 1000;
		const diffDays = Math.round(Math.abs((Date.now() - lastUpdated) / oneDay));

		if (diffDays < 30) {
			throw new ServerError(
				'User',
				'You can update your username only once every 30 days',
				400
			);
		}
	}

	const { error } = await dbClient
		.from('users')
		.update({ username: options.new_username })
		.eq('id', user.id);

	if (error) {
		throw new ServerError(
			'Database',
			'Internal server error updating the database.',
			500
		);
	}

	return new Response(
		JSON.stringify({
			old_name: user.username,
			new_name: options.new_username,
			new_token: createToken(options.new_username, user.password)
		})
	);
}
