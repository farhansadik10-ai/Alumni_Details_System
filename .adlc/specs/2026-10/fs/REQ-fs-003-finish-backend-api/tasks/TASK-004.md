# TASK-004 — API plumbing: async handler, token util, error middleware, request helpers

| Field | Value |
|---|---|
| REQ | REQ-fs-003 |
| Tier | 1 |
| Status | pending |
| Repo | alumni-details-system |
| Depends on | TASK-002, TASK-003 |
| Blocks | TASK-008, TASK-009, TASK-010, TASK-011 |

## Goal

The API has one error middleware, a wrapper that sends rejected promises to it, a token utility, and the request helpers the controllers will share. The token and role checks answer through the error middleware.

## Files to touch

| Path | Action |
|---|---|
| `backend/src/api/utils/asyncHandler.ts` | create |
| `backend/src/api/utils/token.ts` | create |
| `backend/src/api/MiddleWare/errorMiddleware.ts` | create |
| `backend/src/api/MiddleWare/authMiddleware.ts` | edit |
| `backend/src/api/MiddleWare/roleMiddleware.ts` | edit |
| `backend/src/api/utils/requestHelpers.ts` | edit |
| `backend/src/api/app.ts` | edit |

## Approach

- **`asyncHandler.ts`.** `export function handler<C, K extends keyof C>(controller: C, method: K): RequestHandler` — `K` limited to keys whose value is `(req, res) => unknown`. It returns `(req, res, next) => Promise.resolve(controller[method].call(controller, req, res)).catch(next)`, with the call inside a `try` so a synchronous throw also reaches `next`.
- **`token.ts`.** `signToken(payload: { sub: number; role: string }): string` (1 hour, as today) and `verifyToken(token): { sub: number; role: string }`. Both read `process.env.JWT_SECRET` inside the function; if it is missing they throw a plain `Error` (the middleware answers 500). `verifyToken` catches only `jsonwebtoken`'s own errors (`JsonWebTokenError`, which also covers an expired token) and rethrows them as `UnauthorizedError("Invalid or expired token")`; a missing secret is not turned into a 401. The expiry is a named constant.
- **`errorMiddleware.ts`.** Exports `notFoundHandler` (throws `NotFoundError("Route not found")` via `next`) and `errorMiddleware(err, req, res, next)`:
  1. `res.headersSent` → `next(err)`.
  2. `err instanceof AppError` → `res.status(err.status).json({ error: err.message })`.
  3. body-parser failure (`err.type === "entity.parse.failed"`) → 400 `Request body is not valid JSON`; any other error from Express itself with a 4xx `status` → that status and `Request could not be read`.
  4. `classifyDbError(err)`: `bad_value` / `not_null` → 400 `Invalid value in request`; `unique` / `foreign_key` → 409 `Request conflicts with existing data`. `console.error` the error first.
  5. else `console.error(err)` and 500 `Internal server error`.
  Messages are named constants. No branch sends `err.message` unless `err` is an `AppError`.
- **`authMiddleware.ts`.** Import `verifyToken` from `../utils/token`. No token → `next(new UnauthorizedError("No token provided"))`. Otherwise call `verifyToken` in a `try` and pass whatever it throws to `next` unchanged.
- **`roleMiddleware.ts`.** Wrong role → `next(new ForbiddenError("Forbidden"))`.
- **`requestHelpers.ts`** — add, keeping everything that is there:
  - `parseId(value: unknown, label = "id"): number` — accepts a string of digits only (or a number) that is a positive safe integer; else `ValidationError("Invalid " + label)`.
  - `DEFAULT_PAGE_SIZE = 12`, `MAX_PAGE_SIZE = 50`; `parsePaging(query): { page; limit; offset }` — `page` default 1, `limit` default 12; each, when sent, must be a string of digits ≥ 1 else `ValidationError("page must be a whole number of 1 or more")` (same for `limit`); `limit` above 50 becomes 50.
  - `queryText(query, key): string | undefined` — trimmed string; empty or absent → `undefined`; an array or object value → `ValidationError(key + " must be a single value")`.
  - `isBoolean(value)`.
  - `checkFields<K extends string>(fields: Partial<Record<K, unknown>>, rules: Record<K, (v: unknown) => boolean>): UpdateFields<K>` — throws `ValidationError("<key> has the wrong type")` for the first key that fails its rule; returns the same object typed as `UpdateFields<K>` (import the type from `@alumni/dal`).
- **`app.ts`.** After the last `app.use("/api/...")` line add `app.use("/api", notFoundHandler)` then `app.use(errorMiddleware)`. Leave the route mounts and `dotenv` line as they are.

## Acceptance

- [ ] AC3 (middleware half): `errorMiddleware` is the last `app.use` in `app.ts`
- [ ] AC4: no `{ message: ... }` body is left in `MiddleWare/`; an unknown `/api` URL and a broken JSON body reach `{ error }` by reading the code
- [ ] AC5: only the `AppError` branch sends an error's own message
- [ ] AC6 (helper half): `parseId` refuses `abc`, `1.5`, `0`, `-3`, `12abc`, `""`, `null`
- [ ] `token.ts` has no top-level read of `process.env`; a missing `JWT_SECRET` reaches the 500 branch, not a 401
- [ ] `npx tsc --noEmit -p backend/src/api` reports no error in the seven files of this task (errors in controller or route files are expected until tier 2)

## Notes

- Do not edit controllers or route files here. `UserController` keeps its own `login` / `verifyToken` until TASK-008 removes them; nothing may import them from this task's files.
- `req.user` is still set by `authMiddleware` exactly as before.
- Do not add a dependency. Do not read `.env`.
- Lesson: [[knowledge/lessons/LESSON-REQ-fs-002-4]] — `parseId` must refuse `null` and `""` before any `Number(...)`.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-003-finish-backend-api/architecture]]
- Lessons checked: LESSON-REQ-fs-002-3, LESSON-REQ-fs-002-4
