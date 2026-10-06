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

### Implementation notes (task-implementer, 2026-10-06)

- **Open problem, not in this task's files: `%` and `_` are not escaped yet.** `backend/src/dal/query/listHelpers.ts:24` reads `text.replace(/[\%_]/g, "\$&")` on disk: one backslash where TASK-002 meant two. The regex matches only `%` and `_` and replaces each with itself. That one expression, evaluated alone in Node on `50%_a\b`, gives the same text back. Effect on `listUsers`: `q=%` matches every user, `q=_` any one character. The value is still bound, so there is no injection. `listUsers` calls the helper as designed and needs no change once the line is fixed. The "`%` and `_` are escaped" part of AC25 stays unticked until then. TASK-006 and TASK-007 found the same thing.
- **The `$n` count, by reading.** `q` pushes one value and uses its position twice. `role` pushes one. `LIMIT` and `OFFSET` are `values.length + 1` and `+ 2`.

  | Filter | WHERE | Count values | Page statement | Page values |
  |---|---|---|---|---|
  | none | (none) | `[]` | `LIMIT $1 OFFSET $2` | `[limit, offset]` |
  | `q` | `(name ILIKE $1 OR email ILIKE $1)` | `[pattern]` | `LIMIT $2 OFFSET $3` | `[pattern, limit, offset]` |
  | `role` | `role = $1` | `[role]` | `LIMIT $2 OFFSET $3` | `[role, limit, offset]` |
  | both | `(... $1 ... $1) AND role = $2` | `[pattern, role]` | `LIMIT $3 OFFSET $4` | `[pattern, role, limit, offset]` |

- **Names checked against `db/schema.md`:** `"User"`, `id`, `name`, `email`, `role`; constraint `User_email_key`. `password` is in neither list statement; the only `SELECT *` on `"User"` is still `findUserWithPasswordByEmail`.
- **A filter key is "sent" when it is not `undefined`.** An empty `q` would give the pattern `%%`, which matches every user. Dropping an empty or blank `q` and `role` is the controller's job (TASK-008).
- **Delete maps any foreign-key refusal, not one by name.** Three constraints can refuse a user delete (`alumni_user_id_fkey`, `posts_user_id_fkey`, `comment_user_id_fkey`) and all mean the same 409.
- **Two small additions beyond the Approach:** `UserQuery.ts` exports a named `UserListFilter` interface for the `{ q?, role? }` shape (the Manager still reads it through `Parameters<...>`, so `dal/index.ts` is untouched), and the two email-conflict catches share one private function, `mapEmailConflict`, in `UserManager.ts`.
- **For TASK-008:** `UserManager.getAllUsers` is gone; `listUsers(filter, page)` returns `{ rows, total }`. `deleteUser` returns `false` for an id with no user (answer 404). `updateUser` takes `UpdateFields<"name" | "email" | "password" | "photo_url">`.
- **Checks run:** `npx tsc --noEmit -p backend/src/dal` exit 0; `npx tsc --noEmit -p backend/src/businessLogic` exit 0. No SQL was executed.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-003-finish-backend-api/architecture]]
- Lessons checked: LESSON-REQ-fs-001-1, LESSON-REQ-fs-001-4, LESSON-REQ-fs-002-1, LESSON-REQ-fs-002-2
