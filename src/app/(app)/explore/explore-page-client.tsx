"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import type { ExploreDeckItem, ExploreSort } from "@/types/deck";

type ExplorePageClientProps = {
  decks: ExploreDeckItem[];
  loadError: string | null;
  isSignedIn: boolean;
  initialQuery: string;
  initialSort: ExploreSort;
};

const SORT_OPTIONS: { value: ExploreSort; label: string }[] = [
  { value: "popular", label: "Most popular" },
  { value: "least-popular", label: "Least popular" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
];

export function ExplorePageClient({
  decks,
  loadError,
  isSignedIn,
  initialQuery,
  initialSort,
}: ExplorePageClientProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState<ExploreSort>(initialSort);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setQuery(initialQuery);
    setSort(initialSort);
  }, [initialQuery, initialSort]);

  const pushFilters = (nextQuery: string, nextSort: ExploreSort) => {
    const params = new URLSearchParams();
    if (nextQuery.trim()) {
      params.set("q", nextQuery.trim());
    }
    if (nextSort !== "popular") {
      params.set("sort", nextSort);
    }
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `/explore?${qs}` : "/explore");
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    pushFilters(query, sort);
  };

  const stats = useMemo(
    () => ({
      deckCount: decks.length,
      saveTotal: decks.reduce((sum, d) => sum + d.saveCount, 0),
    }),
    [decks],
  );

  return (
    <div className="relative w-full text-[var(--app-foreground)]">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,var(--app-surface)_0%,var(--app-background)_55%,color-mix(in_srgb,var(--app-accent)_8%,var(--app-background))_100%)]" />

      <div className="relative space-y-8 pb-12">
        <header className="space-y-4 border-b border-[var(--app-surface-border)] pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--app-accent)]">
              Community
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Explore decks
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--app-muted)] sm:text-base">
              Browse public decks from other students. Preview cards and save
              copies to your library when signed in.
            </p>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <form onSubmit={handleSearch} className="min-w-0 flex-1">
              <label className="sr-only" htmlFor="explore-search">
                Search decks
              </label>
              <input
                id="explore-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title or description…"
                className="w-full rounded-xl border border-[var(--app-surface-border)] bg-[var(--app-surface)] px-4 py-2.5 text-sm shadow-inner focus:border-[var(--app-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)]/20"
              />
            </form>
            <label className="flex shrink-0 items-center gap-2 text-sm">
              <span className="font-medium text-[var(--app-muted)]">Sort</span>
              <select
                value={sort}
                onChange={(e) => {
                  const next = e.target.value as ExploreSort;
                  setSort(next);
                  pushFilters(query, next);
                }}
                className="rounded-xl border border-[var(--app-surface-border)] bg-[var(--app-surface)] px-3 py-2.5 text-sm focus:border-[var(--app-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)]/20"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => pushFilters(query, sort)}
              className="shrink-0 rounded-xl bg-[var(--app-accent)] px-4 py-2.5 text-sm font-semibold text-[var(--app-surface)] shadow-sm transition hover:opacity-90"
            >
              Search
            </button>
          </div>
        </header>

        {!isSignedIn ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            You can browse public decks without signing in.{" "}
            <Link href="/login?next=/explore" className="font-semibold text-indigo-700">
              Sign in
            </Link>{" "}
            to preview card backs and save decks.
          </div>
        ) : null}

        {loadError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            <span className="font-semibold">Could not load explore decks.</span>{" "}
            {loadError}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { label: "Public decks", value: stats.deckCount },
            { label: "Total saves", value: stats.saveTotal },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-[var(--app-surface-border)] bg-[var(--app-surface)] p-5 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--app-muted)]">
                {s.label}
              </p>
              <p className="mt-2 font-mono text-3xl font-semibold tabular-nums">
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {decks.length === 0 && !loadError ? (
          <div className="rounded-2xl border border-dashed border-[var(--app-surface-border)] bg-[var(--app-surface)]/60 px-6 py-16 text-center">
            <p className="text-lg font-medium">No public decks yet</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--app-muted)]">
              When other students publish decks, they will show up here.
            </p>
          </div>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {decks.map((deck) => (
              <li key={deck.id}>
                <article className="flex h-full flex-col rounded-2xl border border-[var(--app-surface-border)] bg-[var(--app-surface)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--app-accent)]/40 hover:shadow-md">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-800">
                      Community
                    </span>
                    {deck.savedCopyId ? (
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
                        Saved
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-3 line-clamp-2 text-lg font-semibold leading-snug">
                    {deck.title}
                  </h3>
                  <p className="mt-2 text-sm text-[var(--app-muted)]">
                    by {deck.authorName}
                  </p>
                  {deck.description ? (
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[var(--app-muted)]">
                      {deck.description}
                    </p>
                  ) : null}
                  <p className="mt-3 text-xs font-medium text-[var(--app-muted)]">
                    {deck.cardCount} cards · {deck.saveCount} saves
                  </p>
                  <div className="mt-4 border-t border-[var(--app-surface-border)] pt-4">
                    <Link
                      href={`/explore/${deck.id}`}
                      className="inline-flex w-full items-center justify-center rounded-lg bg-[var(--app-accent)] px-3 py-2.5 text-sm font-semibold text-[var(--app-surface)] shadow-sm transition hover:opacity-90"
                    >
                      {isSignedIn ? "Preview deck" : "View deck"}
                    </Link>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
