import { UserError } from '$server';
import { SupabaseClient } from '@supabase/supabase-js';
import { getRequestJSON, parseToken } from '$utils';
import { MessageSendRequest } from '$users/types';
import { Message } from './types';

export async function sendMessage(
	request: Request,
	dbClient: SupabaseClient
): Promise<Response> {
	const options = await getRequestJSON<MessageSendRequest>(request);

	if (!options || !options.token || !options.text || !options.channel) {
		throw UserError('Missing fields.');
	}

	const userData = parseToken(options.token);

	const { data: user } = await dbClient
		.from('users')
		.select('*')
		.eq('username', userData.username)
		.eq('password', userData.password);

	if (!user?.length) {
		throw UserError('Invalid token: user not found.');
	}

	const { data: chat } = await dbClient
		.from('chats')
		.select('*')
		.eq('id', options.channel);

	if (!chat?.length) {
		throw UserError('Requested chat not found.');
	} else if (!chat[0].users.includes(user[0].id)) {
		throw UserError('User is not in specified chat.');
	}

	const newMessage: Message = {
		author: user[0].id,
		text: options.text,
		created_at: Date.now()
	};

	await dbClient
		.from('chats')
		.update({ messages: [...chat[0].messages, newMessage] })
		.eq('id', options.channel);

	return new Response(JSON.stringify(newMessage));
}
