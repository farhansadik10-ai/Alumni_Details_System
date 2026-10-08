# TASK-003 — usersQuery: the Users address

| Field | Value |
|---|---|
| REQ | REQ-fs-007 |
| Tier | 1 |
| Status | pending |
| Repo | alumni-details-system |
| Depends on | TASK-002 |
| Blocks | TASK-006, TASK-008 |

## Goal

`readUsersQuery`, `writeUsersQuery`, `toUserListParams` and `hasUsersCriteria` read and write `q`, `role` and `page` in the address, and a bad value never gets through.

## Files to touch

| Path | Action |
|---|---|
| `frontend/src/lib/usersQuery.ts` | create |
| `scripts/frontend-lib-check.ts` | edit: cases |

## Approach

- Model on `frontend/src/lib/directoryQuery.ts`. `UsersQuery = { q: string; role: "" | "student" | "alumni" | "admin"; page: number }`; default `{ q: "", role: "", page: 1 }`.
- `q` is read trimmed; a repeated key reads as empty. `role` is accepted only when it is exactly one of the three words (lower case); anything else reads as "". `page` goes through `readPageParam`.
- Write: only set values, page 1 left out, key order `q`, `role`, `page`.
- `toUserListParams` mirrors the server query (`q`, `role`, `page`); `limit` is never sent. The `UserListParams` type is repeated here because `lib/` does not import `services/` (as `DirectoryListParams` is).
- `hasUsersCriteria(query)`: `q !== "" || role !== ""`.
- Cases (typed from this list): page `0`, `01`, `abc`, `2`, `99999999`; repeated `q`; `role=ADMIN`, `role=teacher`, `role=admin`; `q` of spaces only; a round trip of each query; the defaults write an empty string.

## Acceptance

- [ ] The library check passes with the new cases.
- [ ] One case was shown to fail with a deliberately wrong expectation, in a copy outside the repo (L-REQ-fs-003-4).
- [ ] The three role words are defined once (reuse `Role` from `lib/token.ts`; export a `ROLES` list there if none is exported).

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-007-frontend-users-about-polish-perf/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-003-1-write-the-check-from-the-spec-not-the-code|L-REQ-fs-003-1]], [[knowledge/lessons/LESSON-REQ-fs-003-4-a-check-must-be-able-to-fail|L-REQ-fs-003-4]]
