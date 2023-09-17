import { Message } from '$chats/types';

export interface User {
	id: string;
	password: string;
	username: string;
	created_at?: string;
	updated_at?: string;
	in_chats: string[];
}

export interface AuthorisedRequest {
	token: string;
}

export interface NameChangeRequest extends AuthorisedRequest {
	new_username: string;
}

export interface ChatMessagesRequest extends AuthorisedRequest {
	id: string;
	page: number;
}

export interface ChatInfoRequest extends AuthorisedRequest {
	id: string;
}

export type ChatDeletionRequest = ChatInfosRequest;

export interface ChatCreationRequest extends AuthorisedRequest {
	name: string;
}

export interface MessageSendRequest extends AuthorisedRequest, Message {
	channel: string;
}

export interface ChangeOwnerRequest extends AuthorisedRequest {
	id: string;
	new_owner: string;
}
