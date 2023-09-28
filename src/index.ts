import Server from '$server';
import { checkENV } from '$utils';
import { createClient } from '@supabase/supabase-js';

// This is put in a function to be able to use it in tests.
export function getServer(testPort?: number | string): Server {
	const port = testPort || Number(process.env.PORT) || 3000;

	// Checking if there's already a server running on :${port}. This WILL kill it if detected.
	// Used to hot-reload the server in developement.

	// On windows, it might not work. But if it doesn't work, serverCheck.succes
	// wont be `true` anyways, so it doesn't really matter.
	const serverCheck = Bun.spawnSync(['lsof', 't', 'i:' + port]);

	if (serverCheck.success) {
		Bun.spawnSync(['kill', serverCheck.stdout.toString()]);
	}

	const dbClient = createClient(
		checkENV('SUPABASE_URL'),
		checkENV('SUPABASE_KEY'),
		{
			auth: { persistSession: false }
		}
	);

	return new Server(port, dbClient);
}
