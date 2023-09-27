import { Server as BunServer, ServerWebSocket } from 'bun';
import handleMessage from './message';
import { SupabaseClient } from '@supabase/supabase-js';
import { UserError } from '$server*';

export type WebSocketData = {
	createdAt: number;
	channelId: string;
	authToken: string;
};

let databaseClient: SupabaseClient;

export default class WebSocketServer {
	constructor(dbClient: SupabaseClient) {
		databaseClient = dbClient;
	}

	public upgrade(request: Request, server: BunServer): Response | undefined {
		const urlParams = new URLSearchParams(request.url);

		const success = server.upgrade(request, {
			data: {
				createdAt: Date.now(),
				channelId: urlParams.get('chat'),
				authToken: urlParams.get('token')
			}
		});

		if (success)
			return new Response('WebSocket upgrade error', { status: 500 });

		throw UserError('Missing data or upgrade failed');
	}

	public async message(ws: ServerWebSocket<WebSocketData>, message: string) {
		const response = await handleMessage(ws, message, databaseClient);
		ws.send(JSON.stringify(response || {}));
	}

	public async open(ws: ServerWebSocket<WebSocketData>) {
		// TODO:
	}
}
