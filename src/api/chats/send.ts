import { UserError } from '$server';
import { SupabaseClient } from '@supabase/supabase-js';
import { Fields, getOptions, getSession } from '$utils';
import { Message } from './types';

interface MessageSendRequest {
	channel: string;
	text: string;
	session: string;
}

// Will use in the future for WS.
async function send<T = Message>(
	dbClient: SupabaseClient,
	options: MessageSendRequest,
	newMessage: T,
	userId: string
): Promise<T> {
	const { data: chat } = await dbClient
		.from('chats')
		.select('*')
		.eq('id', options.channel);

	if (!chat?.length) {
		throw UserError('Requested chat not found.');
	} else if (!chat[0].users.includes(userId)) {
		throw UserError('User is not in specified chat.');
	}

	await dbClient
		.from('chats')
		.update({ messages: [...chat[0].messages, newMessage] })
		.eq('id', options.channel);

	return newMessage;
}

export async function sendMessage(
	request: Request,
	dbClient: SupabaseClient
): Promise<Response> {
	const fields: Fields<MessageSendRequest> = ['text', 'channel', 'session'];
	const options = await getOptions<MessageSendRequest>(request, fields);
	const { userId } = getSession(options.session);

	const newMessage: Message = {
		author: userId,
		text: options.text,
		created_at: Date.now()
	};

	return new Response(
		JSON.stringify(send(dbClient, options, newMessage, userId))
	);
}
