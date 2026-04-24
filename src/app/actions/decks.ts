"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export type CreateDeckResult =
  | { success: true }
  | { success: false; error: string };

export async function createDeck(formData: FormData): Promise<CreateDeckResult> {
  const title = formData.get("title");
  if (typeof title !== "string" || !title.trim()) {
    return { success: false, error: "Title is required." };
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("decks").insert({
    title: title.trim(),
  });

  if (error) {
    return {
      success: false,
      error: error.message || "Could not create deck (check Supabase schema).",
    };
  }

  revalidatePath("/decks");
  return { success: true };
}

export async function submitCreateDeckForm(formData: FormData): Promise<void> {
  await createDeck(formData);
}
