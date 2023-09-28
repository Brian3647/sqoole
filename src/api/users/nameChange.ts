import { ServerError } from '$server';
import { SupabaseClient } from '@supabase/supabase-js';
import { Fields, createToken, getOptions, getSession, getUser } from '$utils';
import { uncheckedOpenSession } from './openSession';

interface NameChangeRequest {
	new_username: string;
	session: string;
}

export async function usernameChange(
	request: Request,
	dbClient: SupabaseClient
): Promise<Response> {
	const fields: Fields<NameChangeRequest> = ['new_username', 'session'];
	const options = await getOptions<NameChangeRequest>(request, fields);
	const session = getSession(options.session);

	const user = await getUser(dbClient, session.token, [
		'created_at',
		'updated_at',
		'id',
		'username',
		'password'
	]);

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

	await dbClient
		.from('users')
		.update({ username: options.new_username })
		.eq('id', user.id);

	const token = createToken(options.new_username, user.password);

	return new Response(
		JSON.stringify({
			old_name: user.username,
			new_name: options.new_username,
			new_token: token,
			new_session: uncheckedOpenSession(token, user.id)
		})
	);
}
