# **Contributing :beers:**

**Currently important _to-do_ list can be found [here](/TODO.md)**

This project is made using Bun (the javascript runtime & toolkit) along with TypeScript and supabase.

You will need to have both installed and a supabase project created, which you will need to get the database password from and create a file named `.env` with the following contents:

```env
SUPABASE_KEY=(db's password)
SUPABASE_URL=(your supabase project URL)
```

Table schemas can be created based on [`src/api/types.d.ts`](/src/api/types.d.ts). Probably will add screenshots on the future.

## **The front-end (pain)**

It uses Nuxt. Sadly. Please work on it. I don't like building front-end.

## **Commit format**

It's required to use [gitmoji](https://github.com/carloscuesta/gitmoji-cli) for your commits.
