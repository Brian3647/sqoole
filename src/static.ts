import { ServerError } from '$server';
import { Ok, Error, Result } from '$utils/result';
import path from 'node:path';
import { readFileSync } from 'node:fs';

export default async function staticHandler(
	url: string[],
	files: string
): Promise<Result<Response, ServerError>> {
	if (url[0] === '') {
		return read(files, 'index.html', true);
	}

	if (url.includes('..')) {
		return Error(
			new ServerError('User', 'Attempt to access local files.', 400)
		);
	}

	return await read(files, url.join('/'), false);
}

async function read(
	files: string,
	selected: string,
	shouldExist: boolean,
	code?: number
): Promise<Result<Response, ServerError>> {
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

	// FIXME
	// <Bun File>.text() is giving me strange errors. Might be fixed in the future.
	// For now, this works just fine.
	const fileContents = readFileSync(selected);

	return Ok(
		new Response(fileContents, {
			headers: { 'Content-Type': bunFile.type },
			status: code ?? 200
		})
	);
}
