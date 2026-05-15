import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type { DeckRow } from "@/types/deck";
import { DecksPageClient, type DeckListItem } from "./decks-page-client";

export const dynamic = "force-dynamic";

function formatLoadError(e: unknown): string {
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

function normalizeDecks(rows: DeckRow[] | null): DeckListItem[] {
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
    cardCount:
      Array.isArray(row.cards) &&
      row.cards[0] &&
      typeof row.cards[0].count === "number"
        ? row.cards[0].count
        : 0,
  }));
}

export default async function DecksPage() {
  let decks: DeckListItem[] = [];
  let loadError: string | null = null;
  let hasUsers = false;
  let defaultUserId: string | null = null;

  try {
    const supabase = await createSupabaseServerClient();

    const { count: userCount, error: userCountError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    if (userCountError) {
      throw userCountError;
    }
    hasUsers = (userCount ?? 0) > 0;

    if (hasUsers) {
      const { data: firstUser, error: firstUserError } = await supabase
        .from("users")
        .select("id")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!firstUserError && firstUser && typeof firstUser.id === "string") {
        defaultUserId = firstUser.id;
      }
    }

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
        cards (count)
      `,
      )
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    decks = normalizeDecks(data as DeckRow[] | null);
  } catch (e) {
    loadError = formatLoadError(e);
  }

  return (
    <DecksPageClient
      decks={decks}
      defaultUserId={defaultUserId}
      hasUsers={hasUsers}
      loadError={loadError}
    />
  );
}
