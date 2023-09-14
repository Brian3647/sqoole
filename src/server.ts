import { Result } from '$utils/result.ts';
import staticHandler from './static.ts';
import apiHandler from './api/api.ts';
import path from 'node:path';
import { SupabaseClient } from '@supabase/supabase-js';

const files = path.join(import.meta.dir, '..', 'web', 'dist');
let databaseClient: SupabaseClient;

export default class Server {
	port!: number;
	dbClient!: SupabaseClient;

	constructor(port: number, dbClient: SupabaseClient) {
		this.port = port;
		databaseClient = dbClient;
	}

	async fetch(request: Request): Promise<Response> {
		const server_response = await handleRequest(request, files, databaseClient);
		if (server_response.isOk()) return server_response.value as Response;

		let error = server_response.value as ServerError;
		if (error === undefined) {
			error = new ServerError(
				'Unknown',
				'Unknown server error, probably due to lack of error handling.',
				500
			);
		}

		error.log(request.url);
		return error.intoResponse();
	}

	public start() {
		Bun.serve({
			port: this.port,
			fetch: this.fetch
		});
	}
}

async function handleRequest(
	request: Request,
	files: string,
	dbClient: SupabaseClient
): Promise<Result<Response, ServerError>> {
	const path = request.url.split('/').slice(3);

	if (path[0] === 'api') {
		return await apiHandler(path, request, dbClient);
	} else {
		return staticHandler(path, files);
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
		return new Response(
			`[${this.errorType.toUpperCase()} ERROR] status: ${this.status}\n` +
				`WITH ERROR MESSAGE: '${this.message}'`,
			{ status: this.status }
		);
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
