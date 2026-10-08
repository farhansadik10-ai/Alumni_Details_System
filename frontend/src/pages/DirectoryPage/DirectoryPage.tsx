import { useAtomValue, useSetAtom, useStore } from "jotai";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AlumniCard } from "../../components/alumni/AlumniCard/AlumniCard";
import { AlumniCardSkeleton } from "../../components/alumni/AlumniCard/AlumniCardSkeleton";
import { DirectoryFilters } from "../../components/alumni/DirectoryFilters/DirectoryFilters";
import type { DirectoryFilterPatch } from "../../components/alumni/DirectoryFilters/DirectoryFilters";
import { PageLayout } from "../../components/shell/PageLayout/PageLayout";
import { Card } from "../../components/ui/Card/Card";
import { EmptyState } from "../../components/ui/EmptyState/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState/ErrorState";
import { Pagination } from "../../components/ui/Pagination/Pagination";
import { SkeletonGroup } from "../../components/ui/Skeleton/Skeleton";
import {
  DIRECTORY_COUNT_FAILED,
  DIRECTORY_COUNT_LOADING,
  DIRECTORY_CLEAR_BUTTON,
  DIRECTORY_COUNT_NONE,
  DIRECTORY_EMPTY_MATCH_HEADING,
  DIRECTORY_EMPTY_MATCH_TEXT,
  DIRECTORY_EMPTY_NONE_HEADING,
  DIRECTORY_EMPTY_NONE_TEXT,
  DIRECTORY_ERROR_HEADING,
  DIRECTORY_HEADING,
  DIRECTORY_SUB,
  directoryCount,
} from "../../config/text";
import {
  DEFAULT_DIRECTORY_QUERY,
  hasCriteria,
  lastPage,
  readDirectoryQuery,
  toListParams,
  writeDirectoryQuery,
} from "../../lib/directoryQuery";
import type { DirectoryQuery } from "../../lib/directoryQuery";
import { loadFailureText } from "../../lib/loadFailure";
import {
  clearDirectoryAtom,
  directoryAtom,
  filtersAtom,
  loadDirectoryAtom,
  loadFiltersAtom,
} from "../../store/alumniAtoms";
import styles from "./DirectoryPage.module.css";

// A pause this long in typing sends the search (AC3).
const SEARCH_DELAY_MS = 300;
// The skeleton cards of a full page while a page loads (AC9).
const SKELETON_CARD_COUNT = 12;

type ListView = "loading" | "ready" | "empty" | "error";

/** The canonical address text of a query: the load key and the card return state. */
function queryKeyOf(query: DirectoryQuery): string {
  return writeDirectoryQuery(query).toString();
}

/**
 * The alumni directory (AC1 to AC14). The address is the truth: every
 * control writes it, and the list loads from it. Only the typed search text,
 * its timer and a few focus flags live in the component.
 */
export default function DirectoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = useMemo(() => readDirectoryQuery(searchParams), [searchParams]);
  const queryKey = queryKeyOf(query);

  const store = useStore();
  const directory = useAtomValue(directoryAtom);
  const filters = useAtomValue(filtersAtom);
  const loadDirectory = useSetAtom(loadDirectoryAtom);
  const loadFilters = useSetAtom(loadFiltersAtom);
  const clearDirectory = useSetAtom(clearDirectoryAtom);

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
  function writeAddress(next: DirectoryQuery, replace: boolean): boolean {
    if (queryKeyOf(next) === queryKeyOf(liveQuery.current)) {
      return false;
    }
    liveQuery.current = next;
    setParams.current(writeDirectoryQuery(next), { replace });
    return true;
  }

  /**
   * A change of a filter, the checkbox or the page. It pushes a history
   * entry, and a search still waiting for its timer goes with it (ADV-003).
   * A new search always starts on page 1, even when a page click sends it
   * (AC6, CORR-002).
   */
  function writeControl(patch: Partial<DirectoryQuery>): boolean {
    const pending = stopTimer();
    const base = liveQuery.current;
    const q = pending ?? base.q;
    lastCommitted.current = q;
    const newSearch = q !== base.q;
    return writeAddress({ ...base, q, ...patch, ...(newSearch ? { page: 1 } : {}) }, false);
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

  function handleSearchTextChange(text: string) {
    setSearchText(text);
    stopTimer();
    pendingText.current = text;
    timer.current = window.setTimeout(() => commitSearch(text), SEARCH_DELAY_MS);
  }

  function handleFilterChange(patch: DirectoryFilterPatch) {
    writeControl({ ...patch, page: 1 });
  }

  function handlePageChange(page: number) {
    focusCountOnPage.current = writeControl({ page });
  }

  function handleClear() {
    stopTimer();
    setSearchText("");
    lastCommitted.current = "";
    writeAddress(DEFAULT_DIRECTORY_QUERY, false);
    // The Clear button disappears with the criteria: focus goes to the search box.
    searchRef.current?.focus();
  }

  function retryList() {
    void loadDirectory({ params: toListParams(query), queryKey });
    // The error state and its button go away: the count line says "Loading".
    countRef.current?.focus();
  }

  // The list follows the address. latestRequest drops older answers (G48).
  useEffect(() => {
    const keyQuery = readDirectoryQuery(new URLSearchParams(queryKey));
    void loadDirectory({ params: toListParams(keyQuery), queryKey });
  }, [queryKey, loadDirectory]);

  // The options once; not again when they are already here (back from a profile).
  useEffect(() => {
    if (store.get(filtersAtom).status !== "ready") {
      void loadFilters();
    }
  }, [store, loadFilters]);

  // Back, Forward or a pasted link changed the search: the box follows.
  useEffect(() => {
    if (query.q !== lastCommitted.current) {
      stopTimer();
      lastCommitted.current = query.q;
      setSearchText(query.q);
    }
  }, [query.q]);

  useEffect(() => () => void stopTimer(), []);

  // Leaving the page forgets the list, so the next visit never shows this
  // visit's list or error for a frame before its own load (CORR-004, ARCH-005).
  useEffect(() => () => clearDirectory(), [clearDirectory]);

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
  const current = directory.queryKey === queryKey ? directory : null;
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

  let view: ListView;
  if (current === null || current.status === "idle" || current.status === "loading" || pastTheEnd) {
    view = "loading";
  } else if (current.status === "error") {
    view = "error";
  } else if (current.items.length === 0) {
    view = "empty";
  } else {
    view = "ready";
  }

  const countText = {
    loading: DIRECTORY_COUNT_LOADING,
    error: DIRECTORY_COUNT_FAILED,
    empty: DIRECTORY_COUNT_NONE,
    ready: directoryCount(current?.total ?? 0),
  }[view];
  const directorySearch = queryKey === "" ? "" : `?${queryKey}`;
  const emptyWithCriteria = view === "empty" && hasCriteria(query);

  return (
    <PageLayout heading={DIRECTORY_HEADING} sub={DIRECTORY_SUB}>
      <Card>
        <DirectoryFilters
          query={query}
          searchText={searchText}
          onSearchTextChange={handleSearchTextChange}
          onSearchNow={() => commitSearch(searchText)}
          onFilterChange={handleFilterChange}
          options={filters.filters}
          optionsStatus={filters.status}
          onRetryOptions={() => void loadFilters()}
          onClear={handleClear}
          showClear={!emptyWithCriteria}
          searchRef={searchRef}
        />
      </Card>

      <div className={styles.results}>
        <p ref={countRef} className={styles.count} role="status" tabIndex={-1}>
          {countText}
        </p>

        {view === "loading" ? (
          <SkeletonGroup>
            <div className={styles.grid}>
              {Array.from({ length: SKELETON_CARD_COUNT }, (_, index) => (
                <AlumniCardSkeleton key={index} />
              ))}
            </div>
          </SkeletonGroup>
        ) : null}

        {view === "ready" && current ? (
          <>
            <ul className={`${styles.grid} ${styles.list}`}>
              {current.items.map((alumni) => (
                <li key={alumni.id} className={styles.item}>
                  <AlumniCard alumni={alumni} directorySearch={directorySearch} />
                </li>
              ))}
            </ul>
            <Pagination page={query.page} pageCount={pageCount} onChange={handlePageChange} />
          </>
        ) : null}

        {/* With criteria, the empty state has the "Clear search and filters"
            button and the search card hides its own, so the page never shows
            two (AC11). */}
        {emptyWithCriteria ? (
          <EmptyState
            heading={DIRECTORY_EMPTY_MATCH_HEADING}
            text={DIRECTORY_EMPTY_MATCH_TEXT}
            actionLabel={DIRECTORY_CLEAR_BUTTON}
            onAction={handleClear}
          />
        ) : null}
        {view === "empty" && !hasCriteria(query) ? (
          <EmptyState heading={DIRECTORY_EMPTY_NONE_HEADING} text={DIRECTORY_EMPTY_NONE_TEXT} />
        ) : null}

        {view === "error" ? (
          <ErrorState
            heading={DIRECTORY_ERROR_HEADING}
            text={loadFailureText(current?.failure ?? null)}
            onRetry={retryList}
            retryVariant="secondary"
          />
        ) : null}
      </div>
    </PageLayout>
  );
}
