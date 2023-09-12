import { ServerError } from '../server';
import { Error, Ok, Result } from '../utils/result';
import { SupabaseClient } from '@supabase/supabase-js';
import userApiHandler from './users';

export default async function apiHandler(
	path: string[],
	request: Request,
	dbClient: SupabaseClient
): Promise<Result<Response, ServerError>> {
	switch (path[1]) {
		case 'ping':
			return Ok(new Response('Pong!'));
		case 'users':
			return await userApiHandler(path, request, dbClient);
		default:
			return Error(new ServerError('User', 'Unexistent API route', 404));
	}
}
