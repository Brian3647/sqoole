# **API GUIDE**

- [screenshot (recommended for mobile)](#screenshot)

```c
/api
	/users
		/login { username: string, password: string }
		-> { token: string }

		/change_username { new_username: string, token: string }
		-> { old_name: string, new_name: string, new_token: string }

		/new { username: string, password: string }
		-> { token: string }

		/delete { token: string }
		-> {}

	/chats
		/new { token: string, name: string, days_until_deletion: number =< 7 }
		-> {}

		/send { token: string, text: string, channel: string }
		-> { author: string, text: string, created_at: number }

		/delete { token: string, id: string }
		-> {}

		/join { token: string, id: string }
		-> {}

		/get_information { token: string, id: string }
		-> { name: string, users: string[] }

		/get_messages { token: string, id: string, page: number }
		-> string[]

		/get_chats { token: string }
		-> string[]

		/give_owner { token: string, id: string, new_owner: string }
		-> {}

	/ws
		// TODO. WebSockets aren't currently working.
```

### Screenshot

![screenshot.png](/.github/assets/api_routes_screenshot.png)
