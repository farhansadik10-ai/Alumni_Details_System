# ADR-11 — Code throws typed errors; one middleware turns them into `{ error }` ^ADR-11

| Field | Value |
|---|---|
| Status | accepted |
| Decided | 2026-10-06 (accepted by the owner at the REQ-fs-003 design gate) |
| Author | Claude, for farhansadik10-ai (owner) |
| Supersedes | (none) |
| Superseded by | (none) |
| Based on | REQ-fs-003; the owner's convention "one shared error middleware; no per-method try/catch for HTTP mapping" ([[context/conventions]]); [[knowledge/gotchas#^g29\|G29]], [[knowledge/gotchas#^g34\|G34]] |

## Context

Every controller function catches its own errors and answers `{ error: error.message }`. Three things follow. The message is often PostgreSQL's own text ([[knowledge/gotchas#^g34|G34]]). The token check, the role check and login answer `{ message }` instead ([[knowledge/gotchas#^g29|G29]]). And the status is picked by which `catch` block the error lands in, not by what went wrong.

The owner's convention already says there is one error middleware. What it does not say is how code tells that middleware which status to use, where those error types live given the one-way chain `api` → `businessLogic` → `dal`, and how a database failure becomes a safe answer. The installed Express is 4.22, which does not pass a rejected promise to error middleware by itself.

## Considered options

### Option 1 — Typed errors in `businessLogic`, a database-error classifier in `dal`, one middleware in `api`

`businessLogic/src/errors.ts` holds `AppError(status, message)` and five subclasses (400, 401, 403, 404, 409). Controllers, the two middlewares and Managers throw them. `dal/errors.ts` exports `classifyDbError`, the only code that reads PostgreSQL error codes. The middleware answers `{ error }`: an `AppError` with its own status and message, a classified database error with a fixed plain message (400 or 409), anything else 500 `Internal server error`. A small in-repo wrapper forwards rejected promises.

**Pros:**
- One place decides every error body. No database text can reach a client.
- Managers can refuse a request (duplicate email, user still has content) without knowing Express.
- No new dependency.

**Cons:**
- An HTTP status number sits in a class in `businessLogic`.
- Every route must be wrapped; a missed wrapper means a hanging request.

### Option 2 — Error classes in `api` only; controllers translate everything

**Pros:**
- No status numbers below the API layer.

**Cons:**
- Controllers need `try`/`catch` again to translate what Managers and the database throw, which is what the convention rules out.

### Option 3 — Add the `express-async-errors` package, or move to Express 5

**Pros:**
- No wrapper on each route.

**Cons:**
- A new dependency that patches Express internals, or a major-version upgrade, for a ten-line helper.

## Decision

**We chose Option 1.**

It is the only option that meets the owner's "no per-method try/catch" rule and keeps database text away from clients in every case, including ones nobody planned for. The status number in `businessLogic` is a small price: the classes are named by what happened (`NotFoundError`, `ConflictError`), and the number is read only by the middleware.

## Consequences

| Consequence | Type |
|---|---|
| Every error body is `{ "error": "<message>" }`; the `message` key is gone | new work |
| New refusals are written as `throw new SomethingError("...")`, never `res.status(...).json(...)` | new work |
| Every route's handler goes through `handler(controller, "method")` | new work |
| Only `dal/errors.ts` may read PostgreSQL error codes | trade-off |
| A database failure nobody mapped answers a generic 400, 409 or 500; the detail is only in the server log | trade-off |
| Owner checks stay in controllers for now; they can move to Managers later without changing this model | follow-up |

## Open questions

- [ ] A real logging library in place of `console.error`. Not decided ([[context/conventions]], Logging).

## Related

- Concepts: (none)
- Components: [[knowledge/components/api-controllers-and-routes]], [[knowledge/components/dal-query-classes]]
- Gotchas: [[knowledge/gotchas#^g16|G16]], [[knowledge/gotchas#^g29|G29]], [[knowledge/gotchas#^g34|G34]]
- Lessons: (none)
- ADRs: [[architecture/adr-06-deleting-rows-that-other-rows-reference|ADR-06]]
