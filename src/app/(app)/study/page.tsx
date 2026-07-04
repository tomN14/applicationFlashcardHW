import Link from "next/link";
import { loadDecksList } from "@/lib/load-decks-list";

export const dynamic = "force-dynamic";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export default async function StudyHubPage() {
  const { decks, loadError, isSignedIn } = await loadDecksList();
  const studyable = decks.filter((d) => d.cardCount > 0);

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 text-zinc-900">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Study</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Your decks are loaded from Supabase. Sign in to see your library.
        </p>
      </div>

      {loadError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          <span className="font-semibold">Could not load decks.</span> {loadError}
        </div>
      ) : null}

      {!isSignedIn ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <Link href="/signup" className="font-semibold text-indigo-700 hover:text-indigo-900">
            Sign up
          </Link>{" "}
          or{" "}
          <Link href="/login" className="font-semibold text-indigo-700 hover:text-indigo-900">
            sign in
          </Link>{" "}
          to study your decks.
        </div>
      ) : null}

      {studyable.length === 0 && !loadError && isSignedIn ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/80 px-6 py-12 text-center">
          <p className="font-medium text-zinc-800">No decks with cards yet</p>
          <p className="mt-2 text-sm text-zinc-600">
            Create a deck on the decks page or run{" "}
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs">
              npm run seed
            </code>{" "}
            for sample data.
          </p>
          <Link
            href="/decks"
            className="mt-6 inline-flex rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Go to decks
          </Link>
        </div>
      ) : null}

      {studyable.length > 0 ? (
        <ul className="space-y-3">
          {studyable.map((deck) => (
            <li key={deck.id}>
              <article className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm ring-1 ring-zinc-950/5">
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold text-zinc-900">
                    {deck.title}
                  </h2>
                  {deck.description ? (
                    <p className="mt-1 line-clamp-2 text-sm text-zinc-600">
                      {deck.description}
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs text-zinc-500">
                    {deck.cardCount} cards · {formatDate(deck.created_at)}
                  </p>
                </div>
                <Link
                  href={`/decks/${deck.id}/study`}
                  className="shrink-0 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
                >
                  Study
                </Link>
              </article>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="text-center text-sm text-zinc-500">
        <Link href="/decks" className="font-medium text-indigo-700 hover:text-indigo-900">
          Manage all decks →
        </Link>
      </p>
    </div>
  );
}
