import Link from "next/link";

export default function StudyHubPage() {
  return (
    <div className="mx-auto max-w-lg space-y-4 py-8 text-center text-zinc-700">
      <h1 className="text-2xl font-semibold text-zinc-900">Study</h1>
      <p className="text-sm text-zinc-600">
        Open a deck, then use{" "}
        <span className="font-medium text-zinc-800">Study</span> from the deck
        card or deck page.
      </p>
      <Link
        href="/decks"
        className="inline-flex rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
      >
        Go to decks
      </Link>
    </div>
  );
}
