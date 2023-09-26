import { UserError } from '$server';
import { SupabaseClient } from '@supabase/supabase-js';
import { createUser } from './new';
import { login } from './login';
import { usernameChange } from './nameChange';
import { deleteUser } from './delete';
import { tokenLogin } from './tokenLogin';
import { Paths } from '$api/types';

export const paths: Paths = {
	new: createUser,
	login: login,
	change_username: usernameChange,
	delete: deleteUser,
	token_login: tokenLogin
};

export default async function userApiHandler(
	path: string[],
	request: Request,
	dbClient: SupabaseClient,
	ip: string
): Promise<Response> {
	if (path[2] in paths) {
		return await paths[path[2]](request, dbClient, ip);
	}

	throw UserError('Unexistent API route', 404);
}
