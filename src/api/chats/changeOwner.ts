import { UserError } from '$server';
import { SupabaseClient } from '@supabase/supabase-js';
import { Fields, getOptions, getSession } from '$utils';

interface ChangeOwnerRequest {
	channelId: string;
	new_owner: string;
	session: string;
}

export async function changeOwner(
	request: Request,
	dbClient: SupabaseClient
): Promise<Response> {
	const fields: Fields<ChangeOwnerRequest> = ['channelId', 'new_owner'];
	const options = await getOptions<ChangeOwnerRequest>(request, fields);
	const session = getSession(options.session);

	const { data: requestedChat } = await dbClient
		.from('chats')
		.select('owner, users')
		.eq('id', options.channelId);

	if (!requestedChat?.length) {
		throw UserError('Requested chat not found.');
	} else if (requestedChat[0].owner !== session.userId) {
		throw UserError('Invalid token: user is not the owner of the chat.');
	}

	const { data: newOwner } = await dbClient
		.from('users')
		.select('id')
		.eq('id', options.new_owner);

	if (!newOwner?.length) {
		throw UserError("New owner's ID is not valid: user was not found.");
	} else if (!requestedChat![0].users.includes(options.new_owner)) {
		throw UserError('New owner needs to be part of the chat.');
	}

	await dbClient
		.from('chats')
		.update({ owner: options.new_owner })
		.eq('id', options.channelId);

	return new Response('{}');
}
