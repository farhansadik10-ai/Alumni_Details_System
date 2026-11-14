# TASK-003 — Typed errors in businessLogic

| Field | Value |
|---|---|
| REQ | REQ-fs-003 |
| Tier | 0 |
| Status | pending |
| Repo | alumni-details-system |
| Depends on | — |
| Blocks | TASK-004, TASK-005 |

## Goal

`@alumni/businesslogic` exports the error classes that Managers, controllers and middlewares throw (ADR-11).

## Files to touch

| Path | Action |
|---|---|
| `backend/src/businessLogic/src/errors.ts` | create |
| `backend/src/businessLogic/index.ts` | edit |

## Approach

- `export class AppError extends Error` with `readonly status: number`; constructor `(status, message)`; sets `this.name` to the class name.
- Five subclasses, each taking only a message: `ValidationError` (400), `UnauthorizedError` (401), `ForbiddenError` (403), `NotFoundError` (404), `ConflictError` (409). Status numbers are named constants, not literals scattered in the classes.
- Export all six from `index.ts`.

## Acceptance

- [x] `npx tsc --noEmit -p backend/src/businessLogic` passes
- [x] `new NotFoundError("x") instanceof AppError` is true by construction, and `.status` is 404
- [x] No Manager file is edited in this task

## Notes

- Nothing here imports Express.
- Implemented 2026-10-06. `npx tsc --noEmit -p backend/src/businessLogic` exited 0 with no output.
- `this.name` is set once in `AppError` with `new.target.name`, so each subclass gets its own name without repeating the line.
- The `instanceof` criterion was checked by reading, not by running: `NotFoundError extends AppError` and the root `tsconfig.json` targets ESNext, so native class inheritance from `Error` keeps the prototype chain. No code was executed to prove it.
- The five status constants are private to `errors.ts` (not exported); the task asked only for the six classes.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-003-finish-backend-api/architecture]]
- Lessons checked: —
