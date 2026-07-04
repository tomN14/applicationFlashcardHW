"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ensurePublicUser } from "@/lib/auth/ensure-public-user";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

export type AuthActionResult =
  | { ok: true; error: null }
  | { ok: false; error: string };

function fail(message: string): AuthActionResult {
  return { ok: false, error: message };
}

function ok(): AuthActionResult {
  return { ok: true, error: null };
}

function appOrigin(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

function safeNextPath(next: string | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/decks";
  }
  return next;
}

export type OAuthProvider = "google" | "github";

export async function signInWithOAuth(input: {
  provider: OAuthProvider;
  nextPath?: string;
}): Promise<AuthActionResult> {
  const nextPath = safeNextPath(input.nextPath);
  const supabase = await createSupabaseAuthServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: input.provider,
    options: {
      redirectTo: `${appOrigin()}/auth/callback?next=${encodeURIComponent(nextPath)}`,
    },
  });

  if (error) {
    return fail(error.message);
  }

  if (data.url) {
    redirect(data.url);
  }

  return fail("Could not start OAuth sign-in.");
}

export async function signUpWithEmail(input: {
  email: string;
  password: string;
  confirmPassword?: string;
}): Promise<AuthActionResult> {
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!email || !email.includes("@")) {
    return fail("Enter a valid email address.");
  }
  if (password.length < 8) {
    return fail("Password must be at least 8 characters.");
  }
  if (
    typeof input.confirmPassword === "string" &&
    input.confirmPassword !== password
  ) {
    return fail("Passwords do not match.");
  }

  const supabase = await createSupabaseAuthServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${appOrigin()}/auth/callback`,
    },
  });

  if (error) {
    const message = error.message.includes("Database error saving new user")
      ? "Sign-up failed in the database. In Supabase → SQL Editor, run the migration `supabase/migrations/20260522130000_auth_signup_handle_new_user.sql`, then try again."
      : error.message;
    return fail(message);
  }

  if (data.user) {
    try {
      await ensurePublicUser(data.user);
    } catch (e) {
      return fail(
        e instanceof Error ? e.message : "Account created but profile sync failed.",
      );
    }
  }

  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/decks");
  }

  return ok();
}

export async function signInWithEmail(input: {
  email: string;
  password: string;
  nextPath?: string;
}): Promise<AuthActionResult> {
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!email || !email.includes("@")) {
    return fail("Enter a valid email address.");
  }
  if (!password) {
    return fail("Enter your password.");
  }

  const supabase = await createSupabaseAuthServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return fail(error.message);
  }

  if (data.user) {
    try {
      await ensurePublicUser(data.user);
    } catch (e) {
      return fail(
        e instanceof Error ? e.message : "Signed in but profile sync failed.",
      );
    }
  }

  revalidatePath("/", "layout");
  redirect(safeNextPath(input.nextPath));
}

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseAuthServerClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function requestPasswordReset(input: {
  email: string;
}): Promise<AuthActionResult> {
  const email = input.email.trim().toLowerCase();

  if (!email || !email.includes("@")) {
    return fail("Enter a valid email address.");
  }

  const supabase = await createSupabaseAuthServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appOrigin()}/auth/callback?next=/reset-password`,
  });

  if (error) {
    return fail(error.message);
  }

  return ok();
}

export async function updatePassword(input: {
  password: string;
  confirmPassword?: string;
}): Promise<AuthActionResult> {
  const password = input.password;

  if (password.length < 8) {
    return fail("Password must be at least 8 characters.");
  }
  if (
    typeof input.confirmPassword === "string" &&
    input.confirmPassword !== password
  ) {
    return fail("Passwords do not match.");
  }

  const supabase = await createSupabaseAuthServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return fail("Your reset link expired. Request a new one from forgot password.");
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return fail(error.message);
  }

  revalidatePath("/", "layout");
  redirect("/login?reset=success");
}

export async function updateUsername(input: {
  username: string;
}): Promise<AuthActionResult> {
  const supabase = await createSupabaseAuthServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return fail("Sign in to update your profile.");
  }

  const username = input.username.trim();
  if (!username) {
    return fail("Username is required.");
  }
  if (username.length > 32) {
    return fail("Username must be at most 32 characters.");
  }
  if (!/^[\w.@+-]+$/.test(username)) {
    return fail(
      "Username can only use letters, numbers, and . _ @ + -",
    );
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ username })
    .eq("user_id", user.id);

  if (error) {
    if (error.code === "23505") {
      return fail("That username is already taken.");
    }
    return fail(error.message ?? "Could not save username.");
  }

  revalidatePath("/", "layout");
  revalidatePath("/profile");
  return ok();
}

export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
  confirmPassword?: string;
}): Promise<AuthActionResult> {
  const supabase = await createSupabaseAuthServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user?.email) {
    return fail("Sign in to change your password.");
  }

  const currentPassword = input.currentPassword;
  const newPassword = input.newPassword;

  if (!currentPassword) {
    return fail("Enter your current password.");
  }
  if (newPassword.length < 8) {
    return fail("New password must be at least 8 characters.");
  }
  if (
    typeof input.confirmPassword === "string" &&
    input.confirmPassword !== newPassword
  ) {
    return fail("New passwords do not match.");
  }
  if (currentPassword === newPassword) {
    return fail("Choose a different password than your current one.");
  }

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (verifyError) {
    return fail("Current password is incorrect.");
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    return fail(error.message);
  }

  revalidatePath("/", "layout");
  revalidatePath("/profile");
  return ok();
}
