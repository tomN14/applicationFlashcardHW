import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

const AUTH_PASSWORD_PLACEHOLDER = "supabase_auth";

type AuthUserLike = {
  id: string;
  email?: string | null;
};

/**
 * Mirror Supabase Auth user into `public.users` (+ profile + subscription).
 * New profiles default `username` to the user's email.
 */
export async function ensurePublicUser(authUser: AuthUserLike): Promise<void> {
  const email = authUser.email?.trim().toLowerCase();
  if (!email) {
    return;
  }

  const admin = createSupabaseAdminClient();

  const { error: userError } = await admin.from("users").upsert(
    {
      id: authUser.id,
      email,
      password_hash: AUTH_PASSWORD_PLACEHOLDER,
    },
    { onConflict: "id" },
  );

  if (userError) {
    const msg = userError.message ?? "Could not save user row.";
    if (userError.code === "23505") {
      throw new Error(
        "This email is already registered. Try signing in, or use a different email.",
      );
    }
    throw new Error(msg);
  }

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      user_id: authUser.id,
      username: email,
    },
    { onConflict: "user_id", ignoreDuplicates: true },
  );

  if (profileError) {
    throw new Error(profileError.message ?? "Could not save profile.");
  }

  const { data: existingSub } = await admin
    .from("subscriptions")
    .select("id")
    .eq("user_id", authUser.id)
    .maybeSingle();

  if (!existingSub) {
    const { error: subError } = await admin.from("subscriptions").insert({
      user_id: authUser.id,
      plan: "free",
    });
    if (subError && subError.code !== "23505") {
      throw new Error(subError.message ?? "Could not save subscription.");
    }
  }
}
