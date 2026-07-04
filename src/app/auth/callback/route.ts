import { NextResponse } from "next/server";
import { ensurePublicUser } from "@/lib/auth/ensure-public-user";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";

function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/decks";
  }
  return next;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));
  const oauthError = searchParams.get("error_description") ?? searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(oauthError)}`,
    );
  }

  if (code) {
    const supabase = await createSupabaseAuthServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      try {
        await ensurePublicUser(data.user);
      } catch {
        /* Session is valid; user row may sync on next request */
      }
      return NextResponse.redirect(`${origin}${next}`);
    }

    const message =
      error?.message ?? "Could not complete sign-in. Try again.";
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(message)}`,
    );
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("Could not complete sign-in.")}`,
  );
}
