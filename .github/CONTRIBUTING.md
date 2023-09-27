# **Contributing :beers:**

_Refer to [here](./PULL_REQUEST_TEMPLATE.md) and [here](./ISSUE_TEMPLATE/) for issue and PR templates respectively_

This project is made using Bun (the javascript runtime & toolkit) along with TypeScript and supabase.

You will need to have both installed and a supabase project created, which you will need to get the database password from and create a file named `.env` with the following contents:

```env
SUPABASE_KEY=(db's password)
SUPABASE_URL=(your supabase project URL)
```

Tables set-up can be found on [DATABASE_SETUP.md](./DATABASE_SETUP.md). Please note it might not be updated as of every commit, so I recommend reading the api's code you want to touch just in case.

## **Testing**

There is a full API test at [`./src/api/api.test.ts`](/src/api/api.test.ts), but websockets will need to be tested manually (specially using the front-end as soon as it's done).

## **The front-end**

Front-end uses NuxtJS and can be found at /web

## **Commit format**

It's recommended to use [gitmoji](https://github.com/carloscuesta/gitmoji-cli) for your commits.
