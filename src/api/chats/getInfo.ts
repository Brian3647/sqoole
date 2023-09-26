import { UserError } from '$server';
import { SupabaseClient } from '@supabase/supabase-js';
import { getOptions, getUser } from '$utils';
import { ChatInfoRequest } from '$users/types';

export async function getInfo(
	request: Request,
	dbClient: SupabaseClient
): Promise<Response> {
	const options = await getOptions<ChatInfoRequest>(request, ['id', 'token']);
	const user = await getUser(dbClient, options.token);

	const { data: chatUsers } = await dbClient
		.from('chats')
		.select('users')
		.eq('id', options.id);

	if (!chatUsers?.length) {
		throw UserError('Chat not found.');
	} else if (!chatUsers[0].users.includes(user.id)) {
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
