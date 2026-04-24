import Link from "next/link";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/decks", label: "Decks" },
  { href: "/study", label: "Study" },
] as const;

export function AppSidebar() {
  return (
    <aside className="flex w-52 shrink-0 flex-col border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="border-b border-zinc-200 px-4 py-4 dark:border-zinc-800">
        <Link
          href="/dashboard"
          className="text-sm font-semibold text-zinc-900 dark:text-zinc-50"
        >
          Recall
        </Link>
      </div>
      <nav className="flex flex-col gap-1 p-3">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="rounded-md px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-200/80 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
