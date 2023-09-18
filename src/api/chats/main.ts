import { UserError } from '$server';
import { SupabaseClient } from '@supabase/supabase-js';

import { createChat } from './new';
import { getMessages } from './getMessages';
import { getInfo } from './getInfo';
import { getChatsWithUser } from './getChatsWithUser';
import { deleteChat } from './delete';
import { joinChat } from './join';
import { sendMessage } from './send';
import { changeOwner } from './changeOwner';

export default async function chatsApiHandler(
	path: string[],
	request: Request,
	dbClient: SupabaseClient
): Promise<Response> {
	switch (path[2]) {
		case 'new':
			return createChat(request, dbClient);
		case 'delete':
			return deleteChat(request, dbClient);
		case 'join':
			return joinChat(request, dbClient);
		case 'send':
			return sendMessage(request, dbClient);
		case 'get_information':
			return getInfo(request, dbClient);
		case 'get_messages':
			return getMessages(request, dbClient);
		case 'get_chats':
			return getChatsWithUser(request, dbClient);
		case 'give_owner':
			return changeOwner(request, dbClient);
		default:
			throw UserError('Unexistent API route', 404);
	}
}
