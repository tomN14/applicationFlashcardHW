"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export type DraftCardInput = { front: string; back: string };

/** Standard server-action result for deck mutations */
export type DeckActionResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };

export type DeckRecord = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
};

export type CardRecord = {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  position: number;
  front_latex: boolean;
  back_latex: boolean;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

function ok<T>(data: T): DeckActionResult<T> {
  return { data, error: null };
}

function fail(message: string): DeckActionResult<never> {
  return { data: null, error: message };
}

async function touchDeckRevision(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  deckId: string,
) {
  await supabase
    .from("decks")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", deckId);
}

async function requireUserId(): Promise<string | DeckActionResult<never>> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return fail("Please sign in to continue.");
  }
  return userId;
}

export async function createDeck(input: {
  title: string;
  description?: string | null;
}): Promise<DeckActionResult<DeckRecord>> {
  const title = typeof input.title === "string" ? input.title.trim() : "";
  if (!title) {
    return fail("Title is required.");
  }
  if (title.length > 512) {
    return fail("Title must be at most 512 characters.");
  }

  let description: string | null = null;
  if (typeof input.description === "string" && input.description.trim()) {
    const d = input.description.trim();
    if (d.length > 8000) {
      return fail("Description must be at most 8000 characters.");
    }
    description = d;
  }

  const userIdResult = await requireUserId();
  if (typeof userIdResult !== "string") {
    return userIdResult;
  }
  const userId = userIdResult;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("decks")
    .insert({
      user_id: userId,
      title,
      description,
      is_public: false,
    })
    .select("id, user_id, title, description, is_public, created_at")
    .single();

  const row = data as DeckRecord | null;
  if (error || !row) {
    return fail(error?.message ?? "Could not create deck.");
  }

  revalidatePath("/decks");
  return ok(row);
}

export async function updateDeck(input: {
  id: string;
  title: string;
  description?: string | null;
  is_public: boolean;
}): Promise<DeckActionResult<DeckRecord>> {
  if (typeof input.id !== "string" || !isUuid(input.id)) {
    return fail("Invalid deck id.");
  }

  const title = typeof input.title === "string" ? input.title.trim() : "";
  if (!title) {
    return fail("Title is required.");
  }
  if (title.length > 512) {
    return fail("Title must be at most 512 characters.");
  }

  let description: string | null = null;
  if (typeof input.description === "string" && input.description.trim()) {
    const d = input.description.trim();
    if (d.length > 8000) {
      return fail("Description must be at most 8000 characters.");
    }
    description = d;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("decks")
    .update({
      title,
      description,
      is_public: Boolean(input.is_public),
    })
    .eq("id", input.id)
    .select("id, user_id, title, description, is_public, created_at")
    .single();

  const row = data as DeckRecord | null;
  if (error || !row) {
    return fail(error?.message ?? "Could not update deck.");
  }

  revalidatePath("/decks");
  revalidatePath("/explore");
  revalidatePath(`/explore/${input.id}`);
  revalidatePath(`/decks/${input.id}`);
  return ok(row);
}

export async function deleteDeck(input: {
  id: string;
}): Promise<DeckActionResult<{ id: string }>> {
  if (typeof input.id !== "string" || !isUuid(input.id)) {
    return fail("Invalid deck id.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("decks").delete().eq("id", input.id);

  if (error) {
    return fail(error.message);
  }

  revalidatePath("/decks");
  return ok({ id: input.id });
}

export async function createDeckWithCards(input: {
  title: string;
  description: string | null;
  cards: DraftCardInput[];
}): Promise<DeckActionResult<{ deckId: string }>> {
  const userIdResult = await requireUserId();
  if (typeof userIdResult !== "string") {
    return userIdResult;
  }
  const userId = userIdResult;

  const title =
    typeof input.title === "string" ? input.title.trim().slice(0, 512) : "";
  if (!title) {
    return fail("Title is required.");
  }

  let description: string | null = null;
  if (typeof input.description === "string" && input.description.trim()) {
    description = input.description.trim().slice(0, 8000);
  }

  const normalized = input.cards
    .map((c) => ({
      front: typeof c.front === "string" ? c.front.trim() : "",
      back: typeof c.back === "string" ? c.back.trim() : "",
    }))
    .filter((c) => c.front.length > 0 && c.back.length > 0);

  if (normalized.length === 0) {
    return fail("Add at least one card with front and back.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: deckRow, error: deckError } = await supabase
    .from("decks")
    .insert({
      user_id: userId,
      title,
      description,
      is_public: false,
    })
    .select("id")
    .single();

  const deck = deckRow as { id: string } | null;
  if (deckError || !deck?.id) {
    return fail(deckError?.message ?? "Could not create deck.");
  }

  const rows = normalized.map((c, position) => ({
    deck_id: deck.id,
    front: c.front,
    back: c.back,
    position,
  }));

  const { error: cardsError } = await supabase.from("cards").insert(rows);

  if (cardsError) {
    await supabase.from("decks").delete().eq("id", deck.id);
    return fail(cardsError.message);
  }

  revalidatePath("/decks");
  revalidatePath(`/decks/${deck.id}`);
  return ok({ deckId: deck.id });
}

export async function addCardToDeck(input: {
  deckId: string;
  front: string;
  back: string;
  front_latex?: boolean;
  back_latex?: boolean;
}): Promise<DeckActionResult<CardRecord>> {
  if (typeof input.deckId !== "string" || !isUuid(input.deckId)) {
    return fail("Invalid deck id.");
  }
  const front = typeof input.front === "string" ? input.front.trim() : "";
  const back = typeof input.back === "string" ? input.back.trim() : "";
  if (!front || !back) {
    return fail("Front and back are required.");
  }

  const supabase = await createSupabaseServerClient();

  const { data: top, error: posErr } = await supabase
    .from("cards")
    .select("position")
    .eq("deck_id", input.deckId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (posErr) {
    return fail(posErr.message);
  }

  const row = top as { position: number } | null;
  const position = (row?.position ?? -1) + 1;

  const { data, error } = await supabase
    .from("cards")
    .insert({
      deck_id: input.deckId,
      front,
      back,
      position,
      front_latex: Boolean(input.front_latex),
      back_latex: Boolean(input.back_latex),
    })
    .select("id, deck_id, front, back, position, front_latex, back_latex")
    .single();

  const card = data as CardRecord | null;
  if (error || !card) {
    return fail(error?.message ?? "Could not add card.");
  }

  await touchDeckRevision(supabase, input.deckId);
  revalidatePath(`/decks/${input.deckId}`);
  revalidatePath(`/decks/${input.deckId}/study`);
  revalidatePath("/explore");
  revalidatePath(`/explore/${input.deckId}`);
  return ok(card);
}

export async function updateCardInDeck(input: {
  id: string;
  deckId: string;
  front: string;
  back: string;
  front_latex?: boolean;
  back_latex?: boolean;
}): Promise<DeckActionResult<CardRecord>> {
  if (typeof input.id !== "string" || !isUuid(input.id)) {
    return fail("Invalid card id.");
  }
  if (typeof input.deckId !== "string" || !isUuid(input.deckId)) {
    return fail("Invalid deck id.");
  }
  const front = typeof input.front === "string" ? input.front.trim() : "";
  const back = typeof input.back === "string" ? input.back.trim() : "";
  if (!front || !back) {
    return fail("Front and back are required.");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("cards")
    .update({
      front,
      back,
      front_latex: Boolean(input.front_latex),
      back_latex: Boolean(input.back_latex),
    })
    .eq("id", input.id)
    .eq("deck_id", input.deckId)
    .select("id, deck_id, front, back, position, front_latex, back_latex")
    .single();

  const card = data as CardRecord | null;
  if (error || !card) {
    return fail(error?.message ?? "Could not update card.");
  }

  await touchDeckRevision(supabase, input.deckId);
  revalidatePath(`/decks/${input.deckId}`);
  revalidatePath(`/decks/${input.deckId}/study`);
  revalidatePath("/explore");
  revalidatePath(`/explore/${input.deckId}`);
  return ok(card);
}

export async function deleteCardFromDeck(input: {
  id: string;
  deckId: string;
}): Promise<DeckActionResult<{ id: string }>> {
  if (typeof input.id !== "string" || !isUuid(input.id)) {
    return fail("Invalid card id.");
  }
  if (typeof input.deckId !== "string" || !isUuid(input.deckId)) {
    return fail("Invalid deck id.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("cards")
    .delete()
    .eq("id", input.id)
    .eq("deck_id", input.deckId);

  if (error) {
    return fail(error.message);
  }

  await touchDeckRevision(supabase, input.deckId);
  revalidatePath(`/decks/${input.deckId}`);
  revalidatePath(`/decks/${input.deckId}/study`);
  revalidatePath("/explore");
  revalidatePath(`/explore/${input.deckId}`);
  return ok({ id: input.id });
}

/**
 * Persist card order. `orderedCardIds` is the full list of card ids for this
 * deck in display order (position 0 .. n-1). Uses a two-phase position update
 * to avoid unique (deck_id, position) conflicts while swapping. Temp positions
 * use a high offset because `position` must be >= 0.
 */
export async function reorderDeckCards(input: {
  deckId: string;
  orderedCardIds: string[];
}): Promise<DeckActionResult<{ count: number }>> {
  if (typeof input.deckId !== "string" || !isUuid(input.deckId)) {
    return fail("Invalid deck id.");
  }
  if (!Array.isArray(input.orderedCardIds)) {
    return fail("orderedCardIds must be an array.");
  }

  const ids = input.orderedCardIds.filter(
    (id): id is string => typeof id === "string" && isUuid(id),
  );
  if (ids.length === 0) {
    return ok({ count: 0 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: rows, error: selErr } = await supabase
    .from("cards")
    .select("id")
    .eq("deck_id", input.deckId);

  if (selErr) {
    return fail(selErr.message);
  }

  const existing = new Set((rows as { id: string }[]).map((r) => r.id));
  if (existing.size !== ids.length) {
    return fail("Card list does not match this deck.");
  }
  for (const id of ids) {
    if (!existing.has(id)) {
      return fail("Unknown card id in order.");
    }
  }
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) {
      return fail("Duplicate card id in order.");
    }
    seen.add(id);
  }

  // Phase 1: move to high temporary positions (must stay >= 0 — see cards.position check).
  const tempBase = 1_000_000;
  for (let i = 0; i < ids.length; i += 1) {
    const { error } = await supabase
      .from("cards")
      .update({ position: tempBase + i })
      .eq("id", ids[i])
      .eq("deck_id", input.deckId);
    if (error) {
      return fail(error.message);
    }
  }

  for (let i = 0; i < ids.length; i += 1) {
    const { error } = await supabase
      .from("cards")
      .update({ position: i })
      .eq("id", ids[i])
      .eq("deck_id", input.deckId);
    if (error) {
      return fail(error.message);
    }
  }

  await touchDeckRevision(supabase, input.deckId);
  revalidatePath(`/decks/${input.deckId}`);
  revalidatePath(`/decks/${input.deckId}/study`);
  revalidatePath("/explore");
  revalidatePath(`/explore/${input.deckId}`);
  return ok({ count: ids.length });
}
