import Server from '$server.ts';
import { checkENV } from '$utils/general.ts';
import { createClient } from '@supabase/supabase-js';

const port = 3000;

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

new Server(port, dbClient).start();
