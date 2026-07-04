export type Flashcard = {
  id: string;
  front: string;
  back: string;
};

export type Deck = {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  cards: Flashcard[];
};

/** Row shape from `public.decks` + optional nested count (list query) */
export type DeckRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  updated_at?: string;
  source_deck_id?: string | null;
  source_synced_at?: string | null;
  save_count?: number;
  cards?: { count: number }[];
};

/** Card row from `public.cards` */
export type CardRow = {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  position: number;
  front_latex: boolean;
  back_latex: boolean;
};

/** Deck with nested cards (management / study load) */
export type DeckDetail = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  source_deck_id: string | null;
  source_synced_at: string | null;
  save_count: number;
  cards: CardRow[];
};

export type ExploreDeckItem = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  cardCount: number;
  saveCount: number;
  authorName: string;
  savedCopyId: string | null;
};

export type ExploreSort = "popular" | "least-popular" | "newest" | "oldest";
