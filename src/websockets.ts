import { Server as BunServer, ServerWebSocket } from 'bun';
import { SupabaseClient } from '@supabase/supabase-js';
import { UserError } from '$server*';
import { parseToken } from '$utils';

export type WebSocketData = {
	createdAt: number;
	channelId: string;
	authToken: string;
	userId: string;
};

let dbClient: SupabaseClient;

export default class WebSocketServer {
	constructor(databaseClient: SupabaseClient) {
		dbClient = databaseClient;
	}

	public upgrade(request: Request, server: BunServer): Response | undefined {
		const urlParams = new URLSearchParams(request.url);

		const success = server.upgrade(request, {
			data: {
				createdAt: Date.now(),
				channelId: urlParams.get('chat'),
				authToken: urlParams.get('token'),
				userId: urlParams.get('userId')
			}
		});

		if (!success) throw UserError('Missing data or upgrade failed');

		return new Response('{}');
	}

	public async message(ws: ServerWebSocket<WebSocketData>, message: string) {
		if (!ws.data.authToken || !ws.data.channelId || !ws.data.userId) {
			// Not a websocket request
			return;
		}

		const response = {
			author: ws.data.userId,
			text: message,
			created_at: Date.now()
		};

		ws.publish(ws.data.channelId, JSON.stringify(response));
	}

	public async open(ws: ServerWebSocket<WebSocketData>) {
		if (!ws.data.authToken || !ws.data.channelId || !ws.data.userId) {
			// Not a websocket request
			return;
		}

		const loginData = parseToken(ws.data.authToken);

		const { data: user } = await dbClient
			.from('users')
			.select('id')
			.eq('username', loginData.username)
			.eq('password', loginData.password);

		if (!user?.length) {
			throw UserError('Invalid token: Wrong username or password');
		} else if (user[0].id !== ws.data.userId) {
			throw UserError('Incorrect user ID.');
		}

		const { data: chat } = await dbClient
			.from('chats')
			.select('users')
			.eq('id', ws.data.channelId);

		if (!chat?.length) {
			throw UserError('Requested chat not found.');
		} else if (!chat[0].users.includes(user[0].id)) {
			throw UserError("You aren't part of the requested chat room.");
		}

		ws.subscribe(ws.data.channelId);
	}
}
