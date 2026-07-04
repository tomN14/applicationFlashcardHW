"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { requestPasswordReset, type AuthActionResult } from "@/app/actions/auth";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthField } from "@/components/auth/auth-field";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setPending(true);

    try {
      const result: AuthActionResult = await requestPasswordReset({ email });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setInfo(
        "If an account exists for that email, we sent a reset link. Check your inbox and spam folder.",
      );
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
          Forgot password
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Enter your email and we&apos;ll send a link to reset your password.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
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

          {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}
          {info ? <AuthAlert variant="success">{info}</AuthAlert> : null}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Sending link…" : "Send reset link"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-600">
          Remember your password?{" "}
          <Link
            href="/login"
            className="font-semibold text-indigo-700 hover:text-indigo-900"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
