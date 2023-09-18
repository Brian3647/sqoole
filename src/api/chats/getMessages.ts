import { UserError } from '$server';
import { SupabaseClient } from '@supabase/supabase-js';
import { getRequestJSON, parseToken } from '$utils';
import { ChatMessagesRequest } from '$users/types';

const messagesPerPage = 20;

export async function getMessages(
	request: Request,
	dbClient: SupabaseClient
): Promise<Response> {
	const options = await getRequestJSON<ChatMessagesRequest>(request);

	if (!options || !options.id || !options.token) {
		throw UserError('Missing fields.');
	}

	const userData = parseToken(options.token);

	const { data: possibleUser } = await dbClient
		.from('users')
		.select('*')
		.eq('username', userData.username)
		.eq('password', userData.password);

	if (!possibleUser?.length) {
		throw UserError('Invalid token: user not found.');
	}

	const { data: chat } = await dbClient
		.from('chats')
		.select('users')
		.eq('id', options.id);

	if (!chat?.length) {
		throw UserError('Chat not found.');
	} else if (!chat[0].users.includes(possibleUser[0].id)) {
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
