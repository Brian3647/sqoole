import { Server as BunServer, ServerWebSocket } from 'bun';
import handleMessage from './message';
import { SupabaseClient } from '@supabase/supabase-js';
import { debug } from '$utils/general';

export type WebSocketData = {
	createdAt: number;
	channelId: string;
	authToken: string;
};

export default class WebSocketServer {
	dbClient!: SupabaseClient;

	constructor(dbClient: SupabaseClient) {
		this.dbClient = dbClient;
	}

	public upgrade(request: Request, server: BunServer): Response | undefined {
		const success = server.upgrade(request, {
			data: {
				createdAt: Date.now(),
				channelId: request.headers.get('X-ChannelId') || '',
				authToken: request.headers.get('X-Token') || ''
			}
		});

		return success
			? undefined
			: new Response('WebSocket upgrade error', { status: 500 });
	}

	async message(ws: ServerWebSocket<WebSocketData>, message: string) {
		const response = await handleMessage(ws, message, this.dbClient);
		ws.send(JSON.stringify(response));
	}
}
