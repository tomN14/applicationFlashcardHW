"use client";

import { useState } from "react";

type FlipCardProps = {
  front: string;
  back: string;
};

export function FlipCard({ front, back }: FlipCardProps) {
  const [showBack, setShowBack] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setShowBack((v) => !v)}
      className="flex min-h-48 w-full max-w-md flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 p-6 text-center transition-colors hover:border-zinc-400 dark:border-zinc-600 dark:bg-zinc-900 dark:hover:border-zinc-500"
    >
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {showBack ? "Back" : "Front"} · tap to flip
      </span>
      <p className="mt-4 text-lg text-zinc-900 dark:text-zinc-50">
        {showBack ? back : front}
      </p>
    </button>
  );
}
