"use client";

import { motion } from "motion/react";
import { CardTextWithLatex } from "@/components/study/card-text-with-latex";

export type StudyFlipCardProps = {
  front: string;
  back: string;
  frontLatex: boolean;
  backLatex: boolean;
  isFlipped: boolean;
  onFlip: () => void;
  onPrevious: () => void;
  onNext: () => void;
  canGoNext: boolean;
  cardIndex: number;
  totalCards: number;
};

export function StudyFlipCard({
  front,
  back,
  frontLatex,
  backLatex,
  isFlipped,
  onFlip,
  onPrevious,
  onNext,
  canGoNext,
  cardIndex,
  totalCards,
}: StudyFlipCardProps) {
  return (
    <motion.div
      className="relative mx-auto w-full max-w-xl"
      style={{ perspective: 1200 }}
      initial={false}
    >
      <motion.div
        className="relative aspect-[4/3] w-full cursor-pointer sm:aspect-[5/3]"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{
          duration: 0.55,
          ease: [0.33, 1, 0.38, 1],
        }}
        initial={false}
      >
        {/* Front — question */}
        <motion.div
          role="button"
          tabIndex={0}
          aria-label="Show answer"
          aria-hidden={isFlipped}
          onClick={() => !isFlipped && onFlip()}
          className="absolute inset-0 flex flex-col rounded-3xl border border-zinc-200/90 bg-gradient-to-br from-white via-indigo-50/30 to-white p-8 shadow-xl ring-1 ring-zinc-950/5 sm:p-10"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-indigo-600">
              Question
            </span>
            <span className="font-mono text-[11px] tabular-nums text-zinc-400">
              {cardIndex + 1} / {totalCards}
            </span>
          </div>
          <motion.div
            className="flex flex-1 flex-col items-center justify-center text-center"
            animate={{ opacity: isFlipped ? 0 : 1 }}
            transition={{ duration: 0.2 }}
            initial={false}
          >
            <CardTextWithLatex
              text={front}
              latexEnabled={frontLatex}
              className="text-xl font-medium text-zinc-900 sm:text-2xl"
            />
            <p className="mt-8 text-xs font-medium text-zinc-400">
              Tap card to reveal answer
            </p>
          </motion.div>
        </motion.div>

        {/* Back — answer + side tap zones */}
        <motion.div
          aria-hidden={!isFlipped}
          className="absolute inset-0 flex flex-col rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/80 via-white to-white p-8 shadow-xl ring-1 ring-emerald-950/5 sm:p-10"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <motion.div
            className="relative flex flex-1 flex-col"
            initial={false}
            animate={{ opacity: isFlipped ? 1 : 0 }}
            transition={{ duration: 0.25, delay: isFlipped ? 0.15 : 0 }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
                Answer
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onFlip();
                }}
                className="relative z-20 rounded-lg px-2 py-1 text-[11px] font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800"
              >
                ← Question
              </button>
            </div>

            <motion.div
              className="flex flex-1 flex-col items-center justify-center px-[28%] text-center"
              initial={false}
              animate={{ opacity: isFlipped ? 1 : 0 }}
              transition={{ duration: 0.25, delay: isFlipped ? 0.15 : 0 }}
            >
              <CardTextWithLatex
                text={back}
                latexEnabled={backLatex}
                className="text-lg text-zinc-800 sm:text-xl"
              />
              <p className="mt-6 hidden text-[11px] font-medium text-zinc-400 sm:block">
                {canGoNext
                  ? "Click left or right edge to navigate"
                  : "Flip the card to continue"}
              </p>
              <p className="mt-6 text-[11px] font-medium text-zinc-400 sm:hidden">
                {canGoNext
                  ? "Tap left or right edge to navigate"
                  : "Flip the card to continue"}
              </p>
            </motion.div>

            {isFlipped ? (
              <>
                <button
                  type="button"
                  aria-label="Previous card"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPrevious();
                  }}
                  className="group absolute inset-y-0 left-0 z-10 w-[30%] rounded-l-3xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-indigo-500"
                >
                  <span
                    aria-hidden
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 px-2 py-2.5 text-base text-zinc-400 shadow-sm ring-1 ring-zinc-200/80 backdrop-blur-sm transition group-hover:bg-white group-hover:text-indigo-600 group-active:scale-95 sm:left-4 sm:px-2.5 sm:py-3 sm:text-lg"
                  >
                    ←
                  </span>
                </button>
                <button
                  type="button"
                  aria-label="Next card"
                  disabled={!canGoNext}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (canGoNext) {
                      onNext();
                    }
                  }}
                  className="group absolute inset-y-0 right-0 z-10 w-[30%] rounded-r-3xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-indigo-500 disabled:pointer-events-none"
                >
                  <span
                    aria-hidden
                    className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-2 py-2.5 text-base shadow-sm ring-1 backdrop-blur-sm transition sm:right-4 sm:px-2.5 sm:py-3 sm:text-lg ${
                      canGoNext
                        ? "bg-white/80 text-zinc-400 ring-zinc-200/80 group-hover:bg-white group-hover:text-indigo-600 group-active:scale-95"
                        : "bg-white/50 text-zinc-300 ring-zinc-100/80"
                    }`}
                  >
                    →
                  </span>
                </button>
              </>
            ) : null}
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
