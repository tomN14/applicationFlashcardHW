"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  applyColorScheme,
  deleteCustomColorScheme,
  saveCustomColorScheme,
  updateDateOfBirth,
} from "@/app/actions/profile";
import { AuthAlert } from "@/components/auth/auth-alert";
import { useTheme } from "@/components/theme/theme-provider";
import {
  BUILTIN_SCHEMES,
  customSchemeKey,
  type SavedColorScheme,
} from "@/lib/theme/color-schemes";
import { TrashIcon } from "@heroicons/react/16/solid";

type ProfileAppearanceSectionProps = {
  dateOfBirth: string | null;
  activeColorScheme: string;
  savedColorSchemes: SavedColorScheme[];
  disabled?: boolean;
};

function schemePreviewStyle(scheme: {
  background: string;
  foreground: string;
  accent: string;
}) {
  return {
    background: scheme.background,
    color: scheme.foreground,
    borderColor: scheme.foreground,
  } as const;
}

export function ProfileAppearanceSection({
  dateOfBirth: initialDateOfBirth,
  activeColorScheme: initialActive,
  savedColorSchemes: initialSaved,
  disabled = false,
}: ProfileAppearanceSectionProps) {
  const router = useRouter();
  const { setTheme } = useTheme();

  const [dateOfBirth, setDateOfBirth] = useState(initialDateOfBirth ?? "");
  const [activeColorScheme, setActiveColorScheme] = useState(initialActive);
  const [savedColorSchemes, setSavedColorSchemes] = useState(initialSaved);
  const [dobMessage, setDobMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const [schemeMessage, setSchemeMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const [customMessage, setCustomMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  const [customName, setCustomName] = useState("My theme");
  const [customBackground, setCustomBackground] = useState("#1e3a8a");
  const [customForeground, setCustomForeground] = useState("#ffffff");
  const [customAccent, setCustomAccent] = useState("#f59e0b");

  const [savingDob, startSaveDob] = useTransition();
  const [applyingScheme, startApplyScheme] = useTransition();
  const [savingCustom, startSaveCustom] = useTransition();
  const [deletingSchemeId, setDeletingSchemeId] = useState<string | null>(null);
  const [deletingScheme, startDeleteScheme] = useTransition();

  useEffect(() => {
    setDateOfBirth(initialDateOfBirth ?? "");
    setActiveColorScheme(initialActive);
    setSavedColorSchemes(initialSaved);
  }, [initialDateOfBirth, initialActive, initialSaved]);

  const busy =
    disabled ||
    savingDob ||
    applyingScheme ||
    savingCustom ||
    deletingScheme;

  const handleSaveDob = () => {
    setDobMessage(null);
    startSaveDob(async () => {
      const result = await updateDateOfBirth({
        dateOfBirth: dateOfBirth.trim() ? dateOfBirth.trim() : null,
      });
      if (!result.ok) {
        setDobMessage({ type: "error", text: result.error });
        return;
      }
      setDobMessage({ type: "success", text: "Date of birth saved." });
      router.refresh();
    });
  };

  const handleApplyScheme = (schemeId: string) => {
    setSchemeMessage(null);
    setActiveColorScheme(schemeId);
    setTheme(schemeId, savedColorSchemes);

    startApplyScheme(async () => {
      const result = await applyColorScheme({ activeColorScheme: schemeId });
      if (!result.ok) {
        setSchemeMessage({ type: "error", text: result.error });
        setActiveColorScheme(initialActive);
        setTheme(initialActive, initialSaved);
        return;
      }
      setSchemeMessage({ type: "success", text: "Color scheme applied." });
      router.refresh();
    });
  };

  const handleSaveCustom = (apply: boolean) => {
    setCustomMessage(null);
    startSaveCustom(async () => {
      const result = await saveCustomColorScheme({
        name: customName,
        background: customBackground,
        foreground: customForeground,
        accent: customAccent,
        apply,
      });

      if (!result.ok) {
        setCustomMessage({ type: "error", text: result.error });
        return;
      }

      const nextSaved = [...savedColorSchemes, result.scheme];
      setSavedColorSchemes(nextSaved);

      if (apply) {
        setActiveColorScheme(result.activeColorScheme);
        setTheme(result.activeColorScheme, nextSaved);
        setSchemeMessage({ type: "success", text: "Custom scheme saved and applied." });
      } else {
        setCustomMessage({
          type: "success",
          text: "Custom scheme saved. It is available below without changing your current theme.",
        });
      }

      router.refresh();
    });
  };

  const handleDeleteCustom = (scheme: SavedColorScheme) => {
    setSchemeMessage(null);
    setDeletingSchemeId(scheme.id);
    startDeleteScheme(async () => {
      const result = await deleteCustomColorScheme({ schemeId: scheme.id });
      setDeletingSchemeId(null);

      if (!result.ok) {
        setSchemeMessage({ type: "error", text: result.error });
        return;
      }

      setSavedColorSchemes(result.savedColorSchemes);
      setActiveColorScheme(result.activeColorScheme);
      setTheme(result.activeColorScheme, result.savedColorSchemes);
      setSchemeMessage({ type: "success", text: `"${scheme.name}" deleted.` });
      router.refresh();
    });
  };

  const builtinOptions = [
    {
      id: BUILTIN_SCHEMES.default.id,
      label: BUILTIN_SCHEMES.default.label,
      preview: BUILTIN_SCHEMES.default,
    },
    {
      id: BUILTIN_SCHEMES.dark.id,
      label: BUILTIN_SCHEMES.dark.label,
      preview: BUILTIN_SCHEMES.dark,
    },
  ];

  const customOptions = savedColorSchemes.map((scheme) => ({
    id: customSchemeKey(scheme.id),
    scheme,
    label: scheme.name,
    preview: scheme,
  }));

  return (
    <>
      <section className="rounded-3xl border border-[var(--app-surface-border)] bg-[var(--app-surface)] p-6 shadow-sm ring-1 ring-zinc-950/5 sm:p-8">
        <h2 className="text-base font-semibold text-[var(--app-foreground)]">
          Date of birth
        </h2>
        <p className="mt-1 text-sm text-[var(--app-muted)]">
          Pick a date from the calendar or type it in (YYYY-MM-DD).
        </p>

        <div className="mt-5 flex flex-wrap items-end gap-3">
          <label className="block min-w-[12rem] flex-1 text-sm">
            <span className="font-medium text-[var(--app-foreground)]">
              Birthday
            </span>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              disabled={busy}
              className="mt-1.5 w-full rounded-xl border border-[var(--app-surface-border)] bg-[var(--app-surface)] px-3 py-2.5 text-sm text-[var(--app-foreground)] shadow-inner focus:border-[var(--app-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)]/20 disabled:opacity-60"
            />
          </label>
          <button
            type="button"
            onClick={handleSaveDob}
            disabled={busy}
            className="rounded-xl bg-[var(--app-accent)] px-5 py-2.5 text-sm font-semibold text-[var(--app-surface)] shadow-sm transition hover:opacity-90 disabled:opacity-60"
          >
            {savingDob ? "Saving…" : "Save date"}
          </button>
        </div>

        {dobMessage ? (
          <div className="mt-4">
            <AuthAlert variant={dobMessage.type}>{dobMessage.text}</AuthAlert>
          </div>
        ) : null}
      </section>

      <section className="rounded-3xl border border-[var(--app-surface-border)] bg-[var(--app-surface)] p-6 shadow-sm ring-1 ring-zinc-950/5 sm:p-8">
        <h2 className="text-base font-semibold text-[var(--app-foreground)]">
          Color scheme
        </h2>
        <p className="mt-1 text-sm text-[var(--app-muted)]">
          Changes apply immediately after you save. Custom schemes can be saved
          without applying and stay available as options.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {builtinOptions.map((scheme) => {
            const selected = activeColorScheme === scheme.id;
            return (
              <button
                key={scheme.id}
                type="button"
                onClick={() => handleApplyScheme(scheme.id)}
                disabled={busy || applyingScheme}
                className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition disabled:opacity-60 ${
                  selected
                    ? "border-[var(--app-accent)] ring-2 ring-[var(--app-accent)]/25"
                    : "border-[var(--app-surface-border)] hover:border-[var(--app-accent)]/50"
                }`}
              >
                <div>
                  <p className="text-sm font-semibold text-[var(--app-foreground)]">
                    {scheme.label}
                  </p>
                  {selected ? (
                    <p className="text-xs text-[var(--app-muted)]">Active</p>
                  ) : (
                    <p className="text-xs text-[var(--app-muted)]">Tap to apply</p>
                  )}
                </div>
                <span
                  className="ml-3 inline-flex h-10 w-16 shrink-0 items-center justify-center rounded-lg border text-[10px] font-semibold"
                  style={schemePreviewStyle(scheme.preview)}
                >
                  Aa
                </span>
              </button>
            );
          })}

          {customOptions.map((scheme) => {
            const selected = activeColorScheme === scheme.id;
            const isDeleting = deletingSchemeId === scheme.scheme.id;
            return (
              <div
                key={scheme.id}
                className={`flex items-stretch overflow-hidden rounded-2xl border transition ${
                  selected
                    ? "border-[var(--app-accent)] ring-2 ring-[var(--app-accent)]/25"
                    : "border-[var(--app-surface-border)]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleApplyScheme(scheme.id)}
                  disabled={busy || applyingScheme}
                  className="flex min-w-0 flex-1 items-center justify-between px-4 py-3 text-left transition hover:bg-[var(--app-background)]/40 disabled:opacity-60"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--app-foreground)]">
                      {scheme.label}
                    </p>
                    {selected ? (
                      <p className="text-xs text-[var(--app-muted)]">Active</p>
                    ) : (
                      <p className="text-xs text-[var(--app-muted)]">Tap to apply</p>
                    )}
                  </div>
                  <span
                    className="ml-3 inline-flex h-10 w-16 shrink-0 items-center justify-center rounded-lg border text-[10px] font-semibold"
                    style={schemePreviewStyle(scheme.preview)}
                  >
                    Aa
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteCustom(scheme.scheme)}
                  disabled={busy}
                  aria-label={`Delete ${scheme.label}`}
                  className="flex shrink-0 items-center justify-center border-l border-[var(--app-surface-border)] px-3 text-[var(--app-muted)] transition hover:bg-rose-50 hover:text-rose-700 disabled:opacity-60"
                >
                  <TrashIcon className="size-4" />
                  <span className="sr-only">
                    {isDeleting ? "Deleting…" : "Delete"}
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        {schemeMessage ? (
          <div className="mt-4">
            <AuthAlert variant={schemeMessage.type}>{schemeMessage.text}</AuthAlert>
          </div>
        ) : null}

        <div className="mt-8 border-t border-[var(--app-surface-border)] pt-6">
          <h3 className="text-sm font-semibold text-[var(--app-foreground)]">
            Create a custom scheme
          </h3>
          <p className="mt-1 text-sm text-[var(--app-muted)]">
            Save it for later, or save and apply right away.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm sm:col-span-2">
              <span className="font-medium text-[var(--app-foreground)]">Name</span>
              <input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                disabled={busy}
                maxLength={32}
                className="mt-1.5 w-full rounded-xl border border-[var(--app-surface-border)] bg-[var(--app-surface)] px-3 py-2.5 text-sm text-[var(--app-foreground)] shadow-inner focus:border-[var(--app-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)]/20 disabled:opacity-60"
              />
            </label>

            {[
              ["Background", customBackground, setCustomBackground],
              ["Text", customForeground, setCustomForeground],
              ["Accent", customAccent, setCustomAccent],
            ].map(([label, value, setter]) => (
              <label key={label as string} className="block text-sm">
                <span className="font-medium text-[var(--app-foreground)]">
                  {label as string}
                </span>
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    type="color"
                    value={value as string}
                    onChange={(e) => (setter as (v: string) => void)(e.target.value)}
                    disabled={busy}
                    className="h-11 w-14 cursor-pointer rounded-lg border border-[var(--app-surface-border)] bg-transparent p-1 disabled:opacity-60"
                  />
                  <input
                    value={value as string}
                    onChange={(e) => (setter as (v: string) => void)(e.target.value)}
                    disabled={busy}
                    className="min-w-0 flex-1 rounded-xl border border-[var(--app-surface-border)] bg-[var(--app-surface)] px-3 py-2.5 text-sm text-[var(--app-foreground)] shadow-inner focus:border-[var(--app-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)]/20 disabled:opacity-60"
                  />
                </div>
              </label>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleSaveCustom(false)}
              disabled={busy}
              className="rounded-xl border border-[var(--app-surface-border)] bg-[var(--app-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--app-foreground)] shadow-sm transition hover:opacity-90 disabled:opacity-60"
            >
              {savingCustom ? "Saving…" : "Save without applying"}
            </button>
            <button
              type="button"
              onClick={() => handleSaveCustom(true)}
              disabled={busy}
              className="rounded-xl bg-[var(--app-accent)] px-4 py-2.5 text-sm font-semibold text-[var(--app-surface)] shadow-sm transition hover:opacity-90 disabled:opacity-60"
            >
              {savingCustom ? "Saving…" : "Save and apply"}
            </button>
          </div>

          {customMessage ? (
            <div className="mt-4">
              <AuthAlert variant={customMessage.type}>{customMessage.text}</AuthAlert>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
