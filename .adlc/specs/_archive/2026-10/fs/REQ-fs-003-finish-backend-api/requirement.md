# Finish the backend API: class controllers, shared errors, alumni search, feed data

| Field | Value |
|---|---|
| REQ | REQ-fs-003 |
| Status | complete — merged 2026-10-07 |
| Phase | wrapup |
| Created | 2026-10-06 |
| Primary repo | alumni-details-system |
| Touched repos | alumni-details-system |
| Roadmap rows | B3, B3a, B4, B5 (`docs/roadmap.md`) |
| Related | [[architecture/adr-02-admin-deletes-any-post-edits-only-own\|ADR-02]], [[architecture/adr-03-one-alumni-profile-per-user-created-by-that-user\|ADR-03]], [[architecture/adr-05-post-list-returns-author-name-and-photo\|ADR-05]], [[architecture/adr-06-deleting-rows-that-other-rows-reference\|ADR-06]], [[architecture/adr-08-mentoring-and-field-stay-two-new-alumni-columns\|ADR-08]], REQ-fs-002 (follow-ups m4, m6) |

## Problem

The new frontend cannot be built on today's API. Four things are missing or wrong, and each one blocks a screen in `docs/design/`:

1. **Errors are inconsistent and leak database text.** Every controller function has its own `try`/`catch`. Controllers answer `{ error }`, the token check, the role check and login answer `{ message }` (G29). A non-numeric id or a duplicate email returns PostgreSQL's own message (G34). Controllers are exported functions, not classes, against the owner's convention.
2. **The directory has nothing to filter on.** The owner added `alumni.mentorship_available` and `alumni.field` to the database, but `db/schema.md`, the DTO and the queries do not know them.
3. **Lists return everything, unsorted.** `GET /api/alumni` and `GET /api/users` return every row with no search, filter, paging or fixed order (G26). There is no way to get the filter choices, the caller's own profile, or the dashboard counts.
4. **The feed has no people in it.** `GET /api/posts` has no author name or photo and its `comment_count` is always 0 (G11). There is no "comments for one post" endpoint (G24). Deleting a post with comments, a comment with replies, or a user with content fails with a raw foreign-key error (G08).

## Goal

After this REQ the backend is complete for the redesign: every screen in `docs/design/` (directory, profile, feed, dashboard, admin users) can be built against it with no further backend work. Controllers are classes, every error leaves through one middleware as `{ error: <message> }` with the right status, and the list, search, stats and feed endpoints below exist and behave as the acceptance criteria say. No file under `frontend/` changes.

## Non-goals

- No frontend change. The legacy Ant Design app is not touched, even where the API it calls changes (see "Known effects on the legacy frontend").
- No schema change by Claude. The two alumni columns were added by the owner; nothing else in the database changes. No `UNIQUE` on `alumni.user_id`, no `ON DELETE CASCADE` (ADR-06).
- No change to who may do what. Every rule in [[knowledge/components/api-controllers-and-routes]] stays as REQ-fs-002 left it.
- No test runner. Proof is `npm run build` plus an API check script the owner runs against the real database.

## Acceptance criteria

Layers stay routes → controllers → Managers → Query classes in every part.

### Part 1 — Class controllers and one error middleware (roadmap B3)

- [ ] **AC1.** `UserController.ts`, `AlumniController.ts`, `PostController.ts` and `CommentController.ts` each export one class. Every handler that exists today is a method of that class. No handler is an exported function any more. Route files bind instance methods.
- [ ] **AC2.** Login is a method of a controller class. `AuthRoutes.ts` has no inline handler. A correct login still answers 200 `{ token }`.
- [ ] **AC3.** One error middleware is registered in `app.ts` after all routes. No controller method has a `try`/`catch` whose job is to pick an HTTP status.
- [ ] **AC4.** Every error response from the API has the body `{ "error": "<message>" }` and no `message` key. This includes: 401 from the token check, 403 from the role check, login failures, a URL under `/api` that matches no route (404), and a request body that is not valid JSON (400).
- [ ] **AC5.** No response contains a raw database message. A failure nobody planned for answers 500 `{ "error": "Internal server error" }`; the detail is written to the server log only.
- [ ] **AC6.** A `:id` that is not a positive whole number (`abc`, `1.5`, `0`, `-3`, `12abc`) answers 400 on every route that has `:id`, and no database query runs.
- [ ] **AC7 (m6).** Sign-up or a user update with an email that is already taken answers 409 `{ "error": "This email is already registered" }`.
- [ ] **AC8.** Sign-up with `email` or `password` missing, empty or not a string answers 400. Login with `email` or `password` missing or not a string answers 400. Wrong email and wrong password both answer 401 with the same message.
- [ ] **AC9.** A lookup that finds nothing answers 404, not 200 with an empty body (G16): `GET /api/users/:id`, `GET /api/users/email/:email`, `GET /api/alumni/:id`, `GET /api/alumni/email/:email`.
- [ ] **AC10.** `POST /api/comments` reads the post's id from the body key `posts_id`, the same name as the column and the answer; the old key `post_id` is not read (closes G13). A post that does not exist answers 404. A `parent_id` that does not exist, or belongs to a different post, answers 400. `content` that is missing, `null`, empty or only spaces answers 400, the same rule as editing a comment. _(Owner, implement gate, 2026-10-07.)_
- [ ] **AC11 (m4).** The user, post and alumni updates take one shared input type that allows `null`. The casts `as Partial<PostDTO>` and `as Partial<AlumniDTO>` are gone from the update paths, and DTO fields for nullable columns are typed as nullable (G31).
- [ ] **AC12.** Every status code and owner check from REQ-fs-002 still holds, apart from the changes named in AC4–AC10.

### Part 2 — New alumni columns (roadmap B3a)

- [ ] **AC13.** `db/schema.md` lists `alumni.mentorship_available` (boolean, not null, default `false`) and `alumni.field` (text, nullable). The schema summary in `.adlc/context/architecture.md` matches.
- [ ] **AC14.** `POST /api/alumni` accepts `mentorship_available` (boolean; left out means `false`) and `field` (string or `null`; left out means `null`). A wrong type answers 400.
- [ ] **AC15.** `PUT /api/alumni/:id` accepts both under the partial-update rules: a field that is not sent keeps its value; `field: null` clears it; `mentorship_available` must be `true` or `false` (`null` is 400).
- [ ] **AC16.** Every alumni read (the list, `/:id`, `/email/:email`, `/me`) and the create and update responses include `mentorship_available` and `field`.
- [ ] **AC17.** The alumni types in `@alumni/shared` include the two fields.

### Part 3 — Search and lists (roadmap B4)

Paging rules for every list in parts 3 and 4: `page` defaults to 1; `limit` defaults to 12; a `limit` above 50 is treated as 50; `page` or `limit` that is not a whole number of 1 or more answers 400. The response is `{ items, total, page, limit }`, where `total` counts every row that matches the filters and `limit` is the value actually used. A page past the end answers 200 with `items: []` and the right `total`.

- [ ] **AC18.** `GET /api/alumni` (any logged-in user) accepts `q`, `department`, `graduation_year`, `field`, `mentoring`, `page`, `limit` and answers with the list shape. Each item has the alumni columns plus the user's `name`, `email` and `photo_url`; never `password`.
- [ ] **AC19.** `q` matches any part of the user's `name`, `current_company` or `job_title`, ignoring letter case. `%` and `_` in `q` are plain characters, not wildcards.
- [ ] **AC20.** `department` and `field` match the whole value. `graduation_year` must be a whole number (else 400). `mentoring=true` keeps only profiles open to mentoring; any other value for `mentoring` answers 400. A filter sent empty counts as not sent. Filters combine with AND.
- [ ] **AC21.** The alumni list has a fixed order: newest profile first (highest `id`). Two calls with the same query return the same order.
- [ ] **AC22.** `GET /api/alumni/filters` (any logged-in user) answers `{ departments, graduation_years, fields }`: the distinct values in use, without `null` or blank ones, sorted ascending (A to Z; years low to high).
- [ ] **AC23.** `GET /api/alumni/me` (any logged-in user) answers the caller's own profile in the same shape as `GET /api/alumni/:id`, or 404 when the caller has none.
- [ ] **AC24.** `POST /api/alumni` by a user who already has a profile answers 409 and creates nothing (ADR-03, G32).
- [ ] **AC25.** `GET /api/users` (admin only) accepts `q` (any part of `name` or `email`, ignoring case), `role` (whole value), `page`, `limit` and answers with the list shape, ordered by `id`. No item has `password`.
- [ ] **AC26.** `GET /api/stats` (any logged-in user) answers `{ alumni, students, posts, mentoring }`: the number of alumni profiles, of users with role `student`, of posts, and of alumni profiles open to mentoring.

### Part 4 — Feed data (roadmap B5)

- [ ] **AC27.** `GET /api/posts` (any logged-in user) accepts `page` and `limit` and answers with the list shape, newest first (`created_at`, then `id`). Each item has the post columns plus the author's `name` and `photo_url` (ADR-05); never `password`.
- [ ] **AC28.** Each post's `comment_count` equals the number of comments on that post, replies included. It is right after a comment is added and after a comment (with or without replies) is deleted.
- [ ] **AC29.** `GET /api/posts/:id/comments` (any logged-in user) answers an array of every comment on that post, replies included, oldest first. Each has the comment columns (with `parent_id`) plus the author's `name` and `photo_url`. A post that does not exist answers 404.
- [ ] **AC30.** `DELETE /api/posts/:id` (author or admin, ADR-02) deletes the post and all its comments and replies. Either all of it happens or none of it (ADR-06).
- [ ] **AC31.** `DELETE /api/comments/:id` (author or admin) deletes the comment and its replies at every level. Either all of it happens or none of it (ADR-06).
- [ ] **AC32.** `PUT /api/posts/:id` stays author-only, admins included (ADR-02).
- [ ] **AC33.** `DELETE /api/users/:id` (admin) for a user who has posts, comments or an alumni profile answers 409 `{ "error": "This user has posts, comments or an alumni profile and cannot be deleted" }` and deletes nothing. A user with none of these is deleted (200). An id with no user answers 404.

### Whole REQ

- [ ] **AC34.** `npm run build` exits 0, and `npx tsc --noEmit` passes for `backend/src/dal` and `backend/src/businessLogic` (G28).
- [ ] **AC35.** SQL is parameterized, lives only in `backend/src/dal/query/`, and uses only tables and columns listed in `db/schema.md`.
- [ ] **AC36.** No file under `frontend/` changes.
- [ ] **AC37.** An API check script is in the repo. It exercises AC2–AC10, AC12, AC14–AC16 and AC18–AC33 over HTTP and prints pass or fail per check. The owner runs it against the real database; Claude does not.
- [ ] **AC38.** `docs/roadmap.md` rows B3, B3a, B4 and B5 are marked done at wrap-up.

## Known effects on the legacy frontend

The legacy app is not changed, so three of its calls will meet new answers. None breaks a screen:

- **Sign-up, email taken.** `frontend/src/services/usersApi.ts` looks for status 400 and the text `User_email_key`. It will now get 409 with a plain message, and falls through to its general error path. `STATUS: needs verification` — that the legacy form shows the server's message.
- **`GET /api/users/:id` for an unknown id** was 200 with an empty body and is now 404. The legacy code throws "User not found" on the empty body; now the request itself fails.
- **Error key.** The legacy error helpers read `message` first, then `error`, so `{ error }` everywhere works.

## Assumptions

- The owner ran `ALTER TABLE alumni ADD COLUMN mentorship_available boolean NOT NULL DEFAULT false, ADD COLUMN field text;` on the real database and checked it (owner, 2026-10-06). Claude does not run `psql`, so the `alumni` block in `db/schema.md` is edited by hand from that statement and marked as such. The owner can paste real `\d alumni` output over it at any time.
- "Class per controller file" covers the four named files. Which class holds login (a new auth controller or `UserController`) is for `/architect`.
- `GET /api/posts` uses the same `{ items, total, page, limit }` shape and the same paging rules as the other lists.
- `GET /api/posts/:id/comments` is a plain array with no paging: the design shows a whole thread under a post.
- Author fields on posts and comments are named `name` and `photo_url`, the same names the alumni reads use ([[knowledge/concepts/user-join-read-shape]]). This closes ADR-05's open question on names, and its open question on comments.
- `limit` above 50 is cut to 50 instead of answering 400.
- In `/api/stats`, "alumni" means alumni profiles (rows in `alumni`), so it lines up with "alumni open to mentoring". "students" means users whose role is `student`.
- `GET /api/alumni/me`: if a user already has more than one profile from before AC24, the one with the lowest `id` is returned.
- The existing `GET /api/comments` (every comment) stays as it is.
- How `comment_count` is kept right (counted when read, or updated on each write) is for `/architect`. So is where the delete transaction lives (ADR-06 open question).
- Starting the API and sending write requests changes the database, so Claude does not run the check script or the server against the real database in this session. Behaviour is proven by the owner's run.

## Open questions

None open. The owner decided these three at the spec gate (2026-10-06):

- [x] AC9 — lookups that find nothing answer 404 (closes G16). Kept.
- [x] AC24 — a second alumni profile is refused with 409 (closes G32). Kept.
- [x] AC21 — the alumni list is newest first. Kept.

## Owner decisions at the implement gate (2026-10-07)

- **Comment body key is `posts_id`.** The owner's own script sent `{ posts_id, content }` and got 400. The key had not been renamed: the code has always read `post_id`, and before this REQ a body with `posts_id` answered 201 while saving a comment attached to no post (G13). The owner's rule: writes and reads use one name, the schema's. AC10 is changed to match. Comments saved that way by earlier test runs may still be in the database with an empty `posts_id`.
- **A new comment needs content.** Missing, `null`, empty or only spaces is 400. AC10 is changed to match.
- **Kept as built:** create type-checks the older alumni and post fields (400 on a wrong type); a login password of only spaces answers 401.

## Out of scope (for now)

- A `GET /api/posts/:id` route (G33).
- A `sort` parameter on any list; paging for the comments of one post.
- A length limit for `alumni.field` (ADR-08 leaves it to the form's REQ).
- An admin creating a profile for someone else (ADR-03).
- How an admin removes a user who has content (ADR-06 open question).
- Type checks on the older create fields beyond what AC8 and AC14 name.
- Stamping `login_at`; password reset; cancelling tokens after a password change.
- Rebuilding the checked-in compiled files in `shared/` — only if `/architect` finds something reads them.

## Related

- Concepts: [[knowledge/concepts/partial-update-sent-fields]], [[knowledge/concepts/user-join-read-shape]]
- Components: [[knowledge/components/api-controllers-and-routes]], [[knowledge/components/dal-query-classes]]
- Gotchas: [[knowledge/gotchas#^g08|G08]], [[knowledge/gotchas#^g11|G11]], [[knowledge/gotchas#^g16|G16]], [[knowledge/gotchas#^g24|G24]], [[knowledge/gotchas#^g25|G25]], [[knowledge/gotchas#^g26|G26]], [[knowledge/gotchas#^g28|G28]], [[knowledge/gotchas#^g29|G29]], [[knowledge/gotchas#^g30|G30]], [[knowledge/gotchas#^g31|G31]], [[knowledge/gotchas#^g32|G32]], [[knowledge/gotchas#^g34|G34]]
- Lessons: [[knowledge/lessons/LESSON-REQ-fs-001-1]] (the build does not check SQL), [[knowledge/lessons/LESSON-REQ-fs-001-4]] (joins and row logs), [[knowledge/lessons/LESSON-REQ-fs-002-1]] (row or undefined), [[knowledge/lessons/LESSON-REQ-fs-002-2]] (password kept out by the column list), [[knowledge/lessons/LESSON-REQ-fs-002-3]] (convert every inline copy), [[knowledge/lessons/LESSON-REQ-fs-002-4]] (null and empty ids)
- ADRs: [[architecture/adr-01-sign-up-role-is-student-or-alumni|ADR-01]], [[architecture/adr-02-admin-deletes-any-post-edits-only-own|ADR-02]], [[architecture/adr-03-one-alumni-profile-per-user-created-by-that-user|ADR-03]], [[architecture/adr-05-post-list-returns-author-name-and-photo|ADR-05]], [[architecture/adr-06-deleting-rows-that-other-rows-reference|ADR-06]], [[architecture/adr-08-mentoring-and-field-stay-two-new-alumni-columns|ADR-08]]

## Backlinks

_(populated by /wrapup or manually)_
