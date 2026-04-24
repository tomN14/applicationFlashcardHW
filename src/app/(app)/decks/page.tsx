import Link from "next/link";
import { DeckCard } from "@/components/deck/deck-card";
import { submitCreateDeckForm } from "@/app/actions/decks";

const PLACEHOLDER_DECKS = [
  {
    id: "demo-1",
    title: "Spanish basics",
    description: "Placeholder deck — replace with Supabase query.",
    cardCount: 12,
  },
  {
    id: "demo-2",
    title: "ML interview",
    description: "Another placeholder row.",
    cardCount: 24,
  },
];

export default function DecksPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-6 py-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Decks
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          App surface (placeholder): list and create decks.{" "}
          <code className="rounded bg-zinc-100 px-1 text-xs dark:bg-zinc-800">
            createDeck
          </code>{" "}
          in{" "}
          <code className="rounded bg-zinc-100 px-1 text-xs dark:bg-zinc-800">
            actions/decks.ts
          </code>
          .
        </p>
      </div>

      <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          New deck (placeholder)
        </h2>
        <form
          action={submitCreateDeckForm}
          className="mt-3 flex flex-col gap-2 sm:flex-row"
        >
          <input
            name="title"
            required
            placeholder="Deck title"
            className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
          />
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            Create
          </button>
        </form>
      </section>

      <ul className="space-y-3">
        {PLACEHOLDER_DECKS.map((deck) => (
          <li key={deck.id}>
            <DeckCard deck={deck} />
          </li>
        ))}
      </ul>

      <p className="text-sm text-zinc-500">
        <Link href="/dashboard" className="underline">
          Back to dashboard
        </Link>
      </p>
    </div>
  );
}
