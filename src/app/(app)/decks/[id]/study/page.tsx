import { notFound } from "next/navigation";
import { DeckStudyClient } from "../deck-study-client";
import { loadDeckDetail } from "../load-deck-detail";

type DeckStudyPageProps = {
  params: Promise<{ id: string }>;
};

export default async function DeckStudyPage({ params }: DeckStudyPageProps) {
  const { id } = await params;
  const deck = await loadDeckDetail(id);
  if (!deck) {
    notFound();
  }

  return (
    <DeckStudyClient
      deck={{ id: deck.id, title: deck.title }}
      cards={deck.cards}
    />
  );
}
