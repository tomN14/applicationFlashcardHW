"use client";

import Link from "next/link";
import { motion } from "motion/react";

export type StudySessionStats = {
  deckId: string;
  deckTitle: string;
  cardsReviewed: number;
  totalCards: number;
  durationMs: number;
  wasShuffled: boolean;
};

type StudySessionCompleteProps = {
  stats: StudySessionStats;
  onStudyAgain: () => void;
};

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) {
    return `${seconds}s`;
  }
  if (minutes < 60) {
    return `${minutes}m ${seconds}s`;
  }
  const hours = Math.floor(minutes / 60);
  const remMin = minutes % 60;
  return `${hours}h ${remMin}m`;
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      aria-hidden
    >
      <path
        d="M20 6L9 17l-5-5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StudySessionComplete({
  stats,
  onStudyAgain,
}: StudySessionCompleteProps) {
  const {
    deckId,
    deckTitle,
    cardsReviewed,
    totalCards,
    durationMs,
    wasShuffled,
  } = stats;

  const statItems = [
    {
      label: "Cards reviewed",
      value: String(cardsReviewed),
      sub: `of ${totalCards} in deck`,
    },
    {
      label: "Time spent",
      value: formatDuration(durationMs),
      sub: durationMs < 60_000 ? "Nice and focused" : "Solid session",
    },
    {
      label: "Order",
      value: wasShuffled ? "Shuffled" : "In order",
      sub: wasShuffled ? "Random card sequence" : "Deck order preserved",
    },
    {
      label: "Completion",
      value: "100%",
      sub: "Every card revealed",
    },
  ];

  return (
    <motion.div
      className="mx-auto w-full max-w-xl"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.33, 1, 0.38, 1] }}
    >
      <motion.div
        className="overflow-hidden rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 via-white to-indigo-50/50 shadow-xl ring-1 ring-emerald-950/5"
        initial={{ scale: 0.97 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, ease: [0.33, 1, 0.38, 1] }}
      >
        <motion.div
          className="relative px-8 pb-8 pt-10 text-center sm:px-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <div
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-indigo-600 text-white shadow-lg shadow-emerald-500/25"
            aria-hidden
          >
            <CheckIcon className="h-8 w-8" />
          </div>

          <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
            Session complete
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-zinc-900 sm:text-3xl">
            Congratulations!
          </h2>
          <p className="mx-auto mt-3 max-w-md text-pretty text-base leading-relaxed text-zinc-600">
            You have reviewed all of your cards in{" "}
            <span className="font-semibold text-zinc-800">{deckTitle}</span>.
            Every question was flipped at least once — great work staying
            consistent.
          </p>
        </motion.div>

        <div className="border-t border-emerald-100/80 bg-white/60 px-6 py-6 sm:px-8">
          <div className="mb-2 flex items-end justify-between gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Session summary
            </p>
            <p className="font-mono text-xs tabular-nums text-emerald-700">
              {cardsReviewed} / {totalCards}
            </p>
          </div>

          <motion.div
            className="relative mb-6 h-2.5 overflow-hidden rounded-full bg-zinc-100 shadow-inner ring-1 ring-zinc-200/90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
          >
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.33, 1, 0.38, 1] }}
            />
          </motion.div>

          <ul className="grid grid-cols-2 gap-3 sm:gap-4">
            {statItems.map((item, i) => (
              <motion.li
                key={item.label}
                className="rounded-2xl border border-zinc-200/80 bg-white p-4 text-left shadow-sm ring-1 ring-zinc-950/[0.03]"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.06, duration: 0.35 }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                  {item.label}
                </p>
                <p className="mt-1.5 font-mono text-xl font-semibold tabular-nums text-zinc-900">
                  {item.value}
                </p>
                <p className="mt-1 text-[11px] leading-snug text-zinc-500">
                  {item.sub}
                </p>
              </motion.li>
            ))}
          </ul>
        </div>

        <div className="border-t border-zinc-100 bg-zinc-50/50 px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={onStudyAgain}
              className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 active:scale-[0.98]"
            >
              Study again
            </button>
            <Link
              href={`/decks/${deckId}`}
              className="rounded-xl border border-zinc-200 bg-white px-5 py-3 text-center text-sm font-semibold text-zinc-800 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50"
            >
              Back to deck
            </Link>
            <Link
              href="/study"
              className="rounded-xl border border-zinc-200 bg-white px-5 py-3 text-center text-sm font-semibold text-zinc-800 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50"
            >
              Other decks
            </Link>
          </div>
          <p className="mt-5 text-center text-xs text-zinc-400">
            Press <kbd className="rounded border border-zinc-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-zinc-600">R</kbd> to study again ·{" "}
            <kbd className="rounded border border-zinc-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-zinc-600">S</kbd> toggles shuffle on restart
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
