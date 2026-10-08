import type { PublicUser } from "@alumni/shared";
import { useAtomValue, useSetAtom, useStore } from "jotai";
import { useEffect, useRef, useState } from "react";
import { PageLayout } from "../../components/shell/PageLayout/PageLayout";
import { Card } from "../../components/ui/Card/Card";
import { EmptyState } from "../../components/ui/EmptyState/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState/ErrorState";
import { Pagination } from "../../components/ui/Pagination/Pagination";
import { Skeleton, SkeletonGroup, SkeletonStack } from "../../components/ui/Skeleton/Skeleton";
import { Table } from "../../components/ui/Table/Table";
import { DeleteUserDialog } from "../../components/users/DeleteUserDialog/DeleteUserDialog";
import { usersColumns } from "../../components/users/UserCells/usersColumns";
import { UsersFilters } from "../../components/users/UsersFilters/UsersFilters";
import {
  USERS_CLEAR_BUTTON,
  USERS_COUNT_FAILED,
  USERS_COUNT_LOADING,
  USERS_COUNT_NONE,
  USERS_EMPTY_MATCH_HEADING,
  USERS_EMPTY_MATCH_TEXT,
  USERS_EMPTY_NONE_HEADING,
  USERS_EMPTY_NONE_TEXT,
  USERS_ERROR_HEADING,
  USERS_HEADING,
  USERS_SUB,
  USER_ALREADY_GONE_TOAST,
  userDeleteFailureWords,
  userDeletedToast,
  usersCount,
} from "../../config/text";
import { useListAddress } from "../../hooks/useListAddress";
import { displayName } from "../../lib/alumniDisplay";
import { loadFailureText } from "../../lib/loadFailure";
import { lastPage } from "../../lib/pageRange";
import {
  DEFAULT_USERS_QUERY,
  hasUsersCriteria,
  readUsersQuery,
  toUserListParams,
  writeUsersQuery,
} from "../../lib/usersQuery";
import { isGone, userDeleteFailureText } from "../../lib/writeFailure";
import { sessionAtom } from "../../store/sessionAtoms";
import { showToastAtom } from "../../store/toastAtoms";
import { deleteUserAtom } from "../../store/userActions";
import { clearUsersAtom, loadUsersAtom, usersAtom } from "../../store/usersAtoms";
import styles from "./UsersPage.module.css";

// The skeleton rows shown while a page loads (AC10).
const SKELETON_ROW_COUNT = 6;

type ListView = "loading" | "ready" | "empty" | "error";

/**
 * The admin's list of every account (AC1 to AC11). The address is the truth,
 * as on the directory: search, role and page live in it (useListAddress).
 * Delete follows FeedPost: Cancel and Escape always close the dialog, and a
 * failure that answers after the close becomes a toast (ADV-001).
 */
export default function UsersPage() {
  const store = useStore();
  const users = useAtomValue(usersAtom);
  const session = useAtomValue(sessionAtom);
  const loadUsers = useSetAtom(loadUsersAtom);
  const clearUsers = useSetAtom(clearUsersAtom);
  const deleteUser = useSetAtom(deleteUserAtom);
  const showToast = useSetAtom(showToastAtom);

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
    read: readUsersQuery,
    write: writeUsersQuery,
    defaultQuery: DEFAULT_USERS_QUERY,
    list: users,
  });

  // The person of the delete dialog. Kept after the close, so the closing
  // dialog never shows an empty name for a frame.
  const [pendingUser, setPendingUser] = useState<PublicUser | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  // The users whose delete is running. A second press for one is ignored.
  const [deletingIds, setDeletingIds] = useState<readonly number[]>([]);
  // Read after a delete answers: the dialog may have closed, or opened for
  // someone else, meanwhile. The id of the user whose dialog is open, or null.
  const confirmOpenRef = useRef<number | null>(null);
  const deletingRef = useRef(new Set<number>());
  // Raised after a delete took a row away; the effect below moves focus to
  // the count line once the dialog has closed (ADV-002).
  const [focusCountRequest, setFocusCountRequest] = useState(0);
  // The request came from a delete whose dialog was already closed: focus
  // moves only when it was lost with the row, never away from another control.
  const focusOnlyIfLost = useRef(false);

  // The list follows the address. latestRequest drops older answers (G48).
  useEffect(() => {
    const keyQuery = readUsersQuery(new URLSearchParams(queryKey));
    void loadUsers({ params: toUserListParams(keyQuery), queryKey });
  }, [queryKey, loadUsers]);

  // Leaving the page forgets the list, so the next visit never shows this
  // visit's list or error for a frame before its own load.
  useEffect(() => () => clearUsers(), [clearUsers]);

  // Runs after the dialog's own close effect (a child's effect runs first),
  // so the modal no longer swallows the focus.
  useEffect(() => {
    if (focusCountRequest === 0) {
      return;
    }
    const active = document.activeElement;
    if (focusOnlyIfLost.current && active !== null && active !== document.body) {
      return;
    }
    countRef.current?.focus();
  }, [focusCountRequest, countRef]);

  function retryList() {
    void loadUsers({ params: toUserListParams(query), queryKey });
    // The error state and its button go away: the count line says "Loading".
    retryFocus();
  }

  function openConfirm(user: PublicUser) {
    setPendingUser(user);
    setDeleteError(null);
    confirmOpenRef.current = user.id;
    setConfirmOpen(true);
  }

  // Cancel and Escape, also while the delete runs: the browser closes the
  // dialog on a second Escape anyway, so the flag always follows it.
  function closeConfirm() {
    confirmOpenRef.current = null;
    setConfirmOpen(false);
  }

  function setDeleting(id: number, running: boolean) {
    if (running) {
      deletingRef.current.add(id);
    } else {
      deletingRef.current.delete(id);
    }
    setDeletingIds([...deletingRef.current]);
  }

  /**
   * The row was the last one on its page but more users remain there: load
   * the page again rather than show "No users found". A page after the last
   * one is moved by useListAddress (past the end).
   */
  function refillEmptiedPage() {
    const list = store.get(usersAtom);
    if (
      list.status === "ready" &&
      list.queryKey !== null &&
      list.items.length === 0 &&
      list.total > 0 &&
      list.page <= lastPage(list.total, list.limit)
    ) {
      const keyQuery = readUsersQuery(new URLSearchParams(list.queryKey));
      void loadUsers({ params: toUserListParams(keyQuery), queryKey: list.queryKey });
    }
  }

  async function handleConfirmDelete() {
    const user = pendingUser;
    if (user === null || deletingRef.current.has(user.id)) {
      return;
    }
    const name = displayName(user.name);
    setDeleting(user.id, true);
    setDeleteError(null);
    const result = await deleteUser(user.id);
    setDeleting(user.id, false);

    // Still the dialog of this user: nobody closed it or opened another.
    const dialogOpen = confirmOpenRef.current === user.id;

    if (result.ok || isGone(result.failure)) {
      // The store took the row off the list.
      if (dialogOpen) {
        closeConfirm();
      }
      showToast(result.ok ? userDeletedToast(name) : USER_ALREADY_GONE_TOAST);
      focusOnlyIfLost.current = !dialogOpen;
      setFocusCountRequest((count) => count + 1);
      refillEmptiedPage();
      return;
    }
    const text = userDeleteFailureText(result.failure, userDeleteFailureWords(name));
    if (dialogOpen) {
      setDeleteError(text);
    } else {
      showToast(text);
    }
  }

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
    loading: USERS_COUNT_LOADING,
    error: USERS_COUNT_FAILED,
    empty: USERS_COUNT_NONE,
    ready: usersCount(current?.total ?? 0),
  }[view];
  const withCriteria = hasUsersCriteria(query);
  const selfId = session?.userId ?? null;

  const columns = usersColumns({ selfId, onDelete: openConfirm });

  return (
    <PageLayout heading={USERS_HEADING} sub={USERS_SUB}>
      <UsersFilters
        query={query}
        searchText={searchText}
        onSearchTextChange={onSearchTextChange}
        onSearchNow={searchNow}
        onRoleChange={(role) => changeFilter({ role })}
        searchRef={searchRef}
      />

      <div className={styles.results}>
        <p ref={countRef} className={styles.count} role="status" tabIndex={-1}>
          {countText}
        </p>

        {view === "loading" ? (
          <Card>
            <SkeletonGroup>
              {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
                <div key={index} className={styles.skeletonRow} aria-hidden="true">
                  <Skeleton shape="avatar-sm" />
                  <SkeletonStack>
                    <Skeleton shape="title" />
                    <Skeleton shape="line" />
                  </SkeletonStack>
                </div>
              ))}
            </SkeletonGroup>
          </Card>
        ) : null}

        {view === "ready" && current ? (
          <>
            <div className={styles.table}>
              <Table
                columns={columns}
                rows={current.items}
                rowKey={(user) => user.id}
                caption={USERS_HEADING}
              />
            </div>
            <Pagination page={query.page} pageCount={pageCount} onChange={changePage} />
          </>
        ) : null}

        {view === "empty" && withCriteria ? (
          <EmptyState
            heading={USERS_EMPTY_MATCH_HEADING}
            text={USERS_EMPTY_MATCH_TEXT}
            actionLabel={USERS_CLEAR_BUTTON}
            onAction={clear}
          />
        ) : null}
        {view === "empty" && !withCriteria ? (
          <EmptyState heading={USERS_EMPTY_NONE_HEADING} text={USERS_EMPTY_NONE_TEXT} />
        ) : null}

        {view === "error" ? (
          <ErrorState
            heading={USERS_ERROR_HEADING}
            text={loadFailureText(current?.failure ?? null)}
            onRetry={retryList}
            retryVariant="secondary"
          />
        ) : null}
      </div>

      <DeleteUserDialog
        open={confirmOpen}
        name={displayName(pendingUser?.name ?? null)}
        busy={pendingUser !== null && deletingIds.includes(pendingUser.id)}
        errorText={deleteError}
        onClose={closeConfirm}
        onConfirm={() => void handleConfirmDelete()}
      />
    </PageLayout>
  );
}
