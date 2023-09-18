import { UserError } from '$server';
import { SupabaseClient } from '@supabase/supabase-js';
import { getRequestJSON, parseToken } from '$utils';
import { AuthorisedRequest } from '$users/types';

export async function getChatsWithUser(
	request: Request,
	dbClient: SupabaseClient
): Promise<Response> {
	const options = await getRequestJSON<AuthorisedRequest>(request);

	if (!options || !options.token) {
		throw UserError('Missing fields.');
	}

	const userData = parseToken(options.token);

	const { data: possibleUser } = await dbClient
		.from('users')
		.select('*')
		.eq('username', userData.username)
		.eq('password', userData.password);

	if (!possibleUser?.length) {
		throw UserError('Invalid token: user not found.');
	}

	const chats = possibleUser[0].in_chats;
	return new Response(JSON.stringify(chats));
}
