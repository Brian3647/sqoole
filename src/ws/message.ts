import { ServerWebSocket } from 'bun';
import { WebSocketData } from './server';
import { SupabaseClient } from '@supabase/supabase-js';
import { parseToken } from '$utils/general';
import { Message } from '$chats/types';

export default async function handleMessage(
	ws: ServerWebSocket<WebSocketData>,
	message: string,
	dbClient: SupabaseClient
): Promise<string | Message> {
	if (!ws.data.authToken || !ws.data.channelId) {
		return 'Missing auth token or channel ID';
	}

	const possibleLoginData = parseToken(ws.data.authToken);
	if (possibleLoginData.isError()) return possibleLoginData.value! as string;
	const loginData = possibleLoginData.unwrap();

	const { data: user } = await dbClient
		.from('users')
		.select('*')
		.eq('username', loginData.username)
		.eq('password', loginData.password);

	if (!user?.length) {
		return 'Invalid token: Wrong username or password';
	}

	const { data: chat } = await dbClient
		.from('chats')
		.select('*')
		.eq('id', ws.data.channelId);

	if (!chat?.length) {
		return 'Requested chat not found.';
	} else if (!chat[0].users.includes(user[0].id)) {
		return "You aren't part of the requested chat room.";
	}

	return {
		author: user[0].id,
		text: message,
		created_at: Date.now()
	};
}
