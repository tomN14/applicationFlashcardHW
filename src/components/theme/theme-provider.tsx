"use client";

import {
  applyColorSchemeToDocument,
  resolveColorScheme,
  type SavedColorScheme,
} from "@/lib/theme/color-schemes";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ThemeContextValue = {
  activeColorScheme: string;
  savedColorSchemes: SavedColorScheme[];
  setTheme: (
    activeColorScheme: string,
    savedColorSchemes?: SavedColorScheme[],
  ) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

type ThemeProviderProps = {
  activeColorScheme: string;
  savedColorSchemes: SavedColorScheme[];
  children: ReactNode;
};

export function ThemeProvider({
  activeColorScheme: initialActive,
  savedColorSchemes: initialSaved,
  children,
}: ThemeProviderProps) {
  const [activeColorScheme, setActiveColorScheme] = useState(initialActive);
  const [savedColorSchemes, setSavedColorSchemes] = useState(initialSaved);

  useEffect(() => {
    setActiveColorScheme(initialActive);
    setSavedColorSchemes(initialSaved);
  }, [initialActive, initialSaved]);

  useEffect(() => {
    const resolved = resolveColorScheme(activeColorScheme, savedColorSchemes);
    applyColorSchemeToDocument(resolved);
  }, [activeColorScheme, savedColorSchemes]);

  const setTheme = useCallback(
    (nextActive: string, nextSaved?: SavedColorScheme[]) => {
      setActiveColorScheme(nextActive);
      if (nextSaved) {
        setSavedColorSchemes(nextSaved);
      }
      const saved = nextSaved ?? savedColorSchemes;
      applyColorSchemeToDocument(resolveColorScheme(nextActive, saved));
    },
    [savedColorSchemes],
  );

  const value = useMemo(
    () => ({
      activeColorScheme,
      savedColorSchemes,
      setTheme,
    }),
    [activeColorScheme, savedColorSchemes, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
