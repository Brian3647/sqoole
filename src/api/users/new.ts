import { ServerError, UserError } from '$server';
import { SupabaseClient } from '@supabase/supabase-js';
import { User } from './types';
import { createB64ID, createToken, getOptions } from '$utils';
import { uncheckedOpenSession } from './openSession';

export async function createUser(
	request: Request,
	dbClient: SupabaseClient
): Promise<Response> {
	const options = await getOptions<User>(request, ['username', 'password']);

	if (options.password.length > 80 || options.username.length > 80) {
		throw UserError('Username or password too long. Max size is 80.');
	}

	const password = await Bun.password.hash(options.password);
	let id;
	let possibleUser = [''];

	while (possibleUser.length !== 0) {
		const { data: possibleUserTry } = await dbClient
			.from('users')
			.select('*')
			.eq('id', id);

		id = createB64ID();
		possibleUser = possibleUserTry || [];
	}

	let newUser: Partial<User> = {
		id: id!,
		password: password.toString(),
		username: options.username,
		in_chats: []
	};

	const { error } = await dbClient.from('users').insert([newUser]).select();

	if (error) {
		console.error(error);
		throw new ServerError(
			'Database',
			'Internal database error creating user.',
			500
		);
	}

	const token = createToken(newUser.username!, newUser.password!);
	const session = uncheckedOpenSession(token, newUser.id!);

	const returnObject = JSON.stringify({
		token,
		session,
		id
	});

	return new Response(returnObject);
}
