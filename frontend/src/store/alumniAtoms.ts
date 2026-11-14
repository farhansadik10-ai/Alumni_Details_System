import { atom } from "jotai";
import type { Alumni, AlumniFilters } from "@alumni/shared";
import {
  getAlumni,
  getAlumniFilters,
  getMyAlumni,
  listAlumni,
} from "../services/alumniService";
import type { AlumniListParams } from "../services/alumniService";
import { isCancelled, toApiFailure } from "../services/apiError";
import type { ApiFailure } from "../services/apiError";
import { createLatestRequest } from "./latestRequest";
import { sessionAtom } from "./sessionAtoms";

// The alumni data the three pages show: the directory list, its filter
// options, one person's profile and the logged-in user's own profile. Every
// loader is a write-only atom that never throws. Each goes through its own
// `latestRequest`, so an older call never overwrites a newer one (AC10), and
// a cancelled call changes nothing and shows no error.

// Pages read failures from here, never from services/ (pattern 1).
export type { ApiFailure } from "../services/apiError";

/** The directory list. `queryKey` says which address the state belongs to. */
export interface DirectoryState {
  status: "idle" | "loading" | "ready" | "error";
  queryKey: string | null;
  // Empty unless ready: old results are never shown as new ones (AC9).
  items: Alumni[];
  total: number;
  page: number;
  limit: number;
  failure: ApiFailure | null;
}

export interface FiltersState {
  status: "idle" | "loading" | "ready" | "error";
  filters: AlumniFilters | null;
  failure: ApiFailure | null;
}

/** One person's profile. `id` says which profile the state belongs to. */
export interface ViewedAlumniState {
  status: "idle" | "loading" | "ready" | "notFound" | "error";
  id: number | null;
  alumni: Alumni | null;
  failure: ApiFailure | null;
}

/** The logged-in user's own profile. `none` means they have none yet (a 404). */
export interface MyAlumniState {
  status: "idle" | "loading" | "ready" | "none" | "error";
  alumni: Alumni | null;
  failure: ApiFailure | null;
}

export interface LoadDirectoryInput {
  params: AlumniListParams;
  // The canonical address the page built the params from.
  queryKey: string;
}

export interface LoadMyAlumniOptions {
  // Keep the current state until the answer arrives (ADV-002: the reload
  // after a 409 must not take the form off the screen).
  quiet?: boolean;
}

const IDLE_DIRECTORY: DirectoryState = {
  status: "idle",
  queryKey: null,
  items: [],
  total: 0,
  page: 1,
  limit: 0,
  failure: null,
};
const IDLE_FILTERS: FiltersState = { status: "idle", filters: null, failure: null };
const IDLE_VIEWED: ViewedAlumniState = {
  status: "idle",
  id: null,
  alumni: null,
  failure: null,
};
const IDLE_MY_ALUMNI: MyAlumniState = { status: "idle", alumni: null, failure: null };

const NOT_FOUND = 404;

export const directoryAtom = atom<DirectoryState>(IDLE_DIRECTORY);
export const filtersAtom = atom<FiltersState>(IDLE_FILTERS);
export const viewedAlumniAtom = atom<ViewedAlumniState>(IDLE_VIEWED);
export const myAlumniAtom = atom<MyAlumniState>(IDLE_MY_ALUMNI);

// One per loader; resetAlumniAtom cancels all four, and the three clear atoms
// cancel the directory's, the viewed profile's and the user's own profile's.
const directoryRequest = createLatestRequest();
const filtersRequest = createLatestRequest();
const viewedRequest = createLatestRequest();
const myAlumniRequest = createLatestRequest();

function isNotFound(failure: ApiFailure): boolean {
  return failure.kind === "http" && failure.status === NOT_FOUND;
}

/** Loads one page of the directory. Shows no items while it loads. */
export const loadDirectoryAtom = atom(
  null,
  async (_get, set, input: LoadDirectoryInput): Promise<void> => {
    const { queryKey } = input;
    const ticket = directoryRequest.begin();
    set(directoryAtom, { ...IDLE_DIRECTORY, status: "loading", queryKey });
    try {
      const result = await listAlumni(input.params, ticket.signal);
      if (ticket.isCurrent()) {
        set(directoryAtom, {
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
        set(directoryAtom, {
          ...IDLE_DIRECTORY,
          status: "error",
          queryKey,
          failure: toApiFailure(error),
        });
      }
    }
  },
);

/** Loads the options of the directory's filters (AC4). */
export const loadFiltersAtom = atom(null, async (_get, set): Promise<void> => {
  const ticket = filtersRequest.begin();
  set(filtersAtom, { status: "loading", filters: null, failure: null });
  try {
    const filters = await getAlumniFilters(ticket.signal);
    if (ticket.isCurrent()) {
      set(filtersAtom, { status: "ready", filters, failure: null });
    }
  } catch (error) {
    if (ticket.isCurrent() && !isCancelled(error)) {
      set(filtersAtom, { status: "error", filters: null, failure: toApiFailure(error) });
    }
  }
});

/** Loads one person's profile. A 404 is `notFound`, not an error. */
export const loadAlumniAtom = atom(
  null,
  async (_get, set, id: number): Promise<void> => {
    const ticket = viewedRequest.begin();
    set(viewedAlumniAtom, { status: "loading", id, alumni: null, failure: null });
    try {
      const alumni = await getAlumni(id, ticket.signal);
      if (ticket.isCurrent()) {
        set(viewedAlumniAtom, { status: "ready", id, alumni, failure: null });
      }
    } catch (error) {
      if (!ticket.isCurrent() || isCancelled(error)) {
        return;
      }
      const failure = toApiFailure(error);
      set(viewedAlumniAtom, {
        status: isNotFound(failure) ? "notFound" : "error",
        id,
        alumni: null,
        failure,
      });
    }
  },
);

/**
 * Loads the logged-in user's own profile: `ready`, `none` (a 404) or
 * `error`. A quiet load keeps the current state while it waits, and a
 * failed quiet load keeps it too. An answer that arrives after the session
 * went to another user is dropped.
 */
export const loadMyAlumniAtom = atom(
  null,
  async (get, set, options?: LoadMyAlumniOptions): Promise<void> => {
    const session = get(sessionAtom);
    if (session === null) {
      myAlumniRequest.cancel();
      set(myAlumniAtom, IDLE_MY_ALUMNI);
      return;
    }

    const { userId } = session;
    const quiet = options?.quiet === true;
    // GET /api/alumni/me takes no signal: the ticket alone drops a late answer.
    const ticket = myAlumniRequest.begin();
    const isStillCurrent = (): boolean =>
      ticket.isCurrent() && get(sessionAtom)?.userId === userId;

    if (!quiet) {
      set(myAlumniAtom, { status: "loading", alumni: null, failure: null });
    }
    try {
      const alumni = await getMyAlumni();
      if (isStillCurrent()) {
        set(myAlumniAtom, { status: "ready", alumni, failure: null });
      }
    } catch (error) {
      if (!isStillCurrent() || isCancelled(error)) {
        return;
      }
      const failure = toApiFailure(error);
      if (isNotFound(failure)) {
        set(myAlumniAtom, { status: "none", alumni: null, failure: null });
      } else if (!quiet) {
        set(myAlumniAtom, { status: "error", alumni: null, failure });
      }
    }
  },
);

/**
 * Stores a profile the user just saved. Any load still running for the old
 * state is cancelled, so its answer cannot overwrite the saved one.
 */
export const setMyAlumniAtom = atom(null, (_get, set, alumni: Alumni) => {
  myAlumniRequest.cancel();
  set(myAlumniAtom, { status: "ready", alumni, failure: null });
});

/**
 * Forgets the directory list and cancels its call. The directory calls it
 * when it unmounts, so the next visit never shows this visit's list or error
 * for a frame before its own load starts (CORR-004, ARCH-005). The filter
 * options are kept: they do not depend on the address.
 */
export const clearDirectoryAtom = atom(null, (_get, set) => {
  directoryRequest.cancel();
  set(directoryAtom, IDLE_DIRECTORY);
});

/**
 * Forgets the viewed profile and cancels its call. The profile page calls it
 * when it unmounts, so the next visit never starts from this visit's error,
 * "not found" or old data (CORR-004, ARCH-005).
 */
export const clearViewedAlumniAtom = atom(null, (_get, set) => {
  viewedRequest.cancel();
  set(viewedAlumniAtom, IDLE_VIEWED);
});

/**
 * Forgets the user's own profile and cancels its call. My profile calls it
 * when it unmounts, never while it is open (the band's public link reads the
 * saved profile), so the next visit never starts from this visit's error or
 * old profile (CORR-004, ARCH-005).
 */
export const clearMyAlumniAtom = atom(null, (_get, set) => {
  myAlumniRequest.cancel();
  set(myAlumniAtom, IDLE_MY_ALUMNI);
});

/**
 * Puts all four back to idle and cancels their calls. The session actions
 * call it whenever the user changes, so one user's data is never shown to
 * the next (ADV-001).
 */
export const resetAlumniAtom = atom(null, (_get, set) => {
  directoryRequest.cancel();
  filtersRequest.cancel();
  viewedRequest.cancel();
  myAlumniRequest.cancel();
  set(directoryAtom, IDLE_DIRECTORY);
  set(filtersAtom, IDLE_FILTERS);
  set(viewedAlumniAtom, IDLE_VIEWED);
  set(myAlumniAtom, IDLE_MY_ALUMNI);
});
