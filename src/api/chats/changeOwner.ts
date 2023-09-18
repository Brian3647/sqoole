import { UserError } from '$server';
import { SupabaseClient } from '@supabase/supabase-js';
import { getRequestJSON, parseToken } from '$utils';
import { ChangeOwnerRequest } from '$users/types';

export async function changeOwner(
	request: Request,
	dbClient: SupabaseClient
): Promise<Response> {
	const options = await getRequestJSON<ChangeOwnerRequest>(request);

	if (!options || !options.id || !options.token || !options.new_owner) {
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

	return new Response(JSON.stringify({}));
}
