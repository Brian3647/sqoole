import { UserError } from '$server';
import { SupabaseClient } from '@supabase/supabase-js';
import { getOptions, getUser } from '$utils';
import { ChangeOwnerRequest } from '$users/types';

export async function changeOwner(
	request: Request,
	dbClient: SupabaseClient
): Promise<Response> {
	const fields = ['id', 'token', 'new_owner'];
	const options = await getOptions<ChangeOwnerRequest>(request, fields);
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

	const { data: newOwner } = await dbClient
		.from('users')
		.select('id')
		.eq('id', options.new_owner);

	const { data: chatUsers } = await dbClient
		.from('chats')
		.select('users')
		.eq('id', options.id);

	if (!newOwner?.length) {
		throw UserError("New owner's ID is not valid: user was not found.");
	} else if (!chatUsers![0].users.includes(options.new_owner)) {
		throw UserError('New owner needs to be part of the chat.');
	}

	await dbClient
		.from('chats')
		.update({ owner: options.new_owner })
		.eq('id', options.id);

	return new Response('{}');
}
