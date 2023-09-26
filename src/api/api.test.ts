// Big ass API test.
import { expect, test, describe } from 'bun:test';
import { getServer } from '$src/index.ts';
import { v4 as uuid } from 'uuid';

const port = process.env['PORT'] || 3000;
const apiUrl = `localhost:${port}/api`;
await getServer(port).start();

async function api<T>(path: string, body: T) {
	const response = await fetch(apiUrl + path, {
		body: JSON.stringify(body),
		method: 'POST'
	});

	return await response.json();
}

const firstUserData = {
	username: uuid(),
	password: uuid()
};

const secondUserData = {
	username: uuid(),
	password: uuid()
};

let firstUserToken: string;
let secondUserToken: string;

describe('Users', () => {
	test('Create users', async () => {
		const res = await api('/users/new', firstUserData);

		expect(res.error).toBe(undefined);
		expect(res.token).toBeString();

		firstUserToken = res.token;

		const res2 = await api('/users/new', secondUserData);

		expect(res2.error).toBe(undefined);
		expect(res2.token).toBeString();

		secondUserToken = res2.token;
	});

	test('Login', async () => {
		const res = await api('/users/login', firstUserData);
		const res2 = await api('/users/login', secondUserData);

		expect(res.error).toBe(undefined);
		expect(res2.error).toBe(undefined);

		expect(res.token).toBe(firstUserToken);
		expect(res2.token).toBe(secondUserToken);
	});

	test('Token Login', async () => {
		const res = await api('/users/token_login', { token: firstUserToken });
		expect(res.error).toBe(undefined);
	});

	test('Name change', async () => {
		const res = await api('/users/change_username', {
			token: firstUserToken,
			new_username: uuid()
		});

		expect(res.error).toBe(undefined);
		expect(res.new_name).toBeString();
		expect(res.old_name).toBeString();

		const res2 = await api('/users/change_username', {
			token: secondUserToken,
			new_username: uuid()
		});

		expect(res.error).toBe(undefined);

		firstUserToken = res.new_token;
		secondUserToken = res2.new_token;
	});
});

describe('Cleanup', () => {
	test('Delete users', async () => {
		const res = await api('/users/delete', {
			token: firstUserToken
		});

		const res2 = await api('/users/delete', {
			token: secondUserToken
		});

		expect(res.error).toBe(undefined);
		expect(res2.error).toBe(undefined);
	});
});
