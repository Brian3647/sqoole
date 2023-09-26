import { UserError } from '$server';
import { SupabaseClient } from '@supabase/supabase-js';
import { getOptions, getUser } from '$utils';
import { ChatDeletionRequest } from '$users/types';

export async function deleteChat(
	request: Request,
	dbClient: SupabaseClient
): Promise<Response> {
	const fields = ['id', 'token'];
	const options = await getOptions<ChatDeletionRequest>(request, fields);
	const user = await getUser(dbClient, options.token);

	const { data: requestedChat } = await dbClient
		.from('chats')
		.select('owner')
		.eq('id', options.id);

	if (!requestedChat?.length) {
		throw UserError('Requested chat not found.');
	} else if (requestedChat[0].owner !== user.id) {
		throw UserError('Invalid token: user is not the owner of the chat.');
	}

	await dbClient.from('chats').delete().eq('id', options.id);

	return new Response('{}');
}
