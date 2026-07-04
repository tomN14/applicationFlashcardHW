"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import {
  changePassword,
  requestPasswordReset,
  signOut,
  updateUsername,
  type AuthActionResult,
} from "@/app/actions/auth";
import { removeAvatar, uploadAvatar } from "@/app/actions/profile";
import { displayInitials } from "@/lib/auth/display-initials";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthField } from "@/components/auth/auth-field";
import { Avatar } from "@/components/avatar";
import { ProfileAppearanceSection } from "@/components/profile/profile-appearance-section";
import type { UserProfile } from "@/lib/auth/load-profile";

type ProfilePageClientProps = {
  profile: UserProfile;
};

export function ProfilePageClient({ profile }: ProfilePageClientProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState(profile.username);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [usernameMessage, setUsernameMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const [avatarMessage, setAvatarMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const [resetMessage, setResetMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [savingUsername, startSaveUsername] = useTransition();
  const [uploadingAvatar, startUploadAvatar] = useTransition();
  const [removingAvatar, startRemoveAvatar] = useTransition();
  const [changingPassword, startChangePassword] = useTransition();
  const [sendingReset, startSendReset] = useTransition();
  const [signingOut, startSignOut] = useTransition();

  const busy =
    savingUsername ||
    uploadingAvatar ||
    removingAvatar ||
    changingPassword ||
    sendingReset ||
    signingOut;

  useEffect(() => {
    setUsername(profile.username);
    setAvatarUrl(profile.avatarUrl);
  }, [profile.username, profile.avatarUrl]);

  const handleUsernameSave = (e: FormEvent) => {
    e.preventDefault();
    setUsernameMessage(null);
    startSaveUsername(async () => {
      const result = await updateUsername({ username });
      if (!result.ok) {
        setUsernameMessage({ type: "error", text: result.error });
        return;
      }
      setUsernameMessage({ type: "success", text: "Username saved." });
      router.refresh();
    });
  };

  const handleAvatarPick = () => {
    if (!busy) {
      fileInputRef.current?.click();
    }
  };

  const handleAvatarChange = (file: File | undefined) => {
    if (!file) return;
    setAvatarMessage(null);
    const formData = new FormData();
    formData.set("avatar", file);
    startUploadAvatar(async () => {
      const result = await uploadAvatar(formData);
      if (!result.ok) {
        setAvatarMessage({ type: "error", text: result.error });
        return;
      }
      setAvatarMessage({ type: "success", text: "Avatar updated." });
      router.refresh();
    });
  };

  const handleRemoveAvatar = () => {
    setAvatarMessage(null);
    startRemoveAvatar(async () => {
      const result = await removeAvatar();
      if (!result.ok) {
        setAvatarMessage({ type: "error", text: result.error });
        return;
      }
      setAvatarUrl(null);
      setAvatarMessage({ type: "success", text: "Avatar removed." });
      router.refresh();
    });
  };

  const handlePasswordChange = (e: FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);
    startChangePassword(async () => {
      const result = await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      if (!result.ok) {
        setPasswordMessage({ type: "error", text: result.error });
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage({ type: "success", text: "Password updated." });
    });
  };

  const handleSendResetLink = () => {
    setResetMessage(null);
    startSendReset(async () => {
      const result: AuthActionResult = await requestPasswordReset({
        email: profile.email,
      });
      if (!result.ok) {
        setResetMessage({ type: "error", text: result.error });
        return;
      }
      setResetMessage({
        type: "success",
        text: "Reset link sent. Check your inbox and spam folder.",
      });
    });
  };

  const handleSignOut = () => {
    startSignOut(async () => {
      try {
        await signOut();
      } catch {
        router.refresh();
      }
    });
  };

  const previewAvatarUrl = avatarUrl ?? profile.avatarUrl;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-indigo-600">
          Account
        </p>
        <h1 className="text-2xl font-semibold text-zinc-900">Your profile</h1>
        <p className="text-sm text-zinc-600">
          Update how you appear in the app, change your password, or sign out.
        </p>
      </div>

      <section className="rounded-3xl border border-zinc-200/90 bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 sm:p-8">
        <h2 className="text-base font-semibold text-zinc-900">Photo</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Upload a profile picture. JPEG, PNG, or WebP up to 2 MB.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-5">
          <button
            type="button"
            onClick={handleAvatarPick}
            disabled={busy}
            className="group relative rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 disabled:opacity-60"
            aria-label="Upload profile photo"
          >
            <Avatar
              src={previewAvatarUrl}
              initials={displayInitials(username || profile.email)}
              alt={username}
              className="size-20 bg-indigo-600 text-xl text-white transition group-hover:opacity-90"
              square
            />
            <span className="absolute inset-x-0 bottom-0 rounded-b-2xl bg-zinc-950/55 py-1 text-[10px] font-medium text-white opacity-0 transition group-hover:opacity-100">
              Change
            </span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              handleAvatarChange(file);
              e.target.value = "";
            }}
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleAvatarPick}
              disabled={busy}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 disabled:opacity-60"
            >
              {uploadingAvatar ? "Uploading…" : "Upload photo"}
            </button>
            {previewAvatarUrl ? (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                disabled={busy}
                className="rounded-xl px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-60"
              >
                {removingAvatar ? "Removing…" : "Remove photo"}
              </button>
            ) : null}
          </div>
        </div>

        {avatarMessage ? (
          <div className="mt-4">
            <AuthAlert variant={avatarMessage.type}>{avatarMessage.text}</AuthAlert>
          </div>
        ) : null}
      </section>

      <section className="rounded-3xl border border-zinc-200/90 bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 sm:p-8">
        <h2 className="text-base font-semibold text-zinc-900">Username</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Shown in the app instead of your email. Default is your email until you
          change it.
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleUsernameSave}>
          <AuthField
            label="Username"
            name="username"
            value={username}
            onChange={setUsername}
            maxLength={32}
            required
            disabled={busy}
            placeholder={profile.email}
            hint="Letters, numbers, and . _ @ + -"
          />
          {usernameMessage ? (
            <AuthAlert variant={usernameMessage.type}>
              {usernameMessage.text}
            </AuthAlert>
          ) : null}
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60"
          >
            {savingUsername ? "Saving…" : "Save username"}
          </button>
        </form>

        <p className="mt-4 text-sm text-[var(--app-muted)]">
          Email: <span className="font-medium text-[var(--app-foreground)]">{profile.email}</span>
        </p>
      </section>

      <ProfileAppearanceSection
        dateOfBirth={profile.dateOfBirth}
        activeColorScheme={profile.activeColorScheme}
        savedColorSchemes={profile.savedColorSchemes}
        disabled={busy}
      />

      <section className="rounded-3xl border border-zinc-200/90 bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 sm:p-8">
        <h2 className="text-base font-semibold text-zinc-900">Password</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Change your password while signed in, or email yourself a reset link.
        </p>

        <form className="mt-5 space-y-4" onSubmit={handlePasswordChange}>
          <AuthField
            label="Current password"
            name="currentPassword"
            type="password"
            value={currentPassword}
            onChange={setCurrentPassword}
            autoComplete="current-password"
            required
            disabled={busy}
          />
          <AuthField
            label="New password"
            name="newPassword"
            type="password"
            value={newPassword}
            onChange={setNewPassword}
            autoComplete="new-password"
            minLength={8}
            required
            disabled={busy}
            hint="At least 8 characters"
          />
          <AuthField
            label="Confirm new password"
            name="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
            required
            disabled={busy}
          />
          {passwordMessage ? (
            <AuthAlert variant={passwordMessage.type}>
              {passwordMessage.text}
            </AuthAlert>
          ) : null}
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60"
          >
            {changingPassword ? "Updating…" : "Update password"}
          </button>
        </form>

        <div className="mt-6 border-t border-zinc-100 pt-6">
          <p className="text-sm text-zinc-600">
            Prefer a reset link? We&apos;ll email{" "}
            <span className="font-medium text-zinc-800">{profile.email}</span>.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSendResetLink}
              disabled={busy}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 disabled:opacity-60"
            >
              {sendingReset ? "Sending…" : "Email reset link"}
            </button>
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-indigo-700 hover:text-indigo-900"
            >
              Forgot password page
            </Link>
          </div>
          {resetMessage ? (
            <div className="mt-4">
              <AuthAlert variant={resetMessage.type}>{resetMessage.text}</AuthAlert>
            </div>
          ) : null}
        </div>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-zinc-200/90 bg-zinc-50/80 px-6 py-5">
        <div>
          <p className="text-sm font-semibold text-zinc-900">Sign out</p>
          <p className="text-sm text-zinc-600">End your session on this device.</p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={busy}
          className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 disabled:opacity-60"
        >
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </section>
    </div>
  );
}
