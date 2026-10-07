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

- [x] AC3 (middleware half): `errorMiddleware` is the last `app.use` in `app.ts`
- [x] AC4: no `{ message: ... }` body is left in `MiddleWare/`; an unknown `/api` URL and a broken JSON body reach `{ error }` by reading the code
- [x] AC5: only the `AppError` branch sends an error's own message
- [x] AC6 (helper half): `parseId` refuses `abc`, `1.5`, `0`, `-3`, `12abc`, `""`, `null`
- [x] `token.ts` has no top-level read of `process.env`; a missing `JWT_SECRET` reaches the 500 branch, not a 401
- [x] `npx tsc --noEmit -p backend/src/api` reports no error in the seven files of this task (errors in controller or route files are expected until tier 2)

## Notes

### Implementation notes (2026-10-06)

**How it was checked.** `npx tsc --noEmit -p backend/src/api`: 6 errors, all in `controllers/` (old Manager method names, tier 2's work); none in this task's seven files. Nothing was run against the database and no file that imports the DAL was executed. Two extra checks in the session scratch folder, outside the repo:
- a type-only file proving `handler(obj, "name")` accepts `(req, res)` methods (sync, async, no-argument) and refuses a non-method field, a method with another parameter type, a three-parameter method and an unknown name;
- a copy of the `parseId` and paging expressions run in Node: `abc`, `1.5`, `0`, `-3`, `12abc`, `""`, `null`, `undefined`, `" 5"`, `"5\n"`, `1e3`, `0x10`, `[]`, `[7]`, `{}`, `true`, `NaN`, a 20-digit string all refused; `"7"`, `"007"`, `7` give 7.

**Four places where the code differs a little from the Approach text. Each is the stricter reading.**
1. `checkFields` returns a new object with the same entries, not the same object. That way it needs no cast: each value is also checked to be a string, number, boolean or `null`, so an object or array fails with "<key> has the wrong type" even if a rule would let it through. The first failing key is found in the order of `rules`.
2. `verifyToken` also answers 401 when the token is valid but its payload is not `{ sub: number, role: string }`. Today's code casts without looking. One effect: a token signed with `role: null` is refused. TASK-008 already signs `role ?? ""` (ADV-003), so no new token has that shape.
3. `parsePaging`: a `limit` too long to hold exactly (say 30 digits) becomes 50, as the rule says. A `page` above about 1.8e14 is lowered to that number, so `offset` stays an exact whole number; it answers an empty page instead of a database error.
4. `handler`'s first type parameter is unconstrained and the key type is a mapped type (`ControllerMethodName<C>`), which gives the "keys whose value is `(req, res) => unknown`" limit. Inside, the method is read with one `as ControllerMethod`; the key type already proves it.

**The "other Express error" branch** matches any non-`AppError` value with a whole-number `status` from 400 to 499 (payload too large, a URL that cannot be decoded). It sends that status and the fixed text, never the error's message. It runs before the database test; a PostgreSQL error has no `status`.

**Left alone on purpose.**
- `isSelf` / `toUserId` keep their own looser reader (they accept `"1.5"` and negative numbers, and return `false` rather than throw). Moving them onto `toWholeNumber` would change REQ-fs-002 owner-check behaviour; not asked for here (LESSON-REQ-fs-002-3 says to write down why a sibling stays).
- `findWrongType` stays; `checkFields` replaces it once the tier 2 controllers stop calling it.
- `AuthRoutes.ts` and `UserController.ts` still hold `{ message }` bodies and their own `verifyToken` with a load-time `JWT_SECRET` read. TASK-008 removes them. Nothing in this task's files imports from `UserController`.

**Follow-ups for the owner or a later task.**
- `console.error(err)` in the database branch prints the whole PostgreSQL error. On a NOT NULL or CHECK failure its `detail` is the full failing row; for `"User"` that includes the password hash (CAND-019). Built as the task says. A narrower log line (code, constraint, table, stack) would keep the hash out of the server log.
- `jwt.verify` is called without an `algorithms` list, as before. With a string secret the library allows only the HMAC family, so this is not a hole; pinning `["HS256"]` would be tidier.
- `backend/src/dal/query/listHelpers.ts` `likePattern` is reported broken by CAND-009, 012 and 015. Not this task's file; not touched.

- Do not edit controllers or route files here. `UserController` keeps its own `login` / `verifyToken` until TASK-008 removes them; nothing may import them from this task's files.
- `req.user` is still set by `authMiddleware` exactly as before.
- Do not add a dependency. Do not read `.env`.
- Lesson: [[knowledge/lessons/LESSON-REQ-fs-002-4]] — `parseId` must refuse `null` and `""` before any `Number(...)`.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-003-finish-backend-api/architecture]]
- Lessons checked: LESSON-REQ-fs-002-3, LESSON-REQ-fs-002-4
