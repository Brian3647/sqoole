import { Route } from '$api/types';
import { UserError, sessions } from '$server';
import { getOptions } from '$utils';

export const endSession: Route = async (request): Promise<Response> => {
	const { session } = await getOptions(request);

	if (!sessions[session])
		throw UserError('Missing session ID or session not found');

	delete sessions[session];

	return new Response('{}');
};
