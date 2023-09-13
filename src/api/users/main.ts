import { ServerError } from '../../server';
import { Error, Result } from '../../utils/result';
import { SupabaseClient } from '@supabase/supabase-js';
import { createUser } from './new';
import { login } from './login';

export default async function userApiHandler(
	path: string[],
	request: Request,
	dbClient: SupabaseClient
): Promise<Result<Response, ServerError>> {
	switch (path[2]) {
		case 'new':
			return await createUser(request, dbClient);
		case 'login':
			return await login(request, dbClient);
		default:
			return Error(new ServerError('User', 'Unexistent API route', 404));
	}
}
