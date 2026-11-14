import { atom } from "jotai";
import { TOKEN_STORAGE_KEY } from "../config/storageKeys";
import { readStored, removeStored, writeStored } from "../lib/browserStorage";
import { readToken } from "../lib/token";
import type { Session } from "../lib/token";

// Why the user is on the log-in page, when the app sent them there.
export type AuthNotice = null | "sessionEnded" | "loggedOut";

const storedTokenAtom = atom<string | null>(readStored(TOKEN_STORAGE_KEY));

/**
 * The login token, kept in step with the browser's storage (ADR-14).
 * Only the actions in sessionActions.ts write it.
 */
export const tokenAtom = atom(
  (get) => get(storedTokenAtom),
  (_get, set, token: string | null) => {
    set(storedTokenAtom, token);
    if (token === null) {
      removeStored(TOKEN_STORAGE_KEY);
    } else {
      writeStored(TOKEN_STORAGE_KEY, token);
    }
  },
);

/**
 * Takes over a token another tab already wrote to storage. It does not write
 * storage again, so two tabs cannot keep answering each other.
 */
export const adoptStoredTokenAtom = atom(
  null,
  (_get, set, token: string | null) => {
    set(storedTokenAtom, token);
  },
);

/**
 * Who is logged in, read from the token, or null. A token that cannot be read
 * gives null. Expiry is not judged here, because an atom has no clock: the
 * start-up check and the RequireAuth guard call isExpired.
 */
export const sessionAtom = atom<Session | null>((get) => {
  const token = get(tokenAtom);
  return token === null ? null : readToken(token);
});

export const authNoticeAtom = atom<AuthNotice>(null);
