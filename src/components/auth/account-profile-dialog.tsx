"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type FormEvent } from "react";
import { signOut, updateUsername } from "@/app/actions/auth";
import { Avatar } from "@/components/avatar";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogDescription,
  DialogTitle,
} from "@/components/dialog";
import type { AuthMenuUser } from "@/components/auth/auth-menu";
import { displayInitials } from "@/lib/auth/display-initials";

type AccountProfileDialogProps = {
  user: AuthMenuUser;
  open: boolean;
  onClose: () => void;
};

export function AccountProfileDialog({
  user,
  open,
  onClose,
}: AccountProfileDialogProps) {
  const router = useRouter();
  const [username, setUsername] = useState(user.username);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, startSave] = useTransition();
  const [signingOut, startSignOut] = useTransition();

  useEffect(() => {
    if (open) {
      setUsername(user.username);
      setError(null);
      setSuccess(null);
    }
  }, [open, user.username]);

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    startSave(async () => {
      const result = await updateUsername({ username });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSuccess("Profile saved.");
      router.refresh();
    });
  };

  const handleSignOut = () => {
    setError(null);
    startSignOut(async () => {
      try {
        await signOut();
      } catch {
        router.refresh();
      }
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="sm"
      className="text-zinc-900"
    >
      <div>
        <DialogTitle>Your profile</DialogTitle>
        <DialogDescription>
          Choose how your name appears in the app. Your email stays private.
        </DialogDescription>

        <DialogBody>
          <div className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4">
            <Avatar
              initials={displayInitials(username || user.email)}
              alt={username}
              className="size-14 bg-indigo-600 text-lg text-white"
              square
            />
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-zinc-900">
                {username || user.email}
              </p>
              <p className="truncate text-sm text-zinc-500">{user.email}</p>
            </div>
          </div>

          <form id="profile-form" className="mt-5 space-y-4" onSubmit={handleSave}>
            <label className="block text-sm">
              <span className="font-medium text-zinc-700">Username</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={saving || signingOut}
                maxLength={32}
                required
                className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm shadow-inner focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
                placeholder={user.email}
              />
              <span className="mt-1.5 block text-xs text-zinc-500">
                Default is your email until you change it.
              </span>
            </label>

            {error ? (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
                {error}
              </p>
            ) : null}
            {success ? (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                {success}
              </p>
            ) : null}
          </form>
        </DialogBody>

        <DialogActions>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={saving || signingOut}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 disabled:opacity-60"
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={saving || signingOut}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-60"
          >
            Close
          </button>
          <button
            type="submit"
            form="profile-form"
            disabled={saving || signingOut}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </DialogActions>
      </div>
    </Dialog>
  );
}
