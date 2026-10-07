import { atom } from "jotai";
import { THEME_STORAGE_KEY } from "../config/storageKeys";
import { readStored, writeStored } from "../lib/browserStorage";
import { appStore } from "./appStore";

export type ThemeChoice = "light" | "dark" | "system";

type AppliedTheme = "light" | "dark";

const SYSTEM_DARK_QUERY = "(prefers-color-scheme: dark)";

/** Anything other than the three choices counts as system (also nothing saved). */
function toThemeChoice(stored: string | null): ThemeChoice {
  return stored === "light" || stored === "dark" || stored === "system"
    ? stored
    : "system";
}

/** The system's own answer. Light when the browser cannot say. */
function systemTheme(): AppliedTheme {
  try {
    return window.matchMedia(SYSTEM_DARK_QUERY).matches ? "dark" : "light";
  } catch {
    return "light";
  }
}

/**
 * Sets data-theme on <html> to light or dark. tokens.css does the rest;
 * no component reads the theme. The script in index.html does the same
 * before the first paint, so the two must agree.
 */
export function applyTheme(choice: ThemeChoice): void {
  document.documentElement.dataset.theme =
    choice === "system" ? systemTheme() : choice;
}

const storedChoiceAtom = atom<ThemeChoice>(
  toThemeChoice(readStored(THEME_STORAGE_KEY)),
);

/**
 * The theme choice (ADR-14). Setting it saves it (system is saved as
 * "system") and applies it at once.
 */
export const themeChoiceAtom = atom(
  (get) => get(storedChoiceAtom),
  (_get, set, choice: ThemeChoice) => {
    set(storedChoiceAtom, choice);
    writeStored(THEME_STORAGE_KEY, choice);
    applyTheme(choice);
  },
);

function followSystem(): void {
  if (appStore.get(storedChoiceAtom) === "system") {
    applyTheme("system");
  }
}

// Takes over a choice made in another tab. It does not write storage again,
// so two tabs cannot keep answering each other.
function followOtherTabs(event: StorageEvent): void {
  // A null key means the whole storage was cleared.
  if (event.key !== THEME_STORAGE_KEY && event.key !== null) {
    return;
  }
  const choice = toThemeChoice(event.key === null ? null : event.newValue);
  appStore.set(storedChoiceAtom, choice);
  applyTheme(choice);
}

// The listeners, added once, when this module is first loaded. Every page has
// a ThemeSwitch, which imports this file, so no start-up call is needed.
function startThemeSync(): () => void {
  applyTheme(appStore.get(storedChoiceAtom));

  let systemQuery: MediaQueryList | null = null;
  try {
    systemQuery = window.matchMedia(SYSTEM_DARK_QUERY);
    systemQuery.addEventListener("change", followSystem);
  } catch {
    // A browser that cannot tell: the page stays as it was applied.
    systemQuery = null;
  }
  window.addEventListener("storage", followOtherTabs);

  return () => {
    systemQuery?.removeEventListener("change", followSystem);
    window.removeEventListener("storage", followOtherTabs);
  };
}

const stopThemeSync = startThemeSync();

// Development only: when this file is hot-reloaded, the old listeners go.
if (import.meta.hot) {
  import.meta.hot.dispose(stopThemeSync);
}
