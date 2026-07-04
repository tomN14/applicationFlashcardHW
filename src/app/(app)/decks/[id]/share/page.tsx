import Link from "next/link";
import { notFound } from "next/navigation";
import { loadDeckDetail } from "../load-deck-detail";

export const dynamic = "force-dynamic";

type DeckSharePageProps = {
  params: Promise<{ id: string }>;
};

export default async function DeckSharePage({ params }: DeckSharePageProps) {
  const { id } = await params;
  const deck = await loadDeckDetail(id);

  if (!deck) {
    notFound();
  }

  const sharePath = `/share/${deck.id}`;
  const shareUrl =
    typeof process.env.NEXT_PUBLIC_APP_URL === "string" &&
    process.env.NEXT_PUBLIC_APP_URL.length > 0
      ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}${sharePath}`
      : sharePath;

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-10 text-zinc-900">
      <Link
        href={`/decks/${deck.id}`}
        className="text-sm font-medium text-indigo-700 hover:text-indigo-900"
      >
        ← {deck.title}
      </Link>

      <h1 className="text-2xl font-semibold">Share deck</h1>

      {deck.is_public ? (
        <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 text-sm text-emerald-950">
          <p>
            This deck is <strong>public</strong>. Anyone with the link can view
            cards (read-only).
          </p>
          <p className="break-all rounded-xl border border-emerald-200/80 bg-white px-3 py-2 font-mono text-xs text-zinc-800">
            {shareUrl}
          </p>
          <Link
            href={sharePath}
            className="inline-flex rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
          >
            Preview public page
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Turn on <strong>Public</strong> on the deck page to enable sharing.
        </div>
      )}

      <p className="text-xs text-zinc-500">
        {deck.cards.length} cards loaded from Supabase
      </p>
    </div>
  );
}
