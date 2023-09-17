export interface Chat {
	id: string;
	messages: Message[];
	// Users are listed by ID.
	users: string[];
	created_at?: string;
	name: string;
	owner: string;
}

export interface Message {
	author: string;
	text: string;
	created_at: number;
}
