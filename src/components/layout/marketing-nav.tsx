import Link from "next/link";

export function MarketingNav() {
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
      </nav>
    </header>
  );
}
