import Link from "next/link";
import { DashboardClient } from "./dashboard-client";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-6 py-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Dashboard
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          App surface (placeholder): signed-in home for decks, billing, and
          settings. Wire auth (Supabase) and Stripe customer records here.
        </p>
      </div>
      <DashboardClient />
      <nav className="flex flex-wrap gap-4 text-sm font-medium">
        <Link href="/decks" className="text-zinc-700 underline dark:text-zinc-300">
          My decks
        </Link>
        <Link href="/study" className="text-zinc-700 underline dark:text-zinc-300">
          Study
        </Link>
        <Link href="/pricing" className="text-zinc-700 underline dark:text-zinc-300">
          Pricing
        </Link>
      </nav>
    </div>
  );
}
