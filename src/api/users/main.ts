import { UserError } from '$server';
import { SupabaseClient } from '@supabase/supabase-js';
import { createUser } from './new';
import { login } from './login';
import { usernameChange } from './nameChange';
import { deleteUser } from './delete';

export default async function userApiHandler(
	path: string[],
	request: Request,
	dbClient: SupabaseClient
): Promise<Response> {
	switch (path[2]) {
		case 'new':
			return await createUser(request, dbClient);
		case 'login':
			return await login(request, dbClient);
		case 'change_username':
			return await usernameChange(request, dbClient);
		case 'delete':
			return await deleteUser(request, dbClient);
		default:
			throw UserError('Unexistent API route', 404);
	}
}
