# Close the security and data-loss gaps in the backend

| Field | Value |
|---|---|
| REQ | REQ-fs-002 |
| Status | validated |
| Phase | spec |
| Created | 2026-10-06 |
| Primary repo | alumni-details-system |
| Touched repos | alumni-details-system |
| Related | [[knowledge/gotchas#^g02\|G02]], [[knowledge/gotchas#^g09\|G09]], [[knowledge/gotchas#^g10\|G10]], [[knowledge/gotchas#^g14\|G14]], [[knowledge/gotchas#^g15\|G15]], [[knowledge/gotchas#^g17\|G17]], [[knowledge/gotchas#^g18\|G18]], [[knowledge/gotchas#^g19\|G19]], [[knowledge/gotchas#^g20\|G20]], [[knowledge/gotchas#^g22\|G22]], [[knowledge/gotchas#^g23\|G23]], [[architecture/adr-01-sign-up-role-is-student-or-alumni\|ADR-01]], [[architecture/adr-02-admin-deletes-any-post-edits-only-own\|ADR-02]], [[architecture/adr-03-one-alumni-profile-per-user-created-by-that-user\|ADR-03]] |

## Problem

The backend has holes that lose data or let one user act as another. They are all live today and the new frontend will be built on these endpoints.

- **Data loss.** `PUT /api/users/:id`, `PUT /api/posts/:id` and `PUT /api/alumni/:id` write every column on every call. A field the request leaves out is written as NULL: editing only a post's caption removes its media; editing one alumni field wipes the other six; a user edit without a password is rejected or wipes `name` / `photo_url` (G02, G09, G10).
- **Password hash in responses.** Sign-up, get all users, get by id, get by email and update all return the `password` column. `GET /api/users/:id` is open to any logged-in user, so anyone can read anyone's hash (G17). `UserQuery.getAllUsers` also prints every user row, hash included, to the server log.
- **Anyone can register as admin.** `POST /api/users` is public and stores whatever `role` the body says (G14).
- **Missing owner checks.** Any logged-in user can update any user (G18), any alumni profile (G19), and edit or delete any comment (G23). G19 and G23 became reachable when REQ-fs-001 fixed the SQL.
- **Author taken from the request.** New posts and comments use the `user_id` in the body, so a user can post or comment as someone else (G20, G22).
- **A write with no login.** `PUT /api/users/:id/login` has no token check. Anyone on the network can stamp any user's `login_at` (G15). Nothing in the repo calls this route.

## Goal

After this REQ, a partial update changes only the fields that were sent; no API response or server log contains a password hash; sign-up creates only student or alumni accounts; a user can change only their own user record, alumni profile and comments (admins as listed below); the author of a new post or comment is always the logged-in user; and no route that writes to the database can be called without a token, apart from sign-up and login. The database schema and the frontend are untouched.

## Non-goals

- No database schema change and no migration. No UNIQUE on `alumni.user_id`, no cascade deletes.
- No frontend change, legacy or new. No change to `@alumni/shared` types unless a backend type needs it to compile.
- No move to controller classes or a shared error middleware. Those conventions are target rules and are their own REQ; this REQ keeps the current controller style.
- No change to how deletes handle related rows ([[architecture/adr-06-deleting-rows-that-other-rows-reference|ADR-06]], G08). Deleting a comment that has replies still fails.

## Acceptance criteria

"Sent" means the key is present in the JSON body. "Owner" means the logged-in user (`sub` in the token) is the user the row belongs to.

### Partial updates (G02, G09, G10)

- [ ] AC1 — `PUT /api/users/:id` with only some of `name`, `email`, `password`, `photo_url` changes only those columns (plus `updated_at`). Every column not sent keeps its value.
- [ ] AC2 — `PUT /api/users/:id` without `password` leaves the stored hash unchanged; the user can still log in with the old password.
- [ ] AC3 — `PUT /api/users/:id` never changes `role`, whatever the body contains.
- [ ] AC4 — `PUT /api/posts/:id` with only `caption` keeps `media_url`, and with only `media_url` keeps `caption`. It never changes the post's `user_id`.
- [ ] AC5 — `PUT /api/alumni/:id` with any subset of `department`, `graduation_year`, `current_company`, `job_title`, `experience`, `bio`, `linkedin_url` changes only those columns. It never changes `user_id`.
- [ ] AC6 — On all three, a nullable field sent as `null` is cleared. `email` or `password` sent as `null` or an empty string is rejected with 400 and nothing is written.
- [ ] AC7 — On all three, a body with none of the updatable fields writes nothing to the row.

### Password never leaves the backend (G17)

- [ ] AC8 — No response from any endpoint contains a `password` key. This covers `POST /api/users`, `GET /api/users`, `GET /api/users/:id`, `GET /api/users/email/:email`, `PUT /api/users/:id`, and every posts, comments and alumni endpoint.
- [ ] AC9 — Login still works: `POST /api/auth/login` with correct credentials returns a token; with a wrong password it returns 401.
- [ ] AC10 — No code path writes a user row or a password hash to the console.

### Sign-up role (G14, ADR-01)

- [ ] AC11 — `POST /api/users` with `role` of `student` or `alumni` creates the user with that role.
- [ ] AC12 — `POST /api/users` with any other `role` (including `admin`, a different letter case, or no role) returns 400 and creates no user.

### Owner checks (G18, G19, G23)

- [ ] AC13 — `PUT /api/users/:id` succeeds only when the caller is that user or an admin. Anyone else gets 403 and nothing is written.
- [ ] AC14 — `PUT /api/alumni/:id` succeeds only when the caller owns that profile (`alumni.user_id` is the caller) or is an admin. Anyone else gets 403 and nothing is written.
- [ ] AC15 — `PUT /api/comments/:id` succeeds only for the comment's author. Everyone else, admins included, gets 403.
- [ ] AC16 — `DELETE /api/comments/:id` succeeds only for the comment's author or an admin. Anyone else gets 403 and the comment stays.
- [ ] AC17 — On the four routes above, an `:id` that matches no row returns 404, not 200. One exception, decided by the owner at the design gate (2026-10-06): on `PUT /api/users/:id` the 403 comes first, so a non-admin gets 403 for any id that is not their own, whether or not it exists; only an admin gets the 404.

### Author comes from the token (G20, G22)

- [ ] AC18 — `POST /api/posts` stores the caller's id as `user_id`. A `user_id` in the body is ignored.
- [ ] AC19 — `POST /api/comments` stores the caller's id as `user_id`. A `user_id` in the body is ignored.
- [ ] AC20 — `PUT /api/comments/:id` changes only `content`; it cannot move a comment to another user, post or parent.

### `PUT /api/users/:id/login` (G15)

- [ ] AC21 — The route is removed, together with the controller, Manager and Query code that only it uses. A request to it without a token can no longer change any row.

### Additions — not in the original request; the owner added all three at the spec gate (2026-10-06)

These are the same kind of hole, sitting next to the ones listed.

- [ ] AC22 — `PUT /api/posts/:id` succeeds only for the post's author; everyone else, admins included, gets 403, and a missing id gets 404 (G21, [[architecture/adr-02-admin-deletes-any-post-edits-only-own|ADR-02]]). Without this, AC4 repairs an endpoint that any logged-in user can still use on anyone's post.
- [ ] AC23 — `POST /api/alumni` stores the caller's id as `user_id`; a `user_id` in the body is ignored ([[architecture/adr-03-one-alumni-profile-per-user-created-by-that-user|ADR-03]]). Today an alumni can create a profile under another user's id.
- [ ] AC24 — `PUT /api/users/:id/logout` succeeds only when the caller is that user; anyone else gets 403. Today any logged-in user can stamp any user's `logout_at`.

### Whole-change checks

- [ ] AC25 — `npm run build` exits 0.
- [ ] AC26 — `db/schema.md` is unchanged and no SQL names a table or column that is not in it.
- [ ] AC27 — No file under `frontend/` changes.
- [ ] AC28 — Every SQL statement stays parameterized and inside `backend/src/dal/query/`; nothing skips the route → controller → Manager → Query order.

## Assumptions

- `req.user.sub` is the numeric `"User".id` and `req.user.role` is the stored role. Read from `UserController.login` and `authMiddleware`.
- Nothing calls `PUT /api/users/:id/login`: a search of `backend/src`, `frontend/src` and `shared/` finds only its own definition. `login_at` is shown nowhere. So removing the route breaks no caller. The owner chose "remove it" at the spec gate (2026-10-06); stamping `login_at` inside `POST /api/auth/login` was offered and not chosen.
- A field sent as `null` means "clear it" (AC6). This lets a user remove a photo or a bio. Confirmed by the owner at the spec gate (2026-10-06).
- Sign-up with a bad or missing role is rejected rather than quietly stored as `student` (AC12). ADR-01 allows either "reject or ignore"; the owner chose reject at the spec gate (2026-10-06).
- The legacy frontend may break where it relied on these holes (for example, sending only some fields is now safe, but sending `role: "admin"` at sign-up now fails). That is accepted: the legacy screens are being replaced.
- There is no test runner. "Done" means the build passes, the SQL is checked by eye against `db/schema.md`, and the owner runs a manual checklist against the real database ([[knowledge/lessons/LESSON-REQ-fs-001-1]]). Claude does not run database-changing commands in this session.

## Open questions

- [x] Which status code for an update whose body has no updatable field (AC7)? **400**, chosen by the owner at the design gate (2026-10-06).

## Out of scope (for now)

- G08 / ADR-06 — deleting a post with comments or a comment with replies.
- G11 — `comment_count` is never updated.
- G13 — comments take `post_id` in the body but return `posts_id`.
- G16, G27 — "not found" returning 200 on the endpoints this REQ does not add an owner check to (user and alumni lookups).
- G24 — no comments-by-post endpoint. G26 — alumni list has no order.
- "One alumni profile per user" (ADR-03) is still not enforced.
- `GET /api/users/:id` stays open to any logged-in user; it just stops returning the hash.
- `"User".email` is case-sensitive, so the same address in another letter case can register twice.
- Password strength rules, rate limiting on login, and the 1-hour token lifetime.
- `console.log` of post and comment rows in `PostQuery.getAllPosts` and `CommentQuery.getAllComments` (no password in them).

## Related

- Concepts: [[knowledge/concepts/user-join-read-shape]]
- Components: [[knowledge/components/dal-query-classes]]
- Lessons: [[knowledge/lessons/LESSON-REQ-fs-001-1]] (a passing build does not check SQL), [[knowledge/lessons/LESSON-REQ-fs-001-2]] (list what a fix makes reachable — the reason for AC22), [[knowledge/lessons/LESSON-REQ-fs-001-3]] (`req.body` passed straight through — `AlumniController.updateAlumni`), [[knowledge/lessons/LESSON-REQ-fs-001-4]] (rows printed to the log — AC10)
- ADRs: [[architecture/adr-01-sign-up-role-is-student-or-alumni|ADR-01]], [[architecture/adr-02-admin-deletes-any-post-edits-only-own|ADR-02]], [[architecture/adr-03-one-alumni-profile-per-user-created-by-that-user|ADR-03]], [[architecture/adr-06-deleting-rows-that-other-rows-reference|ADR-06]]
- Gotchas: G02, G09, G10, G14, G15, G17, G18, G19, G20, G21, G22, G23 in [[knowledge/gotchas]]

## Backlinks

_(populated by /wrapup or manually)_
