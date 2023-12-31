import staticHandler from './static.ts';
import apiHandler from './api/api.ts';
import path from 'node:path';
import { SupabaseClient } from '@supabase/supabase-js';
import WebSocketServer from './websockets.ts';
import { Server as BunServer } from 'bun';
import { RateLimiter } from './rateLimiter.ts';
import cleanDeletedChats from './api/chats/cleanDeletedChats.ts';
import schedule from 'node-schedule';

const files = path.join(import.meta.dir, '..', 'web', 'dist');
let databaseClient: SupabaseClient;
let webSocketServer: WebSocketServer;
let rateLimiter: RateLimiter;

export type Session = {
	userId: string;
	token: string;
};

export const sessions: Record<string, Session> = {};

export default class Server {
	port!: number | string;

	constructor(port: number | string, dbClient: SupabaseClient) {
		this.port = port;
		databaseClient = dbClient;
		webSocketServer = new WebSocketServer(dbClient);
		rateLimiter = new RateLimiter(10000, 30);
	}

	async fetch(
		request: Request,
		server: BunServer
	): Promise<Response | undefined> {
		if (request.url.includes('/ws'))
			return webSocketServer.upgrade(request, server);

		try {
			return handleRequest(request, files, databaseClient);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (error: any) {
			if (
				typeof error === 'string' &&
				!error.toLowerCase().includes('internal')
			) {
				return UserError(error).intoResponse();
			} else {
				if ('log' in error && 'intoResponse' in error) {
					error.log(request.url);
					return error.intoResponse();
				}

				return new ServerError(
					'Unknown',
					'Unknown server error: ' + JSON.stringify(error),
					500
				).intoResponse();
			}
		}
	}

	public async start() {
		cleanDeletedChats(databaseClient);
		schedule.scheduleJob('*/10 * * * *', () =>
			cleanDeletedChats(databaseClient)
		);

		Bun.serve({
			port: this.port,
			fetch: this.fetch,
			websocket: {
				message: webSocketServer.message,
				open: webSocketServer.open
			}
		});

		return console.log('Server ON');
	}
}

async function handleRequest(
	request: Request,
	files: string,
	dbClient: SupabaseClient
): Promise<Response> {
	const path = request.url.split('/').slice(3);

	if (path[0] === 'api') {
		const rateLimit = rateLimiter.check(request);
		if (rateLimit) return rateLimit;

		return await apiHandler(path, request, dbClient);
	} else {
		return await staticHandler(path, files);
	}
}

/// Server Error management

export type ServerErrorType = 'Database' | 'User' | 'Unknown';

export class ServerError {
	errorType!: ServerErrorType;
	message!: string;
	status!: number;

	constructor(errorType: ServerErrorType, message: string, status: number) {
		this.errorType = errorType;
		this.message = message;
		this.status = status;
	}

	public intoResponse(): Response {
		const response = {
			error: true,
			type: this.errorType,
			message: this.message,
			status: this.status
		};

		return new Response(JSON.stringify(response), { status: this.status });
	}

	public log(route?: string) {
		if (this.errorType === 'User') return;

		if (route) {
			console.error('Error with request to ' + route);
		}

		console.error(
			`[INTERNAL SERVER ERROR] [FROM: ${this.errorType}]: ${this.message}` +
				'\n---'
		);
	}
}

export const UserError = (body: string, status: number = 400) =>
	new ServerError('User', body, status);
