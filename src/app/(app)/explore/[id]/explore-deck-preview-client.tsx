"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveCommunityDeck } from "@/app/actions/community-decks";
import { CardTextWithLatex } from "@/components/study/card-text-with-latex";
import type { DeckDetail } from "@/types/deck";

type ExploreDeckPreviewClientProps = {
  deck: DeckDetail;
  authorName: string;
  savedCopyId: string | null;
  isSignedIn: boolean;
};

function PreviewCard({
  front,
  back,
  frontLatex,
  backLatex,
  canFlip,
}: {
  front: string;
  back: string;
  frontLatex: boolean;
  backLatex: boolean;
  canFlip: boolean;
}) {
  const [flipped, setFlipped] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        if (canFlip) {
          setFlipped((f) => !f);
        }
      }}
      disabled={!canFlip}
      className="group flex min-h-[9rem] flex-col rounded-2xl border border-[var(--app-surface-border)] bg-[var(--app-surface)] p-4 text-left shadow-sm transition hover:border-[var(--app-accent)]/40 hover:shadow-md disabled:cursor-default"
    >
      <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--app-muted)]">
        {flipped ? "Back" : "Front"}
      </span>
      <div className="mt-2 flex flex-1 items-center text-sm leading-relaxed">
        {flipped ? (
          <CardTextWithLatex
            text={back}
            latexEnabled={backLatex}
            className="line-clamp-6"
          />
        ) : (
          <CardTextWithLatex
            text={front}
            latexEnabled={frontLatex}
            className="line-clamp-6"
          />
        )}
      </div>
      {canFlip ? (
        <span className="mt-3 text-[11px] font-medium text-[var(--app-muted)] opacity-0 transition group-hover:opacity-100">
          Tap to flip
        </span>
      ) : (
        <span className="mt-3 text-[11px] font-medium text-amber-700">
          Sign in to flip cards
        </span>
      )}
    </button>
  );
}

export function ExploreDeckPreviewClient({
  deck,
  authorName,
  savedCopyId: initialSavedCopyId,
  isSignedIn,
}: ExploreDeckPreviewClientProps) {
  const router = useRouter();
  const [savedCopyId, setSavedCopyId] = useState(initialSavedCopyId);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, startSave] = useTransition();

  const handleSave = () => {
    if (!isSignedIn) {
      router.push(`/login?next=/explore/${deck.id}`);
      return;
    }

    setMessage(null);
    startSave(async () => {
      const result = await saveCommunityDeck({ sourceDeckId: deck.id });
      if (result.error || !result.data) {
        setMessage(result.error ?? "Could not save deck.");
        return;
      }
      setSavedCopyId(result.data.copyDeckId);
      setMessage(
        result.data.alreadySaved
          ? "Already in your library."
          : "Deck saved to your library.",
      );
      router.refresh();
    });
  };

  return (
    <div className="relative w-full pb-12 text-[var(--app-foreground)]">
      <div className="mb-6">
        <Link
          href="/explore"
          className="text-sm font-semibold text-[var(--app-accent)] hover:opacity-80"
        >
          ← Back to explore
        </Link>
      </div>

      <header className="flex flex-col gap-4 border-b border-[var(--app-surface-border)] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--app-accent)]">
            Community preview
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {deck.title}
          </h1>
          <p className="mt-2 text-sm text-[var(--app-muted)]">
            by {authorName} · {deck.cards.length} cards · {deck.save_count}{" "}
            saves
          </p>
          {deck.description ? (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--app-muted)]">
              {deck.description}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          {isSignedIn ? (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || Boolean(savedCopyId)}
              className="rounded-xl bg-[var(--app-accent)] px-5 py-2.5 text-sm font-semibold text-[var(--app-surface)] shadow-sm transition hover:opacity-90 disabled:cursor-default disabled:opacity-60"
            >
              {saving
                ? "Saving…"
                : savedCopyId
                  ? "Saved"
                  : "Save to my decks"}
            </button>
          ) : (
            <Link
              href={`/login?next=/explore/${deck.id}`}
              className="inline-flex items-center justify-center rounded-xl bg-[var(--app-accent)] px-5 py-2.5 text-sm font-semibold text-[var(--app-surface)] shadow-sm"
            >
              Sign in to save
            </Link>
          )}
          {savedCopyId ? (
            <Link
              href={`/decks/${savedCopyId}`}
              className="text-center text-xs font-medium text-[var(--app-muted)] hover:text-[var(--app-accent)]"
            >
              Open saved copy
            </Link>
          ) : null}
        </div>
      </header>

      {message ? (
        <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {message}
        </p>
      ) : null}

      <section className="mt-8">
        <h2 className="text-base font-semibold">Cards</h2>
        <p className="mt-1 text-sm text-[var(--app-muted)]">
          {isSignedIn
            ? "Tap a card to flip between question and answer."
            : "Front sides are visible. Sign in to flip and save this deck."}
        </p>

        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {deck.cards.map((card) => (
            <li key={card.id}>
              <PreviewCard
                front={card.front}
                back={card.back}
                frontLatex={card.front_latex}
                backLatex={card.back_latex}
                canFlip={isSignedIn}
              />
            </li>
          ))}
        </ul>
      </section>

      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--app-surface-border)] bg-[var(--app-surface)]/95 px-4 py-3 backdrop-blur-md lg:pl-[calc(var(--sidebar-offset,16rem)+1rem)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <span className="text-sm font-semibold text-[var(--app-muted)]">
            {savedCopyId ? "Saved" : "Previewing community deck"}
          </span>
          {isSignedIn ? (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || Boolean(savedCopyId)}
              className="rounded-xl bg-[var(--app-accent)] px-4 py-2 text-sm font-semibold text-[var(--app-surface)] disabled:opacity-60"
            >
              {savedCopyId ? "Saved" : saving ? "Saving…" : "Save deck"}
            </button>
          ) : (
            <Link
              href={`/login?next=/explore/${deck.id}`}
              className="rounded-xl bg-[var(--app-accent)] px-4 py-2 text-sm font-semibold text-[var(--app-surface)]"
            >
              Sign in to save
            </Link>
          )}
        </div>
      </footer>
    </div>
  );
}
