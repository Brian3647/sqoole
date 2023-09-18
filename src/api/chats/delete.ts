import { UserError } from '$server';
import { SupabaseClient } from '@supabase/supabase-js';
import { getRequestJSON, parseToken } from '$utils';
import { ChatDeletionRequest } from '$users/types';

export async function deleteChat(
	request: Request,
	dbClient: SupabaseClient
): Promise<Response> {
	const options = await getRequestJSON<ChatDeletionRequest>(request);

	if (!options || !options.id || !options.token) {
		throw UserError('Missing fields.');
	}

	const userData = parseToken(options.token);

	const { data: user } = await dbClient
		.from('users')
		.select('*')
		.eq('username', userData.username)
		.eq('password', userData.password);

	if (!user?.length) {
		throw UserError('Invalid token: user not found.');
	}

	const { data: requestedChat } = await dbClient
		.from('chats')
		.select('owner')
		.eq('id', options.id);

	if (!requestedChat?.length) {
		throw UserError('Requested chat not found.');
	} else if (requestedChat[0].owner !== user[0].id) {
		throw UserError('Invalid token: user is not the owner of the chat.');
	}

	await dbClient.from('chats').delete().eq('id', options.id);

	return new Response(JSON.stringify({}));
}
