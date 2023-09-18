import { UserError } from '$server';
import { SupabaseClient } from '@supabase/supabase-js';
import { debug, getRequestJSON, parseToken } from '$utils';
import { ChatDeletionRequest } from '$users/types';

export async function joinChat(
	request: Request,
	dbClient: SupabaseClient
): Promise<Response> {
	const requestBody = await getRequestJSON<ChatDeletionRequest>(request);

	if (requestBody.isError()) {
		throw requestBody.unwrapError();
	}

	const options = requestBody.unwrap();

	if (!options || !options.id || !options.token) {
		throw UserError('Missing fields.');
	}

	const userData = parseToken(options.token);

	const { data: user } = await dbClient
		.from('users')
		.select('*')
		.eq('username', userData.username)
		.eq('password', userData.password);

	if (!user?.length) {
		throw UserError('Invalid token: user not found.');
	}

	const { data: chat } = await dbClient
		.from('chats')
		.select('users')
		.eq('id', options.id);

	if (!chat?.length) {
		throw UserError('Requested chat not found.');
	} else if (chat[0].users.includes(user[0].id)) {
		throw UserError('User is already in specified chat.');
	}

	await dbClient
		.from('chats')
		.update({ users: [...chat[0].users, user[0].id] })
		.eq('id', options.id);

	return new Response(JSON.stringify({}));
}
