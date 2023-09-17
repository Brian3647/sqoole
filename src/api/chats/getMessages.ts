import { ServerError } from '$server';
import { Error, Ok, Result } from '$utils/result';
import { SupabaseClient } from '@supabase/supabase-js';
import { getRequestJSON, parseToken } from '$utils/general';
import { ChatMessagesRequest } from '$users/types';

const messagesPerPage = 20;

export async function getMessages(
	request: Request,
	dbClient: SupabaseClient
): Promise<Result<Response, ServerError>> {
	const requestBody = await getRequestJSON<ChatMessagesRequest, ServerError>(
		request,
		new ServerError('User', 'Invalid JSON object.', 400)
	);

	if (requestBody.isError()) {
		return Error(requestBody.unwrapError());
	}

	const options = requestBody.unwrap();

	if (!options || !options.id || !options.token) {
		return Error(new ServerError('User', 'Missing fields.', 400));
	}

	const userData = parseToken(options.token).unwrapOr({
		username: '',
		password: ''
	});

	const { data: possibleUser } = await dbClient
		.from('users')
		.select('*')
		.eq('username', userData.username)
		.eq('password', userData.password);

	if (!possibleUser?.length) {
		return Error(
			new ServerError('User', 'Invalid token: user not found.', 400)
		);
	}

	const { data: chat } = await dbClient
		.from('chats')
		.select('users')
		.eq('id', options.id);

	if (!chat?.length) {
		return Error(new ServerError('User', 'Chat not found.', 400));
	} else if (!chat[0].users.includes(possibleUser[0].id)) {
		return Error(new ServerError('User', 'User not part of that chat.', 400));
	}

	const rangeStart = messagesPerPage * (options.page || 0);
	const { data: unPreparedMessages } = await dbClient
		.from('chats')
		.select('messages')
		.eq('id', options.id)
		.range(rangeStart, rangeStart + messagesPerPage);

	const messages = (unPreparedMessages && unPreparedMessages[0].messages) || [];

	return Ok(new Response(JSON.stringify(messages)));
}
