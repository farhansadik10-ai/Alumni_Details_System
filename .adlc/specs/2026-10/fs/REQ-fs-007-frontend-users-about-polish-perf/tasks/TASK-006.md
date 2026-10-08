# TASK-006 — Users store: list, clear, reset, delete

| Field | Value |
|---|---|
| REQ | REQ-fs-007 |
| Tier | 1 |
| Status | pending |
| Repo | alumni-details-system |
| Depends on | TASK-003, TASK-005 |
| Blocks | TASK-008 |

## Goal

The Users list and the delete live in atoms, with the rules of patterns 7, 23 and 30, and one admin's list never reaches the next user.

## Files to touch

| Path | Action |
|---|---|
| `frontend/src/store/usersAtoms.ts` | create: `UsersState`, `usersAtom`, `loadUsersAtom({ params, queryKey })`, `clearUsersAtom`, `resetUsersAtom`, `currentUsersVisit()` |
| `frontend/src/store/userActions.ts` | create: `deleteUserAtom(id)` returning `{ ok: true }` or `{ ok: false, failure }` |
| `frontend/src/store/sessionActions.ts` | edit: `set(resetUsersAtom)` beside every `set(resetAlumniAtom)` (three places) |

## Approach

- Copy the shape of `directoryAtom` and `loadDirectoryAtom` in `frontend/src/store/alumniAtoms.ts`: own `createLatestRequest()`, no items while loading, `queryKey` in the state, a cancelled call changes nothing and shows no error.
- `deleteUserAtom`: the same start-of-write guard as `startWrite` in `frontend/src/store/postActions.ts` (the user and the visit must be the same when the answer comes; no session answers `{ ok: false, failure: NOT_READY }` as there). The visit counter goes up in `clearUsersAtom` and `resetUsersAtom`.
- On success or `isGone(failure)` (404): if the state is ready and holds the id, remove the row and lower `total` by one, never below zero. A 409 or any other failure patches nothing.
- The action does not reload the list; the page decides what happens next.
- Import no component or page. Export the `ApiFailure` type like the other store files.

## Acceptance

- [ ] `grep -c "resetAlumniAtom" frontend/src/store/sessionActions.ts` and the same for `resetUsersAtom` give the same number of call lines.
- [ ] `npm run build` and the style check exit 0.
- [ ] A scratch run outside the repo (no network, nothing from `backend/`, no `pg`, no `dotenv`) shows: a late answer for an old key changes nothing; a delete of a held row lowers `total`; a delete of an id not held changes nothing; a 409 patches nothing.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-007-frontend-users-about-polish-perf/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-005-2-store-state-outlives-the-page|L-REQ-fs-005-2]], [[knowledge/lessons/LESSON-REQ-fs-006-2-an-async-answer-may-only-change-its-own-state|L-REQ-fs-006-2]], [[knowledge/gotchas#^g48|G48]], [[knowledge/gotchas#^g56|G56]]
