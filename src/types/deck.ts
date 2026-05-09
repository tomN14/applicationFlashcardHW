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

/** Row shape from `public.decks` + optional nested count */
export type DeckRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  cards?: { count: number }[];
};
