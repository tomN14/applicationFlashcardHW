import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { AuthAlert } from "@/components/auth/auth-alert";
import { ForgotPasswordForm } from "./forgot-password-form";

type ForgotPasswordPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const { error } = await searchParams;

  return (
    <AuthPageShell backHref="/login" backLabel="← Sign in">
      {error === "expired" ? (
        <div className="mx-auto mb-4 w-full max-w-md">
          <AuthAlert variant="error">
            Your reset link expired or is invalid. Request a new one below.
          </AuthAlert>
        </div>
      ) : null}
      <ForgotPasswordForm />
    </AuthPageShell>
  );
}
