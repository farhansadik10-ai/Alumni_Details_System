# API controllers and routes (`backend/src/api/`)

| Field | Value |
|---|---|
| Component | `@alumni/api` — `controllers/*Controller.ts`, `routes/*Routes.ts`, `MiddleWare/` |
| Status | stub — written at the REQ-fs-002 design gate; `/wrapup` fills in what was learned |
| Created | 2026-10-06 |

Express routes map URLs to controller functions, which call the Managers. Routes compose `authMiddleware` and `requireRole` per route. Controllers are exported functions with their own `try`/`catch` today; class-based controllers and one error middleware are planned (roadmap B3).

## Touched by

- REQ-fs-002 — owner checks, author from the token, sign-up role check, partial updates, login-stamp route removed.

## Related

- [[context/architecture]] (Layering rules, Cross-cutting concerns)
- [[knowledge/components/dal-query-classes]]
- [[knowledge/concepts/partial-update-sent-fields]]

## Backlinks

_(populated by /wrapup or manually)_
