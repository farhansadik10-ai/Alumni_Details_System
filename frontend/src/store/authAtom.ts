import { atom } from "jotai";
import { toCurrentUser } from "../utils/jwt";

// localStorage key for the JWT; also read by services/apiClient.ts for the Bearer header.
export const TOKEN_STORAGE_KEY = "token";

export const tokenAtom = atom<string | null>(
  localStorage.getItem(TOKEN_STORAGE_KEY)
);

export const isLoggedInAtom = atom((get) => {
  return get(tokenAtom) !== null;
});

// Decoded token (id, role, expiresAt), or null when there is no valid token.
// Expiry depends on the clock, so check it with isExpired() from utils/jwt (useCurrentUser does).
export const currentUserAtom = atom((get) => toCurrentUser(get(tokenAtom)));
