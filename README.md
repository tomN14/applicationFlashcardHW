## Recall

Next.js app with Supabase, OpenAI, Stripe, and Resend.

## Supabase Setup

1. Copy `.env.example` to `.env.local`.
2. Fill these values from your Supabase project:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Supabase may call this the **Publishable key**)
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only secret; never expose client-side)
3. Run your schema SQL in Supabase SQL Editor.
4. Start the app:

```bash
npm run dev
```

### Files already wired

- Browser client: `src/lib/supabaseClient.ts`
- Server client: `src/lib/supabaseServer.ts`
- Admin client (service role): `src/lib/supabaseAdmin.ts`
- Auth/session middleware: `middleware.ts`
