# TASK-009 — Users on the dev components page

| Field | Value |
|---|---|
| REQ | REQ-fs-007 |
| Tier | 3 |
| Status | done |
| Repo | alumni-details-system |
| Depends on | TASK-008 |
| Blocks | TASK-012 |

## Goal

Every new Users part is shown in every state on `/dev/components`, and no request can start from it (spec AC12).

## Files to touch

| Path | Action |
|---|---|
| `frontend/src/pages/dev/ComponentsPage/ComponentsPage.tsx` | edit: Users section |
| `frontend/src/pages/dev/ComponentsPage/ComponentsPage.module.css` | edit only if a style is needed (use `composes`, no copy) |

## Approach

- Show `UsersFilters` (empty, with a search, with a role), `UserNameCell` (normal, "You", a 60-character name, no photo), `UserActionsCell` (own row has none), a `Table` of four sample users, and `DeleteUserDialog` open (idle, busy, with a 409 message, with a network message).
- Put the new section inside the existing `NoRequests` wrapper (pattern 22). Sample data is invented names only, no real data.

## Acceptance

- [ ] Every state above is on the page in both themes.
- [ ] Clicking anything on the Users section sends no request (the wrapper stops it).
- [ ] The production build still has no dev page text (`grep -rlF "Compare each section with" frontend/dist` prints nothing).

## Notes

- **Shared columns (a small change in components/users/, outside the two files above).** UsersPage built its five Table columns inline. They now live in `components/users/UserCells/usersColumns.tsx` (`usersColumns({ selfId, onDelete })`), with the `.muted` rule moved from `UsersPage.module.css` to `usersColumns.module.css`. UsersPage calls `usersColumns({ selfId, onDelete: openConfirm })`; its behaviour is unchanged. The dev page uses the same function, so nothing is copied.
- **New section "Users"** (`UserSamples`, after the dashboard blocks): UsersFilters empty, with a search, with a role; UserNameCell with a photo, no photo, "You", a 60-character name, no name; UserActionsCell with Delete and on the viewer's own row (renders nothing); a Table of four invented users (viewer admin with "You" and no Delete, a long-named student, an alumnus, an account with no name, role or date). All of these sit inside `NoRequests`.
- **The delete dialog sits outside `NoRequests`, on purpose.** `Dialog` calls `showModal()` with no portal, so inside the guard its Cancel and confirm presses would be stopped too. Its four opener buttons and its handlers are page-only (close, or a "Nothing was sent" toast), so no request can start. States: idle, busy (confirm ignores presses), 409 and network; the two messages come from `userDeleteFailureText(fixed failure, userDeleteFailureWords(name))`, the same call as UsersPage.
- The page subtitle now names users.html; it still starts with "Compare each section with".
- Checks: `npm run build` passed (tsc -b + vite), style check PASS, lib check 536 passed, and `grep -rlF "Compare each section with" frontend/dist` printed nothing. No browser run: TASK-012 looks at the page in both themes.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-007-frontend-users-about-polish-perf/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-006-5-build-a-component-so-the-dev-page-can-show-it|L-REQ-fs-006-5]]
