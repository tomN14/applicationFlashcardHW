import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server Supabase client — cookie-backed when using anon/publishable key.
 *
 * Env resolution:
 * - URL: SUPABASE_URL, then NEXT_PUBLIC_SUPABASE_URL
 * - Key (first match wins):
 *   1. SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY — bypasses RLS (typical when
 *      you haven't applied dev RLS migrations on hosted Supabase; server-only).
 *   2. SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
 */
export async function createSupabaseServerClient() {
  const url =
    process.env.SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SECRET_KEY?.trim();

  const anonKey =
    process.env.SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  const key = serviceRoleKey || anonKey;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase env vars. Set SUPABASE_URL plus either SUPABASE_SERVICE_ROLE_KEY (recommended for server without RLS policies) or SUPABASE_ANON_KEY / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Redeploy after saving.",
    );
  }

  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          /* Server Component cookie write — ignore when not allowed */
        }
      },
    },
  });
}
