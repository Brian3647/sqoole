import crypto from 'crypto';
import { ServerError, UserError, sessions, type Session } from './server';
import { SupabaseClient } from '@supabase/supabase-js';
import { User } from '$api/users/types';

export type Fields<T> = (keyof T)[];

export function debug<T>(value: T): T {
	console.log(value);
	return value;
}

export function checkENV(id: string): string {
	if (!process.env[id]) {
		throw `Missing ENV variable '${id}'.`;
	}

	return process.env[id]!;
}

export function createB64ID(length: number = 8): string {
	const randomNumber = crypto.randomBytes(length).toString('hex');

	// Sliced (0, -1) because last character is always going to be '='.
	return Buffer.from(randomNumber, 'hex').toString('base64').slice(0, -1);
}

export async function getRequestJSON<T extends Record<string, any>>(
	request: Request
): Promise<T> {
	const requestBody = await request.text();

	if (!requestBody) {
		throw UserError('Invalid JSON object.');
	}

	return JSONParse(requestBody);
}

export function JSONParse<T>(
	str: string,
	error: ServerError = UserError('Invalid JSON object.')
): T {
	try {
		return JSON.parse(str);
	} catch {
		throw error;
	}
}

export function createToken(username: string, hashedPassword: string) {
	return `${username}:${hashedPassword}`;
}

export function parseToken(token: string): {
	username: string;
	password: string;
} {
	// .toString() js to make sure. Weird errors happen without it
	const values = token.toString().split(':');

	if (values.length < 2) {
		throw UserError('Invalid token provided.');
	}

	return {
		username: values[0],
		password: values.slice(1).join(':')
	};
}

// I know this is a lot of type gymnastics, but its worth for intellisense.
export async function getUser<T extends keyof User>(
	dbClient: SupabaseClient,
	token: string,
	select: ['*'] | T[] = ['*']
): Promise<Pick<User, T>> {
	const userData = parseToken(token);

	const { data: users } = await dbClient
		.from('users')
		.select(select.join(', '))
		.eq('username', userData.username)
		.eq('password', userData.password);

	if (!users?.length) {
		throw UserError('Invalid username or password in token');
	}

	return users[0] as unknown as Pick<User, T>;
}

export async function getOptions<
	T extends Record<string, any> = {
		session: string;
	}
>(
	request: Request,
	fields: Fields<T> = ['session'] as Fields<T>,
	error: ServerError = UserError('Missing fields.')
): Promise<T> {
	const data = await getRequestJSON<T>(request);

	fields.forEach((field) => {
		if (!data[field]) {
			throw error;
		}
	});

	return data;
}

export function getSession(maybeSession: string | undefined): Session {
	const session = sessions[maybeSession || ''] || '';

	if (!session) {
		throw UserError('Session ID not provided or wrong.');
	} else if (!session.token || !session.userId) {
		throw UserError('Invalid session: missing UserID or token');
	}

	return session;
}
