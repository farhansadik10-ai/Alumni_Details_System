# Gotchas

Consolidated list of codebase quirks — things that exist for non-obvious reasons and **should not be simplified, removed, or "cleaned up" without understanding why they're there**.

Each entry has a stable `^g##` block anchor. Reference from other vault pages as `[[knowledge/gotchas#^g05|G05]]`.

## How to add an entry

1. Find the highest existing `^g##` anchor and increment.
2. Append a new entry using the shape in `templates/gotcha-template.md`.
3. Link from relevant spec/concept/component pages.
4. Append a line to `hot.md`: `## [DATE] gotcha | G## — title`.

## Distinction from lessons

- **Gotcha:** "this code does X for non-obvious reason Y — don't simplify it." Describes *existing* weirdness.
- **Lesson:** "next time you do X, remember Y." Describes *future* behavior.

Use both. They serve different purposes.

---

## Entries

<!-- Newest entries below this line. Add new ones at the bottom; existing anchors must not be renumbered. -->

G01–G24 were carried over on 2026-10-05 from the retired AI-DLC plan (`AIdlc/plan.md`, deleted; still in git history): its "SQL problems" table and its "Later: backend hardening" list, items L.1 to L.15. Each was re-checked against the backend code on 2026-10-05 and is still true. None has been fixed. "REQ" is `—` because they predate the ADLC pipeline. "Why it exists" is not recorded anywhere for any of them (`STATUS: needs verification`), so that field is left out of the entries below.

Where each old item went:

| Old item | Gotcha | Old item | Gotcha |
|---|---|---|---|
| SQL: `AlumniQuery.createAlumni` | G01 | L.1 password in responses | G17 |
| SQL: `AlumniQuery.updateAlumni` | G02 | L.2 `PUT /api/users/:id` owner check | G18 |
| SQL: `AlumniQuery.findAlumniById` | G03 | L.3 `PUT /api/users/:id/login` | G15 |
| SQL: `AlumniQuery.findAlumniByEmail` | G04 | L.4 sign-up `role` | G14 |
| SQL: `AlumniQuery.getAllAlumni` | G05 | L.5 `PUT /api/alumni/:id` owner check | G19 |
| SQL: `CommentQuery.updateComment` | G06 | L.6 alumni 404 | G16 |
| SQL: `CommentQuery.deleteComment` | G07 | L.7 `graduation_yr` | G12 |
| SQL: deletes with related rows | G08 | L.8 post `user_id` from body | G20 |
| SQL: `UserQuery.updateUser` | G09 | L.9 `PUT /api/posts/:id` owner check | G21 |
| SQL: `PostQuery.updatePost` | G10 | L.10 `updatePost` NULL overwrite | G10 |
| SQL: `PostQuery.updateCommentCount` | G11 | L.11 `comment_count` | G11 |
| Related: `graduation_yr` | G12 | L.12 comment `user_id` from body | G22 |
| Related: `post_id` / `posts_id` | G13 | L.13 comment owner check | G23 |
| Related: sign-up `role` | G14 | L.14 `post_id` / `posts_id` | G13 |
| Related: `/login` route needs no login | G15 | L.15 comments-by-post endpoint | G24 |
| Related: alumni 200 with empty body | G16 | | |

---

## G01 — `AlumniQuery.createAlumni` always fails ^g01

| Field | Value |
|---|---|
| Discovered | 2026-10-02 |
| REQ | — |
| Component | `backend/src/dal/query/AlumniQuery.ts` |
| Status | confirmed |
| Severity | trap (will bite a normal change) |

**What:** The insert can never run: it says `INSER`, targets the table `users` (there is none; the table is `alumni`), and names the columns `graduation_yr?`, `current_company?`, `job_title?`, `experience?`.

**Where:** `backend/src/dal/query/AlumniQuery.ts` → `createAlumni`. Reached by `POST /api/alumni`.

**Why it's surprising:** The route, controller and Manager all exist and look finished, so creating an alumni profile looks like a working feature. Every call returns 400.

**Don't:** Don't build a "create alumni profile" screen on this endpoint before the query is fixed. Use the real names in `db/schema.md` (`alumni`, `graduation_year`).

**Related:** [[knowledge/gotchas#^g02|G02]], [[knowledge/gotchas#^g12|G12]], [[context/architecture]] (Database schema). Origin: SQL problems.

---

## G02 — `AlumniQuery.updateAlumni` always fails ^g02

| Field | Value |
|---|---|
| Discovered | 2026-10-02 |
| REQ | — |
| Component | `backend/src/dal/query/AlumniQuery.ts` |
| Status | confirmed |
| Severity | trap (will bite a normal change) |

**What:** The update targets `users` (no such table), uses `?` in column names and `graduation_yr` instead of `graduation_year`, and its SQL uses `$8` for the id while only 7 values are passed (`id` is never sent). Once repaired as written, it would also set every omitted field to NULL.

**Where:** `backend/src/dal/query/AlumniQuery.ts` → `updateAlumni`. Reached by `PUT /api/alumni/:id`.

**Why it's surprising:** The method takes a `Partial<AlumniDTO>`, which suggests a partial update. It writes all seven columns regardless.

**Don't:** Don't fix only the table name. The parameter list and the NULL overwrite must be fixed in the same change, or a partial edit will wipe the profile.

**Related:** [[knowledge/gotchas#^g01|G01]], [[knowledge/gotchas#^g12|G12]], [[knowledge/gotchas#^g19|G19]]. Origin: SQL problems.

---

## G03 — `AlumniQuery.findAlumniById` reads a table that does not exist ^g03

| Field | Value |
|---|---|
| Discovered | 2026-10-02 |
| REQ | — |
| Component | `backend/src/dal/query/AlumniQuery.ts` |
| Status | confirmed |
| Severity | trap (will bite a normal change) |

**What:** It runs `SELECT * FROM users WHERE id = $1`. There is no `users` table; it must read `alumni`.

**Where:** `backend/src/dal/query/AlumniQuery.ts` → `findAlumniById`. Reached by `GET /api/alumni/:id`.

**Why it's surprising:** `getAllAlumni` in the same class reads `alumni` correctly, so the list works and the detail lookup always fails.

**Don't:** Don't assume the detail endpoint works because the list endpoint does.

**Related:** [[knowledge/gotchas#^g04|G04]], [[knowledge/gotchas#^g16|G16]]. Origin: SQL problems.

---

## G04 — `AlumniQuery.findAlumniByEmail` cannot work without a join ^g04

| Field | Value |
|---|---|
| Discovered | 2026-10-02 |
| REQ | — |
| Component | `backend/src/dal/query/AlumniQuery.ts` |
| Status | confirmed |
| Severity | trap (will bite a normal change) |

**What:** It runs `SELECT * FROM users WHERE email = $1`. There is no `users` table, and `alumni` has no `email` column: the email lives on `"User"`, so the lookup needs a join.

**Where:** `backend/src/dal/query/AlumniQuery.ts` → `findAlumniByEmail`. Reached by `GET /api/alumni/email/:email`.

**Why it's surprising:** Changing `users` to `alumni` looks like the whole fix. It is not, because the column is missing too.

**Don't:** Don't add an `email` column to `alumni` to make this work. No schema change without the owner's approval; join `"User"` instead.

**Related:** [[knowledge/gotchas#^g03|G03]], [[knowledge/gotchas#^g05|G05]]. Origin: SQL problems.

---

## G05 — `AlumniQuery.getAllAlumni` returns no name, email or photo ^g05

| Field | Value |
|---|---|
| Discovered | 2026-10-02 |
| REQ | — |
| Component | `backend/src/dal/query/AlumniQuery.ts` |
| Status | confirmed |
| Severity | careful (check before touching) |

**What:** It runs `SELECT * FROM alumni` with no join to `"User"`, so each row has a `user_id` but no name, email or photo.

**Where:** `backend/src/dal/query/AlumniQuery.ts` → `getAllAlumni`. Reached by `GET /api/alumni`.

**Why it's surprising:** The query works, so the gap only shows when a directory screen tries to display a person.

**Don't:** Don't fill the gap by calling `GET /api/users/:id` once per row from the frontend. When adding the join, never select `password`.

**Related:** [[knowledge/gotchas#^g17|G17]], [[architecture/adr-05-post-list-returns-author-name-and-photo|ADR-05]] (same join decided for posts). Origin: SQL problems.

---

## G06 — `CommentQuery.updateComment` always fails ^g06

| Field | Value |
|---|---|
| Discovered | 2026-10-02 |
| REQ | — |
| Component | `backend/src/dal/query/CommentQuery.ts` |
| Status | confirmed |
| Severity | trap (will bite a normal change) |

**What:** It updates the table `comments` (no such table; it is `comment`), and the SQL has a syntax error: `content=$1 updated_at=NOW()` is missing a comma.

**Where:** `backend/src/dal/query/CommentQuery.ts` → `updateComment`. Reached by `PUT /api/comments/:id`.

**Why it's surprising:** `createComment` and `getAllComments` in the same class use `comment` correctly.

**Don't:** Don't fix only one of the two errors; both stop the query.

**Related:** [[knowledge/gotchas#^g07|G07]], [[knowledge/gotchas#^g23|G23]]. Origin: SQL problems.

---

## G07 — `CommentQuery.deleteComment` uses a table that does not exist ^g07

| Field | Value |
|---|---|
| Discovered | 2026-10-02 |
| REQ | — |
| Component | `backend/src/dal/query/CommentQuery.ts` |
| Status | confirmed |
| Severity | trap (will bite a normal change) |

**What:** It runs `DELETE FROM comments`. The table is `comment`.

**Where:** `backend/src/dal/query/CommentQuery.ts` → `deleteComment`. Reached by `DELETE /api/comments/:id`.

**Why it's surprising:** Same class, two table names: create and list use `comment`, update and delete use `comments`.

**Don't:** Don't stop at the table name. Once it is right, deleting a comment that has replies fails for a second reason (G08).

**Related:** [[knowledge/gotchas#^g06|G06]], [[knowledge/gotchas#^g08|G08]], [[knowledge/gotchas#^g23|G23]]. Origin: SQL problems.

---

## G08 — Deleting a row that other rows point to fails ^g08

| Field | Value |
|---|---|
| Discovered | 2026-10-02 |
| REQ | — |
| Component | `backend/src/dal/query/PostQuery.ts`, `CommentQuery.ts`, `UserQuery.ts`; database |
| Status | confirmed |
| Severity | trap (will bite a normal change) |

**What:** No foreign key has `ON DELETE CASCADE`. Deleting a post that has comments, a comment that has replies, or a user who has posts, comments or an alumni row fails with a foreign-key error.

**Where:** `PostQuery.deletePost`, `CommentQuery.deleteComment`, `UserQuery.deleteUser`, each a single `DELETE`. Constraints are listed in `db/schema.md`.

**Why it's surprising:** Delete works in a quick test on a fresh row and fails only once related rows exist. The controllers return it as a 400 with the raw database message.

**Don't:** Don't add `ON DELETE CASCADE` or any migration. The decided handling is in [[architecture/adr-06-deleting-rows-that-other-rows-reference|ADR-06]]: posts and comments delete their comments / replies in the backend in one transaction; users with related rows are never deleted.

**Related:** [[architecture/adr-06-deleting-rows-that-other-rows-reference|ADR-06]], [[knowledge/gotchas#^g07|G07]]. Origin: SQL problems.

---

## G09 — Editing a user without a password locks them out ^g09

| Field | Value |
|---|---|
| Discovered | 2026-10-02 |
| REQ | — |
| Component | `backend/src/dal/query/UserQuery.ts`, `backend/src/api/controllers/UserController.ts` |
| Status | confirmed |
| Severity | landmine (can cause an outage) |

**What:** `updateUser` always writes `name`, `photo_url`, `password` and `email`. A request that leaves one out sends it as NULL. `password` and `email` are NOT NULL, so that update is rejected; any nullable field left out (`name`, `photo_url`) is silently wiped.

**Where:** `backend/src/dal/query/UserQuery.ts` → `updateUser`; `UserController.updateUser` passes `undefined` for a missing password. Reached by `PUT /api/users/:id`.

**Why it's surprising:** It takes `Partial<UserDTO>` and the controller hashes the password only "if given", which reads like a partial update. The retired plan recorded the effect as "sets the password to NULL and locks the user out"; with the NOT NULL constraint in `db/schema.md` the database should refuse that instead — which of the two happens has not been tested (`STATUS: needs verification`).

**Don't:** Don't build a profile-edit form that sends only the changed fields until this query stops overwriting omitted ones.

**Related:** [[knowledge/gotchas#^g10|G10]], [[knowledge/gotchas#^g18|G18]], [[knowledge/gotchas#^g17|G17]]. Origin: SQL problems.

---

## G10 — `PostQuery.updatePost` overwrites omitted fields with NULL ^g10

| Field | Value |
|---|---|
| Discovered | 2026-10-02 |
| REQ | — |
| Component | `backend/src/dal/query/PostQuery.ts` |
| Status | confirmed |
| Severity | trap (will bite a normal change) |

**What:** The update always sets both `caption` and `media_url`. Leaving one out of the request sets it to NULL.

**Where:** `backend/src/dal/query/PostQuery.ts` → `updatePost`. Reached by `PUT /api/posts/:id`.

**Why it's surprising:** Editing only the caption silently removes the post's media, and nothing reports an error.

**Don't:** Until the query is fixed, any caller must send both `caption` and `media_url` on every edit.

**Related:** [[knowledge/gotchas#^g09|G09]], [[knowledge/gotchas#^g21|G21]]. Origin: SQL problems, L.10.

---

## G11 — `posts.comment_count` is never updated ^g11

| Field | Value |
|---|---|
| Discovered | 2026-10-02 |
| REQ | — |
| Component | `backend/src/dal/query/PostQuery.ts` |
| Status | confirmed |
| Severity | careful (check before touching) |

**What:** `PostQuery.updateCommentCount` exists but nothing calls it, so `comment_count` stays at its default, 0.

**Where:** `backend/src/dal/query/PostQuery.ts` → `updateCommentCount`; no call on comment create or delete.

**Why it's surprising:** The column and the method both exist, so the count looks maintained.

**Don't:** Don't show `comment_count` on a screen as if it were correct. Either call the method on comment create / delete, or compute the count.

**Related:** [[knowledge/gotchas#^g24|G24]]. Origin: SQL problems, L.11.

---

## G12 — The backend says `graduation_yr`; the column is `graduation_year` ^g12

| Field | Value |
|---|---|
| Discovered | 2026-10-02 |
| REQ | — |
| Component | `backend/src/dal/dto/AlumniDTO.ts`, `backend/src/api/controllers/AlumniController.ts`, `backend/src/dal/query/AlumniQuery.ts` |
| Status | confirmed |
| Severity | trap (will bite a normal change) |

**What:** The DTO, the controller and the queries use `graduation_yr`. The real column, and the type in `@alumni/shared`, is `graduation_year` (integer).

**Where:** `AlumniDTO.ts`, `AlumniController.createAlumni` (reads `graduation_yr` from the body), `AlumniQuery.createAlumni` / `updateAlumni`.

**Why it's surprising:** A client that sends the correct name, `graduation_year`, has the value dropped by the controller.

**Don't:** Don't rename the database column to match the code. The schema is the source of truth; fix the three backend files together.

**Related:** [[knowledge/gotchas#^g01|G01]], [[knowledge/gotchas#^g02|G02]]. Origin: SQL problems (related), L.7.

---

## G13 — Comments take `post_id` in the request but the column is `posts_id` ^g13

| Field | Value |
|---|---|
| Discovered | 2026-10-02 |
| REQ | — |
| Component | `backend/src/api/controllers/CommentController.ts` |
| Status | confirmed |
| Severity | trap (will bite a normal change) |

**What:** `POST /api/comments` and `PUT /api/comments/:id` read `post_id` from the body. The column, the DTO field and the response field are `posts_id`.

**Where:** `backend/src/api/controllers/CommentController.ts` → `createComment`, `updateComment`.

**Why it's surprising:** The same value has one name going in and another coming out. A client that sends `posts_id` creates a comment attached to no post.

**Don't:** Don't "fix" one side without the other. Until they are aligned, send `post_id` and read `posts_id`.

**Related:** [[knowledge/gotchas#^g24|G24]]. Origin: SQL problems (related), L.14.

---

## G14 — Sign-up takes `role` from the request body ^g14

| Field | Value |
|---|---|
| Discovered | 2026-10-02 |
| REQ | — |
| Component | `backend/src/api/controllers/UserController.ts` |
| Status | confirmed |
| Severity | landmine (can cause an outage) |

**What:** `POST /api/users` is public and stores whatever `role` the body contains, so anyone can register as `admin`.

**Where:** `backend/src/api/controllers/UserController.ts` → `createUser`; route in `backend/src/api/routes/UserRoutes.ts`.

**Why it's surprising:** A sign-up form that offers only student and alumni looks safe. The limit is in the UI only.

**Don't:** Don't rely on the form. [[architecture/adr-01-sign-up-role-is-student-or-alumni|ADR-01]] decides that admin is never selectable; the backend must enforce it.

**Related:** [[architecture/adr-01-sign-up-role-is-student-or-alumni|ADR-01]]. Origin: SQL problems (related), L.4.

---

## G15 — `PUT /api/users/:id/login` needs no login ^g15

| Field | Value |
|---|---|
| Discovered | 2026-10-02 |
| REQ | — |
| Component | `backend/src/api/routes/UserRoutes.ts` |
| Status | confirmed |
| Severity | careful (check before touching) |

**What:** The route that stamps `login_at` has no `authMiddleware`. Anyone can set any user's login time.

**Where:** `backend/src/api/routes/UserRoutes.ts` (`router.put("/:id/login", updateLoginTime)`); the code comment says "called during login flow, no token yet".

**Why it's surprising:** Every other write on `/api/users/:id` requires a token. Nothing calls this route: `POST /api/auth/login` does not stamp `login_at` either.

**Don't:** Don't call it from the frontend. Review it (remove it, or stamp `login_at` inside the login itself) before anything depends on `login_at`.

**Related:** [[knowledge/gotchas#^g18|G18]]. Origin: SQL problems (related), L.3.

---

## G16 — Alumni lookups return 200 with an empty body when nothing is found ^g16

| Field | Value |
|---|---|
| Discovered | 2026-10-02 |
| REQ | — |
| Component | `backend/src/api/controllers/AlumniController.ts` |
| Status | confirmed |
| Severity | careful (check before touching) |

**What:** `findAlumniById` and `findAlumniByEmail` send `res.status(200).json(alumni)` even when `alumni` is `undefined`. A missing record is a 200 with no body, not a 404.

**Where:** `backend/src/api/controllers/AlumniController.ts`. The user lookups in `UserController.ts` (`findUserById`, `findUserByEmail`) behave the same way.

**Why it's surprising:** The `catch` block returns 404, which reads as "not found is handled". It only runs when the query throws.

**Don't:** Don't treat a 200 from these endpoints as "found". Check for an empty body until they return 404.

**Related:** [[knowledge/gotchas#^g03|G03]], [[knowledge/gotchas#^g04|G04]]. Origin: SQL problems (related), L.6.

---

## G17 — User endpoints return the password hash ^g17

| Field | Value |
|---|---|
| Discovered | 2026-10-02 |
| REQ | — |
| Component | `backend/src/dal/query/UserQuery.ts`, `backend/src/api/controllers/UserController.ts` |
| Status | confirmed |
| Severity | landmine (can cause an outage) |

**What:** Every user query uses `SELECT *` or `RETURNING *`, and the controllers send the row as it is. Create, get all, get by id, get by email and update all return the `password` column (the bcrypt hash).

**Where:** `UserQuery.createUser`, `findUserByEmail`, `findUserById`, `updateUser`, `getAllUsers`; the matching functions in `UserController.ts`.

**Why it's surprising:** `GET /api/users/:id` is open to any logged-in user, so any user can read any other user's hash.

**Don't:** Don't add a join to `"User"` with `SELECT *`. No endpoint may return `password`. The login path still needs the hash internally, so don't remove it from `findUserByEmail` without giving login another way to read it.

**Related:** [[knowledge/gotchas#^g05|G05]], [[architecture/adr-05-post-list-returns-author-name-and-photo|ADR-05]]. Origin: L.1.

---

## G18 — Any logged-in user can update any user ^g18

| Field | Value |
|---|---|
| Discovered | 2026-10-02 |
| REQ | — |
| Component | `backend/src/api/routes/UserRoutes.ts`, `backend/src/api/controllers/UserController.ts` |
| Status | confirmed |
| Severity | landmine (can cause an outage) |

**What:** `PUT /api/users/:id` checks only that a token is present. It does not compare `:id` with `req.user.sub`, so a student can change another user's email or password.

**Where:** `backend/src/api/routes/UserRoutes.ts` (comment: "ideally check self/admin inside controller"); `UserController.updateUser`.

**Why it's surprising:** A UI that only links to "my profile" hides the hole; the API does not.

**Don't:** Don't treat the UI as the guard. Allow only the owner or an admin.

**Related:** [[knowledge/gotchas#^g09|G09]], [[knowledge/gotchas#^g19|G19]], [[knowledge/gotchas#^g21|G21]], [[knowledge/gotchas#^g23|G23]]. Origin: L.2.

---

## G19 — Any logged-in user can update any alumni profile ^g19

| Field | Value |
|---|---|
| Discovered | 2026-10-02 |
| REQ | — |
| Component | `backend/src/api/routes/AlumniRoutes.ts`, `backend/src/api/controllers/AlumniController.ts` |
| Status | confirmed |
| Severity | trap (will bite a normal change) |

**What:** `PUT /api/alumni/:id` has `authMiddleware` only: no role check, no owner check. Students can call it. `updateAlumni` also passes `req.body` straight to the Manager.

**Where:** `backend/src/api/routes/AlumniRoutes.ts` (comment: "ideally check ownership in controller too"); `AlumniController.updateAlumni`.

**Why it's surprising:** Creating a profile is limited to alumni and admin on the same router; editing one is not. It is masked today because the query itself fails (G02).

**Don't:** Don't fix G02 without adding the owner-or-admin check in the same change, or the hole opens the moment the query works.

**Related:** [[knowledge/gotchas#^g02|G02]], [[architecture/adr-03-one-alumni-profile-per-user-created-by-that-user|ADR-03]]. Origin: L.5.

---

## G20 — `POST /api/posts` takes `user_id` from the body ^g20

| Field | Value |
|---|---|
| Discovered | 2026-10-02 |
| REQ | — |
| Component | `backend/src/api/controllers/PostController.ts` |
| Status | confirmed |
| Severity | trap (will bite a normal change) |

**What:** The author of a new post is whatever `user_id` the request says, not the logged-in user (`req.user.sub`). An alumni can post as anyone.

**Where:** `backend/src/api/controllers/PostController.ts` → `createPost`.

**Why it's surprising:** The route requires a token and a role, so the author looks verified.

**Don't:** Don't design the frontend to choose the author. Take `user_id` from `req.user.sub`.

**Related:** [[knowledge/gotchas#^g22|G22]]. Origin: L.8.

---

## G21 — Any logged-in user can edit any post ^g21

| Field | Value |
|---|---|
| Discovered | 2026-10-02 |
| REQ | — |
| Component | `backend/src/api/routes/PostRoutes.ts`, `backend/src/api/controllers/PostController.ts` |
| Status | confirmed |
| Severity | trap (will bite a normal change) |

**What:** `PUT /api/posts/:id` checks only the token. `deletePost` checks owner or admin; `updatePost` checks nothing, so a student can edit anyone's post.

**Where:** `backend/src/api/routes/PostRoutes.ts` (comment: "ownership check ideally in controller"); `PostController.updatePost`.

**Why it's surprising:** Delete on the same resource is protected, so edit looks protected too.

**Don't:** Don't copy the delete rule as it is. [[architecture/adr-02-admin-deletes-any-post-edits-only-own|ADR-02]]: an admin may delete any post but edit only their own, so edit is owner-only.

**Related:** [[architecture/adr-02-admin-deletes-any-post-edits-only-own|ADR-02]], [[knowledge/gotchas#^g10|G10]]. Origin: L.9.

---

## G22 — `POST /api/comments` takes `user_id` from the body ^g22

| Field | Value |
|---|---|
| Discovered | 2026-10-02 |
| REQ | — |
| Component | `backend/src/api/controllers/CommentController.ts` |
| Status | confirmed |
| Severity | trap (will bite a normal change) |

**What:** The author of a new comment is the `user_id` in the request, not `req.user.sub`. Any logged-in user can comment as anyone.

**Where:** `backend/src/api/controllers/CommentController.ts` → `createComment`.

**Why it's surprising:** Same as G20: the token is checked, the author is not.

**Don't:** Don't send or trust `user_id` from the client. Take it from `req.user.sub`.

**Related:** [[knowledge/gotchas#^g20|G20]], [[knowledge/gotchas#^g13|G13]]. Origin: L.12.

---

## G23 — Any logged-in user can edit or delete any comment ^g23

| Field | Value |
|---|---|
| Discovered | 2026-10-02 |
| REQ | — |
| Component | `backend/src/api/routes/CommentRoutes.ts`, `backend/src/api/controllers/CommentController.ts` |
| Status | confirmed |
| Severity | trap (will bite a normal change) |

**What:** `PUT` and `DELETE /api/comments/:id` check only the token: no owner check, no role check.

**Where:** `backend/src/api/routes/CommentRoutes.ts` (comment: "ownership check ideally in controller"); `CommentController.updateComment`, `deleteComment`.

**Why it's surprising:** It is masked today because both queries fail (G06, G07). Fixing the SQL alone turns a broken feature into an open one.

**Don't:** Don't fix G06 / G07 without the check: edit is owner-only; delete is owner or admin.

**Related:** [[knowledge/gotchas#^g06|G06]], [[knowledge/gotchas#^g07|G07]], [[architecture/adr-06-deleting-rows-that-other-rows-reference|ADR-06]]. Origin: L.13.

---

## G24 — There is no "comments for one post" endpoint ^g24

| Field | Value |
|---|---|
| Discovered | 2026-10-02 |
| REQ | — |
| Component | `backend/src/api/routes/CommentRoutes.ts`, `backend/src/dal/query/CommentQuery.ts` |
| Status | confirmed |
| Severity | careful (check before touching) |

**What:** The only read is `GET /api/comments`, which returns every comment in the system. Showing one post's comments means downloading all of them and filtering by `posts_id` on the client.

**Where:** `backend/src/api/routes/CommentRoutes.ts`; `CommentQuery.getAllComments`.

**Why it's surprising:** A comment thread per post is the only way comments are shown, and it has no endpoint of its own.

**Don't:** Don't treat client-side filtering as the design. It is a stopgap until a comments-by-post endpoint exists.

**Related:** [[knowledge/gotchas#^g11|G11]], [[knowledge/gotchas#^g13|G13]]. Origin: L.15.
