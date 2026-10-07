import { atom } from "jotai";
import type { PublicUser } from "@alumni/shared";
import { getUser } from "../services/userService";
import { sessionAtom } from "./sessionAtoms";

// The logged-in user's own record (name and photo for the header).
export interface Profile {
  status: "idle" | "loading" | "ready" | "error";
  user: PublicUser | null;
}

export const IDLE_PROFILE: Profile = { status: "idle", user: null };
const LOADING_PROFILE: Profile = { status: "loading", user: null };
const FAILED_PROFILE: Profile = { status: "error", user: null };

export const profileAtom = atom<Profile>(IDLE_PROFILE);

/**
 * Loads the profile of the session's user. It starts by showing nobody, so
 * one user's name is never shown to the next. An answer that arrives after
 * the session went to another user (or ended) is dropped. Never throws.
 */
export const loadProfileAtom = atom(null, async (get, set): Promise<void> => {
  const session = get(sessionAtom);
  if (session === null) {
    set(profileAtom, IDLE_PROFILE);
    return;
  }

  const { userId } = session;
  const isStillCurrent = (): boolean => get(sessionAtom)?.userId === userId;

  set(profileAtom, LOADING_PROFILE);
  try {
    const user = await getUser(userId);
    if (isStillCurrent()) {
      set(profileAtom, { status: "ready", user });
    }
  } catch {
    if (isStillCurrent()) {
      set(profileAtom, FAILED_PROFILE);
    }
  }
});
