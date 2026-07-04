import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { getServerAuthUser } from "@/lib/auth/session";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Sign up — Recall",
  description: "Create a Recall account with email and password.",
};

export default async function SignupPage() {
  const user = await getServerAuthUser();
  if (user) {
    redirect("/decks");
  }

  return (
    <AuthPageShell backHref="/login" backLabel="← Sign in">
      <SignupForm />
    </AuthPageShell>
  );
}
