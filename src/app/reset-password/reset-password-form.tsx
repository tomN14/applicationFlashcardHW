"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { updatePassword, type AuthActionResult } from "@/app/actions/auth";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthField } from "@/components/auth/auth-field";

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setPending(true);
    try {
      const result: AuthActionResult = await updatePassword({
        password,
        confirmPassword,
      });
      if (!result.ok) {
        setError(result.error);
      }
    } catch {
      /* redirect() throws on success */
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-3xl border border-zinc-200/90 bg-white p-8 shadow-xl ring-1 ring-zinc-950/5 sm:p-10">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-indigo-600">
          Account recovery
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900">
          Set new password
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Choose a new password for your account.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <AuthField
            label="New password"
            name="password"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            required
            minLength={8}
            disabled={pending}
          />
          <AuthField
            label="Confirm new password"
            name="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
            placeholder="Repeat your password"
            required
            minLength={8}
            disabled={pending}
          />

          {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Updating…" : "Update password"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-600">
          <Link
            href="/forgot-password"
            className="font-semibold text-indigo-700 hover:text-indigo-900"
          >
            Request a new reset link
          </Link>
        </p>
      </div>
    </div>
  );
}
