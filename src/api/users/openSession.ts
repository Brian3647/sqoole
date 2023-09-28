import { Route } from '$api/types';
import { UserError, sessions } from '$server';
import { createToken, getOptions, getUser } from '$utils';
import { SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuid } from 'uuid';

export function uncheckedOpenSession(token: string, userId: string): string {
	let sessionId = uuid();

	while (sessions[sessionId]) {
		sessionId = uuid();
	}

	sessions[sessionId] = { token, userId };
	return sessionId;
}

interface Options {
	token: string;
}

export const openSession = async (
	request: Request,
	dbClient: SupabaseClient
): Promise<string> => {
	const options = await getOptions<Options>(request, ['token']);
	const token = options.token;
	const user = await getUser(dbClient, token, 'username, password, id');

	return uncheckedOpenSession(
		createToken(user.username, user.password),
		user.id
	);
};

export const openSessionRoute: Route = async (
	request,
	dbClient
): Promise<Response> => {
	const { session } = await getOptions(request);

	if (session && sessions[session]) {
		throw UserError('Already using a valid, existing session.');
	}

	const id = await openSession(request, dbClient);
	return new Response(id);
};
