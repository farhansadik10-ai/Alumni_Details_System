# API controllers and routes (`backend/src/api/`)

| Field | Value |
|---|---|
| Component | `@alumni/api` — `controllers/*Controller.ts`, `routes/*Routes.ts`, `MiddleWare/`, `utils/` |
| Status | current as of REQ-fs-003 (2026-10-07) |
| Created | 2026-10-06 |

Express routes map URLs to methods of controller classes, which call the Managers. A controller method reads the request, checks, calls a Manager and sends the answer; to refuse, it throws a typed error. One error middleware turns every error into `{ "error": "<message>" }` ([[architecture/adr-11-typed-errors-and-one-error-middleware|ADR-11]]). Paged lists answer `{ items, total, page, limit }` ([[architecture/adr-12-list-endpoints-answer-items-total-page-limit|ADR-12]]).

Everything below was run against the real database by the owner on 2026-10-07 (his own script, including 14 admin checks, and `scripts/api-check.mjs`).

## The pieces

| File | Job |
|---|---|
| `controllers/{Auth,User,Alumni,Post,Comment,Stats}Controller.ts` | one class each; no `try`/`catch` |
| `routes/*Routes.ts` | one instance per file; every handler is `handler(instance, "method")` |
| `utils/asyncHandler.ts` | `handler(...)`: binds the method and sends a rejected promise to `next` (Express 4 does not) |
| `MiddleWare/errorMiddleware.ts` | `notFoundHandler` and `errorMiddleware`, registered last in `app.ts` |
| `MiddleWare/authMiddleware.ts`, `roleMiddleware.ts` | pass `UnauthorizedError` / `ForbiddenError` to `next` |
| `utils/token.ts` | `signToken`, `verifyToken`; reads `JWT_SECRET` inside the functions ([[knowledge/gotchas#^g40\|G40]]) |
| `utils/requestHelpers.ts` | `parseId`, `parsePaging`, `queryText`, `queryFilterValue`, `pickSent`, `checkFields`, `isSelf`, `isAdmin`, role constants |

## Who may do what

| Route | Allowed |
|---|---|
| `POST /api/auth/login` | anyone; answers `{ token }` |
| `POST /api/users` (sign-up) | anyone; `role` must be exactly `student` or `alumni`; `email` and `password` required |
| `GET /api/users` | admin; `q`, `role`, `page`, `limit` |
| `GET /api/users/:id` | any logged-in user |
| `GET /api/users/email/:email` | admin |
| `PUT /api/users/:id` | that user or an admin |
| `DELETE /api/users/:id` | admin; 409 if the user has posts, comments or a profile |
| `PUT /api/users/:id/logout` | that user only; answers an empty 200 ([[knowledge/gotchas#^g41\|G41]]) |
| `POST /api/alumni` | alumni or admin; the profile belongs to the caller; a second one is 409 |
| `GET /api/alumni`, `/filters`, `/me`, `/:id`, `/email/:email` | any logged-in user ([[knowledge/gotchas#^g42\|G42]]: the email is in every answer) |
| `PUT /api/alumni/:id` | the profile's owner or an admin |
| `POST /api/posts` | alumni or admin; the author is the caller |
| `GET /api/posts`, `GET /api/posts/:id/comments` | any logged-in user |
| `PUT /api/posts/:id` | the author only, admins included (ADR-02) |
| `DELETE /api/posts/:id` | the author or an admin; takes the post's comments with it |
| `POST /api/comments` | any logged-in user; body key `posts_id`; `content` required |
| `GET /api/comments` | any logged-in user; every comment, unpaged |
| `PUT /api/comments/:id` | the author only; changes `content` only |
| `DELETE /api/comments/:id` | the author or an admin; takes every reply under it |
| `GET /api/stats` | any logged-in user |

There is still no `GET /api/posts/:id` route ([[knowledge/gotchas#^g33|G33]]).

## Where each rule lives

The owner decided at the REQ-fs-003 review gate (finding M3) to leave rules where they are and write it down. Managers are thin: they pass calls through, except `UserManager`.

| Rule | Lives in |
|---|---|
| Owner checks (`isSelf`, `isAdmin`), body and query checks, id parsing | controllers |
| A comment's post must exist (404); its parent must be on the same post (400); content required | `CommentController.createComment` |
| One alumni profile per user | `AlumniQuery.createAlumni` (lock, check, insert); it returns nothing and `AlumniController` throws the 409 |
| Email already taken → 409; user still has content → 409 | `UserManager` (maps the database's own refusal, so it holds when two requests race) |
| Deleting a post or comment takes what is under it | `PostQuery.deletePost`, `CommentQuery.deleteComment` |

## What to know before changing it

- **Refuse by throwing.** `throw new NotFoundError("...")` and its siblings from `@alumni/businesslogic`. Never `res.status(4xx).json(...)`. Never a `try`/`catch` that picks a status.
- **Wrap every route.** A handler registered without `handler(...)` hangs the request when it rejects.
- **Order of answers in an update:** 400 for a bad `:id`, then 404 (no row), 403 (not allowed), 400 (nothing sent or wrong type), then the write. One exception: `PUT /api/users/:id` answers 403 before 404, so a non-admin cannot learn which user ids exist.
- **The author always comes from the token** (`req.user.sub`). A `user_id` in a body is ignored.
- **Bodies are read through `pickSent` and `checkFields`** with a fixed key list; `req.body` never goes to a Manager. `checkFields` has two traps ([[knowledge/gotchas#^g35|G35]]). The same key list exists in the Query class ([[knowledge/gotchas#^g30|G30]]).
- **Creates are type-checked too** since REQ-fs-003 (alumni, posts, comments): a wrong type is 400, not a database error.
- **Ids** from the URL or a body go through `parseId`: a positive whole number up to 2147483647, as a number or a string of digits.
- **Paging** goes through `parsePaging`: default 12, above 50 becomes 50, a bad number is 400. Filter rules: [[knowledge/gotchas#^g39|G39]].
- **Fixed paths go above `/:id`** in a route file ([[knowledge/gotchas#^g36|G36]]).
- **A value of only spaces counts as empty** for `email`, `password` on sign-up and update, and comment `content`. Login does not trim the password: a wrong one is 401, never 400.
- **The error middleware logs a short summary of a database error, never the error itself** ([[knowledge/lessons/LESSON-REQ-fs-003-5]]).
- **A self-update of email or password needs no current password**, and a password change does not cancel tokens already issued (valid 1 hour). Accepted in REQ-fs-002; belongs with password reset.
- **Accepted as is (REQ-fs-003 review):** the status numbers 400 and 409 are written in both `businessLogic/src/errors.ts` and `errorMiddleware.ts`; a write is read back in three slightly different ways across the Query classes.

## Touched by

- REQ-fs-002 — owner checks, author from the token, sign-up role check, partial updates, login-stamp route removed, `utils/requestHelpers.ts` added.
- REQ-fs-003 — class controllers, `AuthController`, the error middleware and typed errors, `handler(...)`, `utils/token.ts`, paging and search, `/filters`, `/me`, `/api/stats`, comments of a post, 404 on empty lookups, 409 answers, `posts_id` as the comment body key.

## Related

- [[context/architecture]] (Layering rules, Cross-cutting concerns)
- [[knowledge/components/dal-query-classes]]
- [[knowledge/concepts/partial-update-sent-fields]], [[knowledge/concepts/paged-list-query]], [[knowledge/concepts/user-join-read-shape]]
- [[architecture/adr-01-sign-up-role-is-student-or-alumni|ADR-01]], [[architecture/adr-02-admin-deletes-any-post-edits-only-own|ADR-02]], [[architecture/adr-03-one-alumni-profile-per-user-created-by-that-user|ADR-03]], [[architecture/adr-06-deleting-rows-that-other-rows-reference|ADR-06]], [[architecture/adr-11-typed-errors-and-one-error-middleware|ADR-11]], [[architecture/adr-12-list-endpoints-answer-items-total-page-limit|ADR-12]]

## Backlinks

- REQ-fs-002, REQ-fs-003
