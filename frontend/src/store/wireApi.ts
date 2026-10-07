import { TOKEN_STORAGE_KEY } from "../config/storageKeys";
import { isLiveSession, readToken } from "../lib/token";
import { configureApiClient } from "../services/apiClient";
import { appStore } from "./appStore";
import { endSessionAtom, tokenChangedElsewhereAtom } from "./sessionActions";
import { tokenAtom } from "./sessionAtoms";

let wired = false;

function endStoredSessionIfDead(): void {
  const token = appStore.get(tokenAtom);
  if (token === null) {
    return;
  }
  const session = readToken(token);
  if (!isLiveSession(session, Date.now())) {
    appStore.set(endSessionAtom);
  }
}

function followOtherTabs(event: StorageEvent): void {
  // A null key means the whole storage was cleared.
  if (event.key === TOKEN_STORAGE_KEY) {
    appStore.set(tokenChangedElsewhereAtom, event.newValue);
  } else if (event.key === null) {
    appStore.set(tokenChangedElsewhereAtom, null);
  }
}

/**
 * Connects the store to the API client. main.tsx calls it once, before the
 * first render, so a stored token that is expired or unreadable is ended
 * before any page shows.
 */
export function wireApi(): void {
  if (wired) {
    return;
  }
  wired = true;

  configureApiClient({
    getToken: () => appStore.get(tokenAtom),
    onUnauthorized: () => appStore.set(endSessionAtom),
  });
  endStoredSessionIfDead();
  window.addEventListener("storage", followOtherTabs);
}
