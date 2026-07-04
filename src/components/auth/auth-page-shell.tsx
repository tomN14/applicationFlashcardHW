import Link from "next/link";

type AuthPageShellProps = {
  children: React.ReactNode;
  backHref?: string;
  backLabel?: string;
};

export function AuthPageShell({
  children,
  backHref = "/",
  backLabel = "← Recall",
}: AuthPageShellProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-indigo-50/40 px-4 py-12 text-zinc-900">
      <div className="mx-auto mb-8 max-w-md">
        <Link
          href={backHref}
          className="text-sm font-semibold text-indigo-700 transition hover:text-indigo-900"
        >
          {backLabel}
        </Link>
      </div>
      {children}
    </div>
  );
}
