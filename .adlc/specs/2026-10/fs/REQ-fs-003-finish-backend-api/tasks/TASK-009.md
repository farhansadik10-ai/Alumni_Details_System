# TASK-009 — Alumni controller as a class; search, filters, own profile

| Field | Value |
|---|---|
| REQ | REQ-fs-003 |
| Tier | 2 |
| Status | pending |
| Repo | alumni-details-system |
| Depends on | TASK-004, TASK-006 |
| Blocks | TASK-012 |

## Goal

`AlumniController` is a class; create and update accept the two new fields; the list is searched, filtered and paged; `/filters` and `/me` exist; a second profile is refused.

## Files to touch

| Path | Action |
|---|---|
| `backend/src/api/controllers/AlumniController.ts` | edit |
| `backend/src/api/routes/AlumniRoutes.ts` | edit |

## Approach

- **Field rules, written once** and used by create and update: the seven existing text fields and `field` → `isStringOrNull`; `graduation_year` → `isIntegerOrNull`; `mentorship_available` → `isBoolean`. `UPDATABLE_FIELDS` gains `mentorship_available` and `field` (G30: the Query list got them in TASK-006).
- **Methods** (today's names, no `try`/`catch`):
  - `createAlumni` — `pickSent` + `checkFields` over the nine fields; build the `AlumniDTO` from the checked values (`user_id` from the token; `mentorship_available` defaults to `false`, `field` to `null`); call the Manager. `undefined` back means the user already has a profile → `ConflictError("You already have an alumni profile")`; else 201.
  - `getAllAlumni` — `parsePaging`; `q`, `department`, `field` via `queryText`; `graduation_year` via `queryText` then digits-only → number, else `ValidationError("graduation_year must be a whole number")`; `mentoring`: absent → no filter, `"true"` → `true`, anything else → `ValidationError("mentoring must be true")`. Answer `{ items, total, page, limit }`.
  - `getAlumniFilters` — the Manager's object as it is.
  - `getMyAlumni` — `findAlumniByUserId(req.user.sub)`; none → `NotFoundError("Alumni profile not found")`.
  - `findAlumniById` (`parseId`), `findAlumniByEmail` — none → `NotFoundError("Alumni profile not found")`.
  - `updateAlumni` — `parseId`; then 404, 403, 400 (nothing sent), type checks, write, 404, in today's order with today's messages; typed through `checkFields`, no cast.
- **Routes**, in this order, all with `authMiddleware` and `handler(...)`: `POST /` (with `requireRole("alumni", "admin")` as today), `GET /`, `GET /filters`, `GET /me`, `GET /email/:email`, `GET /:id`, `PUT /:id`.

## Acceptance

- [ ] AC1, AC3 hold for the controller; AC6 for both `:id` routes
- [ ] AC9 (alumni), AC14, AC15, AC16, AC18–AC24 hold by reading the code
- [ ] AC11: no `as Partial<AlumniDTO>` is left
- [ ] AC12: `PUT /api/alumni/:id` is still owner-or-admin, still 404 → 403 → 400; `POST` is still alumni-or-admin and still ignores a `user_id` in the body
- [ ] `/filters` and `/me` are registered before `/:id`
- [ ] `mentorship_available: null` on update is 400 (the rule is `isBoolean`)
- [ ] `npx tsc --noEmit -p backend/src/api` reports no error in these two files

## Notes

- `req.body` never goes to a Manager ([[knowledge/lessons/LESSON-REQ-fs-001-3]]).
- A value of `""` for a filter counts as not sent (`queryText` does this).
- `mentoring=false` is 400 on purpose (spec AC20).

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-003-finish-backend-api/architecture]]
- Lessons checked: LESSON-REQ-fs-001-3, LESSON-REQ-fs-002-3, LESSON-REQ-fs-002-4
