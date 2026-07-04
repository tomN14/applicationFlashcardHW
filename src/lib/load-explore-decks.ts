import { getServerAuthUser } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import type { ExploreDeckItem, ExploreSort } from "@/types/deck";
import { formatSupabaseError } from "@/lib/load-decks-list";

const EXPLORE_SORTS: ExploreSort[] = [
  "popular",
  "least-popular",
  "newest",
  "oldest",
];

export function parseExploreSort(value: string | undefined): ExploreSort {
  if (value && EXPLORE_SORTS.includes(value as ExploreSort)) {
    return value as ExploreSort;
  }
  return "popular";
}

type ExploreRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  save_count: number;
  cards: { count: number }[] | null;
};

export type LoadExploreDecksResult = {
  decks: ExploreDeckItem[];
  loadError: string | null;
  isSignedIn: boolean;
  authUserId: string | null;
  query: string;
  sort: ExploreSort;
};

function cardCountFromRow(row: ExploreRow): number {
  const nested = row.cards;
  if (Array.isArray(nested) && nested[0] && typeof nested[0].count === "number") {
    return nested[0].count;
  }
  return 0;
}

async function loadAuthorNames(
  userIds: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (userIds.length === 0) {
    return map;
  }

  const admin = createSupabaseAdminClient();
  const { data: profiles } = await admin
    .from("profiles")
    .select("user_id, username")
    .in("user_id", userIds);

  for (const row of profiles ?? []) {
    const name =
      typeof row.username === "string" && row.username.trim()
        ? row.username.trim()
        : row.user_id.slice(0, 8);
    map.set(row.user_id, name);
  }

  for (const id of userIds) {
    if (!map.has(id)) {
      map.set(id, id.slice(0, 8));
    }
  }

  return map;
}

export async function loadExploreDecks(input?: {
  query?: string;
  sort?: ExploreSort;
}): Promise<LoadExploreDecksResult> {
  const query = (input?.query ?? "").trim();
  const sort = input?.sort ?? "popular";

  const authUser = await getServerAuthUser();
  const isSignedIn = authUser !== null;
  const authUserId = authUser?.id ?? null;

  let decks: ExploreDeckItem[] = [];
  let loadError: string | null = null;

  try {
    const admin = createSupabaseAdminClient();

    let builder = admin
      .from("decks")
      .select(
        `
        id,
        user_id,
        title,
        description,
        created_at,
        updated_at,
        save_count,
        cards ( count )
      `,
      )
      .eq("is_public", true)
      .is("source_deck_id", null);

    if (authUserId) {
      builder = builder.neq("user_id", authUserId);
    }

    if (query) {
      const escaped = query.replace(/[%_]/g, "\\$&");
      builder = builder.or(
        `title.ilike.%${escaped}%,description.ilike.%${escaped}%`,
      );
    }

    switch (sort) {
      case "least-popular":
        builder = builder.order("save_count", { ascending: true });
        break;
      case "newest":
        builder = builder.order("created_at", { ascending: false });
        break;
      case "oldest":
        builder = builder.order("created_at", { ascending: true });
        break;
      default:
        builder = builder
          .order("save_count", { ascending: false })
          .order("created_at", { ascending: false });
        break;
    }

    const { data, error } = await builder;
    if (error) {
      throw error;
    }

    const rows = (data ?? []) as ExploreRow[];

    const authorNames = await loadAuthorNames([
      ...new Set(rows.map((r) => r.user_id)),
    ]);

    let savedBySource = new Map<string, string>();
    if (authUserId && rows.length > 0) {
      const sourceIds = rows.map((r) => r.id);
      const { data: copies } = await admin
        .from("decks")
        .select("id, source_deck_id")
        .eq("user_id", authUserId)
        .in("source_deck_id", sourceIds);

      savedBySource = new Map(
        (copies ?? []).flatMap((c) =>
          c.source_deck_id
            ? [[c.source_deck_id as string, c.id as string] as const]
            : [],
        ),
      );
    }

    decks = rows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      title: row.title,
      description: row.description,
      created_at: row.created_at,
      updated_at: row.updated_at,
      cardCount: cardCountFromRow(row),
      saveCount: typeof row.save_count === "number" ? row.save_count : 0,
      authorName: authorNames.get(row.user_id) ?? row.user_id.slice(0, 8),
      savedCopyId: savedBySource.get(row.id) ?? null,
    }));
  } catch (e) {
    loadError = formatSupabaseError(e);
  }

  return { decks, loadError, isSignedIn, authUserId, query, sort };
}

export async function loadExploreDeckDetail(id: string): Promise<{
  deck: import("@/types/deck").DeckDetail | null;
  authorName: string;
  savedCopyId: string | null;
  isSignedIn: boolean;
}> {
  const authUser = await getServerAuthUser();
  const authUserId = authUser?.id ?? null;

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
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
    .eq("is_public", true)
    .is("source_deck_id", null)
    .maybeSingle();

  if (error || !data) {
    return { deck: null, authorName: "", savedCopyId: null, isSignedIn: false };
  }

  if (authUserId && data.user_id === authUserId) {
    return { deck: null, authorName: "", savedCopyId: null, isSignedIn: true };
  }

  const authorNames = await loadAuthorNames([data.user_id]);
  const authorName = authorNames.get(data.user_id) ?? data.user_id.slice(0, 8);

  let savedCopyId: string | null = null;
  if (authUserId) {
    const { data: copy } = await admin
      .from("decks")
      .select("id")
      .eq("user_id", authUserId)
      .eq("source_deck_id", id)
      .maybeSingle();
    savedCopyId = copy?.id ?? null;
  }

  const cards = Array.isArray(data.cards)
    ? [...data.cards].sort(
        (a, b) => (a.position as number) - (b.position as number),
      )
    : [];

  const deck = {
    id: data.id,
    user_id: data.user_id,
    title: data.title,
    description: data.description,
    is_public: data.is_public,
    created_at: data.created_at,
    updated_at: data.updated_at,
    source_deck_id: data.source_deck_id,
    source_synced_at: data.source_synced_at,
    save_count: data.save_count ?? 0,
    cards: cards.map((c) => ({
      id: c.id as string,
      deck_id: c.deck_id as string,
      front: c.front as string,
      back: c.back as string,
      position: c.position as number,
      front_latex: Boolean(c.front_latex),
      back_latex: Boolean(c.back_latex),
    })),
  };

  return {
    deck,
    authorName,
    savedCopyId,
    isSignedIn: authUserId !== null,
  };
}
