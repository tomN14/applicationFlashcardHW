import Link from "next/link";
import { submitGenerateCardsForm } from "@/app/actions/generate";

type DeckPageProps = {
  params: Promise<{ id: string }>;
};

export default async function DeckPage({ params }: DeckPageProps) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-6 py-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Deck{" "}
          <code className="rounded bg-zinc-100 px-1 text-lg dark:bg-zinc-800">
            {id}
          </code>
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          App surface (placeholder): deck editor and AI generation via{" "}
          <code className="rounded bg-zinc-100 px-1 text-sm dark:bg-zinc-800">
            actions/generate.ts
          </code>
          .
        </p>
      </div>

      <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Generate cards (placeholder)
        </h2>
        <form
          action={submitGenerateCardsForm}
          className="mt-3 flex flex-col gap-2 sm:flex-row"
        >
          <input
            name="topic"
            placeholder="Topic or notes"
            className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
          />
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            Generate (server)
          </button>
        </form>
        <p className="mt-2 text-xs text-zinc-500">
          Embeddings placeholder:{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
            actions/embeddings.ts
          </code>
          .
        </p>
      </section>

      <p className="text-sm text-zinc-500">
        <Link href="/decks" className="underline">
          All decks
        </Link>
      </p>
    </div>
  );
}
