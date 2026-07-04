import {
  loadExploreDecks,
  parseExploreSort,
} from "@/lib/load-explore-decks";
import { ExplorePageClient } from "./explore-page-client";

export const dynamic = "force-dynamic";

type ExplorePageProps = {
  searchParams: Promise<{ q?: string; sort?: string }>;
};

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const { q, sort } = await searchParams;
  const parsedSort = parseExploreSort(sort);
  const result = await loadExploreDecks({ query: q, sort: parsedSort });

  return (
    <ExplorePageClient
      decks={result.decks}
      loadError={result.loadError}
      isSignedIn={result.isSignedIn}
      initialQuery={result.query}
      initialSort={result.sort}
    />
  );
}
