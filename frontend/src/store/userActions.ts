import { atom } from "jotai";
import type { Getter } from "jotai";
import { isGone } from "../lib/writeFailure";
import { toApiFailure } from "../services/apiError";
import type { ApiFailure } from "../services/apiError";
import { deleteUser } from "../services/userService";
import { sessionAtom } from "./sessionAtoms";
import { currentUsersVisit, removeUserLocallyAtom } from "./usersAtoms";

// The one write of the Users page: delete a user (admin only). It returns a
// result and never throws; it shows no toast and moves no focus (pattern 7).
// After the server answers, the list is patched, not reloaded, and only when
// it is still safe: the same user, the same visit of the page (no clear or
// reset since), and the list `ready` and holding the row (L-REQ-fs-006-2).
// A late answer patches nothing and still returns its result.
//
// A 404 still returns the failure, and also removes the row here, so the page
// can say "already gone". A 409 (the user still owns content) and any other
// failure patch nothing.

// Pages read failures from here, never from services/ (pattern 1).
export type { ApiFailure } from "../services/apiError";

export type UserWriteResult = { ok: true } | { ok: false; failure: ApiFailure };

// Nothing to write as: no session. The page is not shown then, so no status
// is worth reporting: "network".
const NOT_READY: ApiFailure = { kind: "network" };

/**
 * Remembers who writes and in which visit of the Users page. The answer may
 * patch the list only while `isCurrent()` is true. Null when nobody is logged in.
 */
function startWrite(get: Getter): { isCurrent: () => boolean } | null {
  const session = get(sessionAtom);
  if (session === null) {
    return null;
  }
  const { userId } = session;
  const visit = currentUsersVisit();
  return {
    isCurrent: () =>
      get(sessionAtom)?.userId === userId && currentUsersVisit() === visit,
  };
}

/** Deletes a user. Does not reload the list: the page decides what comes next. */
export const deleteUserAtom = atom(
  null,
  async (get, set, id: number): Promise<UserWriteResult> => {
    const scope = startWrite(get);
    if (scope === null) {
      return { ok: false, failure: NOT_READY };
    }
    let failure: ApiFailure | null = null;
    try {
      await deleteUser(id);
    } catch (error) {
      failure = toApiFailure(error);
    }
    const gone = failure === null || isGone(failure);
    if (gone && scope.isCurrent()) {
      set(removeUserLocallyAtom, id);
    }
    return failure === null ? { ok: true } : { ok: false, failure };
  },
);
