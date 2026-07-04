"use client";

import { motion } from "motion/react";

type StudyProgressBarProps = {
  flippedCount: number;
  total: number;
};

export function StudyProgressBar({ flippedCount, total }: StudyProgressBarProps) {
  const pct = total > 0 ? Math.min(100, (flippedCount / total) * 100) : 0;
  const complete = total > 0 && flippedCount >= total;

  return (
    <div className="w-full" role="progressbar" aria-valuenow={flippedCount} aria-valuemin={0} aria-valuemax={total} aria-label="Study progress">
      <div className="mb-2.5 flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Progress
          </p>
          <p className="mt-0.5 text-sm font-medium text-zinc-800">
            {complete ? "All cards revealed" : "Cards flipped"}
          </p>
        </div>
        <p className="font-mono text-sm tabular-nums text-zinc-600">
          <span className="font-semibold text-indigo-600">{flippedCount}</span>
          <span className="text-zinc-400"> / </span>
          {total}
        </p>
      </div>

      <div className="relative h-3 overflow-hidden rounded-full bg-zinc-100/90 shadow-inner ring-1 ring-zinc-200/90">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500 shadow-[0_0_12px_rgba(79,70,229,0.35)]"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: [0.33, 1, 0.38, 1] }}
        />
        {pct > 0 && pct < 100 ? (
          <motion.div
            className="pointer-events-none absolute inset-y-0 w-8 rounded-full bg-white/30 blur-sm"
            initial={false}
            animate={{ left: `calc(${pct}% - 1rem)` }}
            transition={{ duration: 0.5, ease: [0.33, 1, 0.38, 1] }}
          />
        ) : null}
      </div>

      <p className="mt-2 text-right text-[11px] tabular-nums text-zinc-400">
        {Math.round(pct)}%
      </p>
    </div>
  );
}
