import { loadDecksList } from "@/lib/load-decks-list";
import { DecksPageClient } from "./decks-page-client";

export const dynamic = "force-dynamic";

export default async function DecksPage() {
  const { decks, loadError, isSignedIn, authUserId } = await loadDecksList();

  return (
    <DecksPageClient
      decks={decks}
      isSignedIn={isSignedIn}
      authUserId={authUserId}
      loadError={loadError}
    />
  );
}
