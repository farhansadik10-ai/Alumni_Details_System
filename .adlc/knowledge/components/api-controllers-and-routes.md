# API controllers and routes (`backend/src/api/`)

| Field | Value |
|---|---|
| Component | `@alumni/api` — `controllers/*Controller.ts`, `routes/*Routes.ts`, `MiddleWare/`, `utils/requestHelpers.ts` |
| Status | current as of REQ-fs-002 (2026-10-06) |
| Created | 2026-10-06 |

Express routes map URLs to controller functions, which call the Managers. Routes compose `authMiddleware` and `requireRole` per route. Controllers are exported functions with their own `try`/`catch` today; class-based controllers and one error middleware are planned (roadmap B3).

## What to know before changing it

- **Who may do what** (since REQ-fs-002; not yet run against the database by the pipeline):

  | Route | Allowed |
  |---|---|
  | `POST /api/users` (sign-up) | anyone; `role` must be exactly `student` or `alumni` |
  | `PUT /api/users/:id` | that user or an admin |
  | `PUT /api/users/:id/logout` | that user only |
  | `POST /api/alumni` | alumni or admin; the profile belongs to the caller ([[knowledge/gotchas#^g32\|G32]]) |
  | `PUT /api/alumni/:id` | the profile's owner or an admin |
  | `POST /api/posts` | alumni or admin; the author is the caller |
  | `PUT /api/posts/:id` | the author only, admins included (ADR-02) |
  | `DELETE /api/posts/:id` | the author or an admin |
  | `POST /api/comments` | any logged-in user; the author is the caller |
  | `PUT /api/comments/:id` | the author only; changes `content` only |
  | `DELETE /api/comments/:id` | the author or an admin |

- **Owner checks live in the controller**, with `isSelf` and `isAdmin` from `utils/requestHelpers.ts`. Never write the comparison inline: `isSelf` refuses null and empty ids ([[knowledge/lessons/LESSON-REQ-fs-002-4]]). When B3 adds the error middleware the checks can move to the Managers.
- **Order of answers in an update:** 404 (no row), 403 (not allowed), 400 (nothing sent or wrong type), then the write. One exception: `PUT /api/users/:id` answers 403 first, so a non-admin cannot learn which user ids exist.
- **The author always comes from the token** (`req.user.sub`). A `user_id` in a body is ignored on create and cannot be changed on update.
- **Updates read the body through `pickSent`** with a fixed key list and never pass `req.body` on ([[knowledge/lessons/LESSON-REQ-fs-001-3]]). The same list exists in the Query class ([[knowledge/gotchas#^g30|G30]]).
- **A value of only spaces counts as empty** for `email`, `password` and comment `content` (owner's choice, REQ-fs-002).
- **Two error shapes:** controllers answer `{ error }`, the middlewares and login answer `{ message }` ([[knowledge/gotchas#^g29|G29]]). Raw database messages still come through on bad ids and duplicate emails ([[knowledge/gotchas#^g34|G34]]).
- **Create handlers do not type-check their body fields**; only updates do.
- **A self-update of email or password needs no current password**, and a password change does not cancel tokens already issued (valid 1 hour). Accepted in REQ-fs-002; belongs with password reset.

## Touched by

- REQ-fs-002 — owner checks, author from the token, sign-up role check, partial updates, login-stamp route removed, `utils/requestHelpers.ts` added.

## Related

- [[context/architecture]] (Layering rules, Cross-cutting concerns)
- [[knowledge/components/dal-query-classes]]
- [[knowledge/concepts/partial-update-sent-fields]]
- [[architecture/adr-01-sign-up-role-is-student-or-alumni|ADR-01]], [[architecture/adr-02-admin-deletes-any-post-edits-only-own|ADR-02]], [[architecture/adr-03-one-alumni-profile-per-user-created-by-that-user|ADR-03]]

## Backlinks

- REQ-fs-002
