import { SupabaseClient } from '@supabase/supabase-js';
import { getOptions, getUser } from '$utils';
import { AuthorisedRequest } from '$users/types';

export async function getChatsWithUser(
	request: Request,
	dbClient: SupabaseClient
): Promise<Response> {
	const options = await getOptions<AuthorisedRequest>(request);
	const chats = (await getUser(dbClient, options.token)).in_chats;
	return new Response(JSON.stringify(chats));
}
