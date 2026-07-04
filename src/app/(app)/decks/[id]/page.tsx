import { notFound } from "next/navigation";
import { DeckManageClient } from "./deck-manage-client";
import { loadDeckDetail } from "./load-deck-detail";

type DeckPageProps = {
  params: Promise<{ id: string }>;
};

export default async function DeckPage({ params }: DeckPageProps) {
  const { id } = await params;
  const deck = await loadDeckDetail(id);
  if (!deck) {
    notFound();
  }

  return <DeckManageClient deck={deck} />;
}
