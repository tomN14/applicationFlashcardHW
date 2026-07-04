import { NextResponse } from "next/server";

function present(name: string): boolean {
  const v = process.env[name];
  return typeof v === "string" && v.trim().length > 0;
}

function urlFromEnv(): string | undefined {
  return (
    process.env.SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  );
}

function serverKeyResolved(): boolean {
  const service =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SECRET_KEY?.trim();
  if (service) {
    return true;
  }
  return Boolean(
    process.env.SUPABASE_ANON_KEY?.trim() ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim(),
  );
}

/**
 * Confirms Supabase-related env vars are visible to the deployment (no secret values).
 * Visit GET /api/health/supabase on Vercel after redeploying.
 */
export async function GET() {
  const url = urlFromEnv();
  const keyOk = serverKeyResolved();
  const urlSet = Boolean(url);
  const supabaseEnvOk = urlSet && keyOk;

  const keys = {
    SUPABASE_URL: present("SUPABASE_URL"),
    NEXT_PUBLIC_SUPABASE_URL: present("NEXT_PUBLIC_SUPABASE_URL"),
    SUPABASE_SERVICE_ROLE_KEY: present("SUPABASE_SERVICE_ROLE_KEY"),
    SUPABASE_SECRET_KEY: present("SUPABASE_SECRET_KEY"),
    SUPABASE_ANON_KEY: present("SUPABASE_ANON_KEY"),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: present("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: present(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    ),
  };

  const servicePresent =
    present("SUPABASE_SERVICE_ROLE_KEY") || present("SUPABASE_SECRET_KEY");

  let urlHostname: string | null = null;
  let urlParseError: string | null = null;
  if (url) {
    try {
      urlHostname = new URL(url.includes("://") ? url : `https://${url}`).hostname;
    } catch {
      urlParseError = "SUPABASE_URL is not a valid URL (paste full Project URL from Supabase)";
    }
  }

  const urlLooksLikeSupabase =
    urlHostname != null && urlHostname.endsWith(".supabase.co");

  return NextResponse.json(
    {
      supabaseEnvOk,
      urlSet,
      urlHostname,
      urlLooksLikeSupabase,
      urlParseError,
      serverKeyConfigured: servicePresent || keyOk,
      usesServiceRole: servicePresent,
      vercel: present("VERCEL"),
      vercelEnv: process.env.VERCEL_ENV ?? null,
      keysPresent: keys,
      dnsHint:
        "If /decks shows ENOTFOUND for *.supabase.co, the Project URL in Vercel is wrong or the Supabase project was deleted/paused. Copy Settings → API → Project URL exactly from dashboard.",
      hint: !supabaseEnvOk
        ? "Need SUPABASE_URL plus SUPABASE_SERVICE_ROLE_KEY (recommended; bypasses RLS) or anon/publishable keys. Names must match exactly. Redeploy after saving."
        : urlParseError,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
