export interface User {
	id: string;
	password: string;
	username: string;
	created_at?: string;
	updated_at?: string;
}

export interface NameChangeRequest {
	token: string;
	new_username: string;
}
