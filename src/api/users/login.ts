import { UserError } from '$server';
import { SupabaseClient } from '@supabase/supabase-js';
import { User } from './types';
import { createToken, getOptions } from '$utils';
import { uncheckedOpenSession } from './openSession';

export async function login(
	request: Request,
	dbClient: SupabaseClient
): Promise<Response> {
	const options = await getOptions<User>(request, ['username', 'password']);

	const { data: users } = await dbClient
		.from('users')
		.select('id, created_at, updated_at, password, username, in_chats')
		.eq('username', options.username);

	if (!users?.length) {
		throw UserError('Wrong username or password.');
	}

	const user = users[0];

	const validPassword = await Bun.password.verify(
		options.password,
		user.password
	);

	if (!validPassword) {
		throw UserError('Wrong username or password.');
	}

	const token = createToken(user.username, user.password);
	const session = uncheckedOpenSession(token, user.id);

	return new Response(
		JSON.stringify({
			token,
			username: user.username,
			id: user.id,
			created_at: user.created_at,
			updated_at: user.updated_at,
			in_chats: user.in_chats,
			session
		})
	);
}
