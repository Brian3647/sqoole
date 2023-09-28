import { SupabaseClient } from '@supabase/supabase-js';
import { getOptions, getUser } from '$utils';
import { uncheckedOpenSession } from './openSession';

interface AuthorisedRequest {
	token: string;
}

export async function tokenLogin(
	request: Request,
	dbClient: SupabaseClient
): Promise<Response> {
	const options = await getOptions<AuthorisedRequest>(request, ['token']);
	const user = await getUser(dbClient, options.token, [
		'id',
		'created_at',
		'updated_at',
		'in_chats',
		'username'
	]);

	const session = uncheckedOpenSession(options.token, user.id);

	return new Response(
		JSON.stringify({
			id: user.id,
			created_at: user.created_at,
			updated_at: user.updated_at,
			in_chats: user.in_chats,
			username: user.username,
			session
		})
	);
}
