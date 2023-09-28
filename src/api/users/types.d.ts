export interface User extends Record<string, string | string[]> {
	id: string;
	password: string;
	username: string;
	created_at: string;
	updated_at: string;
	in_chats: string[];
}
