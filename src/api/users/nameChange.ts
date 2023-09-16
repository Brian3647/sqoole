import { ServerError } from '$server';
import { Error, Ok, Result } from '$utils/result';
import { SupabaseClient } from '@supabase/supabase-js';
import { NameChangeRequest, User } from './types';
import { debug, getRequestJSON, parseToken } from '$utils/general';

export async function usernameChange(
	request: Request,
	dbClient: SupabaseClient
): Promise<Result<Response, ServerError>> {
	const requestBody = await getRequestJSON<NameChangeRequest, ServerError>(
		request,
		new ServerError('User', 'Invalid JSON object.', 400)
	);

	if (requestBody.isError()) {
		return Error(requestBody.unwrapError());
	}

	const options = requestBody.value as NameChangeRequest;
	if (!options || !options.new_username || !options.token) {
		return Error(new ServerError('User', 'Missing fields.', 400));
	}

	const parsedToken = parseToken(options.token);

	if (parsedToken.isError()) {
		return Error(new ServerError('User', 'Invalid token.', 400));
	}

	const data = parsedToken.unwrap();
	const { data: usersFound } = await dbClient
		.from('users')
		.select('*')
		.eq('username', data.username)
		.eq('password', data.password);

	if (!usersFound?.length) {
		return Error(
			new ServerError('User', 'Invalid username or password in token.', 400)
		);
	}

	const user: User = usersFound[0];
	const lastUpdated = Date.parse(user.updated_at || user.created_at!);
	const oneDay = 24 * 60 * 60 * 1000;
	const diffDays = Math.round(Math.abs((Date.now() - lastUpdated) / oneDay));

	if (diffDays < 30) {
		return Error(
			new ServerError(
				'User',
				'You can update your username only once every 30 days',
				400
			)
		);
	}

	const { error } = await dbClient
		.from('users')
		.update({ username: options.new_username })
		.eq('id', user.id);

	if (error) {
		return Error(
			new ServerError(
				'Database',
				'Internal server error updating the database.',
				500
			)
		);
	}

	return Ok(
		new Response(
			JSON.stringify({
				old_name: user.username,
				new_name: options.new_username
			})
		)
	);
}
