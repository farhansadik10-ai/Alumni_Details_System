# TASK-005 — Users data layer: search list, delete result, conflict mapping

| Field | Value |
|---|---|
| REQ | REQ-fs-003 |
| Tier | 1 |
| Status | pending |
| Repo | alumni-details-system |
| Depends on | TASK-001, TASK-002, TASK-003 |
| Blocks | TASK-008 |

## Goal

`UserQuery` and `UserManager` can list users with search, role filter and paging, report whether a delete removed a row, and turn a taken email or a user who still has content into a `ConflictError`.

## Files to touch

| Path | Action |
|---|---|
| `backend/src/dal/query/UserQuery.ts` | edit |
| `backend/src/businessLogic/src/UserManager.ts` | edit |

## Approach

- **UserQuery.**
  - Export `type UserUpdateColumn = (typeof UPDATABLE_USER_COLUMNS)[number]`; `updateUser(id, data: UpdateFields<UserUpdateColumn>)`.
  - Replace `getAllUsers` with `listUsers(filter: { q?: string; role?: string }, page: PageRequest): Promise<PageRows<PublicUserDTO>>`. Build conditions and values together: `q` → `(name ILIKE $n OR email ILIKE $n)` with `likePattern(q)` (no `ESCAPE` clause, see TASK-002); `role` → `role = $n`. Run `SELECT COUNT(*)::int AS total FROM "User" <where>` and `SELECT ${PUBLIC_USER_COLUMNS} FROM "User" <where> ORDER BY id LIMIT $n OFFSET $n`.
  - `deleteUser(id): Promise<boolean>` — `rowCount` greater than 0.
- **UserManager.**
  - `listUsers(filter, page)` pass-through; remove `getAllUsers`.
  - `createUser` and `updateUser`: wrap the Query call; when `classifyDbError(err)` is `{ kind: "unique", constraint: "User_email_key" }` throw `ConflictError("This email is already registered")`; rethrow anything else untouched.
  - `deleteUser(id): Promise<boolean>`: when `classifyDbError(err)?.kind === "foreign_key"` throw `ConflictError("This user has posts, comments or an alumni profile and cannot be deleted")`; otherwise return the Query's boolean.
  - `updateUser` and `listUsers` take their parameter types from the Query method itself (`Parameters<UserQuery["updateUser"]>[1]`, `Parameters<UserQuery["listUsers"]>[0]`), so `dal/index.ts` needs no new export and is not edited here.
  - The constraint name and both messages are named constants.

## Acceptance

- [ ] AC7 and AC33 (data half) hold by reading the code
- [ ] AC25 (data half): `q` matches name or email with `ILIKE`; `%` and `_` are escaped; order is by `id`; `password` is in neither statement
- [ ] Every `$n` in the two list statements has a value at the matching position, for all four filter combinations (none, `q`, `role`, both)
- [ ] `npx tsc --noEmit -p backend/src/dal` and `-p backend/src/businessLogic` pass
- [ ] No `SELECT *` on `"User"` other than `findUserWithPasswordByEmail`

## Notes

- `"User"` is always double-quoted. Column names only from `db/schema.md`.
- Do not log rows ([[knowledge/lessons/LESSON-REQ-fs-001-4]]).
- The API workspace will not compile after this task (the controller still calls `getAllUsers`); TASK-008 fixes that. Do not edit controllers.
- Lessons: [[knowledge/lessons/LESSON-REQ-fs-002-1]], [[knowledge/lessons/LESSON-REQ-fs-002-2]].

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-003-finish-backend-api/architecture]]
- Lessons checked: LESSON-REQ-fs-001-1, LESSON-REQ-fs-001-4, LESSON-REQ-fs-002-1, LESSON-REQ-fs-002-2
