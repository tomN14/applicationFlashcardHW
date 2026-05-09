"use server";

import { revalidatePath } from "next/cache";
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

async function getDefaultUserId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const row = data as { id: string } | null;
  if (error || !row?.id) {
    return null;
  }
  return row.id;
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

  const userId = await getDefaultUserId();
  if (!userId) {
    return fail("No user found. Run the seed script first.");
  }

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
  const userId = await getDefaultUserId();
  if (!userId) {
    return fail("No user found. Run the seed script first.");
  }

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
