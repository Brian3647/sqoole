import { SupabaseClient } from '@supabase/supabase-js';
import { AuthorisedRequest, User } from './types';
import { getOptions, getUser } from '$utils';

export async function tokenLogin(
	request: Request,
	dbClient: SupabaseClient
): Promise<Response> {
	const options = await getOptions<User & AuthorisedRequest>(request);
	if (options.token) {
		const user = await getUser(dbClient, options.token);
		return new Response(
			JSON.stringify({
				id: user.id,
				created_at: user.created_at,
				updated_at: user.updated_at,
				in_chats: user.in_chats,
				username: user.username
			})
		);
	}

	return new Response('returnObject');
}
