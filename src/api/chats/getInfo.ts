import { UserError } from '$server';
import { SupabaseClient } from '@supabase/supabase-js';
import { getRequestJSON, parseToken } from '$utils';
import { ChatInfoRequest } from '$users/types';

export async function getInfo(
	request: Request,
	dbClient: SupabaseClient
): Promise<Response> {
	const options = await getRequestJSON<ChatInfoRequest>(request);

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

	const { data: chatUsers } = await dbClient
		.from('chats')
		.select('users')
		.eq('id', options.id);

	if (!chatUsers?.length) {
		throw UserError('Chat not found.');
	} else if (!chatUsers[0].users.includes(user[0].id)) {
		throw UserError('User not part of that chat.');
	}

	const { data: chatName } = await dbClient
		.from('chats')
		.select('name')
		.eq('id', options.id);

	const response = {
		users: chatUsers[0].users,
		name: chatName![0].name
	};

	return new Response(JSON.stringify(response));
}
