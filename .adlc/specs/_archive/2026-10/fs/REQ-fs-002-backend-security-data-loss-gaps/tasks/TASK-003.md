# TASK-003 — Users: no password, partial update, sign-up role, owner checks, remove login route

| Field | Value |
|---|---|
| REQ | REQ-fs-002 |
| Tier | 1 |
| Status | complete |
| Repo | alumni-details-system |
| Depends on | TASK-001, TASK-002 |
| Blocks | TASK-007 |

## Goal

No user endpoint returns or logs `password`; a user update changes only what was sent and only for self or admin; sign-up takes only student or alumni; logout is self-only; the login-stamp route is gone.

## Files to touch

| Path | Action |
|---|---|
| `backend/src/dal/dto/UserDTO.ts` | edit — add `export type PublicUserDTO = Omit<UserDTO, "password">` |
| `backend/src/dal/index.ts` | edit — export the type |
| `backend/src/dal/query/UserQuery.ts` | edit |
| `backend/src/businessLogic/src/UserManager.ts` | edit |
| `backend/src/api/controllers/UserController.ts` | edit |
| `backend/src/api/routes/UserRoutes.ts` | edit |

## Approach

- **UserQuery.** Add a constant with the public columns: `id, name, email, role, photo_url, login_at, logout_at, created_at, updated_at`. Use it in place of `*` in `createUser` (`RETURNING`), `findUserById`, `findUserByEmail`, `getAllUsers`, `updateUser` (`RETURNING`); type them as `PublicUserDTO`. Add `findUserWithPasswordByEmail(email): Promise<UserDTO | undefined>` (`SELECT *`), for login only. Rewrite `updateUser(id, data)` with `buildUpdateSet(data, ["name","email","password","photo_url"])`; when nothing was sent, run no `UPDATE` and return `findUserById(id)`. Delete the `console.log(user)` in `getAllUsers`. Delete `updateLoginTime`.
- **UserManager.** Add `findUserForLogin(email)`, which calls `findUserWithPasswordByEmail`. Delete `updateLoginTime`.
- **UserController.**
  - `login`: use `findUserForLogin`.
  - `createUser`: constant `SIGNUP_ROLES = ["student", "alumni"]`; if `role` is not exactly one of them, 400 `{ error: "Role must be student or alumni" }`, before hashing.
  - `updateUser`: `id = Number(req.params.id)`; if not `isSelf(req, id)` and not `isAdmin(req)`, 403 `{ error: "Not authorized to update this user" }`. `fields = pickSent(req.body, ["name","email","password","photo_url"])`; empty gives 400 `{ error: "No fields to update" }`. If `email` or `password` is in `fields` and is not a non-empty string, 400. If `name` or `photo_url` is in `fields` and is not a string or `null`, 400 `{ error: "<field> has the wrong type" }`. Hash `password` when present. Call `userManager.updateUser(id, fields)`; no row gives 404 `{ error: "User not found" }`. Do not build a `UserDTO` here.
  - `updateLogoutTime`: if not `isSelf(req, id)`, 403.
  - Delete `updateLoginTime`.
- **UserRoutes.** Delete the `/:id/login` line and its import. Update the comment on `PUT /:id` (the check now exists).

## Acceptance

- [ ] AC1, AC2, AC3, AC6, AC7 hold for `PUT /api/users/:id` by reading the code
- [ ] AC8: no `SELECT *` or `RETURNING *` on `"User"` except in `findUserWithPasswordByEmail`; that method has exactly one caller chain, ending in `login`
- [ ] AC9: `login` still compares against `user.password` from the login-only read
- [ ] AC10: no `console.log` left in `UserQuery.ts`
- [ ] AC11, AC12: the role check is an exact match and runs before `bcrypt.hash`
- [ ] AC13, AC17 (users), AC24 hold by reading the code
- [ ] AC21: a search for `updateLoginTime` in `backend/src/**/*.ts` finds only the commented line in `TestManager.ts`
- [ ] Every column name in the new SQL is in the `"User"` table of `db/schema.md`
- [ ] `npm run build` exits 0

## Notes

- Order on `PUT /api/users/:id` is 403 first, then 400, then 404 from the write. A non-admin never gets 404 on someone else's id; only an admin does (architecture, Approach 4). AC17 for users is tested as an admin.
- `password` and `email` are NOT NULL in the database; the 400 for `null` or empty must come from the controller, not from a database error.
- `GET /api/users/email/:email` and `GET /api/users/:id` keep their current status codes (G16 is out of scope).
- Do not touch `TestManager.ts`, `frontend/` or `shared/`.
- Gotchas: G09, G14, G15, G17, G18.

### Implementation notes (task-implementer, 2026-10-06)

- `UserQuery.updateUser` and `UserManager.updateUser` take `Record<string, unknown>`, not `Partial<UserDTO>`. `UserDTO` types `name` and `photo_url` as `string`, so a `null` (AC6: clear a nullable field) would need a cast. The value types are checked in the controller; the column names come from `UPDATABLE_USER_COLUMNS` in the Query.
- `findUserById` is now typed `PublicUserDTO | undefined` (it always could return `undefined`). `updateUser` returns the same, which is what the controller's 404 reads. `GET /api/users/:id` behaviour is unchanged (still 200 with an empty body for a missing id, G16).
- The 400 for a bad `email` / `password` says `"<field> must be a non-empty string"`. The task file fixed the status but not the text. A string of only spaces counts as empty (`isNonEmptyString` trims).
- The salt rounds `10` became the constant `PASSWORD_SALT_ROUNDS` because the line was being edited anyway (conventions: no magic numbers). Same value, same behaviour.
- `UserRoutes.ts`: the `PUT /:id/logout` line also got a comment ("self only"), the second stale comment the architecture's blast radius mentions.
- `findUserWithPasswordByEmail` is not typed as public; its only caller is `UserManager.findUserForLogin`, whose only caller is `UserController.login`. Checked with a search over `backend/src/**/*.ts`.
- Not changed, still true: the `catch` in `updateUser` returns the raw database message as 400 (for example a duplicate `email`, or a `name` over 100 characters). Roadmap B3 covers it. `login` with no `password` in the body still throws inside `bcrypt.compare`; unchanged and out of scope.
- SQL column check against `db/schema.md` → `"User"`: `id, name, email, password, role, photo_url, login_at, logout_at, created_at, updated_at` — all ten exist; the public list is those minus `password`. Not run against the database (the owner's manual checklist, TASK-007).
- Build: `npm run build` exited 0 with all four Tier 1 tasks' edits in the tree.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-002-backend-security-data-loss-gaps/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-001-1]], [[knowledge/lessons/LESSON-REQ-fs-001-4]]
