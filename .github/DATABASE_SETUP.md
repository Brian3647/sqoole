## **table:** `users`

**SQL:**

```sql
create table
  public.users (
    id text not null,
    created_at timestamp with time zone not null default now(),
    password text not null,
    username text not null,
    constraint users_pkey primary key (id),
    constraint users_username_check check ((length(username) < 80))
  ) tablespace pg_default;
```

**Types (easier reading):**

```typescript
interface User {
	// Unique, primary key
	id: string;
	password: string;
	username: string;
	created_at: TimeStamp;
}
```

## **table:** `chats`

**SQL:**

```sql
create table
  public.chats (
    id text not null,
    created_at timestamp with time zone not null default now(),
    messages json[] null,
    users text[] null,
		name text null,
    constraint chats_pkey primary key (id)
  ) tablespace pg_default;
```

**Types (easier reading):**

```typescript
interface Chat {
	id: string;
	messages: Message[];
	// Users are listed by ID.
	users: string[];
	created_at: TimeStamp;
	name: string;
}

interface Message {
	author: string;
	text: string;
}
```
