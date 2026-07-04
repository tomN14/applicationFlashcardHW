"use client";

import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  defaultDropAnimationSideEffects,
  type DropAnimation,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "motion/react";
import { useState } from "react";
import { CardFieldEditor } from "@/components/deck/card-field-editor";
import type { CardRow } from "@/types/deck";

const dropAnimation: DropAnimation = {
  duration: 220,
  easing: "cubic-bezier(0.25, 1, 0.35, 1)",
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: "0.4" } },
  }),
};

const sortTransition = {
  duration: 260,
  easing: "cubic-bezier(0.25, 1, 0.35, 1)",
} as const;

function GripIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <circle cx="9" cy="7" r="1.35" />
      <circle cx="15" cy="7" r="1.35" />
      <circle cx="9" cy="12" r="1.35" />
      <circle cx="15" cy="12" r="1.35" />
      <circle cx="9" cy="17" r="1.35" />
      <circle cx="15" cy="17" r="1.35" />
    </svg>
  );
}

function SortableManageRow({
  card,
  index,
  isEditing,
  editFront,
  editBack,
  editFrontLatex,
  editBackLatex,
  disabled,
  onStartEdit,
  onCancelEdit,
  onSaveCard,
  onRemoveCard,
  setEditFront,
  setEditBack,
  setEditFrontLatex,
  setEditBackLatex,
}: {
  card: CardRow;
  index: number;
  isEditing: boolean;
  editFront: string;
  editBack: string;
  editFrontLatex: boolean;
  editBackLatex: boolean;
  disabled: boolean;
  onStartEdit: (c: CardRow) => void;
  onCancelEdit: () => void;
  onSaveCard: (id: string) => void;
  onRemoveCard: (id: string) => void;
  setEditFront: (v: string) => void;
  setEditBack: (v: string) => void;
  setEditFrontLatex: (v: boolean) => void;
  setEditBackLatex: (v: boolean) => void;
}) {
  const dragDisabled = disabled || isEditing;
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id, disabled: dragDisabled, transition: sortTransition });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li ref={setNodeRef} style={style} className="relative list-none">
      <motion.div
        initial={false}
        animate={{ scale: isDragging ? 1.01 : 1 }}
        transition={{ type: "spring", stiffness: 480, damping: 36 }}
        className={`rounded-xl border border-zinc-200 bg-zinc-50/40 p-4 ring-1 ring-zinc-950/5 ${
          isDragging ? "z-10 shadow-lg ring-indigo-300/60" : ""
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-200/80 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              ref={setActivatorNodeRef}
              {...attributes}
              {...listeners}
              disabled={dragDisabled}
              className="touch-none rounded-lg border border-zinc-200 bg-white p-2 text-zinc-500 transition hover:border-indigo-200 hover:bg-indigo-50/80 hover:text-indigo-700 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Drag to reorder"
              title="Drag to reorder"
            >
              <GripIcon />
            </button>
            <span className="font-mono text-xs font-semibold tabular-nums text-zinc-500">
              #{index + 1}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => onSaveCard(card.id)}
                  disabled={disabled}
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {disabled ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={onCancelEdit}
                  disabled={disabled}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => onStartEdit(card)}
                disabled={disabled}
                className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-900 hover:bg-indigo-100 disabled:opacity-50"
              >
                Edit
              </button>
            )}
            <button
              type="button"
              onClick={() => onRemoveCard(card.id)}
              disabled={disabled}
              className="rounded-lg border-2 border-dashed border-rose-500 bg-rose-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-rose-900 hover:bg-rose-100 disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <CardFieldEditor
            label="Front"
            value={isEditing ? editFront : card.front}
            latexEnabled={isEditing ? editFrontLatex : card.front_latex}
            isEditing={isEditing}
            disabled={disabled}
            onValueChange={setEditFront}
            onLatexChange={setEditFrontLatex}
          />
          <CardFieldEditor
            label="Back"
            value={isEditing ? editBack : card.back}
            latexEnabled={isEditing ? editBackLatex : card.back_latex}
            isEditing={isEditing}
            disabled={disabled}
            onValueChange={setEditBack}
            onLatexChange={setEditBackLatex}
          />
        </div>
      </motion.div>
    </li>
  );
}

function OverlayPreview({ card, index }: { card: CardRow; index: number }) {
  return (
    <motion.div
      initial={{ scale: 0.98, rotate: -0.5 }}
      animate={{ scale: 1.02, rotate: 0 }}
      transition={{ type: "spring", stiffness: 420, damping: 32 }}
      className="max-w-xl cursor-grabbing rounded-xl border-2 border-indigo-400 bg-white p-4 shadow-2xl ring-4 ring-indigo-500/15"
    >
      <p className="text-[10px] font-semibold uppercase text-zinc-500">
        #{index + 1}
      </p>
      <p className="mt-2 line-clamp-2 text-sm font-medium text-zinc-900">
        {card.front}
      </p>
      <p className="mt-1 line-clamp-2 text-xs text-zinc-600">{card.back}</p>
    </motion.div>
  );
}

type DeckManageSortableListProps = {
  orderedCards: CardRow[];
  editingId: string | null;
  editFront: string;
  editBack: string;
  editFrontLatex: boolean;
  editBackLatex: boolean;
  disabled: boolean;
  onReorder: (nextOrderedIds: string[]) => void;
  onStartEdit: (c: CardRow) => void;
  onCancelEdit: () => void;
  onSaveCard: (id: string) => void;
  onRemoveCard: (id: string) => void;
  setEditFront: (v: string) => void;
  setEditBack: (v: string) => void;
  setEditFrontLatex: (v: boolean) => void;
  setEditBackLatex: (v: boolean) => void;
};

export function DeckManageSortableList({
  orderedCards,
  editingId,
  editFront,
  editBack,
  editFrontLatex,
  editBackLatex,
  disabled,
  onReorder,
  onStartEdit,
  onCancelEdit,
  onSaveCard,
  onRemoveCard,
  setEditFront,
  setEditBack,
  setEditFrontLatex,
  setEditBackLatex,
}: DeckManageSortableListProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const activeIndex = activeId
    ? orderedCards.findIndex((c) => c.id === activeId)
    : -1;
  const activeCard = activeIndex >= 0 ? orderedCards[activeIndex] : null;

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    const oldIndex = orderedCards.findIndex((c) => c.id === active.id);
    const newIndex = orderedCards.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) {
      return;
    }
    const next = arrayMove(orderedCards, oldIndex, newIndex);
    onReorder(next.map((c) => c.id));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(e) => setActiveId(String(e.active.id))}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <SortableContext
        items={orderedCards.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="mt-6 flex flex-col gap-4 p-0">
          {orderedCards.map((c, index) => (
            <SortableManageRow
              key={c.id}
              card={c}
              index={index}
              isEditing={editingId === c.id}
              editFront={editFront}
              editBack={editBack}
              editFrontLatex={editFrontLatex}
              editBackLatex={editBackLatex}
              disabled={disabled}
              onStartEdit={onStartEdit}
              onCancelEdit={onCancelEdit}
              onSaveCard={onSaveCard}
              onRemoveCard={onRemoveCard}
              setEditFront={setEditFront}
              setEditBack={setEditBack}
              setEditFrontLatex={setEditFrontLatex}
              setEditBackLatex={setEditBackLatex}
            />
          ))}
        </ul>
      </SortableContext>
      <DragOverlay dropAnimation={dropAnimation}>
        {activeCard && activeIndex >= 0 ? (
          <OverlayPreview card={activeCard} index={activeIndex} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
