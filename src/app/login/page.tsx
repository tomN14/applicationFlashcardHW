import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { getServerAuthUser } from "@/lib/auth/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in — Recall",
  description: "Sign in to your Recall account with email and password.",
};

type LoginPageProps = {
  searchParams: Promise<{ error?: string; reset?: string; next?: string }>;
};

function safeNextPath(next: string | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/decks";
  }
  return next;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getServerAuthUser();
  const { error, reset, next } = await searchParams;
  const nextPath = safeNextPath(next);

  if (user) {
    redirect(nextPath);
  }

  return (
    <AuthPageShell>
      <LoginForm
        initialError={error ?? null}
        passwordResetSuccess={reset === "success"}
        nextPath={nextPath}
      />
    </AuthPageShell>
  );
}
