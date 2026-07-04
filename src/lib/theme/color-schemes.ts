export type SavedColorScheme = {
  id: string;
  name: string;
  background: string;
  foreground: string;
  accent: string;
};

export type ResolvedColorScheme = {
  id: string;
  label: string;
  background: string;
  foreground: string;
  surface: string;
  surfaceBorder: string;
  accent: string;
  muted: string;
  sidebarUserBg: string;
  sidebarUserText: string;
};

export const BUILTIN_SCHEMES = {
  default: {
    id: "default",
    label: "Default",
    background: "#f4f4f5",
    foreground: "#18181b",
    surface: "#ffffff",
    surfaceBorder: "#e4e4e7",
    accent: "#4f46e5",
    muted: "#71717a",
    sidebarUserBg: "#18181b",
    sidebarUserText: "#ffffff",
  },
  dark: {
    id: "dark",
    label: "White on black",
    background: "#000000",
    foreground: "#ffffff",
    surface: "#0a0a0a",
    surfaceBorder: "#262626",
    accent: "#ffffff",
    muted: "#a3a3a3",
    sidebarUserBg: "#ffffff",
    sidebarUserText: "#000000",
  },
} as const satisfies Record<string, ResolvedColorScheme>;

export type BuiltinSchemeId = keyof typeof BUILTIN_SCHEMES;

/** Legacy `light` matched default; normalize stored values. */
export function normalizeActiveColorScheme(active: string | null | undefined): string {
  const trimmed = typeof active === "string" ? active.trim() : "";
  if (!trimmed || trimmed === "light") {
    return "default";
  }
  return trimmed;
}

export function isBuiltinSchemeId(id: string): id is BuiltinSchemeId {
  return id in BUILTIN_SCHEMES;
}

export function customSchemeKey(id: string): string {
  return `custom:${id}`;
}

export function parseActiveSchemeId(active: string): {
  type: "builtin" | "custom";
  id: string;
} {
  if (active.startsWith("custom:")) {
    return { type: "custom", id: active.slice("custom:".length) };
  }
  return { type: "builtin", id: active };
}

export function savedSchemeToResolved(scheme: SavedColorScheme): ResolvedColorScheme {
  return {
    id: customSchemeKey(scheme.id),
    label: scheme.name,
    background: scheme.background,
    foreground: scheme.foreground,
    surface: scheme.background,
    surfaceBorder: mixHex(scheme.foreground, scheme.background, 0.82),
    accent: scheme.accent,
    muted: mixHex(scheme.foreground, scheme.background, 0.45),
    sidebarUserBg: scheme.foreground,
    sidebarUserText: scheme.background,
  };
}

export function resolveColorScheme(
  activeColorScheme: string,
  savedColorSchemes: SavedColorScheme[],
): ResolvedColorScheme {
  const active = normalizeActiveColorScheme(activeColorScheme);
  const parsed = parseActiveSchemeId(active);

  if (parsed.type === "builtin" && isBuiltinSchemeId(parsed.id)) {
    return BUILTIN_SCHEMES[parsed.id];
  }

  const custom = savedColorSchemes.find((s) => s.id === parsed.id);
  if (custom) {
    return savedSchemeToResolved(custom);
  }

  return BUILTIN_SCHEMES.default;
}

export function applyColorSchemeToDocument(scheme: ResolvedColorScheme): void {
  const root = document.documentElement;
  root.dataset.theme = scheme.id;
  root.style.setProperty("--app-background", scheme.background);
  root.style.setProperty("--app-foreground", scheme.foreground);
  root.style.setProperty("--app-surface", scheme.surface);
  root.style.setProperty("--app-surface-border", scheme.surfaceBorder);
  root.style.setProperty("--app-accent", scheme.accent);
  root.style.setProperty("--app-muted", scheme.muted);
  root.style.setProperty("--app-sidebar-user-bg", scheme.sidebarUserBg);
  root.style.setProperty("--app-sidebar-user-text", scheme.sidebarUserText);
}

function mixHex(a: string, b: string, weight: number): string {
  const parse = (hex: string) => {
    const clean = hex.replace("#", "");
    const full =
      clean.length === 3
        ? clean
            .split("")
            .map((c) => c + c)
            .join("")
        : clean.slice(0, 6);
    return [
      Number.parseInt(full.slice(0, 2), 16),
      Number.parseInt(full.slice(2, 4), 16),
      Number.parseInt(full.slice(4, 6), 16),
    ] as const;
  };

  try {
    const [r1, g1, b1] = parse(a);
    const [r2, g2, b2] = parse(b);
    const mix = (x: number, y: number) =>
      Math.round(x * weight + y * (1 - weight));
    const toHex = (n: number) => n.toString(16).padStart(2, "0");
    return `#${toHex(mix(r1, r2))}${toHex(mix(g1, g2))}${toHex(mix(b1, b2))}`;
  } catch {
    return b;
  }
}

export function normalizeHexColor(value: string): string | null {
  const trimmed = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    const hex = trimmed.slice(1);
    return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`.toLowerCase();
  }
  return null;
}

export function parseSavedColorSchemes(raw: unknown): SavedColorScheme[] {
  if (!Array.isArray(raw)) return [];

  return raw.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const id = typeof row.id === "string" ? row.id : "";
    const name = typeof row.name === "string" ? row.name.trim() : "";
    const background = normalizeHexColor(
      typeof row.background === "string" ? row.background : "",
    );
    const foreground = normalizeHexColor(
      typeof row.foreground === "string" ? row.foreground : "",
    );
    const accent = normalizeHexColor(
      typeof row.accent === "string" ? row.accent : "",
    );

    if (!id || !name || !background || !foreground || !accent) {
      return [];
    }

    return [{ id, name, background, foreground, accent }];
  });
}
