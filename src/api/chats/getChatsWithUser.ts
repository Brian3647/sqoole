import { getOptions, getSession } from '$utils';
import { SupabaseClient } from '@supabase/supabase-js';

export async function getChatsWithUser(
	request: Request,
	dbClient: SupabaseClient
): Promise<Response> {
	const options = await getOptions(request);
	const session = getSession(options.session);

	const { data: chats } = await dbClient
		.from('users')
		.select('in_chats')
		.eq('id', session.userId);

	if (!chats?.length) {
		return new Response('[]');
	}

	return new Response(JSON.stringify(chats![0].in_chats));
}
