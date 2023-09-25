import { UserError } from '$server';
import { SupabaseClient } from '@supabase/supabase-js';
import { createUser } from './new';
import { login } from './login';
import { usernameChange } from './nameChange';
import { deleteUser } from './delete';
import { Paths } from '$api/types';

export const paths: Paths = {
	new: createUser,
	login: login,
	change_username: usernameChange,
	delete: deleteUser
};

export default async function userApiHandler(
	path: string[],
	request: Request,
	dbClient: SupabaseClient
): Promise<Response> {
	if (path[2] in paths) {
		return await paths[path[2]](request, dbClient);
	}

	throw UserError('Unexistent API route', 404);
}
