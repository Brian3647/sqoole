import { UserError } from '$server';
import { SupabaseClient } from '@supabase/supabase-js';
import { User } from './types';
import { createToken, getOptions } from '$utils';

export async function login(
	request: Request,
	dbClient: SupabaseClient,
	ip: string
): Promise<Response> {
	const options = await getOptions<User>(request, ['username', 'password']);

	const { data: users } = await dbClient
		.from('users')
		.select('*')
		.eq('username', options.username);

	if (!users?.length) {
		throw UserError('Wrong username or password.');
	}

	const user: User = users[0];

	const validPassword = await Bun.password.verify(
		options.password,
		user.password
	);

	if (!validPassword) {
		throw UserError('Wrong username or password.');
	} else if (!user.ips.includes(ip) && ip !== '127.0.0.1') {
		await dbClient
			.from('users')
			.update({ ips: [...user.ips, ip] })
			.eq('id', user.id);
	}

	return new Response(
		JSON.stringify({
			token: createToken(user.username, user.password),
			username: user.username,
			id: user.id,
			created_at: user.created_at,
			updated_at: user.updated_at,
			in_chats: user.in_chats
		})
	);
}
