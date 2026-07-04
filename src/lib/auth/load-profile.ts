import { ensurePublicUser } from "@/lib/auth/ensure-public-user";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import {
  parseSavedColorSchemes,
  normalizeActiveColorScheme,
  type SavedColorScheme,
} from "@/lib/theme/color-schemes";

export type UserProfile = {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  dateOfBirth: string | null;
  activeColorScheme: string;
  savedColorSchemes: SavedColorScheme[];
};

function formatDateOfBirth(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  return null;
}

export async function loadUserProfile(): Promise<UserProfile | null> {
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
    /* Profile page may still load read-only fields */
  }

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select(
      "username, avatar_url, date_of_birth, active_color_scheme, saved_color_schemes",
    )
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
    dateOfBirth: formatDateOfBirth(profile?.date_of_birth),
    activeColorScheme,
    savedColorSchemes: parseSavedColorSchemes(profile?.saved_color_schemes),
  };
}
