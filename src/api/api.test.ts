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

let [firstUserSession, secondUserSession] = ['', ''];

describe('Users', () => {
	test('Create users', async () => {
		const res = await api('/users/new', firstUserData);

		expect(res.error).toBe(undefined);
		expect(res.token).toBeString();

		firstUserToken = res.token;
		firstUserSession = res.session;

		const res2 = await api('/users/new', secondUserData);

		expect(res2.error).toBe(undefined);
		expect(res2.token).toBeString();

		secondUserToken = res2.token;
		secondUserSession = res2.session;
		secondUserID = res2.id;
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
		const newSecondUserName = uuid();

		const res2 = await api('/users/change_username', {
			session: secondUserSession,
			new_username: newSecondUserName
		});

		secondUserData.username = newSecondUserName;

		expect(res2.error).toBe(undefined);

		secondUserToken = res2.new_token;
		secondUserSession = res2.new_session;
	});

	test('Get username', async () => {
		const res = await api('/users/get_username', {
			id: secondUserID
		});

		expect(res.error).toBe(undefined);
		expect(res.username).toBe(secondUserData.username);
	});
});

let chatId: string;

describe('Chats', () => {
	test('Create chat', async () => {
		const res = await api('/chats/new', {
			session: firstUserSession,
			name: chatName,
			days_until_deletion: 2
		});

		expect(res.error).toBe(undefined);
		expect(res.id).toBeString();
		chatId = res.id;
	});

	test('Get messages', async () => {
		const res = await api('/chats/get_messages', {
			session: firstUserSession,
			id: chatId,
			page: 0
		});

		expect(res.error).toBe(undefined);
		expect(res).toBeArrayOfSize(1);
	});

	test('Get chats with user', async () => {
		const res = await api('/chats/get_chats', {
			session: firstUserSession
		});

		expect(res).toBeArrayOfSize(1);
		expect(res[0]).toBe(chatId);
	});

	test('Join chat', async () => {
		const res = await api('/chats/join', {
			session: secondUserSession,
			id: chatId
		});

		expect(res.error).toBe(undefined);
	});

	test('Change owner', async () => {
		const res = await api('/chats/give_owner', {
			session: firstUserSession,
			channelId: chatId,
			new_owner: secondUserID
		});

		expect(res.error).toBe(undefined);
	});

	test('Get chat information', async () => {
		const res = await api('/chats/get_information', {
			session: firstUserSession,
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
			session: secondUserSession,
			id: chatId
		});

		expect(res.error).toBe(undefined);
	});

	test('Delete users', async () => {
		const res = await api('/users/delete', {
			session: firstUserSession
		});

		const res2 = await api('/users/delete', {
			session: secondUserSession
		});

		expect(res.error).toBe(undefined);
		expect(res2.error).toBe(undefined);
	});
});
