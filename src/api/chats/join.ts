import { UserError } from '$server';
import { SupabaseClient } from '@supabase/supabase-js';
import { getOptions, getUser } from '$utils';
import { ChatDeletionRequest } from '$users/types';

const maxUsersInChat = 80;

export async function joinChat(
	request: Request,
	dbClient: SupabaseClient
): Promise<Response> {
	const fields = ['id', 'token'];
	const options = await getOptions<ChatDeletionRequest>(request, fields);

	const user = await getUser(dbClient, options.token);

	const { data: chat } = await dbClient
		.from('chats')
		.select('users')
		.eq('id', options.id);

	if (!chat?.length) {
		throw UserError('Requested chat not found.');
	} else if (chat[0].users.includes(user.id)) {
		throw UserError('User is already in specified chat.');
	} else if (chat[0].users.length >= maxUsersInChat) {
		throw UserError(`The chat is full (max of ${maxUsersInChat})`);
	}

	await dbClient
		.from('chats')
		.update({ users: [...chat[0].users, user.id] })
		.eq('id', options.id);

	return new Response('{}');
}
