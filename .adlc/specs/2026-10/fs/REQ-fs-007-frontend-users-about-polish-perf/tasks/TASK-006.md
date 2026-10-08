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

## Notes

- `sessionActions.ts`: `set(resetUsersAtom)` added at lines 57 (`clearSessionAtom`), 66 (`startSessionAtom`) and 183 (`tokenChangedElsewhereAtom`), each right after `set(resetPostsAtom)`. Three `resetAlumniAtom` call lines, three `resetUsersAtom` call lines.
- One addition beyond the file table: `usersAtoms.ts` also exports `removeUserLocallyAtom(id)` (the patch: ready list holding the id only, `total` never below zero), the same split as `removePostLocallyAtom` in `postAtoms.ts`, so `userActions.ts` changes the list through one atom (G48).
- `loadUsersAtom` takes the services `UserListParams` (role is `string`); `toUserListParams` from `lib/usersQuery.ts` returns a narrower type that fits it, so the page needs no alias.
- `deleteUserAtom` follows `deleteCommentAtom`'s shape: one `failure` variable, `gone = failure === null || isGone(failure)`, patch only when `scope.isCurrent()`. A loading or error list is never patched (removed rows come back right on the next load anyway).
- Scratch check (not shipped): `scratchpad/userscheck/` copied from REQ-fs-006's `storecheck` harness (G56 rules: `net.Socket.connect`, `dns.lookup` and `fetch` throw; ESM and CommonJS resolvers both hooked; `axios`, `pg`, `dotenv`, `backend/` refused; every `services/*.ts` swapped for a fake; `require.cache` probed before the first call and at the end). Run with `node --import <repo>/node_modules/tsx/dist/loader.mjs --import ./register.mjs harness.mjs` (the `dist/esm/index.mjs` entry hooks ESM only and fails on the store's `require`). 22 of 22 pass. Against a copy with the `gone && scope.isCurrent()` guard replaced by `true`, 5 fail (409, network, session change, clear, reset), so the check can fail.
- Not covered by the harness: that the three `sessionActions` places actually run `resetUsersAtom` (loading `sessionActions.ts` would pull in every other store and service); covered by the grep acceptance instead.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-007-frontend-users-about-polish-perf/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-005-2-store-state-outlives-the-page|L-REQ-fs-005-2]], [[knowledge/lessons/LESSON-REQ-fs-006-2-an-async-answer-may-only-change-its-own-state|L-REQ-fs-006-2]], [[knowledge/gotchas#^g48|G48]], [[knowledge/gotchas#^g56|G56]]
