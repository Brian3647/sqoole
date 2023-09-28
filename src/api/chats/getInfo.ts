import { UserError } from '$server';
import { SupabaseClient } from '@supabase/supabase-js';
import { getOptions, getSession } from '$utils';

interface ChatInfoRequest {
	session: string;
	id: string;
}

export async function getInfo(
	request: Request,
	dbClient: SupabaseClient
): Promise<Response> {
	const options = await getOptions<ChatInfoRequest>(request, ['id']);
	const session = getSession(options.session);

	const { data: chat } = await dbClient
		.from('chats')
		.select('users, name, owner')
		.eq('id', options.id);

	if (!chat?.length) {
		throw UserError('Chat not found.');
	} else if (!chat[0].users.includes(session.userId)) {
		throw UserError('User not part of that chat.');
	}

	const response = {
		users: chat[0].users,
		name: chat[0].name,
		owner: chat[0].owner
	};

	return new Response(JSON.stringify(response));
}
