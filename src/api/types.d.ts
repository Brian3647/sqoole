import { SupabaseClient } from '@supabase/supabase-js';

export interface Paths {
	[key: string]: Route;
}

export type Route = (
	request: Request,
	databaseClient: SupabaseClient,
	ip: string
) => Response | Promise<Response>;
