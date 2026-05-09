/**
 * SERVER ONLY — do not import this module from Client Components or shared
 * client bundles. It reads `OPENAI_API_KEY`, which must never be exposed
 * with a `NEXT_PUBLIC_` prefix.
 */
import OpenAI from "openai";

let openai: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!openai) {
    const key =
      process.env.OPENAI_API_KEY ?? process.env.OPEN_AI_API_KEY;
    if (!key) {
      throw new Error("OPENAI_API_KEY (or OPEN_AI_API_KEY) is not set");
    }
    openai = new OpenAI({ apiKey: key });
  }
  return openai;
}
