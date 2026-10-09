import { useAtomValue, useSetAtom, useStore } from "jotai";
import { useEffect } from "react";
import { AlumniCard } from "../../components/alumni/AlumniCard/AlumniCard";
import { AlumniCardSkeleton } from "../../components/alumni/AlumniCard/AlumniCardSkeleton";
import { DirectoryFilters } from "../../components/alumni/DirectoryFilters/DirectoryFilters";
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
import { useListAddress } from "../../hooks/useListAddress";
import {
  DEFAULT_DIRECTORY_QUERY,
  hasCriteria,
  readDirectoryQuery,
  toListParams,
  writeDirectoryQuery,
} from "../../lib/directoryQuery";
import { loadFailureText } from "../../lib/loadFailure";
import {
  clearDirectoryAtom,
  directoryAtom,
  filtersAtom,
  loadDirectoryAtom,
  loadFiltersAtom,
} from "../../store/alumniAtoms";
import styles from "./DirectoryPage.module.css";

// The skeleton cards of a full page while a page loads (AC9).
const SKELETON_CARD_COUNT = 12;

type ListView = "loading" | "ready" | "empty" | "error";

/**
 * The alumni directory (AC1 to AC14). The address is the truth: every
 * control writes it, and the list loads from it. The typed search text, its
 * timer and the focus flags live in useListAddress.
 */
export default function DirectoryPage() {
  const store = useStore();
  const directory = useAtomValue(directoryAtom);
  const filters = useAtomValue(filtersAtom);
  const loadDirectory = useSetAtom(loadDirectoryAtom);
  const loadFilters = useSetAtom(loadFiltersAtom);
  const clearDirectory = useSetAtom(clearDirectoryAtom);

  // The address, the search box and its timer, page change, Clear and the
  // past-the-end fix (REQ-fs-007: moved as they were into the shared hook).
  const {
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
  } = useListAddress({
    read: readDirectoryQuery,
    write: writeDirectoryQuery,
    defaultQuery: DEFAULT_DIRECTORY_QUERY,
    list: directory,
  });

  function retryList() {
    void loadDirectory({ params: toListParams(query), queryKey });
    // The error state and its button go away: the count line says "Loading".
    retryFocus();
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

  // Leaving the page forgets the list, so the next visit never shows this
  // visit's list or error for a frame before its own load (CORR-004, ARCH-005).
  useEffect(() => () => clearDirectory(), [clearDirectory]);

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
          onSearchTextChange={onSearchTextChange}
          onSearchNow={searchNow}
          onFilterChange={changeFilter}
          options={filters.filters}
          optionsStatus={filters.status}
          onRetryOptions={() => void loadFilters()}
          onClear={clear}
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
            <Pagination page={query.page} pageCount={pageCount} onChange={changePage} />
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
            onAction={clear}
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
