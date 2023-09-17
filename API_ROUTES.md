# **API GUIDE**

```ts
/api
	/users
		/login { username: string, password: string }
		-> { token: string }

		/change_username { new_username: string, token: string }
		-> { old_name: string, new_name: string }

		/new { username: string, password: string }
		-> { token: string }

	/chats
		/new { token: string, name: string }
		-> 'OK.'

		/send { token: string, text: string, channel: string }
		-> { author: string, text: string, created_at: number }

		/delete { token: string, id: string }
		-> 'OK.'

		/join { token: string, id: string }
		-> 'OK.'

		/get_information { token: string, id: string }
		-> { name: string, users: string[] }

		/get_messages { token: string, id: string, page: number }
		-> string[]

		/get_chats { token: string }
		-> string[]

		/give_owner { token: string, id: string, new_owner: string }
		-> 'OK.'

	/ws
		// TODO. WebSockets aren't currently working.
```
