"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { signUpWithEmail, type AuthActionResult } from "@/app/actions/auth";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthDivider } from "@/components/auth/auth-divider";
import { AuthField } from "@/components/auth/auth-field";
import { OAuthButtons } from "@/components/auth/oauth-buttons";

export function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setPending(true);
    try {
      const result: AuthActionResult = await signUpWithEmail({
        email,
        password,
        confirmPassword,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setInfo(
        "Account created. Check your email to confirm, then sign in. Your profile is saved automatically.",
      );
      setPassword("");
      setConfirmPassword("");
    } catch {
      /* redirect() throws when email confirmation is off and session is created */
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-3xl border border-zinc-200/90 bg-white p-8 shadow-xl ring-1 ring-zinc-950/5 sm:p-10">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-indigo-600">
          Get started
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900">
          Create account
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Create an account with Google, GitHub, or email and password.
        </p>

        <div className="mt-6">
          <OAuthButtons />
        </div>

        <AuthDivider />

        <form className="space-y-4" onSubmit={handleSubmit}>
          <AuthField
            label="Email"
            name="email"
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
            placeholder="you@example.com"
            required
            disabled={pending}
          />
          <AuthField
            label="Password"
            name="password"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            required
            minLength={8}
            disabled={pending}
            hint="Use 8 or more characters."
          />
          <AuthField
            label="Confirm password"
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
          {info ? <AuthAlert variant="success">{info}</AuthAlert> : null}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-600">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-indigo-700 hover:text-indigo-900"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
