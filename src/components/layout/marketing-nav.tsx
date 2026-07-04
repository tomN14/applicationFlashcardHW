import Link from "next/link";
import type { AppAuthUser } from "@/lib/auth/session";

type MarketingNavProps = {
  user: AppAuthUser | null;
};

export function MarketingNav({ user }: MarketingNavProps) {
  return (
    <header className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
      <nav className="mx-auto flex max-w-3xl flex-wrap items-center gap-4 text-sm">
        <Link
          href="/"
          className="font-semibold text-zinc-900 dark:text-zinc-50"
        >
          Home
        </Link>
        <Link
          href="/pricing"
          className="text-zinc-600 hover:underline dark:text-zinc-400"
        >
          Pricing
        </Link>
        <Link
          href="/contact"
          className="text-zinc-600 hover:underline dark:text-zinc-400"
        >
          Contact
        </Link>
        {user ? (
          <Link
            href="/decks"
            className="rounded-full bg-indigo-600 px-3.5 py-1.5 font-medium text-white shadow-sm transition hover:bg-indigo-500"
          >
            Decks
          </Link>
        ) : (
          <>
            <Link
              href="/login"
              className="font-medium text-indigo-700 hover:underline dark:text-indigo-400"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-indigo-600 px-3.5 py-1.5 font-medium text-white shadow-sm transition hover:bg-indigo-500"
            >
              Sign up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
