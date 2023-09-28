import { UserError } from '$server';
import { SupabaseClient } from '@supabase/supabase-js';
import { createUser } from './new';
import { login } from './login';
import { usernameChange } from './nameChange';
import { deleteUser } from './delete';
import { tokenLogin } from './tokenLogin';
import { openSessionRoute } from './openSession';
import { endSession } from './endSession';
import { getUsername } from './getUsername';
import { Paths } from '$api/types';

export const paths: Paths = {
	new: createUser,
	login: login,
	change_username: usernameChange,
	delete: deleteUser,
	token_login: tokenLogin,
	open_session: openSessionRoute,
	end_session: endSession,
	get_username: getUsername
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
