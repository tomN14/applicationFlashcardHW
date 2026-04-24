import Link from "next/link";
import type { Deck } from "@/types/deck";

type DeckCardProps = {
  deck: Pick<Deck, "id" | "title" | "description"> & { cardCount?: number };
};

export function DeckCard({ deck }: DeckCardProps) {
  return (
    <article className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        <Link href={`/decks/${deck.id}`} className="hover:underline">
          {deck.title}
        </Link>
      </h2>
      {deck.description ? (
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {deck.description}
        </p>
      ) : null}
      {deck.cardCount != null ? (
        <p className="mt-2 text-xs text-zinc-500">
          {deck.cardCount} cards (placeholder)
        </p>
      ) : null}
    </article>
  );
}
