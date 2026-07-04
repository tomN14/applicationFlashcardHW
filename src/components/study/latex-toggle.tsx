"use client";

type LatexToggleProps = {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
  label?: string;
};

export function LatexToggle({
  enabled,
  onChange,
  disabled,
  label = "LaTeX",
}: LatexToggleProps) {
  return (
    <button
      type="button"
      aria-pressed={enabled}
      disabled={disabled}
      onClick={() => onChange(!enabled)}
      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition disabled:opacity-50 ${
        enabled
          ? "border-indigo-300 bg-indigo-100 text-indigo-800"
          : "border-zinc-200 bg-white text-zinc-500 hover:border-indigo-200 hover:text-indigo-700"
      }`}
    >
      {label} {enabled ? "on" : "off"}
    </button>
  );
}
