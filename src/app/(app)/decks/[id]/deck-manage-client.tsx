"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import {
  addCardToDeck,
  deleteCardFromDeck,
  reorderDeckCards,
  updateCardInDeck,
  updateDeck,
} from "@/app/actions/decks";
import type { CardRow, DeckDetail } from "@/types/deck";
import { CardFieldEditor } from "@/components/deck/card-field-editor";
import { DeckManageSortableList } from "./deck-manage-sortable-list";

type DeckManageClientProps = {
  deck: DeckDetail;
};

type DeckSaveUi = "idle" | "saving" | "saved" | "error";

function sameDeckMeta(
  a: { title: string; description: string; is_public: boolean },
  b: { title: string; description: string; is_public: boolean },
) {
  return (
    a.title === b.title &&
    a.description === b.description &&
    a.is_public === b.is_public
  );
}

/** Stable fingerprint of card ids + positions from the server (sorted by position). */
function cardsOrderFingerprint(cards: DeckDetail["cards"]): string {
  return [...cards]
    .sort((a, b) => a.position - b.position)
    .map((c) => `${c.id}:${c.position}`)
    .join("|");
}

function orderFingerprintFromIds(orderedIds: string[]): string {
  return orderedIds.map((id, i) => `${id}:${i}`).join("|");
}

function sortedCardIds(cards: CardRow[]): string[] {
  return [...cards]
    .sort((a, b) => a.position - b.position)
    .map((c) => c.id);
}

export function DeckManageClient({ deck: initial }: DeckManageClientProps) {
  const router = useRouter();
  const initialRef = useRef(initial);
  initialRef.current = initial;

  const [isRefreshing, startRefresh] = useTransition();
  const [supabaseBusy, setSupabaseBusy] = useState(false);

  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description ?? "");
  const [isPublic, setIsPublic] = useState(initial.is_public);

  const [deckSaveUi, setDeckSaveUi] = useState<DeckSaveUi>("idle");
  const lastSyncedDeck = useRef({
    title: initial.title.trim(),
    description: (initial.description ?? "").trim(),
    is_public: initial.is_public,
  });
  const deckSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFront, setEditFront] = useState("");
  const [editBack, setEditBack] = useState("");
  const [editFrontLatex, setEditFrontLatex] = useState(false);
  const [editBackLatex, setEditBackLatex] = useState(false);

  const [newFront, setNewFront] = useState("");
  const [newBack, setNewBack] = useState("");
  const [newFrontLatex, setNewFrontLatex] = useState(false);
  const [newBackLatex, setNewBackLatex] = useState(false);

  const [orderedIds, setOrderedIds] = useState<string[]>(() =>
    initial.cards.map((c) => c.id),
  );

  const [banner, setBanner] = useState<string | null>(null);

  const cardsOrderKey = useMemo(
    () => cardsOrderFingerprint(initial.cards),
    [initial.cards],
  );

  /** Single primitive — keeps useEffect dependency array length stable (React 19). */
  const deckMetaSyncKey = useMemo(
    () =>
      `${initial.id}|${initial.title}|${initial.description ?? ""}|${String(initial.is_public)}`,
    [initial.id, initial.title, initial.description, initial.is_public],
  );

  const cardsLayoutSyncKey = useMemo(
    () => `${initial.id}|${cardsOrderKey}`,
    [initial.id, cardsOrderKey],
  );

  const lastAppliedCardsKey = useRef<string | null>(null);
  const orderedIdsRef = useRef(orderedIds);
  const reorderInFlightRef = useRef(false);
  /** Set after a successful reorder until server payload matches this order. */
  const committedOrderRef = useRef<string[] | null>(null);

  orderedIdsRef.current = orderedIds;

  useEffect(() => {
    const d = initialRef.current;
    lastSyncedDeck.current = {
      title: d.title.trim(),
      description: (d.description ?? "").trim(),
      is_public: d.is_public,
    };
    setTitle(d.title);
    setDescription(d.description ?? "");
    setIsPublic(d.is_public);
    setDeckSaveUi("idle");
  }, [deckMetaSyncKey]);

  useEffect(() => {
    if (reorderInFlightRef.current) {
      return;
    }
    if (lastAppliedCardsKey.current === cardsLayoutSyncKey) {
      return;
    }

    const serverIds = sortedCardIds(initialRef.current.cards);
    const localIds = orderedIdsRef.current;
    const serverKey = serverIds.join("|");
    const localKey = localIds.join("|");

    const committed = committedOrderRef.current;
    if (committed && committed.join("|") !== serverKey) {
      return;
    }
    if (committed && committed.join("|") === serverKey) {
      committedOrderRef.current = null;
    }

    if (serverKey === localKey) {
      lastAppliedCardsKey.current = cardsLayoutSyncKey;
      return;
    }

    lastAppliedCardsKey.current = cardsLayoutSyncKey;
    setOrderedIds(serverIds);
    setEditingId(null);
  }, [cardsLayoutSyncKey]);

  const cards = initial.cards;
  const orderedCards = useMemo(() => {
    const byId = new Map(cards.map((c) => [c.id, c]));
    return orderedIds
      .map((id) => byId.get(id))
      .filter((c): c is CardRow => c != null);
  }, [cards, orderedIds]);
  const cardCount = cards.length;

  const refresh = useCallback(() => {
    startRefresh(() => {
      router.refresh();
    });
  }, [router]);

  const isDeckDirty = useCallback(() => {
    const t = title.trim();
    const d = description.trim();
    return !sameDeckMeta(
      { title: t, description: d, is_public: isPublic },
      lastSyncedDeck.current,
    );
  }, [title, description, isPublic]);

  const performDeckSave = useCallback(async (): Promise<boolean> => {
    const t = title.trim();
    if (!t) {
      setBanner("Title is required.");
      setDeckSaveUi("error");
      return false;
    }
    if (!isDeckDirty()) {
      setDeckSaveUi("idle");
      return true;
    }

    setDeckSaveUi("saving");
    setBanner(null);
    const result = await updateDeck({
      id: initial.id,
      title: t,
      description: description.trim() || null,
      is_public: isPublic,
    });

    if (result.error) {
      setBanner(result.error);
      setDeckSaveUi("error");
      return false;
    }

    lastSyncedDeck.current = {
      title: t,
      description: description.trim(),
      is_public: isPublic,
    };
    setDeckSaveUi("saved");
    window.setTimeout(() => {
      setDeckSaveUi((s) => (s === "saved" ? "idle" : s));
    }, 2200);
    refresh();
    return true;
  }, [
    title,
    description,
    isPublic,
    initial.id,
    isDeckDirty,
    refresh,
  ]);

  useEffect(() => {
    if (!isDeckDirty()) {
      if (deckSaveTimer.current) {
        clearTimeout(deckSaveTimer.current);
        deckSaveTimer.current = null;
      }
      return;
    }
    if (deckSaveTimer.current) {
      clearTimeout(deckSaveTimer.current);
    }
    deckSaveTimer.current = setTimeout(() => {
      deckSaveTimer.current = null;
      void performDeckSave();
    }, 700);
    return () => {
      if (deckSaveTimer.current) {
        clearTimeout(deckSaveTimer.current);
        deckSaveTimer.current = null;
      }
    };
  }, [title, description, isPublic, performDeckSave, isDeckDirty]);

  const flushDeckSave = useCallback(() => {
    if (deckSaveTimer.current) {
      clearTimeout(deckSaveTimer.current);
      deckSaveTimer.current = null;
    }
    void performDeckSave();
  }, [performDeckSave]);

  const startEdit = (c: CardRow) => {
    setEditingId(c.id);
    setEditFront(c.front);
    setEditBack(c.back);
    setEditFrontLatex(c.front_latex);
    setEditBackLatex(c.back_latex);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveCard = async (cardId: string) => {
    setBanner(null);
    setSupabaseBusy(true);
    try {
      const result = await updateCardInDeck({
        id: cardId,
        deckId: initial.id,
        front: editFront,
        back: editBack,
        front_latex: editFrontLatex,
        back_latex: editBackLatex,
      });
      if (result.error) {
        setBanner(result.error);
        return;
      }
      committedOrderRef.current = null;
      setEditingId(null);
      refresh();
    } finally {
      setSupabaseBusy(false);
    }
  };

  const removeCard = async (cardId: string) => {
    if (!window.confirm("Delete this card?")) {
      return;
    }
    setBanner(null);
    setSupabaseBusy(true);
    try {
      const result = await deleteCardFromDeck({
        id: cardId,
        deckId: initial.id,
      });
      if (result.error) {
        setBanner(result.error);
        return;
      }
      if (editingId === cardId) {
        setEditingId(null);
      }
      committedOrderRef.current = null;
      refresh();
    } finally {
      setSupabaseBusy(false);
    }
  };

  const addCard = async (e: FormEvent) => {
    e.preventDefault();
    setBanner(null);
    setSupabaseBusy(true);
    try {
      const result = await addCardToDeck({
        deckId: initial.id,
        front: newFront,
        back: newBack,
        front_latex: newFrontLatex,
        back_latex: newBackLatex,
      });
      if (result.error) {
        setBanner(result.error);
        return;
      }
      setNewFront("");
      setNewBack("");
      setNewFrontLatex(false);
      setNewBackLatex(false);
      committedOrderRef.current = null;
      refresh();
    } finally {
      setSupabaseBusy(false);
    }
  };

  const handleReorder = (nextOrderedIds: string[]) => {
    const rollback = () => setOrderedIds(sortedCardIds(initialRef.current.cards));

    setOrderedIds(nextOrderedIds);
    reorderInFlightRef.current = true;
    setSupabaseBusy(true);
    void (async () => {
      const result = await reorderDeckCards({
        deckId: initial.id,
        orderedCardIds: nextOrderedIds,
      });
      reorderInFlightRef.current = false;
      if (result.error) {
        setBanner(result.error);
        committedOrderRef.current = null;
        rollback();
      } else {
        setBanner(null);
        committedOrderRef.current = nextOrderedIds;
        lastAppliedCardsKey.current = `${initial.id}|${orderFingerprintFromIds(nextOrderedIds)}`;
        refresh();
      }
      setSupabaseBusy(false);
    })();
  };

  const loading =
    supabaseBusy || isRefreshing || deckSaveUi === "saving";

  return (
    <div className="relative mx-auto max-w-4xl space-y-10 pb-16 text-zinc-900">
      {loading ? (
        <div
          className="pointer-events-none fixed inset-x-0 top-0 z-40 h-1 overflow-hidden bg-indigo-100"
          aria-busy
          aria-label="Loading"
        >
          <div className="h-full w-full animate-pulse bg-indigo-600" />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/decks"
          className="text-sm font-medium text-indigo-700 hover:text-indigo-900"
        >
          ← All decks
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          {deckSaveUi === "saving" ? (
            <span className="text-xs font-medium text-indigo-600">
              Saving deck…
            </span>
          ) : deckSaveUi === "saved" ? (
            <span className="text-xs font-medium text-emerald-700">
              Deck saved
            </span>
          ) : deckSaveUi === "error" ? (
            <span className="text-xs font-medium text-rose-700">
              Deck not saved
            </span>
          ) : null}
          {supabaseBusy || isRefreshing ? (
            <span className="text-xs font-medium text-zinc-500">
              Syncing…
            </span>
          ) : null}
          <Link
            href={`/decks/${initial.id}/study`}
            className="inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
          >
            Study mode
          </Link>
        </div>
      </div>

      {banner ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {banner}
        </div>
      ) : null}

      <section
        className={`rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 transition-opacity sm:p-8 ${loading ? "opacity-[0.92]" : ""}`}
      >
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Deck</h1>
            <p className="mt-1 text-sm text-zinc-500">
              {cardCount} {cardCount === 1 ? "card" : "cards"} · edits save
              automatically
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <label className="block text-sm">
            <span className="font-medium text-zinc-700">Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={flushDeckSave}
              disabled={supabaseBusy}
              className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-zinc-700">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={flushDeckSave}
              rows={3}
              disabled={supabaseBusy}
              className="mt-1.5 w-full resize-y rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
            />
          </label>
          <label className="flex cursor-pointer items-center gap-3 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => {
                setIsPublic(e.target.checked);
                window.setTimeout(() => {
                  flushDeckSave();
                }, 0);
              }}
              disabled={supabaseBusy}
              className="h-4 w-4 rounded border-zinc-300 text-indigo-600 disabled:opacity-50"
            />
            Public deck
          </label>
        </div>
      </section>

      <section
        className={`rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 transition-opacity sm:p-8 ${supabaseBusy || isRefreshing ? "opacity-[0.92]" : ""}`}
      >
        <h2 className="text-lg font-semibold text-zinc-900">Cards</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Drag the grip handle to reorder. Positions save to the database.
          Front and back stay visible for editing.
        </p>

        {cards.length === 0 ? (
          <p className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-10 text-center text-sm text-zinc-600">
            No cards yet.
          </p>
        ) : (
          <DeckManageSortableList
            orderedCards={orderedCards}
            editingId={editingId}
            editFront={editFront}
            editBack={editBack}
            editFrontLatex={editFrontLatex}
            editBackLatex={editBackLatex}
            disabled={supabaseBusy}
            onReorder={handleReorder}
            onStartEdit={startEdit}
            onCancelEdit={cancelEdit}
            onSaveCard={saveCard}
            onRemoveCard={removeCard}
            setEditFront={setEditFront}
            setEditBack={setEditBack}
            setEditFrontLatex={setEditFrontLatex}
            setEditBackLatex={setEditBackLatex}
          />
        )}

        <form
          onSubmit={addCard}
          className="mt-8 border-t border-zinc-200 pt-6"
        >
          <h3 className="text-sm font-semibold text-zinc-800">Add new card</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <CardFieldEditor
              label="Front"
              value={newFront}
              latexEnabled={newFrontLatex}
              isEditing
              disabled={supabaseBusy}
              onValueChange={setNewFront}
              onLatexChange={setNewFrontLatex}
            />
            <CardFieldEditor
              label="Back"
              value={newBack}
              latexEnabled={newBackLatex}
              isEditing
              disabled={supabaseBusy}
              onValueChange={setNewBack}
              onLatexChange={setNewBackLatex}
            />
          </div>
          <button
            type="submit"
            disabled={supabaseBusy}
            className="mt-4 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
          >
            {supabaseBusy ? "Working…" : "Add card"}
          </button>
        </form>
      </section>
    </div>
  );
}
