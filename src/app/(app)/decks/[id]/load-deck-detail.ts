import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type { CardRow, DeckDetail } from "@/types/deck";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export async function loadDeckDetail(id: string): Promise<DeckDetail | null> {
  if (!isUuid(id)) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("decks")
    .select(
      `
      id,
      user_id,
      title,
      description,
      is_public,
      created_at,
      updated_at,
      source_deck_id,
      source_synced_at,
      save_count,
      cards ( id, deck_id, front, back, position, front_latex, back_latex )
    `,
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  const row = data as {
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
    cards: CardRow[] | null;
  };

  const cards = Array.isArray(row.cards)
    ? [...row.cards].map((c) => ({
        ...c,
        front_latex: Boolean(c.front_latex),
        back_latex: Boolean(c.back_latex),
      }))
    : [];
  cards.sort((a, b) => a.position - b.position);

  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    description: row.description,
    is_public: row.is_public,
    created_at: row.created_at,
    updated_at: row.updated_at,
    source_deck_id: row.source_deck_id,
    source_synced_at: row.source_synced_at,
    save_count: row.save_count ?? 0,
    cards,
  };
}

/** Public share surface — deck must exist and have `is_public = true`. */
export async function loadPublicDeck(id: string): Promise<DeckDetail | null> {
  const deck = await loadDeckDetail(id);
  if (!deck?.is_public) {
    return null;
  }
  return deck;
}
