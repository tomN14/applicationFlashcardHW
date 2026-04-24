import Link from "next/link";
import { FlipCard } from "@/components/study/flip-card";

export default function StudyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-6 py-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Study
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Study surface (placeholder): flip cards from{" "}
          <code className="rounded bg-zinc-100 px-1 text-sm dark:bg-zinc-800">
            components/study/flip-card
          </code>
          .
        </p>
      </div>
      <FlipCard
        front="What is the capital of France?"
        back="Paris (placeholder card)."
      />
      <p className="text-sm text-zinc-500">
        <Link href="/decks" className="underline">
          Pick a deck
        </Link>
      </p>
    </div>
  );
}
