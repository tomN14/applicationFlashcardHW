import { ensurePublicUser } from "@/lib/auth/ensure-public-user";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import {
  parseSavedColorSchemes,
  normalizeActiveColorScheme,
  type SavedColorScheme,
} from "@/lib/theme/color-schemes";

export type AppAuthUser = {
  id: string;
  email: string;
  /** Shown in the UI; defaults to email until the user picks a username. */
  username: string;
  avatarUrl: string | null;
  activeColorScheme: string;
  savedColorSchemes: SavedColorScheme[];
};

export async function getServerAuthUser(): Promise<AppAuthUser | null> {
  const supabase = await createSupabaseAuthServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.email) {
    return null;
  }

  try {
    await ensurePublicUser(user);
  } catch {
    /* Deck reads still work; writes may fail until sync succeeds */
  }

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("username, avatar_url, active_color_scheme, saved_color_schemes")
    .eq("user_id", user.id)
    .maybeSingle();

  const username =
    typeof profile?.username === "string" && profile.username.trim()
      ? profile.username.trim()
      : user.email;

  const avatarUrl =
    typeof profile?.avatar_url === "string" && profile.avatar_url.trim()
      ? profile.avatar_url.trim()
      : null;

  const activeColorScheme = normalizeActiveColorScheme(profile?.active_color_scheme);

  return {
    id: user.id,
    email: user.email,
    username,
    avatarUrl,
    activeColorScheme,
    savedColorSchemes: parseSavedColorSchemes(profile?.saved_color_schemes),
  };
}

export async function getCurrentUserId(): Promise<string | null> {
  const user = await getServerAuthUser();
  return user?.id ?? null;
}
