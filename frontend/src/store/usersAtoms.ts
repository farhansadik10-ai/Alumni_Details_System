import { atom } from "jotai";
import type { PublicUser } from "@alumni/shared";
import { isCancelled, toApiFailure } from "../services/apiError";
import type { ApiFailure } from "../services/apiError";
import { listUsers } from "../services/userService";
import type { UserListParams } from "../services/userService";
import { createLatestRequest } from "./latestRequest";

// The Users page's list (admin only). The loader is a write-only atom that
// never throws, with its own `latestRequest` (pattern 23): an older call never
// overwrites a newer one, and a cancelled call changes nothing and shows no
// error. The delete is in userActions.ts.

// Pages read failures from here, never from services/ (pattern 1).
export type { ApiFailure } from "../services/apiError";

/** The users list. `queryKey` says which address the state belongs to. */
export interface UsersState {
  status: "idle" | "loading" | "ready" | "error";
  queryKey: string | null;
  // Empty unless ready: old results are never shown as new ones.
  items: PublicUser[];
  total: number;
  page: number;
  limit: number;
  failure: ApiFailure | null;
}

export interface LoadUsersInput {
  params: UserListParams;
  // The canonical address the page built the params from.
  queryKey: string;
}

const IDLE_USERS: UsersState = {
  status: "idle",
  queryKey: null,
  items: [],
  total: 0,
  page: 1,
  limit: 0,
  failure: null,
};

export const usersAtom = atom<UsersState>(IDLE_USERS);

const usersRequest = createLatestRequest();

// Goes up whenever the list is cleared or reset. A delete remembers it when it
// starts and patches nothing if it changed: a delete that ends after the page
// closed must not touch the next visit's list (LESSON-REQ-fs-005-2).
let usersVisit = 0;

/** The current visit of the Users page; see userActions.ts. */
export function currentUsersVisit(): number {
  return usersVisit;
}

/** Loads one page of users. Shows no rows while it loads. */
export const loadUsersAtom = atom(
  null,
  async (_get, set, input: LoadUsersInput): Promise<void> => {
    const { queryKey } = input;
    const ticket = usersRequest.begin();
    set(usersAtom, { ...IDLE_USERS, status: "loading", queryKey });
    try {
      const result = await listUsers(input.params, ticket.signal);
      if (ticket.isCurrent()) {
        set(usersAtom, {
          status: "ready",
          queryKey,
          items: result.items,
          total: result.total,
          page: result.page,
          limit: result.limit,
          failure: null,
        });
      }
    } catch (error) {
      if (ticket.isCurrent() && !isCancelled(error)) {
        set(usersAtom, {
          ...IDLE_USERS,
          status: "error",
          queryKey,
          failure: toApiFailure(error),
        });
      }
    }
  },
);

/**
 * Takes a deleted user off a ready list without asking the server. `total`
 * drops by one only when the row was held, never below zero. Any other state
 * is left alone.
 */
export const removeUserLocallyAtom = atom(null, (get, set, id: number) => {
  const users = get(usersAtom);
  if (users.status !== "ready" || !users.items.some((user) => user.id === id)) {
    return;
  }
  set(usersAtom, {
    ...users,
    items: users.items.filter((user) => user.id !== id),
    total: Math.max(0, users.total - 1),
  });
});

/**
 * Forgets the list and cancels its call. The Users page calls it when it
 * closes, so the next visit never starts from this one. A delete still
 * running patches nothing afterwards.
 */
export const clearUsersAtom = atom(null, (_get, set) => {
  usersVisit += 1;
  usersRequest.cancel();
  set(usersAtom, IDLE_USERS);
});

/**
 * Puts the list back to idle and cancels its call. The session actions call
 * it beside `resetAlumniAtom` whenever the user changes, so one admin's list
 * is never shown to the next user.
 */
export const resetUsersAtom = atom(null, (_get, set) => {
  usersVisit += 1;
  usersRequest.cancel();
  set(usersAtom, IDLE_USERS);
});
