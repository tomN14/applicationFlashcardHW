/** First line → title; rest → description (same rules as quick-create on decks). */
export function parsePromptTitleDescription(raw: string): {
  title: string;
  description: string | null;
} {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { title: "Untitled deck", description: null };
  }
  const nl = trimmed.indexOf("\n");
  const title =
    nl === -1
      ? trimmed.slice(0, 512)
      : trimmed.slice(0, nl).trim().slice(0, 512) || "Untitled deck";
  const description =
    nl === -1
      ? null
      : trimmed.slice(nl + 1).trim().slice(0, 8000) || null;
  return { title, description };
}
