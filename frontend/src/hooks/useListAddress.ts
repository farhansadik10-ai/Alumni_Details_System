import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import { useSearchParams } from "react-router-dom";
import { lastPage } from "../lib/pageRange";

// A pause this long in typing sends the search (AC3).
const SEARCH_DELAY_MS = 300;

/** The part of an address query the hook works with: the search text and the page. */
export interface ListAddressQuery {
  q: string;
  page: number;
}

/** The states a list goes through; the store's lists use the same four words. */
export type ListAddressStatus = "idle" | "loading" | "ready" | "error";

/** The part of a list's state the hook reads. `queryKey` says which address it belongs to. */
export interface ListAddressList {
  queryKey: string | null;
  status: ListAddressStatus;
  total: number;
  limit: number;
}

export interface ListAddressOptions<Q extends ListAddressQuery, L extends ListAddressList> {
  // Pass functions defined at module level, so the query is read again only
  // when the address changes.
  read: (params: URLSearchParams) => Q;
  write: (query: Q) => URLSearchParams;
  // What Clear writes.
  defaultQuery: Q;
  // The page's list state, passed in, so the hook serves any list and knows no
  // store. (Style rule d only keeps axios and services/ out of hooks/.)
  list: L | null;
}

export interface ListAddress<Q extends ListAddressQuery, L extends ListAddressList> {
  query: Q;
  // The canonical address text of the query: the load key.
  queryKey: string;
  // The list, only when it belongs to this address; otherwise null.
  current: L | null;
  pageCount: number;
  // The list is ready, not empty, and the address asks for a page after its last.
  pastTheEnd: boolean;
  searchText: string;
  searchRef: RefObject<HTMLInputElement>;
  countRef: RefObject<HTMLParagraphElement>;
  onSearchTextChange: (text: string) => void;
  searchNow: () => void;
  changeFilter: (patch: Partial<Q>) => void;
  changePage: (page: number) => void;
  clear: () => void;
  retryFocus: () => void;
}

/**
 * A list page whose search, filters and page live in the address. The address
 * is the truth: every control writes it, and the page loads its list from
 * `queryKey`. Only the typed search text, its timer and a few focus flags live
 * here. The page keeps its load effect, its clear on close and its views.
 */
export function useListAddress<Q extends ListAddressQuery, L extends ListAddressList>({
  read,
  write,
  defaultQuery,
  list,
}: ListAddressOptions<Q, L>): ListAddress<Q, L> {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = useMemo(() => read(searchParams), [read, searchParams]);
  const queryKey = write(query).toString();

  const [searchText, setSearchText] = useState(query.q);

  // The query of the address right now. A timer or a handler reads this at
  // the moment it writes, never a copy from when it started (ADV-003).
  const liveQuery = useRef(query);
  const setParams = useRef(setSearchParams);
  // The trimmed search text this page last wrote or read from the address.
  // The box is overwritten only when the address differs from it (ADV-003).
  const lastCommitted = useRef(query.q);
  // The typed text waiting for the timer, or null when no timer runs.
  const pendingText = useRef<string | null>(null);
  const timer = useRef<number | null>(null);
  // Set only by Pagination's onChange: Back, a pasted link and the
  // past-the-end fix never move focus (ADV-007).
  const focusCountOnPage = useRef(false);
  // The address the past-the-end fix last moved, until that episode ends (AC7).
  const clampedKey = useRef<string | null>(null);

  const countRef = useRef<HTMLParagraphElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    liveQuery.current = query;
    setParams.current = setSearchParams;
  }, [query, setSearchParams]);

  function stopTimer(): string | null {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    const pending = pendingText.current;
    pendingText.current = null;
    return pending === null ? null : pending.trim();
  }

  /** Writes the address; false when it would not change. */
  function writeAddress(next: Q, replace: boolean): boolean {
    if (write(next).toString() === write(liveQuery.current).toString()) {
      return false;
    }
    liveQuery.current = next;
    setParams.current(write(next), { replace });
    return true;
  }

  /**
   * A change of a filter, the checkbox or the page. It pushes a history
   * entry, and a search still waiting for its timer goes with it (ADV-003).
   * A new search always starts on page 1, even when a page click sends it
   * (AC6, CORR-002).
   */
  function writeControl(patch: Partial<Q>, page: number): boolean {
    const pending = stopTimer();
    const base = liveQuery.current;
    const q = pending ?? base.q;
    lastCommitted.current = q;
    const newSearch = q !== base.q;
    return writeAddress({ ...base, q, ...patch, page: newSearch ? 1 : page }, false);
  }

  /** Sends the search text now. Typing replaces the history entry (listed deviation). */
  function commitSearch(text: string) {
    stopTimer();
    const q = text.trim();
    lastCommitted.current = q;
    if (q !== liveQuery.current.q) {
      writeAddress({ ...liveQuery.current, q, page: 1 }, true);
    }
  }

  function onSearchTextChange(text: string) {
    setSearchText(text);
    stopTimer();
    pendingText.current = text;
    timer.current = window.setTimeout(() => commitSearch(text), SEARCH_DELAY_MS);
  }

  function searchNow() {
    commitSearch(searchText);
  }

  // The page is its own argument, so no cast: `{ page }` is not a Partial<Q>
  // for every Q the compiler can imagine.
  function changeFilter(patch: Partial<Q>) {
    writeControl(patch, 1);
  }

  function changePage(page: number) {
    focusCountOnPage.current = writeControl({}, page);
  }

  function clear() {
    stopTimer();
    setSearchText("");
    lastCommitted.current = "";
    writeAddress(defaultQuery, false);
    // The Clear button disappears with the criteria: focus goes to the search box.
    searchRef.current?.focus();
  }

  // After a Retry: the error state and its button go away, and the count line
  // says "Loading". The page starts the load itself.
  function retryFocus() {
    countRef.current?.focus();
  }

  // Back, Forward or a pasted link changed the search: the box follows.
  useEffect(() => {
    if (query.q !== lastCommitted.current) {
      stopTimer();
      lastCommitted.current = query.q;
      setSearchText(query.q);
    }
  }, [query.q]);

  useEffect(() => () => void stopTimer(), []);

  // After the user changed page: focus on the count line. Pagination has
  // gone while the page loads, so nothing takes focus back (AC8).
  useEffect(() => {
    if (focusCountOnPage.current) {
      focusCountOnPage.current = false;
      countRef.current?.focus({ preventScroll: true });
      countRef.current?.scrollIntoView({ block: "start" });
    }
  }, [query.page]);

  // The state belongs to this address only when its key matches (ADV-007).
  const current = list !== null && list.queryKey === queryKey ? list : null;
  const pageCount = current ? lastPage(current.total, current.limit) : 1;
  const pastTheEnd =
    current !== null && current.status === "ready" && current.total > 0 && query.page > pageCount;

  // A page past the end: the address moves to the last page, once per
  // episode (AC7). The mark is cleared as soon as the page is not past the
  // end, so the same address past the end again is moved again and the
  // skeleton is never left on screen (CORR-003).
  useEffect(() => {
    if (!pastTheEnd) {
      clampedKey.current = null;
    } else if (
      clampedKey.current !== queryKey &&
      writeAddress({ ...liveQuery.current, page: pageCount }, true)
    ) {
      clampedKey.current = queryKey;
    }
  });

  return {
    query,
    queryKey,
    current,
    pageCount,
    pastTheEnd,
    searchText,
    searchRef,
    countRef,
    onSearchTextChange,
    searchNow,
    changeFilter,
    changePage,
    clear,
    retryFocus,
  };
}
