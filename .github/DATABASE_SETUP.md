## **table:** `users`

**SQL:**

```sql
create table
  public.users (
    id text not null,
    created_at timestamp with time zone not null default now(),
    password text not null,
    username text not null,
    updated_at timestamp with time zone null,
    in_chats text[] not null default '{}'::text[],
    constraint users_pkey primary key (id),
    constraint users_password_check check ((length(password) < 600)),
    constraint users_username_check check ((length(username) < 80))
  ) tablespace pg_default;

create trigger handle_updated_at before
update on users for each row
execute function moddatetime ('updated_at');
```

**Types (easier reading):**

```typescript
export interface User {
	id: string;
	password: string;
	username: string;
	created_at: string;
	updated_at: string;
	ips: string[];
	in_chats: string[];
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
    owner text null,
    deleted_at timestamp with time zone not null default (now() + '1 day'::interval),
    constraint chats_pkey primary key (id)
  ) tablespace pg_default;
```

**Types (easier reading):**

```typescript
export interface Chat {
	id: string;
	messages: Message[];
	users: string[];
	created_at?: string;
	deleted_at?: string;
	name: string;
	owner: string;
}

export interface Message {
	author: string;
	text: string;
	created_at: number;
}
```
