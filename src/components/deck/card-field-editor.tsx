"use client";

import { CardTextWithLatex } from "@/components/study/card-text-with-latex";
import { LatexToggle } from "@/components/study/latex-toggle";

type CardFieldEditorProps = {
  label: string;
  value: string;
  latexEnabled: boolean;
  isEditing: boolean;
  disabled?: boolean;
  onValueChange: (value: string) => void;
  onLatexChange: (enabled: boolean) => void;
};

export function CardFieldEditor({
  label,
  value,
  latexEnabled,
  isEditing,
  disabled,
  onValueChange,
  onLatexChange,
}: CardFieldEditorProps) {
  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
          {label}
        </p>
        {isEditing ? (
          <LatexToggle
            enabled={latexEnabled}
            onChange={onLatexChange}
            disabled={disabled}
          />
        ) : latexEnabled ? (
          <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700">
            LaTeX
          </span>
        ) : null}
      </div>
      {isEditing ? (
        <>
          <textarea
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            rows={3}
            disabled={disabled}
            placeholder={
              label === "Front"
                ? "Question — use $x+1$ when LaTeX is on"
                : "Answer — use $x+1$ when LaTeX is on"
            }
            className="w-full resize-y rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-sm disabled:opacity-60"
          />
          {latexEnabled ? (
            <div className="mt-2 rounded-lg border border-indigo-100 bg-indigo-50/40 px-3 py-2">
              <p className="text-[10px] font-medium uppercase tracking-wide text-indigo-600">
                Preview
              </p>
              <CardTextWithLatex
                text={value || "—"}
                latexEnabled
                className="mt-1 text-sm text-zinc-800"
              />
            </div>
          ) : null}
        </>
      ) : (
        <CardTextWithLatex
          text={value || "—"}
          latexEnabled={latexEnabled}
          className="text-sm leading-relaxed text-zinc-800"
        />
      )}
    </div>
  );
}
