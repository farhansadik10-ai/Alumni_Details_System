# TASK-005 — Store: latest-request helper, alumni atoms and actions

| Field | Value |
|---|---|
| REQ | REQ-fs-005 |
| Tier | 1 |
| Status | complete |
| Repo | alumni-details-system |
| Depends on | TASK-004 |
| Blocks | TASK-008, TASK-009, TASK-010, TASK-011 |

## Goal

The directory list, the filter options, one viewed profile and my own profile are atoms with loading, ready, empty and error states; saves are actions that return a result; an older call never overwrites a newer one (AC9, AC10, AC24, AC28, AC30, AC37).

## Files to touch

| Path | Action |
|---|---|
| `frontend/src/store/latestRequest.ts` | create |
| `frontend/src/store/alumniAtoms.ts` | create |
| `frontend/src/store/alumniActions.ts` | create |
| `frontend/src/store/profileAtoms.ts` | edit |
| `frontend/src/store/sessionActions.ts` | edit |

## Approach

- `latestRequest.ts`: `createLatestRequest()` returns `{ begin(), cancel() }`. `begin()` aborts the previous call, makes a new `AbortController` and a ticket number, and returns `{ signal, isCurrent() }`. One instance per loader (list, filters, viewed profile, my profile). Used by every loader below; no loader keeps its own counter.
- `alumniAtoms.ts`: `directoryAtom` = `{ status: "idle" | "loading" | "ready" | "error"; items; total; page; limit; failure }`; `loadDirectoryAtom` (write-only, takes a `DirectoryQuery`, sets `loading` with no items, then `ready` or `error`; a cancelled or not-current answer changes nothing and sets no error). `filtersAtom` and `loadFiltersAtom` (same states). `viewedAlumniAtom` = `loading | ready | notFound | error` and `loadAlumniAtom(id)`; 404 is `notFound`. `myAlumniAtom` = `idle | loading | ready | none | error` and `loadMyAlumniAtom`; 404 is `none`, any other failure is `error`. `resetAlumniAtom` puts all four back to idle and cancels their calls. Loaders never throw.
- `alumniActions.ts`: `saveAlumniProfileAtom(values)` builds the body with `alumniFormToBody`; creates when `myAlumniAtom` is `none`, edits when it is `ready` (id from the atom); on success stores the answer in `myAlumniAtom` and returns `{ ok: true, alumni }`; on a 409 while creating it calls `loadMyAlumniAtom` first and returns `{ ok: false, failure }`; otherwise `{ ok: false, failure }`. It never throws and never navigates. `saveAccountAtom({ name, photoUrl })` trims, sends `null` for an empty photo link, calls `updateUser` with the session's own id, and on success calls `setProfileUserAtom`. Both ignore an answer that arrives after the session changed (compare the session's user id before and after the call, as `loadProfileAtom` does).
- `profileAtoms.ts`: add `setProfileUserAtom` (write-only): replaces `profileAtom` with `{ status: "ready", user }` only when that user is the session's user.
- `sessionActions.ts`: call `resetAlumniAtom` inside the two helper atoms that start and clear a session, in the same step as the profile reset (the existing rule: change several atoms at once, token last). **Also** call it in `tokenChangedElsewhereAtom` at the place where the user id changed and `profileAtom` is reset (ADV-001): otherwise admin B, logging in from another tab, would see admin A's loaded profile in this tab, and a save would be `PUT /api/alumni/<A's id>`, which an admin may do.
- A reload that follows a 409 must not set `loading` (ADV-002): `loadMyAlumniAtom` takes an option `{ quiet: true }` that keeps the current state until the answer arrives, then sets `ready`. The save action uses it.
- Export the failure type the pages need from the store file (pattern 1: pages never import `services/`).

## Acceptance

- [x] AC10: typing twice quickly ends with the second answer; the first call is aborted; no error is shown for the abort (confirmed in the browser review with a slow first answer)
- [x] AC28: after `saveAccountAtom`, `profileAtom.user.name` is the saved name
- [x] AC24 / AC30: create when `none`, edit when `ready`, 409 reloads
- [x] A log out, a second user's log in, and a user switch made in another tab (the `storage` event path) each leave all four atoms idle
- [x] A quiet reload after a 409 never shows `loading`
- [x] No action navigates; no atom file imports `axios`
- [x] `npm run build` and `node scripts/frontend-style-check.mjs` exit 0

## Notes

Rules for every task of this REQ: see TASK-001. G48: StrictMode runs effects twice and an update after `await` can arrive late; the ticket check is what protects it. G37: edit uses the id that `/me` returned.

Implementation notes (TASK-005, 2026-10-08):

- `loadDirectoryAtom` takes `{ params: AlumniListParams; queryKey: string }`: the page (TASK-008) builds the params with TASK-003's `toListParams` and passes its canonical address string; the atom stores it as `queryKey` so the page can tell whose state it is reading (ADV-007). `viewedAlumniAtom` stores `id` for the same reason.
- State shapes are flat, like part 1's `Profile`: `{ status, ...data or null, failure }`. All four have an `idle` status for the reset.
- `cancel()` both aborts and retires the ticket. `getMyAlumni` takes no signal, so for `/me` only the ticket (plus a session user-id check) drops a late answer.
- Quiet reload (ADV-002): no `loading`; a 404 sets `none`; any other failure keeps the current state, so the form and the 409 message stay.
- `setMyAlumniAtom` (new, exported for the action) cancels a running my-profile load before storing a saved profile.
- Both saves return `NOT_READY` (`{ kind: "network" }`) when there is no session or the profile is not `none`/`ready`; the forms are not drawn then. A save answer that arrives after the user changed is returned but not stored.
- `saveAccountAtom` sends an empty name as `null` too (pattern 7), not only the photo link.
- `sessionActions.ts`: the token line of `clearSessionAtom` was left where it was (G48); the reset goes next to the profile reset in all three places.
- Proof: a throwaway harness in the session scratchpad ran the real store with a fake axios adapter: 19 checks pass (abort and ticket, slow first answer, 404 to none, create then edit, 409 quiet reload with no `loading`, AC28, all four idle after log out, a second log in and a switch in another tab; an in-flight `/me` dropped after a switch). One wrong expectation was run once to prove it can fail. `npm run build` and the style check pass.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-005-frontend-directory-and-profiles/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-004-3-401-flag-token-header-timeout|L-REQ-fs-004-3]], [[knowledge/concepts/frontend-session-flow]]; gotchas G37, G48
