# TASK-008 — Auth and user controllers as classes; user routes

| Field | Value |
|---|---|
| REQ | REQ-fs-003 |
| Tier | 2 |
| Status | pending |
| Repo | alumni-details-system |
| Depends on | TASK-004, TASK-005 |
| Blocks | TASK-012 |

## Goal

Login is a method of `AuthController`; `UserController` is a class whose methods throw typed errors; the user list is searched and paged; empty lookups are 404; a bad `:id` is 400.

## Files to touch

| Path | Action |
|---|---|
| `backend/src/api/controllers/AuthController.ts` | create |
| `backend/src/api/controllers/UserController.ts` | edit |
| `backend/src/api/routes/AuthRoutes.ts` | edit |
| `backend/src/api/routes/UserRoutes.ts` | edit |

## Approach

- **AuthController** (`export class AuthController`, one `UserManager` field). `login(req, res)`: `email` and `password` must each be a non-empty string, else `ValidationError("Email and password are required")`. `findUserForLogin(email)`; no user, or `bcrypt.compare` false → `UnauthorizedError("Invalid email or password")` (one message for both). Answer 200 `{ token: signToken({ sub: user.id, role: user.role ?? "" }) }` (`role` is nullable in the database; a user with no role gets no role's rights, as today).
- **UserController** (`export class UserController`). Remove `login`, `verifyToken`, the `jsonwebtoken` import and `JWT_SECRET`. Methods keep today's names; no `try`/`catch`:
  - `createUser` — role check as today (same message); then `email` and `password` must be non-empty strings → `ValidationError("Email and password are required")`; hash; create; 201.
  - `getAllUsers` — `parsePaging(req.query)`, `queryText(req.query, "q")`, `queryText(req.query, "role")`; `listUsers`; answer `{ items: rows, total, page, limit }`.
  - `findUserById` — `parseId`; nothing found → `NotFoundError("User not found")`.
  - `findUserByEmail` — nothing found → `NotFoundError("User not found")`.
  - `updateUser` — `parseId` first; then the 403 check, `pickSent`, the 400 checks, hashing and the 404, in today's order and with today's messages. Build the typed fields with `checkFields` (rules: `email`, `password` → `isNonEmptyString`; `name`, `photo_url` → `isStringOrNull`), keeping the message `"<field> must be a non-empty string"` for the two required ones.
  - `deleteUser` — `parseId`; `false` from the Manager → `NotFoundError("User not found")`; else 200 `{ message: "User deleted successfully" }`.
  - `updateLogoutTime` — `parseId`; not self → `ForbiddenError` with today's message.
- **Routes.** One instance per file; every handler is `handler(instance, "method")`. `AuthRoutes`: `router.post("/login", handler(auth, "login"))`, no inline function. `UserRoutes`: same paths, middlewares and order as today.

## Acceptance

- [ ] AC1, AC2, AC3 hold for these four files: no exported handler function, no inline handler, no `try`/`catch`
- [ ] AC6: every method that reads `req.params.id` starts with `parseId`
- [ ] AC7, AC8, AC9 (users), AC25, AC33 hold by reading the code
- [ ] AC12: `PUT /api/users/:id` still answers 403 before 400 and 404; `PUT /:id/logout` is still self-only; sign-up still refuses any role but `student` / `alumni`
- [ ] No `res.status(4xx)` or `res.status(5xx)` call is left in the two controllers
- [ ] Nothing imports `login` or `verifyToken` from `UserController` (search `backend/src`)
- [ ] `npx tsc --noEmit -p backend/src/api` reports no error in these four files

## Notes

- `password` never appears in an answer: the Manager results are already password-free; do not add fields.
- Do not log request bodies.
- The login answer shape `{ token }` and the token payload `{ sub, role }` must not change: the legacy frontend reads them.
- Lessons: [[knowledge/lessons/LESSON-REQ-fs-002-3]] (convert every inline copy), [[knowledge/lessons/LESSON-REQ-fs-002-4]].

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-003-finish-backend-api/architecture]]
- Lessons checked: LESSON-REQ-fs-001-3, LESSON-REQ-fs-002-2, LESSON-REQ-fs-002-3, LESSON-REQ-fs-002-4
