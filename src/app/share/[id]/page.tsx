import Link from "next/link";
import { notFound } from "next/navigation";
import { loadPublicDeck } from "@/app/(app)/decks/[id]/load-deck-detail";

export const dynamic = "force-dynamic";

type SharePageProps = {
  params: Promise<{ id: string }>;
};

export default async function SharePage({ params }: SharePageProps) {
  const { id } = await params;
  const deck = await loadPublicDeck(id);

  if (!deck) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-6 py-10 text-zinc-900">
      <header className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
          Shared deck
        </p>
        <h1 className="text-3xl font-semibold text-zinc-900">{deck.title}</h1>
        {deck.description ? (
          <p className="text-base leading-relaxed text-zinc-600">
            {deck.description}
          </p>
        ) : null}
        <p className="text-sm text-zinc-500">{deck.cards.length} cards</p>
      </header>

      <ul className="space-y-4">
        {deck.cards.map((card, i) => (
          <li
            key={card.id}
            className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm ring-1 ring-zinc-950/5"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-600">
              Card {i + 1}
            </p>
            <p className="mt-2 font-medium text-zinc-900">{card.front}</p>
            <p className="mt-3 border-t border-zinc-100 pt-3 text-sm leading-relaxed text-zinc-700">
              {card.back}
            </p>
          </li>
        ))}
      </ul>

      <p className="text-sm text-zinc-500">
        <Link href="/" className="font-medium text-indigo-700 hover:text-indigo-900">
          ← Home
        </Link>
      </p>
    </div>
  );
}
