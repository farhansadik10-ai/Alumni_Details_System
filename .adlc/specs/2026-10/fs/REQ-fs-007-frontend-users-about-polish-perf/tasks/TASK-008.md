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

## Notes

Written by: task-implementer (tier: deep), 2026-10-09.

- **Checks:** `npm run build` (tsc -b + vite), `node scripts/frontend-style-check.mjs` (0 findings, 198 files) and `npx tsx scripts/frontend-lib-check.ts` (536 passed) all exit 0. No `setTimeout` in the page or `components/users/`. No word added to `config/text.ts`; all existed.
- **Props for TASK-009 (dev page):** `DeleteUserDialog` takes `open`, `name` (already through `displayName`), `busy`, `errorText` (string or null), `onClose`, `onConfirm`. `UserNameCell` takes `name`, `photoUrl`, `isSelf`. `UserActionsCell` takes `name`, `isSelf`, `onDelete`. `UsersFilters` takes `query`, `searchText`, `onSearchTextChange`, `onSearchNow`, `onRoleChange(role: "" | Role)`, `searchRef?`. None of them reads the store or calls a service.
- **Delete, beyond the plan (two small decisions):**
  1. Busy is per user (`deletingIds`), not one flag: an admin can Escape out of a slow delete of X and open Delete for Y. A late answer for X closes the dialog only if the open dialog is still X's (`confirmOpenRef` holds the open user's id, not a boolean); otherwise its failure is a toast and its success is a toast only.
  2. Focus after a late success (dialog already closed) moves to the count line only if focus was lost with the row (`document.activeElement` is body), so it never pulls focus out of the search box.
- **Not moved:** after a failure in the open dialog, focus stays where it is (on the confirm button after a click). `ConfirmDialog` exposes no ref to Cancel and must not change; the `Message` is `role="alert"`, so it is read out. Same as `FeedPost`.
- **Deviation (small, in the page):** `refillEmptiedPage` reloads the same address when a delete empties the last visible row of a page but the server still has rows for it (page 1, total > 0). Without it the page shows "No users found" while users remain. A page past the end is still moved by the hook.
- Name cell: the design links one name to a profile; `PublicUser` has no alumni id, so names are plain text.
- Filters have no Clear button (the design has none); Clear is in the "no match" empty state (`USERS_CLEAR_BUTTON`, "Clear search and role").

**Browser scenarios for TASK-012** (mock API, admin token; also a non-admin token):
1. Non-admin on `/users`: no-access page, no `GET /api/users` sent.
2. Typing waits 300 ms then one request with `q`; Enter and Search send at once; Back restores the box.
3. Role filter: All roles sends no `role`; Student/Alumni/Admin send the stored word; the address follows.
4. Page change: focus on the count line, address `page=2`; a pasted `page=99` moves to the last page.
5. Own row: "You" tag, no Delete; other rows: Delete read out as "Delete <name>".
6. Delete success: dialog closes, toast "<name> was deleted", total down by one, focus on the count line (real Tab shows the ring).
7. Delete 409: message in the dialog, row stays. 404: dialog closes, "already gone" toast, row gone. Network failure and 500: their words in the dialog.
8. Slow delete: Escape twice closes the dialog; a late 409 appears as a toast; Delete on the same or another row opens the dialog again.
9. Delete the only row of page 2: moves to page 1. Delete the last row of page 1 with more users on the server: page reloads, no "No users found".
10. Empty with and without search; error with Try again (focus to the count line); loading skeleton; no old rows for a frame under a new search.
11. Both themes; 360px cards with a 60-character name and email, no sideways scroll; Delete 44px tall.
