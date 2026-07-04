"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import type { AuthActionResult } from "@/app/actions/auth";
import {
  customSchemeKey,
  isBuiltinSchemeId,
  normalizeActiveColorScheme,
  normalizeHexColor,
  parseSavedColorSchemes,
  type SavedColorScheme,
} from "@/lib/theme/color-schemes";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function fail(message: string): AuthActionResult {
  return { ok: false, error: message };
}

function ok(): AuthActionResult {
  return { ok: true, error: null };
}

function avatarExtension(mime: string): string | null {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/jpeg") return "jpg";
  return null;
}

export async function uploadAvatar(formData: FormData): Promise<AuthActionResult> {
  const file = formData.get("avatar");

  if (!(file instanceof File) || file.size === 0) {
    return fail("Choose an image to upload.");
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return fail("Image must be under 2 MB.");
  }
  if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
    return fail("Use a JPEG, PNG, or WebP image.");
  }

  const ext = avatarExtension(file.type);
  if (!ext) {
    return fail("Unsupported image type.");
  }

  const supabase = await createSupabaseAuthServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return fail("Sign in to upload an avatar.");
  }

  const path = `${user.id}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, {
      upsert: true,
      contentType: file.type,
      cacheControl: "3600",
    });

  if (uploadError) {
    const message = uploadError.message.includes("Bucket not found")
      ? "Avatar storage is not set up. Run the migration `supabase/migrations/20260523140000_avatars_storage_profiles_update.sql` in Supabase."
      : uploadError.message;
    return fail(message);
  }

  const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
  const avatarUrl = urlData.publicUrl;

  const admin = createSupabaseAdminClient();
  const { error: profileError } = await admin
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("user_id", user.id);

  if (profileError) {
    return fail(profileError.message ?? "Could not save avatar.");
  }

  revalidatePath("/", "layout");
  revalidatePath("/profile");
  return ok();
}

export async function removeAvatar(): Promise<AuthActionResult> {
  const supabase = await createSupabaseAuthServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return fail("Sign in to remove your avatar.");
  }

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("avatar_url")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profile?.avatar_url) {
    const marker = "/storage/v1/object/public/avatars/";
    const idx = profile.avatar_url.indexOf(marker);
    if (idx !== -1) {
      const storagePath = profile.avatar_url.slice(idx + marker.length);
      await supabase.storage.from("avatars").remove([storagePath]);
    }
  }

  const { error } = await admin
    .from("profiles")
    .update({ avatar_url: null })
    .eq("user_id", user.id);

  if (error) {
    return fail(error.message ?? "Could not remove avatar.");
  }

  revalidatePath("/", "layout");
  revalidatePath("/profile");
  return ok();
}

function parseDateOfBirthInput(value: string | null | undefined): string | null {
  if (value == null || value.trim() === "") {
    return null;
  }
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return null;
  }
  const date = new Date(`${trimmed}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return trimmed;
}

async function requireUserId(): Promise<string | AuthActionResult> {
  const supabase = await createSupabaseAuthServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return fail("Sign in to update your profile.");
  }

  return user.id;
}

export async function updateDateOfBirth(input: {
  dateOfBirth: string | null;
}): Promise<AuthActionResult> {
  const userId = await requireUserId();
  if (typeof userId !== "string") {
    return userId;
  }

  const dateOfBirth = parseDateOfBirthInput(input.dateOfBirth);
  if (input.dateOfBirth && input.dateOfBirth.trim() && !dateOfBirth) {
    return fail("Enter a valid date (YYYY-MM-DD).");
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ date_of_birth: dateOfBirth })
    .eq("user_id", userId);

  if (error) {
    return fail(error.message ?? "Could not save date of birth.");
  }

  revalidatePath("/", "layout");
  revalidatePath("/profile");
  return ok();
}

export async function applyColorScheme(input: {
  activeColorScheme: string;
}): Promise<AuthActionResult> {
  const userId = await requireUserId();
  if (typeof userId !== "string") {
    return userId;
  }

  const active = normalizeActiveColorScheme(input.activeColorScheme);
  if (!active) {
    return fail("Choose a color scheme.");
  }

  const admin = createSupabaseAdminClient();

  if (isBuiltinSchemeId(active)) {
    const { error } = await admin
      .from("profiles")
      .update({ active_color_scheme: active })
      .eq("user_id", userId);

    if (error) {
      return fail(error.message ?? "Could not save color scheme.");
    }

    revalidatePath("/", "layout");
    revalidatePath("/profile");
    return ok();
  }

  if (!active.startsWith("custom:")) {
    return fail("Invalid color scheme.");
  }

  const customId = active.slice("custom:".length);
  const { data: profile } = await admin
    .from("profiles")
    .select("saved_color_schemes")
    .eq("user_id", userId)
    .maybeSingle();

  const saved = parseSavedColorSchemes(profile?.saved_color_schemes);
  if (!saved.some((scheme) => scheme.id === customId)) {
    return fail("That custom color scheme was not found.");
  }

  const { error } = await admin
    .from("profiles")
    .update({ active_color_scheme: active })
    .eq("user_id", userId);

  if (error) {
    return fail(error.message ?? "Could not save color scheme.");
  }

  revalidatePath("/", "layout");
  revalidatePath("/profile");
  return ok();
}

function failCustom(message: string): { ok: false; error: string } {
  return { ok: false, error: message };
}

export async function saveCustomColorScheme(input: {
  name: string;
  background: string;
  foreground: string;
  accent: string;
  apply?: boolean;
}): Promise<
  | { ok: true; error: null; scheme: SavedColorScheme; activeColorScheme: string }
  | { ok: false; error: string }
> {
  const userId = await requireUserId();
  if (typeof userId !== "string") {
    return failCustom(userId.error ?? "Sign in to update your profile.");
  }

  const name = input.name.trim();
  const background = normalizeHexColor(input.background);
  const foreground = normalizeHexColor(input.foreground);
  const accent = normalizeHexColor(input.accent);

  if (!name) {
    return failCustom("Name your custom color scheme.");
  }
  if (name.length > 32) {
    return failCustom("Scheme name must be at most 32 characters.");
  }
  if (!background || !foreground || !accent) {
    return failCustom("Pick valid colors for background, text, and accent.");
  }

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("saved_color_schemes, active_color_scheme")
    .eq("user_id", userId)
    .maybeSingle();

  const saved = parseSavedColorSchemes(profile?.saved_color_schemes);
  const scheme: SavedColorScheme = {
    id: crypto.randomUUID(),
    name,
    background,
    foreground,
    accent,
  };

  const nextSaved = [...saved, scheme];
  const activeColorScheme = input.apply
    ? customSchemeKey(scheme.id)
    : typeof profile?.active_color_scheme === "string" &&
        profile.active_color_scheme.trim()
      ? profile.active_color_scheme.trim()
      : "default";

  const { error } = await admin
    .from("profiles")
    .update({
      saved_color_schemes: nextSaved,
      active_color_scheme: activeColorScheme,
    })
    .eq("user_id", userId);

  if (error) {
    return failCustom(error.message ?? "Could not save custom color scheme.");
  }

  revalidatePath("/", "layout");
  revalidatePath("/profile");
  return { ok: true, error: null, scheme, activeColorScheme };
}

export async function deleteCustomColorScheme(input: {
  schemeId: string;
}): Promise<
  | {
      ok: true;
      error: null;
      activeColorScheme: string;
      savedColorSchemes: SavedColorScheme[];
    }
  | { ok: false; error: string }
> {
  const userId = await requireUserId();
  if (typeof userId !== "string") {
    return failCustom(userId.error ?? "Sign in to update your profile.");
  }

  const schemeId = input.schemeId.trim();
  if (!schemeId) {
    return failCustom("Choose a theme to delete.");
  }

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("saved_color_schemes, active_color_scheme")
    .eq("user_id", userId)
    .maybeSingle();

  const saved = parseSavedColorSchemes(profile?.saved_color_schemes);
  const nextSaved = saved.filter((scheme) => scheme.id !== schemeId);

  if (nextSaved.length === saved.length) {
    return failCustom("That custom theme was not found.");
  }

  const activeKey = customSchemeKey(schemeId);
  const currentActive = normalizeActiveColorScheme(profile?.active_color_scheme);
  const activeColorScheme =
    currentActive === activeKey ? "default" : currentActive;

  const { error } = await admin
    .from("profiles")
    .update({
      saved_color_schemes: nextSaved,
      active_color_scheme: activeColorScheme,
    })
    .eq("user_id", userId);

  if (error) {
    return failCustom(error.message ?? "Could not delete custom theme.");
  }

  revalidatePath("/", "layout");
  revalidatePath("/profile");
  return { ok: true, error: null, activeColorScheme, savedColorSchemes: nextSaved };
}
