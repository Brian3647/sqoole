import { ServerError, UserError } from '$server';
import { SupabaseClient } from '@supabase/supabase-js';
import { User } from './types';
import { createB64ID, createToken, getRequestJSON } from '$utils';

export async function createUser(
	request: Request,
	dbClient: SupabaseClient
): Promise<Response> {
	const options = await getRequestJSON<User>(request);

	if (!options || !options.username || !options.password) {
		throw UserError('Missing fields.');
	}

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

	const newUser: User = {
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

	const returnObject = JSON.stringify({
		token: createToken(newUser.username, newUser.password)
	});

	return new Response(returnObject);
}
