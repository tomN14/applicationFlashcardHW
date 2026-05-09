"use client";

import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
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
import type { ReactNode } from "react";
import { useState } from "react";

export type SortableCardItem = { id: string; front: string; back: string };

const dropAnimation: DropAnimation = {
  duration: 240,
  easing: "cubic-bezier(0.25, 1, 0.35, 1)",
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: { opacity: "0.35" },
    },
  }),
};

const sortTransition = {
  duration: 280,
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

function CardChrome({
  index,
  children,
  toolbar,
}: {
  index: number;
  children: ReactNode;
  toolbar: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm ring-1 ring-zinc-950/5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Card {index + 1}
        </span>
        {toolbar}
      </div>
      {children}
    </div>
  );
}

function SortableCardRow({
  card,
  index,
  onUpdate,
  onRemove,
  disabled,
}: {
  card: SortableCardItem;
  index: number;
  onUpdate: (id: string, field: "front" | "back", value: string) => void;
  onRemove: (id: string) => void;
  disabled: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id, disabled, transition: sortTransition });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li ref={setNodeRef} style={style} className="relative list-none">
      <motion.div
        initial={false}
        animate={{
          scale: isDragging ? 1.008 : 1,
        }}
        transition={{ type: "spring", stiffness: 480, damping: 36 }}
      >
        <CardChrome
          index={index}
          toolbar={
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                ref={setActivatorNodeRef}
                {...attributes}
                {...listeners}
                disabled={disabled}
                className="touch-none rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-zinc-500 transition hover:border-indigo-200 hover:bg-indigo-50/80 hover:text-indigo-700 active:cursor-grabbing disabled:opacity-40"
                aria-label="Drag to reorder"
                title="Drag to reorder"
              >
                <GripIcon />
              </button>
              <button
                type="button"
                onClick={() => onRemove(card.id)}
                disabled={disabled}
                className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-medium text-rose-800 hover:bg-rose-100 disabled:opacity-40"
              >
                Remove
              </button>
            </div>
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs">
              <span className="font-medium text-zinc-600">Front</span>
              <textarea
                value={card.front}
                onChange={(e) => onUpdate(card.id, "front", e.target.value)}
                rows={3}
                disabled={disabled}
                className="mt-1 w-full resize-y rounded-lg border border-zinc-200 bg-zinc-50/80 px-2.5 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 disabled:opacity-50"
              />
            </label>
            <label className="block text-xs">
              <span className="font-medium text-zinc-600">Back</span>
              <textarea
                value={card.back}
                onChange={(e) => onUpdate(card.id, "back", e.target.value)}
                rows={3}
                disabled={disabled}
                className="mt-1 w-full resize-y rounded-lg border border-zinc-200 bg-zinc-50/80 px-2.5 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 disabled:opacity-50"
              />
            </label>
          </div>
        </CardChrome>
      </motion.div>
    </li>
  );
}

function DragOverlayCard({ card, index }: { card: SortableCardItem; index: number }) {
  return (
    <motion.div
      initial={{ scale: 0.98, opacity: 0.92 }}
      animate={{
        scale: 1.03,
        opacity: 1,
        boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.22)",
      }}
      transition={{ type: "spring", stiffness: 440, damping: 32, mass: 0.85 }}
      className="max-w-3xl cursor-grabbing rounded-2xl ring-2 ring-indigo-400/90 ring-offset-2 ring-offset-zinc-100"
    >
      <CardChrome
        index={index}
        toolbar={
          <span className="rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-indigo-800">
            Moving…
          </span>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-zinc-100 bg-zinc-50/90 px-2.5 py-2 text-sm text-zinc-800">
            <p className="text-[10px] font-semibold uppercase text-zinc-500">Front</p>
            <p className="mt-1 line-clamp-4 whitespace-pre-wrap">{card.front || "—"}</p>
          </div>
          <div className="rounded-lg border border-zinc-100 bg-zinc-50/90 px-2.5 py-2 text-sm text-zinc-800">
            <p className="text-[10px] font-semibold uppercase text-zinc-500">Back</p>
            <p className="mt-1 line-clamp-4 whitespace-pre-wrap">{card.back || "—"}</p>
          </div>
        </div>
      </CardChrome>
    </motion.div>
  );
}

type DeckCardsSortableProps = {
  cards: SortableCardItem[];
  onReorder: (cards: SortableCardItem[]) => void;
  onUpdateCard: (id: string, field: "front" | "back", value: string) => void;
  onRemoveCard: (id: string) => void;
  disabled?: boolean;
};

export function DeckCardsSortable({
  cards,
  onReorder,
  onUpdateCard,
  onRemoveCard,
  disabled = false,
}: DeckCardsSortableProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const activeIndex = activeId
    ? cards.findIndex((c) => c.id === activeId)
    : -1;
  const activeCard = activeIndex >= 0 ? cards[activeIndex] : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) {
      return;
    }
    const oldIndex = cards.findIndex((c) => c.id === active.id);
    const newIndex = cards.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) {
      return;
    }
    onReorder(arrayMove(cards, oldIndex, newIndex));
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext
        items={cards.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <ol className="flex flex-col gap-4 p-0">
          {cards.map((card, index) => (
            <SortableCardRow
              key={card.id}
              card={card}
              index={index}
              onUpdate={onUpdateCard}
              onRemove={onRemoveCard}
              disabled={disabled}
            />
          ))}
        </ol>
      </SortableContext>
      <DragOverlay dropAnimation={dropAnimation}>
        {activeCard && activeIndex >= 0 ? (
          <DragOverlayCard card={activeCard} index={activeIndex} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
