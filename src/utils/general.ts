import crypto from 'crypto';
import { Result, Error, Ok } from './result';

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

export async function getRequestJSON<T, E>(
	request: Request,
	error: E
): Promise<Result<T, E>> {
	const requestBody = await request.text();

	if (!requestBody) {
		return Error(error);
	}

	let options: T;

	try {
		options = JSON.parse(requestBody);
	} catch (optionsError) {
		return Error(error);
	}

	return Ok(options);
}

export function createToken(username: string, hashedPassword: string) {
	return `${username}:${hashedPassword}`;
}

export function parseToken(token: string): Result<
	{
		username: string;
		password: string;
	},
	0
> {
	const values = token.split(':');

	if (values.length < 2) {
		return Error(0);
	}

	return Ok({
		username: values[0],
		password: values.slice(1).join(':')
	});
}
