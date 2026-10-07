// localStorage that never throws. The browser can refuse storage (private
// mode, a full disk, a setting), and the app must still run without it.
// localStorage is touched only inside these functions, never at import.

/** The stored text, or null when there is none or storage cannot be read. */
export function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Saves the text. A refused write is ignored. */
export function writeStored(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Nothing to do: the value lives in memory for this visit only.
  }
}

/** Removes the key. A refused removal is ignored. */
export function removeStored(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Nothing to do.
  }
}
