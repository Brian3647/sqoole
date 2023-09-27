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

	const { data: chat } = await dbClient
		.from('chats')
		.select('users, name, owner')
		.eq('id', options.id);

	if (!chat?.length) {
		throw UserError('Chat not found.');
	} else if (!chat[0].users.includes(user.id)) {
		throw UserError('User not part of that chat.');
	}

	const response = {
		users: chat[0].users,
		name: chat[0].name,
		owner: chat[0].owner
	};

	return new Response(JSON.stringify(response));
}
