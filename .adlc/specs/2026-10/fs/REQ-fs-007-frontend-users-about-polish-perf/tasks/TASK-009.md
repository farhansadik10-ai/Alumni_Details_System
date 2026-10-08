# TASK-009 — Users on the dev components page

| Field | Value |
|---|---|
| REQ | REQ-fs-007 |
| Tier | 3 |
| Status | pending |
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

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-007-frontend-users-about-polish-perf/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-006-5-build-a-component-so-the-dev-page-can-show-it|L-REQ-fs-006-5]]
