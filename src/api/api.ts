import { UserError } from '$server';
import { SupabaseClient } from '@supabase/supabase-js';
import userApiHandler from './users/main';
import chatsApiHandler from './chats/main';

export default async function apiHandler(
	path: string[],
	request: Request,
	dbClient: SupabaseClient,
	ip: string
): Promise<Response> {
	switch (path[1]) {
		case 'ping':
			return new Response('Pong!');
		case 'users':
			return await userApiHandler(path, request, dbClient, ip);
		case 'chats':
			return await chatsApiHandler(path, request, dbClient, ip);
		default:
			throw UserError('Unexistent API route');
	}
}
