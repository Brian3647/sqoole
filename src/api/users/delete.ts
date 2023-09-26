import { UserError } from '$server';
import { SupabaseClient } from '@supabase/supabase-js';
import { AuthorisedRequest } from './types';
import { getOptions, getUser } from '$utils';

export async function deleteUser(
	request: Request,
	dbClient: SupabaseClient
): Promise<Response> {
	const options = await getOptions<AuthorisedRequest>(request);
	const user = await getUser(dbClient, options.token);
	await dbClient.from('users').delete().eq('id', user.id);

	return new Response('{}');
}
