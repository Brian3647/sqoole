import { ServerError } from '../server';
import { Ok, Result } from '../utils/result';

export default function api_handler(
	path: string[],
	request: Request
): Result<Response, ServerError> {
	return Ok(new Response('API is still a work in progress.'));
}
