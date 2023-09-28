import { Route } from '$api/types';
import { UserError } from '$server';
import { getOptions } from '$utils';

export const getUsername: Route = async (
	request,
	dbClient
): Promise<Response> => {
	const options = await getOptions<{ id: string }>(request, ['id']);
	const { data: user } = await dbClient
		.from('users')
		.select('username')
		.eq('id', options.id);

	if (!user?.length) {
		throw UserError(`User with id ${options.id} not found.`);
	}

	const username = user[0].username;

	return new Response(JSON.stringify({ username }));
};
