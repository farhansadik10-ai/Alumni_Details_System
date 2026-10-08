# TASK-008 — Users page and its parts

| Field | Value |
|---|---|
| REQ | REQ-fs-007 |
| Tier | 2 |
| Status | pending |
| Repo | alumni-details-system |
| Depends on | TASK-004, TASK-006, TASK-007 |
| Blocks | TASK-009, TASK-012 |

## Goal

An admin can search, filter by role, page through and delete users on `/users`, as `docs/design/screens/users.html` draws it (spec AC1 to AC11).

## Files to touch

| Path | Action |
|---|---|
| `frontend/src/pages/UsersPage/UsersPage.tsx` | replace the placeholder |
| `frontend/src/pages/UsersPage/UsersPage.module.css` | create |
| `frontend/src/components/users/UsersFilters/UsersFilters.tsx` + `.module.css` | create: a `Card` with the search field (`TextInput`), the role `Select`, a Search button; props only |
| `frontend/src/components/users/UserCells/UserNameCell.tsx` + `.module.css` | create: `Avatar`, name, the "You" `Tag`; wraps a 60-character name |
| `frontend/src/components/users/UserCells/UserActionsCell.tsx` | create: Delete button with an accessible name that includes the person; nothing on the admin's own row |
| `frontend/src/components/users/DeleteUserDialog/DeleteUserDialog.tsx` + `.module.css` | create: `ConfirmDialog` (danger) + `Message` for a failure; props `open`, `name`, `busy`, `errorText`, `onClose`, `onConfirm` |

## Approach

- Follow `frontend/src/pages/DirectoryPage/DirectoryPage.tsx` after TASK-007: `useListAddress` with `readUsersQuery` / `writeUsersQuery`; a load effect keyed on `queryKey` calling `loadUsersAtom`; `clearUsersAtom` in a cleanup; the same `view` rules (loading / ready / empty / error) and the same `current` rule (an atom whose `queryKey` is not this address's counts as loading).
- The table uses `Table` with columns Name, Email, Role, Joined, Actions (`data-label` comes from the head). Role: `RoleTag`, or muted "No role" text when the role is null or unknown. Joined: `dateText(created_at)`, else `NOT_GIVEN`. The admin's own row is the row whose `id` equals `session.userId`.
- Count line: polite live region with `tabIndex={-1}`, like the Directory's: "124 users", "1 user", "No users found", "Loading users", "Could not load users".
- Empty with criteria: `EmptyState` with a "Clear search and filters" action; empty without: its own words. Error: `ErrorState` with "Try again".
- Delete: follow `handleConfirmDelete` and `closeConfirm` in `frontend/src/components/posts/FeedPost/FeedPost.tsx` (ADV-001 of this REQ). `pendingUser` state plus a `confirmOpenRef` and a `deletingRef` in the page. Cancel and Escape always close the dialog, also while the delete runs (the browser closes a native dialog on a second Escape anyway, so the flag must follow it); `ConfirmDialog` is not changed and Cancel is not disabled. Confirm calls `deleteUserAtom`; a second press while it runs is ignored (`deletingRef`, and `busy` on the confirm button). On `ok`: close, toast with the name, focus to the count line. On 404 (`isGone`): close, "already gone" toast, same focus. On any other failure, 409 included: if the dialog is still open, show `userDeleteFailureText(failure, words)` in the dialog and keep focus on Cancel; if the admin already closed it, show the same words as a toast.
- Focus after a delete: the opener button is gone and a modal that is still closing swallows `focus()`. Use a request counter in `useState` (`focusCountRequest`), raised when the dialog has closed after a delete, and a page effect that focuses the count line when the counter changes (as `focusEditRequest` does in `FeedPost`). Never call `focus()` in the same tick as the close.
- After a delete that leaves page 2 or later empty, the existing past-the-end rule in the hook moves the address to the last page; page 1 with total 0 shows the empty state.
- Phone: `Table` already makes cards below 768px. The Delete button uses the touch control height token. Long names and emails: `min-width: 0` and `overflow-wrap: anywhere` (G46, the profile and card CSS use the same).
- Words only from `config/text.ts`. No `px`, no color literal, one phone media query.

## Acceptance

- [ ] `npm run build`, the style check and the library check exit 0.
- [ ] A non-admin still gets the no-access page and sends no request.
- [ ] Browser check against a mock API (TASK-012): search debounce, role filter, page change, "You" row without Delete, Delete success, 409, 404, network failure, empty, error, loading; both themes; 360px cards.
- [ ] Browser check of the dialog: with a slow delete, Escape twice closes it and a late 409 appears as a toast; the next Delete opens the dialog again; after a successful delete focus is on the count line (a real Tab key shows the ring).
- [ ] No second copy of search or address code (grep for `setTimeout` in the page).

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-007-frontend-users-about-polish-perf/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-005-1-disable-until-changed-has-three-traps|L-REQ-fs-005-1]], [[knowledge/lessons/LESSON-REQ-fs-006-5-build-a-component-so-the-dev-page-can-show-it|L-REQ-fs-006-5]], [[knowledge/gotchas#^g46|G46]], [[knowledge/gotchas#^g57|G57]]
