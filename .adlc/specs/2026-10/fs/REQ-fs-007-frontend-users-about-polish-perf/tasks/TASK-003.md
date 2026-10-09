# TASK-003 — usersQuery: the Users address

| Field | Value |
|---|---|
| REQ | REQ-fs-007 |
| Tier | 1 |
| Status | done |
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

- [x] The library check passes with the new cases.
- [x] One case was shown to fail with a deliberately wrong expectation, in a copy outside the repo (L-REQ-fs-003-4).
- [x] The three role words are defined once (reuse `Role` from `lib/token.ts`; export a `ROLES` list there if none is exported).

## Notes

- `ROLES` in `lib/token.ts` was module-private; it is now exported (one word added, no behaviour change). `usersQuery.ts` reads the role with `ROLES.find(role => role === value) ?? ""`, the same test `toRole` uses.
- `UserListParams` in `lib/usersQuery.ts` has the same name as the one in `services/userService.ts` (as the task says), but types `role` as `Role` and has no `limit`. A file that imports both must alias one.
- 36 new cases (block "REQ-fs-007 TASK-003"); library check 529 passed, 0 failed. Extra cases beyond the list: `role=admin%20`, a repeated `role`, `role=student` / `role=alumni`, `toUserListParams` and `hasUsersCriteria`.
- Fail proof: a copy in the session scratchpad with imports rewritten to absolute paths and the `role=ADMIN` case expecting `"admin"`: 528 passed, 1 failed, exit 1.
- `npm run build` and `node scripts/frontend-style-check.mjs` pass.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-007-frontend-users-about-polish-perf/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-003-1-write-the-check-from-the-spec-not-the-code|L-REQ-fs-003-1]], [[knowledge/lessons/LESSON-REQ-fs-003-4-a-check-must-be-able-to-fail|L-REQ-fs-003-4]]
