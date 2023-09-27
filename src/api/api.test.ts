// Big ass API test.

import { expect, test, describe } from 'bun:test';
import { getServer } from '$src/index.ts';
import { v4 as uuid } from 'uuid';

const debug = Boolean(process.env.DEBUG || false);
const port = process.env['PORT'] || 3000;
const apiUrl = `localhost:${port}/api`;
await getServer(port).start();

const chatName = 'TEST ROOM 1';

async function api<T>(path: string, body: T) {
	debug && console.log('request to', path, body);

	const response = await fetch(apiUrl + path, {
		body: JSON.stringify(body),
		method: 'POST'
	});

	const text = await response.text();

	if (text.includes('<body>')) {
		Bun.write('./error.html', text);
		throw 'Internal code error written to error.html';
	}

	try {
		const res = await JSON.parse(text);

		return res;
	} catch {
		throw 'Error during JSON.parse';
	}
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

let secondUserID: string;

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

		secondUserID = res2.id;
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

let chatId: string;

describe('Chats', () => {
	test('Create chat', async () => {
		const res = await api('/chats/new', {
			token: firstUserToken,
			name: chatName,
			days_until_deletion: 2
		});

		expect(res.error).toBe(undefined);
		expect(res.id).toBeString();
		chatId = res.id;
	});

	test('Get messages', async () => {
		const res = await api('/chats/get_messages', {
			token: firstUserToken,
			id: chatId,
			page: 0
		});

		expect(res.error).toBe(undefined);
		expect(res).toBeArrayOfSize(1);
	});

	test('Get chats with user', async () => {
		const res = await api('/chats/get_chats', {
			token: firstUserToken
		});

		expect(res).toBeArrayOfSize(1);
		expect(res[0]).toBe(chatId);
	});

	test('Join chat', async () => {
		const res = await api('/chats/join', {
			token: secondUserToken,
			id: chatId
		});

		expect(res.error).toBe(undefined);
	});

	test('Change owner', async () => {
		const res = await api('/chats/give_owner', {
			token: firstUserToken,
			id: chatId,
			new_owner: secondUserID
		});

		expect(res.error).toBe(undefined);
	});

	test('Get chat information', async () => {
		const res = await api('/chats/get_information', {
			token: firstUserToken,
			id: chatId
		});

		expect(res.error).toBe(undefined);
		expect(res.name).toBe(chatName);
		expect(res.owner).toBe(secondUserID);
		expect(res.users).toBeArrayOfSize(2);
	});
});

describe('Cleanup', () => {
	test('Delete chat', async () => {
		const res = await api('/chats/delete', {
			token: secondUserToken,
			id: chatId
		});

		expect(res.error).toBe(undefined);
	});

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
