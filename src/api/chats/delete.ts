import { UserError } from '$server';
import { SupabaseClient } from '@supabase/supabase-js';
import { Fields, getOptions, getSession } from '$utils';

interface ChatDeletionRequest {
	session: string;
	id: string;
}

export async function deleteChat(
	request: Request,
	dbClient: SupabaseClient
): Promise<Response> {
	const fields: Fields<ChatDeletionRequest> = ['id'];
	const options = await getOptions<ChatDeletionRequest>(request, fields);
	const session = getSession(options.session);

	const { data: requestedChat } = await dbClient
		.from('chats')
		.select('owner')
		.eq('id', options.id);

	if (!requestedChat?.length) {
		throw UserError('Requested chat not found.');
	} else if (requestedChat[0].owner !== session.userId) {
		throw UserError('Invalid token: user is not the owner of the chat.');
	}

	await dbClient.from('chats').delete().eq('id', options.id);

	return new Response('{}');
}
