"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createDeckWithCards } from "@/app/actions/decks";
import { generateCardsFromTopic } from "@/app/actions/generate";
import { parsePromptTitleDescription } from "@/lib/deckPrompt";
import { DeckCardsSortable } from "./deck-cards-sortable";

type DraftCard = { id: string; front: string; back: string };

function newDraftId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `c_${Math.random().toString(36).slice(2, 11)}`;
}

function mapGeneratedToDraft(
  cards: { front: string; back: string }[],
): DraftCard[] {
  return cards.map((c) => ({
    id: newDraftId(),
    front: c.front,
    back: c.back,
  }));
}

type DeckGenerateWizardProps = {
  isSignedIn: boolean;
};

export function DeckGenerateWizard({ isSignedIn }: DeckGenerateWizardProps) {
  const router = useRouter();
  const titleInputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  /** "generate" = first AI call; "preview" = edit / reorder / finalize */
  const [phase, setPhase] = useState<"generate" | "preview">("generate");
  const [prompt, setPrompt] = useState("");
  const [deckTitle, setDeckTitle] = useState("");
  const [deckDescription, setDeckDescription] = useState("");
  const [cards, setCards] = useState<DraftCard[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [finalizeError, setFinalizeError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const close = useCallback(() => {
    setOpen(false);
    setPhase("generate");
    setError(null);
    setFinalizeError(null);
    setBusy(false);
    setRegenerating(false);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy && !regenerating) {
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, regenerating, close]);

  useEffect(() => {
    if (open && phase === "preview") {
      titleInputRef.current?.focus();
    }
  }, [open, phase]);

  const runGeneration = useCallback(
    async (topic: string, options: { setDeckMeta: boolean }) => {
      setError(null);
      const result = await generateCardsFromTopic(topic);
      if (!result.success) {
        setError(result.error);
        return false;
      }
      if (result.cards.length === 0) {
        setError("The model returned no cards. Try a different prompt.");
        return false;
      }
      if (options.setDeckMeta) {
        const parsed = parsePromptTitleDescription(topic);
        setDeckTitle(parsed.title);
        setDeckDescription(parsed.description ?? "");
      }
      setCards(mapGeneratedToDraft(result.cards));
      return true;
    },
    [],
  );

  const startWizard = async (initialPrompt: string) => {
    const trimmed = initialPrompt.trim();
    if (!trimmed || !isSignedIn) {
      return;
    }
    setPrompt(trimmed);
    setOpen(true);
    setPhase("generate");
    setCards([]);
    setError(null);
    setFinalizeError(null);
    setBusy(true);
    const ok = await runGeneration(trimmed, { setDeckMeta: true });
    setBusy(false);
    if (ok) {
      setPhase("preview");
    }
  };

  const handleRegenerate = async () => {
    const trimmed = prompt.trim();
    if (!trimmed || regenerating) {
      return;
    }
    setRegenerating(true);
    setError(null);
    await runGeneration(trimmed, { setDeckMeta: false });
    setRegenerating(false);
  };

  const removeCard = (id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
  };

  const updateCard = (id: string, field: "front" | "back", value: string) => {
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    );
  };

  const addCard = () => {
    setCards((prev) => [
      ...prev,
      { id: newDraftId(), front: "", back: "" },
    ]);
  };

  const handleFinalize = async () => {
    setFinalizeError(null);
    setBusy(true);
    const result = await createDeckWithCards({
      title: deckTitle,
      description: deckDescription.trim() || null,
      cards: cards.map(({ front, back }) => ({ front, back })),
    });
    setBusy(false);
    if (result.error) {
      setFinalizeError(result.error);
      return;
    }
    if (!result.data) {
      setFinalizeError("Something went wrong.");
      return;
    }
    close();
    router.push(`/decks/${result.data.deckId}`);
    router.refresh();
  };

  if (!open) {
    return (
      <QuickCreateForm
        isSignedIn={isSignedIn}
        onSubmit={startWizard}
      />
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="deck-wizard-title"
      className="fixed inset-0 z-[80] flex flex-col bg-zinc-100 text-zinc-900"
    >
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-zinc-200 bg-white/95 px-4 py-4 shadow-sm backdrop-blur sm:px-8">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-600">
            AI deck builder
          </p>
          <h2
            id="deck-wizard-title"
            className="mt-1 truncate text-lg font-semibold text-zinc-900 sm:text-xl"
          >
            {phase === "generate" ? "Generating flashcards" : "Review & finalize"}
          </h2>
        </div>
        <WizardSteps phase={phase} />
        <button
          type="button"
          onClick={() => !busy && !regenerating && close()}
          className="shrink-0 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:opacity-40"
          disabled={busy}
        >
          Cancel
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {phase === "generate" && busy ? (
          <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 py-16">
            <div
              className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600"
              aria-hidden
            />
            <p className="max-w-md text-center text-sm text-zinc-600">
              Asking the model for flashcards from your prompt…
            </p>
          </div>
        ) : null}

        {phase === "generate" && !busy && error ? (
          <div className="mx-auto max-w-lg px-6 py-12">
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
              <span className="font-semibold">Generation failed.</span> {error}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={close}
                className="rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-800"
              >
                Back to decks
              </button>
              <button
                type="button"
                onClick={async () => {
                  setBusy(true);
                  const ok = await runGeneration(prompt, {
                    setDeckMeta: true,
                  });
                  setBusy(false);
                  if (ok) {
                    setPhase("preview");
                  }
                }}
                className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
              >
                Try again
              </button>
            </div>
          </div>
        ) : null}

        {phase === "preview" ? (
          <div
            className={`mx-auto max-w-3xl px-4 py-8 sm:px-6 ${regenerating ? "pointer-events-none opacity-60" : ""}`}
          >
            {regenerating ? (
              <p className="mb-4 text-center text-sm font-medium text-indigo-700">
                Regenerating cards…
              </p>
            ) : null}

            <div className="space-y-6">
              <label className="block text-sm">
                <span className="font-medium text-zinc-700">Deck title</span>
                <input
                  ref={titleInputRef}
                  value={deckTitle}
                  onChange={(e) => setDeckTitle(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm shadow-inner focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-zinc-700">Description</span>
                <textarea
                  value={deckDescription}
                  onChange={(e) => setDeckDescription(e.target.value)}
                  rows={3}
                  className="mt-1.5 w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm shadow-inner focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </label>

              <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-white via-indigo-50/30 to-white p-5 shadow-sm ring-1 ring-indigo-950/5">
                <label className="block text-sm">
                  <span className="font-medium text-zinc-800">
                    Prompt (edit and regenerate cards)
                  </span>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={4}
                    className="mt-2 w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm shadow-inner focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleRegenerate}
                  disabled={regenerating || !prompt.trim()}
                  className="mt-3 inline-flex items-center rounded-xl border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-900 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Regenerate flashcards
                </button>
              </div>

              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-800">
                    Cards ({cards.length})
                  </h3>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    Use the grip control to drag and reorder. Keyboard: focus
                    grip, then arrow keys (with dnd-kit).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addCard}
                  className="shrink-0 text-sm font-medium text-indigo-700 hover:text-indigo-900"
                >
                  + Add card
                </button>
              </div>

              <DeckCardsSortable
                cards={cards}
                onReorder={setCards}
                onUpdateCard={updateCard}
                onRemoveCard={removeCard}
                disabled={regenerating}
              />

              {finalizeError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                  {finalizeError}
                </div>
              ) : null}

              <div className="flex flex-wrap justify-end gap-3 pb-8 pt-2">
                <button
                  type="button"
                  onClick={close}
                  disabled={busy}
                  className="rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 disabled:opacity-40"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleFinalize}
                  disabled={busy || cards.length === 0}
                  className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {busy ? "Saving…" : "Create deck"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function WizardSteps({ phase }: { phase: "generate" | "preview" }) {
  const steps = [
    { id: "generate" as const, label: "Generate" },
    { id: "preview" as const, label: "Preview & edit" },
  ];
  return (
    <nav
      aria-label="Progress"
      className="hidden items-center gap-2 sm:flex"
    >
      {steps.map((s, i) => {
        const completed = phase === "preview" && s.id === "generate";
        const active =
          (phase === "generate" && s.id === "generate") ||
          (phase === "preview" && s.id === "preview");
        return (
          <div key={s.id} className="flex items-center gap-2">
            {i > 0 ? (
              <span className="text-zinc-300" aria-hidden>
                →
              </span>
            ) : null}
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                completed
                  ? "bg-emerald-100 text-emerald-800"
                  : active
                    ? "bg-indigo-100 text-indigo-900"
                    : "bg-zinc-100 text-zinc-500"
              }`}
            >
              {completed ? "✓ " : ""}
              {s.label}
            </span>
          </div>
        );
      })}
    </nav>
  );
}

function QuickCreateForm({
  isSignedIn,
  onSubmit,
}: {
  isSignedIn: boolean;
  onSubmit: (prompt: string) => void | Promise<void>;
}) {
  const [localError, setLocalError] = useState<string | null>(null);

  return (
    <form
      className="mt-4 flex flex-col gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setLocalError(null);
        const fd = new FormData(e.currentTarget);
        const raw = fd.get("prompt");
        const text = typeof raw === "string" ? raw : "";
        if (!text.trim()) {
          setLocalError("Enter a prompt first.");
          return;
        }
        await onSubmit(text);
      }}
    >
      <textarea
        name="prompt"
        rows={3}
        placeholder={`Neural networks essentials\nLayers, activations, loss…`}
        className="w-full resize-y rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-inner placeholder:text-zinc-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
      />
      {localError ? (
        <p className="text-xs text-rose-600">{localError}</p>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-zinc-500">
          Saves to your account after you sign in.
        </p>
        <button
          type="submit"
          disabled={!isSignedIn}
          className="inline-flex h-10 items-center rounded-xl bg-indigo-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Create deck
        </button>
      </div>
    </form>
  );
}
