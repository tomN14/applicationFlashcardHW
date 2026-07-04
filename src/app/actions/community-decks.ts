"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import type { DeckActionResult } from "@/app/actions/decks";

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

type SourceCard = {
  front: string;
  back: string;
  position: number;
  front_latex: boolean;
  back_latex: boolean;
};

export async function saveCommunityDeck(input: {
  sourceDeckId: string;
}): Promise<DeckActionResult<{ copyDeckId: string; alreadySaved: boolean }>> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return fail("Sign in to save community decks.");
  }

  const sourceDeckId = input.sourceDeckId.trim();
  if (!isUuid(sourceDeckId)) {
    return fail("Invalid deck.");
  }

  const admin = createSupabaseAdminClient();

  const { data: existing } = await admin
    .from("decks")
    .select("id")
    .eq("user_id", userId)
    .eq("source_deck_id", sourceDeckId)
    .maybeSingle();

  if (existing?.id) {
    return ok({ copyDeckId: existing.id, alreadySaved: true });
  }

  const { data: source, error: sourceError } = await admin
    .from("decks")
    .select(
      `
      id,
      user_id,
      title,
      description,
      is_public,
      updated_at,
      save_count,
      cards ( front, back, position, front_latex, back_latex )
    `,
    )
    .eq("id", sourceDeckId)
    .eq("is_public", true)
    .is("source_deck_id", null)
    .maybeSingle();

  if (sourceError || !source) {
    return fail("This deck is not available to save.");
  }

  if (source.user_id === userId) {
    return fail("You cannot save your own deck.");
  }

  const cards = (Array.isArray(source.cards) ? source.cards : []) as SourceCard[];
  cards.sort((a, b) => a.position - b.position);

  const { data: copy, error: copyError } = await admin
    .from("decks")
    .insert({
      user_id: userId,
      title: source.title,
      description: source.description,
      is_public: false,
      source_deck_id: sourceDeckId,
      source_synced_at: source.updated_at,
    })
    .select("id")
    .single();

  if (copyError || !copy) {
    if (copyError?.code === "23505") {
      const { data: again } = await admin
        .from("decks")
        .select("id")
        .eq("user_id", userId)
        .eq("source_deck_id", sourceDeckId)
        .maybeSingle();
      if (again?.id) {
        return ok({ copyDeckId: again.id, alreadySaved: true });
      }
    }
    return fail(copyError?.message ?? "Could not save deck.");
  }

  if (cards.length > 0) {
    const { error: cardsError } = await admin.from("cards").insert(
      cards.map((card) => ({
        deck_id: copy.id,
        front: card.front,
        back: card.back,
        position: card.position,
        front_latex: Boolean(card.front_latex),
        back_latex: Boolean(card.back_latex),
      })),
    );

    if (cardsError) {
      await admin.from("decks").delete().eq("id", copy.id);
      return fail(cardsError.message ?? "Could not copy cards.");
    }
  }

  await admin
    .from("decks")
    .update({ save_count: (source.save_count ?? 0) + 1 })
    .eq("id", sourceDeckId);

  revalidatePath("/explore");
  revalidatePath(`/explore/${sourceDeckId}`);
  revalidatePath("/decks");
  return ok({ copyDeckId: copy.id, alreadySaved: false });
}

export async function syncCommunityDeck(input: {
  copyDeckId: string;
}): Promise<DeckActionResult<{ copyDeckId: string }>> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return fail("Sign in to update saved decks.");
  }

  const copyDeckId = input.copyDeckId.trim();
  if (!isUuid(copyDeckId)) {
    return fail("Invalid deck.");
  }

  const admin = createSupabaseAdminClient();

  const { data: copy, error: copyError } = await admin
    .from("decks")
    .select("id, user_id, source_deck_id, source_synced_at")
    .eq("id", copyDeckId)
    .maybeSingle();

  if (copyError || !copy?.source_deck_id) {
    return fail("This is not a saved community deck.");
  }

  if (copy.user_id !== userId) {
    return fail("You can only update your own saved copies.");
  }

  const { data: source, error: sourceError } = await admin
    .from("decks")
    .select(
      `
      id,
      title,
      description,
      is_public,
      updated_at,
      cards ( front, back, position, front_latex, back_latex )
    `,
    )
    .eq("id", copy.source_deck_id)
    .eq("is_public", true)
    .maybeSingle();

  if (sourceError || !source) {
    return fail("The original deck is no longer public.");
  }

  const cards = (Array.isArray(source.cards) ? source.cards : []) as SourceCard[];
  cards.sort((a, b) => a.position - b.position);

  const { error: metaError } = await admin
    .from("decks")
    .update({
      title: source.title,
      description: source.description,
      source_synced_at: source.updated_at,
    })
    .eq("id", copyDeckId);

  if (metaError) {
    return fail(metaError.message ?? "Could not update deck.");
  }

  await admin.from("cards").delete().eq("deck_id", copyDeckId);

  if (cards.length > 0) {
    const { error: cardsError } = await admin.from("cards").insert(
      cards.map((card) => ({
        deck_id: copyDeckId,
        front: card.front,
        back: card.back,
        position: card.position,
        front_latex: Boolean(card.front_latex),
        back_latex: Boolean(card.back_latex),
      })),
    );

    if (cardsError) {
      return fail(cardsError.message ?? "Could not sync cards.");
    }
  }

  revalidatePath("/decks");
  revalidatePath("/explore");
  revalidatePath(`/decks/${copyDeckId}`);
  return ok({ copyDeckId });
}
