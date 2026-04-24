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
