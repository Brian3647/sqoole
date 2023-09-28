import { Session, UserError } from '$server';
import { SupabaseClient } from '@supabase/supabase-js';
import { getOptions, getSession } from '$utils';

const messagesPerPage = 20;

interface ChatMessagesRequest {
	id: string;
	session: string;
	page?: number;
}

export async function getMessages(
	request: Request,
	dbClient: SupabaseClient
): Promise<Response> {
	const options = await getOptions<ChatMessagesRequest>(request, ['id']);
	const { userId } = getSession(options.session);

	const { data: chat } = await dbClient
		.from('chats')
		.select('users')
		.eq('id', options.id);

	if (!chat?.length) {
		throw UserError('Chat not found.');
	} else if (!chat[0].users.includes(userId)) {
		throw UserError('User not part of that chat.');
	}

	const rangeStart = messagesPerPage * (options.page || 0);
	const { data: unPreparedMessages } = await dbClient
		.from('chats')
		.select('messages')
		.eq('id', options.id)
		.range(rangeStart, rangeStart + messagesPerPage);

	const messages = (unPreparedMessages && unPreparedMessages[0].messages) || [];

	return new Response(JSON.stringify(messages));
}
