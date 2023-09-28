import { Session, UserError } from '$server';
import { SupabaseClient } from '@supabase/supabase-js';
import { getOptions, getSession } from '$utils';

const maxUsersInChat = 80;

interface ChatDeletionRequest {
	id: string;
	session: string;
}

export async function joinChat(
	request: Request,
	dbClient: SupabaseClient
): Promise<Response> {
	const options = await getOptions<ChatDeletionRequest>(request, ['id']);
	const { userId } = getSession(options.session);

	const { data: chat } = await dbClient
		.from('chats')
		.select('users')
		.eq('id', options.id);

	if (!chat?.length) {
		throw UserError('Requested chat not found.');
	} else if (chat[0].users.includes(userId)) {
		throw UserError('User is already in specified chat.');
	} else if (chat[0].users.length >= maxUsersInChat) {
		throw UserError(`The chat is full (max of ${maxUsersInChat})`);
	}

	await dbClient
		.from('chats')
		.update({ users: [...chat[0].users, userId] })
		.eq('id', options.id);

	return new Response('{}');
}
