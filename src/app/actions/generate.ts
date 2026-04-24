"use server";

import { getOpenAI } from "@/lib/openai";

export type GeneratedCard = { front: string; back: string };

export type GenerateCardsResult =
  | { success: true; cards: GeneratedCard[] }
  | { success: false; error: string };

export async function generateCardsFromTopic(
  topic: string,
): Promise<GenerateCardsResult> {
  const trimmed = topic.trim();
  if (!trimmed) {
    return { success: false, error: "Topic is required." };
  }

  try {
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Return JSON only: { \"cards\": [ { \"front\": string, \"back\": string } ] } with 3–8 flashcards for studying the user's topic.",
        },
        { role: "user", content: trimmed },
      ],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return { success: false, error: "Empty model response." };
    }

    const parsed = JSON.parse(raw) as { cards?: GeneratedCard[] };
    const cards = Array.isArray(parsed.cards) ? parsed.cards : [];

    return {
      success: true,
      cards: cards.filter(
        (c) =>
          c &&
          typeof c.front === "string" &&
          typeof c.back === "string",
      ),
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Generation failed.";
    return { success: false, error: message };
  }
}

export async function submitGenerateCardsForm(formData: FormData) {
  const topic = formData.get("topic");
  const t = typeof topic === "string" ? topic : "";
  await generateCardsFromTopic(t);
}
