"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StudyFlipCard } from "@/components/study/flip-card";
import { StudyProgressBar } from "@/components/study/study-progress-bar";
import {
  StudySessionComplete,
  type StudySessionStats,
} from "@/components/study/study-session-complete";
import type { CardRow, DeckDetail } from "@/types/deck";

type DeckStudyClientProps = {
  deck: Pick<DeckDetail, "id" | "title">;
  cards: CardRow[];
};

function shuffleIds(ids: string[]): string[] {
  const next = [...ids];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName;
  return (
    target.isContentEditable ||
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT"
  );
}

export function DeckStudyClient({ deck, cards }: DeckStudyClientProps) {
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [studyOrder, setStudyOrder] = useState<string[]>(() =>
    cards.map((c) => c.id),
  );
  /** Card ids revealed at least once — progress never decreases. */
  const [flippedCardIds, setFlippedCardIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionStartedAt, setSessionStartedAt] = useState(() => Date.now());
  const [sessionCompletedAt, setSessionCompletedAt] = useState<number | null>(
    null,
  );

  const orderedCards = useMemo(() => {
    const byId = new Map(cards.map((c) => [c.id, c]));
    return studyOrder
      .map((id) => byId.get(id))
      .filter((c): c is CardRow => c !== undefined);
  }, [cards, studyOrder]);

  const total = orderedCards.length;
  const current = total > 0 ? orderedCards[index] : null;

  useEffect(() => {
    setIsFlipped(false);
  }, [index]);

  const markCurrentFlipped = useCallback((cardId: string) => {
    setFlippedCardIds((prev) => {
      if (prev.has(cardId)) {
        return prev;
      }
      const next = new Set(prev);
      next.add(cardId);
      return next;
    });
  }, []);

  const handleFlip = useCallback(() => {
    if (!current) {
      return;
    }
    if (!isFlipped) {
      markCurrentFlipped(current.id);
      setIsFlipped(true);
    } else {
      setIsFlipped(false);
    }
  }, [current, isFlipped, markCurrentFlipped]);

  const goPrev = useCallback(() => {
    setIndex((i) => (i <= 0 ? Math.max(0, total - 1) : i - 1));
  }, [total]);

  const goNext = useCallback(() => {
    if (!isFlipped) {
      return;
    }
    if (index >= total - 1) {
      setSessionComplete(true);
      return;
    }
    setIndex((i) => i + 1);
  }, [index, isFlipped, total]);

  useEffect(() => {
    if (sessionComplete && sessionCompletedAt === null) {
      setSessionCompletedAt(Date.now());
    }
    if (!sessionComplete) {
      setSessionCompletedAt(null);
    }
  }, [sessionComplete, sessionCompletedAt]);

  const sessionStats = useMemo((): StudySessionStats => {
    const completedAt = sessionCompletedAt ?? Date.now();
    return {
      deckId: deck.id,
      deckTitle: deck.title,
      cardsReviewed: flippedCardIds.size,
      totalCards: total,
      durationMs: completedAt - sessionStartedAt,
      wasShuffled: isShuffled,
    };
  }, [
    deck.id,
    deck.title,
    flippedCardIds.size,
    isShuffled,
    sessionCompletedAt,
    sessionStartedAt,
    total,
  ]);

  const toggleShuffle = useCallback(() => {
    setIsShuffled((shuffled) => {
      const nextShuffled = !shuffled;
      setStudyOrder(
        nextShuffled
          ? shuffleIds(cards.map((c) => c.id))
          : cards.map((c) => c.id),
      );
      setIndex(0);
      setIsFlipped(false);
      setSessionComplete(false);
      return nextShuffled;
    });
  }, [cards]);

  const restartSession = useCallback(() => {
    setIndex(0);
    setIsFlipped(false);
    setFlippedCardIds(new Set());
    setSessionComplete(false);
    setSessionStartedAt(Date.now());
    setSessionCompletedAt(null);
    setStudyOrder(
      isShuffled ? shuffleIds(cards.map((c) => c.id)) : cards.map((c) => c.id),
    );
  }, [cards, isShuffled]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }

      const key = e.key;

      if (key === " " || key === "ArrowUp") {
        e.preventDefault();
        handleFlip();
        return;
      }
      if (key === "ArrowRight" || key === "n" || key === "N") {
        e.preventDefault();
        goNext();
        return;
      }
      if (key === "ArrowLeft" || key === "l" || key === "L") {
        e.preventDefault();
        goPrev();
        return;
      }
      if (key === "r" || key === "R") {
        e.preventDefault();
        restartSession();
        return;
      }
      if (key === "s" || key === "S") {
        e.preventDefault();
        toggleShuffle();
        return;
      }
      if (key === "Escape" && isFlipped) {
        e.preventDefault();
        setIsFlipped(false);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    goNext,
    goPrev,
    handleFlip,
    isFlipped,
    restartSession,
    toggleShuffle,
  ]);

  if (total === 0 || !current) {
    return (
      <div className="mx-auto max-w-lg space-y-6 px-4 py-16 text-center text-zinc-700">
        <p className="text-lg font-medium">No cards in this deck</p>
        <p className="text-sm text-zinc-500">
          Add cards on the deck page, then come back to study.
        </p>
        <Link
          href={`/decks/${deck.id}`}
          className="inline-block rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          Manage deck
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[75vh] max-w-2xl flex-col px-4 pb-10 pt-5 text-zinc-900 sm:pb-12 sm:pt-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/decks/${deck.id}`}
          className="text-sm font-medium text-indigo-700 transition hover:text-indigo-900"
        >
          ← {deck.title}
        </Link>
        <div className="flex items-center gap-2">
          {isShuffled ? (
            <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">
              Shuffled
            </span>
          ) : null}
          <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 font-mono text-xs tabular-nums text-zinc-600 shadow-sm">
            Study mode
          </span>
        </div>
      </div>

      <div className="mb-6">
        <StudyProgressBar flippedCount={flippedCardIds.size} total={total} />
      </div>

      {sessionComplete ? (
        <StudySessionComplete stats={sessionStats} onStudyAgain={restartSession} />
      ) : (
        <>
          <div className="flex flex-1 flex-col items-center justify-start pt-2 sm:pt-4">
            <StudyFlipCard
              key={current.id}
              front={current.front}
              back={current.back}
              frontLatex={current.front_latex}
              backLatex={current.back_latex}
              isFlipped={isFlipped}
              onFlip={handleFlip}
              onPrevious={goPrev}
              onNext={goNext}
              canGoNext={isFlipped}
              cardIndex={index}
              totalCards={total}
            />
          </div>

          <p className="mt-6 text-center text-xs leading-relaxed text-zinc-500">
            <span className="font-medium text-zinc-600">Keyboard:</span> Space /
            ↑ flip · ← / L prev · → / N next (after flip) · R restart · S shuffle
          </p>
        </>
      )}
    </div>
  );
}
