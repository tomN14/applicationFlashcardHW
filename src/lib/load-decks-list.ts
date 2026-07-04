import { getServerAuthUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import type { DeckRow } from "@/types/deck";

export type DeckListItem = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  cardCount: number;
  isCommunity: boolean;
  sourceDeckId: string | null;
  hasUpdateAvailable: boolean;
};

function normalizeDecks(rows: DeckRow[] | null): Omit<
  DeckListItem,
  "hasUpdateAvailable"
>[] {
  if (!rows?.length) {
    return [];
  }
  return rows.map((row) => ({
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    description: row.description,
    is_public: row.is_public,
    created_at: row.created_at,
    updated_at: row.updated_at ?? row.created_at,
    cardCount:
      Array.isArray(row.cards) &&
      row.cards[0] &&
      typeof row.cards[0].count === "number"
        ? row.cards[0].count
        : 0,
    isCommunity: Boolean(row.source_deck_id),
    sourceDeckId: row.source_deck_id ?? null,
  }));
}

export function formatSupabaseError(e: unknown): string {
  if (e instanceof Error && e.message) {
    return e.message;
  }
  if (e && typeof e === "object" && "message" in e) {
    const r = e as { message?: string; details?: string; hint?: string };
    const parts = [r.message, r.details, r.hint].filter(
      (s): s is string => typeof s === "string" && s.length > 0,
    );
    if (parts.length > 0) {
      return parts.join(" ");
    }
  }
  if (typeof e === "string" && e) {
    return e;
  }
  return "Something went wrong loading decks.";
}

export type LoadDecksListResult = {
  decks: DeckListItem[];
  loadError: string | null;
  isSignedIn: boolean;
  authUserId: string | null;
  authEmail: string | null;
};

export async function loadDecksList(): Promise<LoadDecksListResult> {
  let decks: DeckListItem[] = [];
  let loadError: string | null = null;

  const authUser = await getServerAuthUser();
  const isSignedIn = authUser !== null;
  const authUserId = authUser?.id ?? null;
  const authEmail = authUser?.email ?? null;

  if (!isSignedIn) {
    return { decks, loadError, isSignedIn, authUserId, authEmail };
  }

  try {
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
        cards (count)
      `,
      )
      .eq("user_id", authUserId!)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    const rows = (data ?? []) as DeckRow[];
    const normalized = normalizeDecks(rows);
    const admin = createSupabaseAdminClient();

    decks = await Promise.all(
      normalized.map(async (deck) => {
        if (!deck.sourceDeckId) {
          return { ...deck, hasUpdateAvailable: false };
        }

        const { data: source } = await admin
          .from("decks")
          .select("updated_at, is_public")
          .eq("id", deck.sourceDeckId)
          .maybeSingle();

        const row = rows.find((r) => r.id === deck.id);
        const synced = row?.source_synced_at ?? null;
        const hasUpdateAvailable = Boolean(
          source?.is_public &&
            source.updated_at &&
            synced &&
            source.updated_at > synced,
        );

        return { ...deck, hasUpdateAvailable };
      }),
    );
  } catch (e) {
    loadError = formatSupabaseError(e);
  }

  return { decks, loadError, isSignedIn, authUserId, authEmail };
}
