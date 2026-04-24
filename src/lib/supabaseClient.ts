import { createBrowserClient } from "@supabase/ssr";

/** Browser Supabase client — uses `NEXT_PUBLIC_SUPABASE_*` env vars. */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
