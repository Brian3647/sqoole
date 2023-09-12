import crypto from 'crypto';

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
