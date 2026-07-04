## Recall

Next.js app with Supabase, OpenAI, Stripe, and Resend.

## Supabase setup

1. Copy `.env.example` to `.env.local`.
2. Fill these values from your Supabase project:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Supabase may call this the **Publishable key**)
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only secret; never expose client-side)
3. Apply migrations in the Supabase SQL editor (in order):
   - `supabase/migrations/20260425210000_pgvector_users_documents_profiles.sql`
   - `supabase/migrations/20260508120000_decks_cards_users_rls_dev.sql` (dev RLS — permissive for local)
4. Seed the database with Faker sample data:

```bash
npm run seed
```

This inserts users, profiles, **20 decks**, **200 flashcards**, sample documents, and events. Re-running the seed wipes only rows with emails ending in `@recall-seed.local`.

5. Start the app:

```bash
npm run dev
```

Open [http://localhost:3000/decks](http://localhost:3000/decks) — decks and cards are loaded from Supabase, not hardcoded in the app.

### Email sign-in

1. Enable **Email** provider in Supabase → Authentication → Providers.
2. For local dev, you can disable “Confirm email” to sign in immediately after sign-up.
3. **If sign-up shows “Database error saving new user”:** run this in Supabase → **SQL Editor**:
   - `supabase/migrations/20260522130000_auth_signup_handle_new_user.sql`
   - (Installs a safe `handle_new_user` trigger with `password_hash` and grants for `supabase_auth_admin`.)
4. Open [http://localhost:3000/login](http://localhost:3000/login) — **Sign in** / **Sign up** with email + password.
4. On sign-in, the app syncs your account to `public.users`, `profiles`, and `subscriptions` (same `id` as Supabase Auth).
5. Use **Sign out** from the navbar avatar or sidebar footer.

Set `NEXT_PUBLIC_APP_URL` (e.g. `http://localhost:3000`) for email confirmation redirects to `/auth/callback`.

### What uses Supabase

| Feature | Data |
|--------|------|
| `/decks` | `decks` + card counts |
| `/decks/[id]` | Deck + `cards` (manage, reorder) |
| `/decks/[id]/study` | Same deck/cards for study mode |
| `/study` | Deck list from Supabase |
| `/share/[id]` | Public decks (`is_public = true`) + cards |
| Server actions | `src/app/actions/decks.ts` — create/update/delete |

New decks are assigned to the signed-in user. Sign in is required to create decks.

### Files already wired

- Browser client: `src/lib/supabaseClient.ts`
- Server client: `src/lib/supabaseServer.ts`
- Admin client (service role): `src/lib/supabaseAdmin.ts`
- Auth/session middleware: `middleware.ts`
- Seed script: `scripts/seed.mjs` (`@faker-js/faker`)
