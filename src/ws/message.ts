import { ServerWebSocket } from 'bun';
import { WebSocketData } from './server';
import { SupabaseClient } from '@supabase/supabase-js';
import { parseToken } from '$utils';
import { Message } from '$chats/types';
import { UserError } from '$server';

export default async function handleMessage(
	ws: ServerWebSocket<WebSocketData>,
	message: string,
	dbClient: SupabaseClient
): Promise<Message | undefined> {
	if (!ws.data.authToken || !ws.data.channelId) {
		return;
	}

	const loginData = parseToken(ws.data.authToken);

	const { data: user } = await dbClient
		.from('users')
		.select('*')
		.eq('username', loginData.username)
		.eq('password', loginData.password);

	if (!user?.length) {
		throw UserError('Invalid token: Wrong username or password');
	}

	const { data: chat } = await dbClient
		.from('chats')
		.select('*')
		.eq('id', ws.data.channelId);

	if (!chat?.length) {
		throw UserError('Requested chat not found.');
	} else if (!chat[0].users.includes(user[0].id)) {
		throw UserError("You aren't part of the requested chat room.");
	}

	return {
		author: user[0].id,
		text: message,
		created_at: Date.now()
	};
}
