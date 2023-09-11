import { ServerError } from './server';
import { Ok, Error, Result } from './utils/result';
import { debug } from './utils/log';
import path from 'node:path';
import { readFileSync } from 'node:fs';

export default function static_handler(
	url: string[],
	files: string
): Result<Response, ServerError> {
	if (url[0] === '') {
		return read(files, 'index.html', true);
	}

	if (url.includes('..')) {
		return Error(
			new ServerError('User', 'Attempt to access local files.', 400)
		);
	}

	return read(files, url.join('/'), false);
}

function read(
	files: string,
	selected: string,
	shouldExist: boolean,
	code?: number
): Result<Response, ServerError> {
	selected = path.join(files, selected);
	const bunFile = Bun.file(selected);

	if (bunFile.size === 0) {
		if (shouldExist) {
			return Error(
				new ServerError('Database', 'File that should exist not found.', 500)
			);
		}

		return read(files, '404.html', true, 404);
	}

	const fileContents = readFileSync(selected).toString();

	return Ok(
		new Response(fileContents, {
			headers: { 'Content-Type': bunFile.type },
			status: code ?? 200
		})
	);
}
