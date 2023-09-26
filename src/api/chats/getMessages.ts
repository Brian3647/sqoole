import { UserError } from '$server';
import { SupabaseClient } from '@supabase/supabase-js';
import { getOptions, getUser } from '$utils';
import { ChatMessagesRequest } from '$users/types';

const messagesPerPage = 20;

export async function getMessages(
	request: Request,
	dbClient: SupabaseClient
): Promise<Response> {
	const fields = ['id', 'token'];
	const options = await getOptions<ChatMessagesRequest>(request, fields);
	const user = await getUser(dbClient, options.token);

	const { data: chat } = await dbClient
		.from('chats')
		.select('users')
		.eq('id', options.id);

	if (!chat?.length) {
		throw UserError('Chat not found.');
	} else if (!chat[0].users.includes(user.id)) {
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
