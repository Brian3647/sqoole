import { UserError } from '$server';
import { SupabaseClient } from '@supabase/supabase-js';
import { getOptions, getUser } from '$utils';
import { MessageSendRequest } from '$users/types';
import { Message } from './types';

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
	const fields = ['token', 'text', 'channel'];
	const options = await getOptions<MessageSendRequest>(request, fields);
	const user = await getUser(dbClient, options.token);

	const newMessage: Message = {
		author: user.id,
		text: options.text,
		created_at: Date.now()
	};

	return new Response(
		JSON.stringify(send(dbClient, options, newMessage, user.id))
	);
}
