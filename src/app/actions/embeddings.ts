"use server";

import { getOpenAI } from "@/lib/openai";

export type EmbeddingResult =
  | { success: true; embedding: number[] }
  | { success: false; error: string };

/** Placeholder: vector embeddings for search / RAG on deck content */
export async function createEmbeddingForText(
  text: string,
): Promise<EmbeddingResult> {
  const trimmed = text.trim();
  if (!trimmed) {
    return { success: false, error: "Text is required." };
  }

  try {
    const openai = getOpenAI();
    const res = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: trimmed,
    });
    const embedding = res.data[0]?.embedding;
    if (!embedding) {
      return { success: false, error: "No embedding returned." };
    }
    return { success: true, embedding };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Embedding failed.";
    return { success: false, error: message };
  }
}
