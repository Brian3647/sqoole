export interface User extends Record<string, any> {
	id: string;
	password: string;
	username: string;
	created_at: string;
	updated_at: string;
	in_chats: string[];
}
