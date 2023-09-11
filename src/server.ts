import { debug } from './utils/log.ts';
import { Ok, Result } from './utils/result.ts';
import static_handler from './static.ts';
import api_handler from './api/handler.ts';
import path from 'node:path';

const files = path.join(import.meta.dir, '..', 'web', 'dist');

export default class Server {
	port!: number;

	constructor(port: number) {
		this.port = port;
	}

	public start() {
		Bun.serve({
			port: this.port,
			fetch(request: Request): Response {
				const server_response = handleRequest(request, files);

				return server_response.unwrapOr((error): Response => {
					if (error === undefined) {
						error = new ServerError(
							'Unknown',
							'Unknown server error, probably due to lack of error handling.',
							500
						);
					}

					error.log();
					console.error(request.url);
					return error.intoResponse();
				});
			}
		});
	}
}

function handleRequest(
	request: Request,
	files: string
): Result<Response, ServerError> {
	const path = request.url.split('/').slice(3);

	let handler_response;

	if (path[0] === 'api') {
		handler_response = api_handler(path, request);
	} else {
		handler_response = static_handler(path, files);
	}

	return handler_response;
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

	public log() {
		if (this.errorType === 'User') return;

		console.error(
			`[INTERNAL SERVER ERROR] [TYPE: ${this.errorType}]: ${this.message}`
		);
	}
}
