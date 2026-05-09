"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  createDeck,
  deleteDeck,
  updateDeck,
} from "@/app/actions/decks";
import { DeckGenerateWizard } from "./deck-generate-wizard";

export type DeckListItem = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  cardCount: number;
};

type DecksPageClientProps = {
  decks: DeckListItem[];
  defaultUserId: string | null;
  hasUsers: boolean;
  loadError: string | null;
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function SparkIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
      <circle cx="12" cy="12" r="3.5" />
    </svg>
  );
}

function tempDeckId(): string {
  return `optimistic-${crypto.randomUUID()}`;
}

export function DecksPageClient({
  decks,
  defaultUserId,
  hasUsers,
  loadError,
}: DecksPageClientProps) {
  const router = useRouter();
  const [list, setList] = useState<DeckListItem[]>(decks);
  const [toast, setToast] = useState<string | null>(null);

  const newDeckDialogRef = useRef<HTMLDialogElement>(null);
  const editDialogRef = useRef<HTMLDialogElement>(null);
  const deleteDialogRef = useRef<HTMLDialogElement>(null);

  const [newDeckOpen, setNewDeckOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const [editing, setEditing] = useState<DeckListItem | null>(null);
  const editBaselineRef = useRef<DeckListItem | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [draftPublic, setDraftPublic] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<DeckListItem | null>(
    null,
  );
  const deleteIndexRef = useRef<number>(0);

  const newFormId = useId();
  const editFormId = useId();

  useEffect(() => {
    setList(decks);
  }, [decks]);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const t = window.setTimeout(() => setToast(null), 6000);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const dlg = newDeckDialogRef.current;
    if (!dlg) {
      return;
    }
    if (newDeckOpen) {
      dlg.showModal();
    } else {
      dlg.close();
    }
  }, [newDeckOpen]);

  useEffect(() => {
    const dlg = editDialogRef.current;
    if (!dlg) {
      return;
    }
    if (editing) {
      dlg.showModal();
    } else {
      dlg.close();
    }
  }, [editing]);

  useEffect(() => {
    const dlg = deleteDialogRef.current;
    if (!dlg) {
      return;
    }
    if (pendingDelete) {
      dlg.showModal();
    } else {
      dlg.close();
    }
  }, [pendingDelete]);

  useEffect(() => {
    if (editing) {
      editBaselineRef.current = editing;
      setDraftTitle(editing.title);
      setDraftDescription(editing.description ?? "");
      setDraftPublic(editing.is_public);
    }
  }, [editing]);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.location.hash === "#quick-create"
    ) {
      document.getElementById("quick-create")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, []);

  const stats = useMemo(
    () => ({
      deckCount: list.length,
      publicCount: list.filter((d) => d.is_public).length,
      cardTotal: list.reduce((sum, d) => sum + d.cardCount, 0),
    }),
    [list],
  );

  const openNewDeck = useCallback(() => {
    setNewTitle("");
    setNewDescription("");
    setNewDeckOpen(true);
  }, []);

  const handleCreateDeck = async (e: FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) {
      setToast("Title is required.");
      return;
    }

    const description =
      newDescription.trim() === "" ? null : newDescription.trim();
    const optimisticId = tempDeckId();
    const optimistic: DeckListItem = {
      id: optimisticId,
      user_id: defaultUserId ?? "",
      title,
      description,
      is_public: false,
      created_at: new Date().toISOString(),
      cardCount: 0,
    };

    setList((prev) => [optimistic, ...prev]);
    setNewDeckOpen(false);
    setNewTitle("");
    setNewDescription("");

    const result = await createDeck({
      title,
      description: description ?? undefined,
    });

    if (result.error) {
      setList((prev) => prev.filter((d) => d.id !== optimisticId));
      setToast(result.error);
      return;
    }

    if (result.data) {
      const r = result.data;
      setList((prev) =>
        prev.map((d) =>
          d.id === optimisticId
            ? {
                id: r.id,
                user_id: r.user_id,
                title: r.title,
                description: r.description,
                is_public: r.is_public,
                created_at: r.created_at,
                cardCount: 0,
              }
            : d,
        ),
      );
      router.refresh();
    }
  };

  const handleSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editing) {
      return;
    }
    const baseline = editBaselineRef.current ?? editing;
    const title = draftTitle.trim();
    if (!title) {
      setToast("Title is required.");
      return;
    }
    const description =
      draftDescription.trim() === "" ? null : draftDescription.trim();

    const nextRow: DeckListItem = {
      ...editing,
      title,
      description,
      is_public: draftPublic,
    };

    setList((prev) =>
      prev.map((d) => (d.id === editing.id ? nextRow : d)),
    );
    setEditing(null);

    const result = await updateDeck({
      id: baseline.id,
      title,
      description,
      is_public: draftPublic,
    });

    if (result.error) {
      setList((prev) =>
        prev.map((d) => (d.id === baseline.id ? baseline : d)),
      );
      setToast(result.error);
      return;
    }

    if (result.data) {
      const r = result.data;
      setList((prev) =>
        prev.map((d) =>
          d.id === r.id
            ? {
                id: r.id,
                user_id: r.user_id,
                title: r.title,
                description: r.description,
                is_public: r.is_public,
                created_at: r.created_at,
                cardCount: d.cardCount,
              }
            : d,
        ),
      );
      router.refresh();
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) {
      return;
    }
    const removed = pendingDelete;
    const id = removed.id;

    setList((prev) => prev.filter((d) => d.id !== id));
    setPendingDelete(null);

    const result = await deleteDeck({ id });
    if (result.error) {
      setList((prev) => {
        const next = [...prev];
        const at = Math.min(
          Math.max(0, deleteIndexRef.current),
          next.length,
        );
        next.splice(at, 0, removed);
        return next;
      });
      setToast(result.error);
      return;
    }
    router.refresh();
  };

  return (
    <div className="relative w-full text-zinc-900">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,#fafafa_0%,#f4f4f5_45%,#eef2ff_100%)]" />

      {toast ? (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[200] max-w-md -translate-x-1/2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-950 shadow-lg"
        >
          {toast}
        </div>
      ) : null}

      <div className="relative space-y-10 pb-12">
        <header className="flex flex-col gap-4 border-b border-zinc-200/80 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
              Library
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
              Decks
            </h1>
            <p className="mt-2 max-w-xl text-pretty text-sm leading-relaxed text-zinc-600 sm:text-base">
              Create decks, edit details, or generate flashcards from a prompt.
              Changes save through the server and stay in sync with your
              library.
            </p>
          </div>
          <button
            type="button"
            onClick={openNewDeck}
            disabled={!hasUsers}
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            New deck
          </button>
        </header>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Decks", value: stats.deckCount, sub: "In your library" },
            { label: "Public", value: stats.publicCount, sub: "Visible to all" },
            { label: "Cards", value: stats.cardTotal, sub: "Across decks" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-zinc-200/90 bg-white/90 p-5 shadow-sm ring-1 ring-zinc-950/5 backdrop-blur-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                {s.label}
              </p>
              <p className="mt-2 font-mono text-3xl font-semibold tabular-nums text-zinc-900">
                {s.value}
              </p>
              <p className="mt-1 text-xs text-zinc-500">{s.sub}</p>
            </div>
          ))}
        </div>

        {loadError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            <span className="font-semibold">Could not load decks.</span>{" "}
            {loadError}
          </div>
        ) : null}

        {!hasUsers ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            No rows in{" "}
            <code className="rounded bg-white/80 px-1.5 py-0.5 font-mono text-xs">
              users
            </code>
            . Run{" "}
            <code className="rounded bg-white/80 px-1.5 py-0.5 font-mono text-xs">
              npm run seed
            </code>{" "}
            first.
          </div>
        ) : null}

        <section
          id="quick-create"
          className="scroll-mt-8 rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-white via-indigo-50/40 to-white p-6 shadow-md ring-1 ring-indigo-950/5 sm:p-8"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-600 text-white shadow-sm">
              <SparkIcon />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-zinc-900 sm:text-xl">
                Quick create
              </h2>
              <p className="mt-1 text-sm text-zinc-600">
                First line → <strong>title</strong>. Everything after a line
                break → <strong>description</strong>. You will preview and edit
                cards before saving.
              </p>
              <DeckGenerateWizard hasUsers={hasUsers} />
            </div>
          </div>
        </section>

        {list.length === 0 && !loadError ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/80 px-6 py-16 text-center">
            <p className="text-lg font-medium text-zinc-800">No decks yet</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600">
              Use <strong>New deck</strong> for a blank deck, or quick create
              above for AI-generated cards.
            </p>
          </div>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((deck) => (
              <li key={deck.id}>
                <article className="flex h-full flex-col rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm ring-1 ring-zinc-950/5 transition hover:-translate-y-0.5 hover:border-indigo-300/80 hover:shadow-md">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={
                        deck.is_public
                          ? "rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800"
                          : "rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-600"
                      }
                    >
                      {deck.is_public ? "Public" : "Private"}
                    </span>
                    <time
                      dateTime={deck.created_at}
                      className="text-[11px] font-medium text-zinc-500"
                    >
                      {formatDate(deck.created_at)}
                    </time>
                  </div>
                  <h3 className="mt-3 line-clamp-2 text-lg font-semibold leading-snug text-zinc-900">
                    {deck.title}
                  </h3>
                  {deck.description ? (
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-zinc-600">
                      {deck.description}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm italic text-zinc-400">
                      No description
                    </p>
                  )}
                  <p className="mt-3 text-xs font-medium text-zinc-500">
                    {deck.cardCount} cards
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2 border-t border-zinc-100 pt-4">
                    <Link
                      href={`/decks/${deck.id}`}
                      className="inline-flex flex-1 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 py-2 text-center text-xs font-semibold text-zinc-800 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 sm:flex-none"
                    >
                      Open
                    </Link>
                    <Link
                      href={`/decks/${deck.id}/study`}
                      className="inline-flex flex-1 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 py-2 text-center text-xs font-semibold text-zinc-800 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50/60 sm:flex-none"
                    >
                      Study
                    </Link>
                    <Link
                      href={`/decks/${deck.id}/share`}
                      className="inline-flex flex-1 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 py-2 text-center text-xs font-semibold text-zinc-800 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 sm:flex-none"
                    >
                      Share
                    </Link>
                    <button
                      type="button"
                      onClick={() => setEditing(deck)}
                      className="inline-flex flex-1 items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-900 shadow-sm transition hover:bg-indigo-100 sm:flex-none"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        deleteIndexRef.current = list.findIndex(
                          (d) => d.id === deck.id,
                        );
                        setPendingDelete(deck);
                      }}
                      className="inline-flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-rose-400 bg-rose-50 px-3 py-2 text-xs font-bold uppercase tracking-wide text-rose-900 shadow-inner transition hover:bg-rose-100 sm:flex-none"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}

        <dialog
          ref={newDeckDialogRef}
          id={newFormId}
          className="w-[min(100vw-2rem,28rem)] rounded-2xl border border-zinc-200 bg-white p-0 text-zinc-900 shadow-2xl ring-1 ring-zinc-950/10 backdrop:bg-zinc-900/30"
          onClose={() => setNewDeckOpen(false)}
        >
          <form
            className="flex flex-col gap-5 p-7"
            onSubmit={handleCreateDeck}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">
                  New deck
                </h2>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Appears in your library right away; we save in the background.
                </p>
              </div>
              <button
                type="button"
                className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
                onClick={() => setNewDeckOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <label className="block text-sm">
              <span className="font-medium text-zinc-700">Title</span>
              <span className="text-rose-600"> *</span>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                autoFocus
                className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm shadow-inner focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="e.g. Spanish verbs"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-zinc-700">Description</span>
              <span className="text-zinc-400"> (optional)</span>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={3}
                className="mt-1.5 w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm shadow-inner focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="Optional notes about this deck"
              />
            </label>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100"
                onClick={() => setNewDeckOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
              >
                Create
              </button>
            </div>
          </form>
        </dialog>

        <dialog
          ref={editDialogRef}
          id={editFormId}
          className="w-[min(100vw-2rem,28rem)] rounded-2xl border border-zinc-200 bg-white p-0 text-zinc-900 shadow-2xl ring-1 ring-zinc-950/10 backdrop:bg-zinc-900/30"
          onClose={() => setEditing(null)}
        >
          {editing ? (
            <form
              className="flex flex-col gap-5 p-7"
              onSubmit={handleSaveEdit}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900">
                    Edit deck
                  </h2>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    Save to update the library; cancel leaves everything as it
                    was.
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
                  onClick={() => setEditing(null)}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <label className="block text-sm">
                <span className="font-medium text-zinc-700">Title</span>
                <input
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  required
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm shadow-inner focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-zinc-700">Description</span>
                <textarea
                  value={draftDescription}
                  onChange={(e) => setDraftDescription(e.target.value)}
                  rows={4}
                  className="mt-1.5 w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm shadow-inner focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={draftPublic}
                  onChange={(e) => setDraftPublic(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500/30"
                />
                Public deck
              </label>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  className="rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100"
                  onClick={() => setEditing(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
                >
                  Save changes
                </button>
              </div>
            </form>
          ) : null}
        </dialog>

        <dialog
          ref={deleteDialogRef}
          className="w-[min(100vw-2rem,26rem)] rounded-2xl border border-zinc-200 bg-white p-0 text-zinc-900 shadow-2xl ring-1 ring-zinc-950/10 backdrop:bg-zinc-900/40"
          onClose={() => setPendingDelete(null)}
        >
          {pendingDelete ? (
            <div className="flex flex-col gap-5 p-7">
              <h2 className="text-lg font-semibold text-zinc-900">
                Delete deck permanently?
              </h2>
              <p className="text-sm leading-relaxed text-zinc-600">
                This will permanently delete{" "}
                <span className="font-semibold text-zinc-900">
                  “{pendingDelete.title}”
                </span>{" "}
                and all of its cards. This action cannot be undone.
              </p>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  className="rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-50"
                  onClick={() => setPendingDelete(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="rounded-xl border-2 border-dashed border-rose-700 bg-rose-950 px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-lg transition hover:bg-rose-900"
                >
                  Yes, delete forever
                </button>
              </div>
            </div>
          ) : null}
        </dialog>
      </div>
    </div>
  );
}
