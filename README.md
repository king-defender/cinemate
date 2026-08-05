# CineMate

Watch together — synced playback, live chat, movie buddy matching.

Built from the product docs in the parent `moviePlatform` folders (FRS, architecture, schema, build plan).

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind
- **Supabase** — Auth, Postgres, Realtime
- **Prisma** — schema + migrations
- **Vercel** — hosting (Hobby / free)

## Quick start

1. Create a [Supabase](https://supabase.com) project.
2. Copy env vars:

```bash
cp .env.example .env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, and `DIRECT_URL` (from Supabase → Settings → API / Database).

3. Enable in Supabase Auth:
   - Email (confirmations on)
   - Google / GitHub providers (optional)
   - **Anonymous sign-ins** (for guest mode)

4. Migrate + seed:

```bash
npm install
npx prisma migrate dev --name init
npx prisma db seed
```

5. In the Supabase SQL editor, run `prisma/rls.sql`.

6. Add Auth redirect URLs:
   - `http://localhost:3000/auth/callback`
   - your Vercel URL + `/auth/callback`

7. Run the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## What's included (Phases 1–3)

| Feature | Status |
|---|---|
| Email/password + Google/GitHub + guest | ✅ |
| Profile view/edit | ✅ |
| Private rooms + invite links | ✅ |
| Playback sync (demo video) | ✅ |
| Real-time chat (persisted) | ✅ |
| Watch history | ✅ |
| Movie buddy matching | ✅ |
| Badges (First Watch, Host Debut, 10 Rooms) | ✅ |
| Genre communities | ✅ |
| Webcam / WebRTC mesh | Deferred (signaling hook ready on room channel) |

Content source integration is intentionally out of scope — the room player uses a public sample clip so you can test sync with 2+ browser tabs.

## Scripts

- `npm run dev` — local server
- `npm run build` — production build
- `npx prisma migrate dev` — apply schema
- `npx prisma db seed` — communities + badges
- `npx prisma studio` — browse data

## Docs map

Product/engineering docs live one level up:

- `../00-foundation/README.md` — vision & scope
- `../14-project-management/build-plan.md` — module order
- `../03-system-design/architecture.md` — realtime decision
