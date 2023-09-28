import { SupabaseClient } from '@supabase/supabase-js';
import { getOptions, getSession } from '$utils';
import { sessions } from '$server';

export async function deleteUser(
	request: Request,
	dbClient: SupabaseClient
): Promise<Response> {
	const { session: sessionId } = await getOptions(request);
	const session = getSession(sessionId);
	await dbClient.from('users').delete().eq('id', session.userId);
	delete sessions[sessionId];
	return new Response('{}');
}
