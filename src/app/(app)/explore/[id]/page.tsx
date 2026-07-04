import Link from "next/link";
import { notFound } from "next/navigation";
import { loadExploreDeckDetail } from "@/lib/load-explore-decks";
import { ExploreDeckPreviewClient } from "./explore-deck-preview-client";

export const dynamic = "force-dynamic";

type ExploreDeckPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ExploreDeckPage({ params }: ExploreDeckPageProps) {
  const { id } = await params;
  const { deck, authorName, savedCopyId, isSignedIn } =
    await loadExploreDeckDetail(id);

  if (!deck) {
    notFound();
  }

  return (
    <ExploreDeckPreviewClient
      deck={deck}
      authorName={authorName}
      savedCopyId={savedCopyId}
      isSignedIn={isSignedIn}
    />
  );
}
