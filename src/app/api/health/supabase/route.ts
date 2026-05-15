import { NextResponse } from "next/server";

/**
 * Confirms Supabase-related env vars are visible to the deployment (no secret values).
 * Visit GET /api/health/supabase on Vercel after redeploying.
 */
export async function GET() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim();
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim();

  const urlSet = Boolean(url);
  const keySet = Boolean(anonKey);

  return NextResponse.json(
    {
      supabaseEnvOk: urlSet && keySet,
      urlSet,
      keySet,
      hint:
        !urlSet || !keySet
          ? "Add vars on Vercel (Production + Preview), enable both checkboxes, redeploy. Names: NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY, or SUPABASE_URL + SUPABASE_ANON_KEY."
          : null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
