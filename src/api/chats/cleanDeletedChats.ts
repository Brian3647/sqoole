// FIXME: THIS IS NOT AN API ROUTE.

// THIS IS A FUNCTION THAT WILL BE CALLED ONCE EVERY SOME TIME WHILE THE SERVER IS RUNNING TO
// CLEAN ALL THE CHATS THAT WERE SCHEDULED TO BE DELETED.

import { SupabaseClient } from '@supabase/supabase-js';

export default async function cleanDeletedChats(dbClient: SupabaseClient) {
	const { data: chats } = await dbClient
		.from('chats')
		.select('users, id')
		.lte('deleted_at', new Date().toISOString());

	if (!chats?.length) return;

	for (let n = 0; n < chats.length; n++) {
		for (let i = 0; i < (chats[0].users || []).length; i++) {
			const user = chats[0].users[i];
			const { data } =
				(await dbClient.from('users').select('in_chats').eq('id', user)) || [];

			const currentInChats = data![0].in_chats;
			await dbClient
				.from('users')
				.update({
					in_chats: currentInChats.filter((x: string) => x != chats[0].id)
				})
				.eq('id', user);
		}

		await dbClient.from('chats').delete().eq('id', chats[0].id);
	}

	console.log(`Deleted ${chats.length} chat${chats.length > 0 ? 's' : ''}`);
}
