"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { signInWithEmail, type AuthActionResult } from "@/app/actions/auth";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthDivider } from "@/components/auth/auth-divider";
import { AuthField } from "@/components/auth/auth-field";
import { OAuthButtons } from "@/components/auth/oauth-buttons";

type LoginFormProps = {
  initialError?: string | null;
  passwordResetSuccess?: boolean;
  nextPath?: string;
};

export function LoginForm({
  initialError,
  passwordResetSuccess,
  nextPath = "/decks",
}: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    try {
      const result: AuthActionResult = await signInWithEmail({
        email,
        password,
        nextPath,
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
          Welcome back
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Sign in</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Sign in with Google, GitHub, or your email and password.
        </p>

        {passwordResetSuccess ? (
          <div className="mt-6">
            <AuthAlert variant="success">
              Password updated. Sign in with your new password.
            </AuthAlert>
          </div>
        ) : null}

        <div className="mt-6">
          <OAuthButtons nextPath={nextPath} />
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
          <div>
            <AuthField
              label="Password"
              name="password"
              type="password"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
              placeholder="••••••••"
              required
              disabled={pending}
            />
            <div className="mt-2 text-right">
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-indigo-700 hover:text-indigo-900"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-600">
          No account yet?{" "}
          <Link
            href="/signup"
            className="font-semibold text-indigo-700 hover:text-indigo-900"
          >
            Create one
          </Link>
        </p>

        <p className="mt-4 text-center text-sm text-zinc-500">
          <Link
            href="/decks"
            className="font-medium text-zinc-600 hover:text-zinc-900"
          >
            Continue without signing in →
          </Link>
        </p>
      </div>
    </div>
  );
}
