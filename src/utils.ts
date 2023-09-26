import crypto from 'crypto';
import { ServerError, UserError } from './server';
import { SupabaseClient } from '@supabase/supabase-js';
import { User } from '$api/users/types';

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

export async function getRequestJSON<T>(request: Request): Promise<T> {
	const requestBody = await request.text();

	if (!requestBody) {
		throw UserError('Invalid JSON object.');
	}

	let options: T;

	try {
		options = JSON.parse(requestBody);
	} catch {
		throw UserError('Invalid JSON object.');
	}

	return options;
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

export async function getUser<T = User>(
	dbClient: SupabaseClient,
	token: string
): Promise<T> {
	const userData = parseToken(token);

	const { data: users } = await dbClient
		.from('users')
		.select('*')
		.eq('username', userData.username)
		.eq('password', userData.password);

	if (!users?.length) {
		throw new ServerError(
			'User',
			'Invalid username or password in token.',
			400
		);
	}

	return users[0];
}

export async function getOptions<T extends Record<string, any>>(
	request: Request,
	fields: string[] = ['token'],
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