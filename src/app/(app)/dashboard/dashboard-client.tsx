"use client";

import { useSubscription } from "@/hooks/use-subscription";

export function DashboardClient() {
  const { status, isLoading, refresh } = useSubscription();

  return (
    <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
        Subscription (hook placeholder)
      </h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Status:{" "}
        <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
          {isLoading ? "…" : status}
        </code>
      </p>
      <button
        type="button"
        onClick={() => refresh()}
        className="mt-3 text-xs font-medium text-zinc-600 underline dark:text-zinc-400"
      >
        Refresh (no-op placeholder)
      </button>
    </section>
  );
}
