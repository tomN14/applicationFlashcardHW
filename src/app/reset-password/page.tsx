import { redirect } from "next/navigation";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { getServerAuthUser } from "@/lib/auth/session";
import { ResetPasswordForm } from "./reset-password-form";

export default async function ResetPasswordPage() {
  const user = await getServerAuthUser();
  if (!user) {
    redirect("/forgot-password?error=expired");
  }

  return (
    <AuthPageShell backHref="/login" backLabel="← Sign in">
      <ResetPasswordForm />
    </AuthPageShell>
  );
}
