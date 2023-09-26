import { UserError } from '$server';
import { Paths } from '$api/types';

import { SupabaseClient } from '@supabase/supabase-js';

import { createChat } from './new';
import { getMessages } from './getMessages';
import { getInfo } from './getInfo';
import { getChatsWithUser } from './getChatsWithUser';
import { deleteChat } from './delete';
import { joinChat } from './join';
import { sendMessage } from './send';
import { changeOwner } from './changeOwner';

const paths: Paths = {
	new: createChat,
	delete: deleteChat,
	join: joinChat,
	send: sendMessage,
	get_information: getInfo,
	get_messages: getMessages,
	get_chats: getChatsWithUser,
	give_owner: changeOwner
};

export default async function chatsApiHandler(
	path: string[],
	request: Request,
	dbClient: SupabaseClient,
	ip: string
): Promise<Response> {
	const fn = paths[path[2]];
	if (!fn) throw UserError('Unexistent API route', 404);
	return await fn(request, dbClient, ip);
}
