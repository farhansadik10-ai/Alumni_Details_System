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

G01–G24 were carried over on 2026-10-05 from the retired AI-DLC plan (`AIdlc/plan.md`, deleted; still in git history): its "SQL problems" table and its "Later: backend hardening" list, items L.1 to L.15. Each was re-checked against the backend code on 2026-10-05 and was true then. REQ-fs-001 (2026-10-05) fixed G01, G03, G04, G05, G06, G07 and G12 and half of G02; each entry's Status row says where it stands. "REQ" is `—` because they predate the ADLC pipeline. "Why it exists" is not recorded anywhere for any of them (`STATUS: needs verification`), so that field is left out of the entries below.

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
| Status | fixed by REQ-fs-001 (2026-10-05) — kept for history |
| Severity | trap (will bite a normal change) |

**What:** The insert can never run: it says `INSER`, targets the table `users` (there is none; the table is `alumni`), and names the columns `graduation_yr?`, `current_company?`, `job_title?`, `experience?`.

**Where:** `backend/src/dal/query/AlumniQuery.ts` → `createAlumni`. Reached by `POST /api/alumni`.

**Why it's surprising:** The route, controller and Manager all exist and look finished, so creating an alumni profile looks like a working feature. Every call returns 400.

**Don't:** Don't build a "create alumni profile" screen on this endpoint before the query is fixed. Use the real names in `db/schema.md` (`alumni`, `graduation_year`).

**Update 2026-10-05 (REQ-fs-001):** The insert now targets `alumni` with the schema's column names. Confirmed by the owner's 39-check run against the real database (2026-10-06, 39 passed).

**Related:** [[knowledge/gotchas#^g02|G02]], [[knowledge/gotchas#^g12|G12]], [[context/architecture]] (Database schema). Origin: SQL problems.

---

## G02 — `AlumniQuery.updateAlumni` always fails ^g02

| Field | Value |
|---|---|
| Discovered | 2026-10-02 |
| REQ | — |
| Component | `backend/src/dal/query/AlumniQuery.ts` |
| Status | fixed by REQ-fs-001 and REQ-fs-002 (2026-10-06) — kept for history |
| Severity | trap (will bite a normal change) |

**What:** The update targets `users` (no such table), uses `?` in column names and `graduation_yr` instead of `graduation_year`, and its SQL uses `$8` for the id while only 7 values are passed (`id` is never sent). Once repaired as written, it would also set every omitted field to NULL.

**Where:** `backend/src/dal/query/AlumniQuery.ts` → `updateAlumni`. Reached by `PUT /api/alumni/:id`.

**Why it's surprising:** The method takes a `Partial<AlumniDTO>`, which suggests a partial update. It writes all seven columns regardless.

**Don't:** Don't fix only the table name. The parameter list and the NULL overwrite must be fixed in the same change, or a partial edit will wipe the profile.

**Update 2026-10-05 (REQ-fs-001):** The table, column names and `$8` binding are fixed, so the update now runs. It still writes all seven columns: any field the request leaves out is set to NULL. The owner chose at the spec gate to leave that for a later REQ. Callers must send all seven fields.

**Update 2026-10-06 (REQ-fs-002):** `updateAlumni` writes only the columns that were sent. `null` clears a field; a body with no updatable field is 400. Confirmed by the owner's 39-check run against the real database (2026-10-06, 39 passed).

**Related:** [[knowledge/gotchas#^g01|G01]], [[knowledge/gotchas#^g12|G12]], [[knowledge/gotchas#^g19|G19]]. Origin: SQL problems.

---

## G03 — `AlumniQuery.findAlumniById` reads a table that does not exist ^g03

| Field | Value |
|---|---|
| Discovered | 2026-10-02 |
| REQ | — |
| Component | `backend/src/dal/query/AlumniQuery.ts` |
| Status | fixed by REQ-fs-001 (2026-10-05) — kept for history |
| Severity | trap (will bite a normal change) |

**What:** It runs `SELECT * FROM users WHERE id = $1`. There is no `users` table; it must read `alumni`.

**Where:** `backend/src/dal/query/AlumniQuery.ts` → `findAlumniById`. Reached by `GET /api/alumni/:id`.

**Why it's surprising:** `getAllAlumni` in the same class reads `alumni` correctly, so the list works and the detail lookup always fails.

**Don't:** Don't assume the detail endpoint works because the list endpoint does.

**Update 2026-10-05 (REQ-fs-001):** Reads `alumni` joined to `"User"`, filtered by `alumni.id`.

**Related:** [[knowledge/gotchas#^g04|G04]], [[knowledge/gotchas#^g16|G16]]. Origin: SQL problems.

---

## G04 — `AlumniQuery.findAlumniByEmail` cannot work without a join ^g04

| Field | Value |
|---|---|
| Discovered | 2026-10-02 |
| REQ | — |
| Component | `backend/src/dal/query/AlumniQuery.ts` |
| Status | fixed by REQ-fs-001 (2026-10-05) — kept for history |
| Severity | trap (will bite a normal change) |

**What:** It runs `SELECT * FROM users WHERE email = $1`. There is no `users` table, and `alumni` has no `email` column: the email lives on `"User"`, so the lookup needs a join.

**Where:** `backend/src/dal/query/AlumniQuery.ts` → `findAlumniByEmail`. Reached by `GET /api/alumni/email/:email`.

**Why it's surprising:** Changing `users` to `alumni` looks like the whole fix. It is not, because the column is missing too.

**Don't:** Don't add an `email` column to `alumni` to make this work. No schema change without the owner's approval; join `"User"` instead.

**Update 2026-10-05 (REQ-fs-001):** Reads `alumni` joined to `"User"` and filters on `"User".email`. No schema change.

**Related:** [[knowledge/gotchas#^g03|G03]], [[knowledge/gotchas#^g05|G05]]. Origin: SQL problems.

---

## G05 — `AlumniQuery.getAllAlumni` returns no name, email or photo ^g05

| Field | Value |
|---|---|
| Discovered | 2026-10-02 |
| REQ | — |
| Component | `backend/src/dal/query/AlumniQuery.ts` |
| Status | fixed by REQ-fs-001 (2026-10-05) — kept for history |
| Severity | careful (check before touching) |

**What:** It runs `SELECT * FROM alumni` with no join to `"User"`, so each row has a `user_id` but no name, email or photo.

**Where:** `backend/src/dal/query/AlumniQuery.ts` → `getAllAlumni`. Reached by `GET /api/alumni`.

**Why it's surprising:** The query works, so the gap only shows when a directory screen tries to display a person.

**Don't:** Don't fill the gap by calling `GET /api/users/:id` once per row from the frontend. When adding the join, never select `password`.

**Update 2026-10-05 (REQ-fs-001):** All three alumni reads return `name`, `email`, `photo_url` from `"User"`; `password` is never selected. See [[knowledge/concepts/user-join-read-shape]].

**Related:** [[knowledge/gotchas#^g17|G17]], [[architecture/adr-05-post-list-returns-author-name-and-photo|ADR-05]] (same join decided for posts). Origin: SQL problems.

---

## G06 — `CommentQuery.updateComment` always fails ^g06

| Field | Value |
|---|---|
| Discovered | 2026-10-02 |
| REQ | — |
| Component | `backend/src/dal/query/CommentQuery.ts` |
| Status | fixed by REQ-fs-001 (2026-10-05) — kept for history |
| Severity | trap (will bite a normal change) |

**What:** It updates the table `comments` (no such table; it is `comment`), and the SQL has a syntax error: `content=$1 updated_at=NOW()` is missing a comma.

**Where:** `backend/src/dal/query/CommentQuery.ts` → `updateComment`. Reached by `PUT /api/comments/:id`.

**Why it's surprising:** `createComment` and `getAllComments` in the same class use `comment` correctly.

**Don't:** Don't fix only one of the two errors; both stop the query.

**Update 2026-10-05 (REQ-fs-001):** Table name and comma fixed; the update now runs. The owner check is still missing — see G23.

**Related:** [[knowledge/gotchas#^g07|G07]], [[knowledge/gotchas#^g23|G23]]. Origin: SQL problems.

---

## G07 — `CommentQuery.deleteComment` uses a table that does not exist ^g07

| Field | Value |
|---|---|
| Discovered | 2026-10-02 |
| REQ | — |
| Component | `backend/src/dal/query/CommentQuery.ts` |
| Status | fixed by REQ-fs-001 (2026-10-05) — kept for history |
| Severity | trap (will bite a normal change) |

**What:** It runs `DELETE FROM comments`. The table is `comment`.

**Where:** `backend/src/dal/query/CommentQuery.ts` → `deleteComment`. Reached by `DELETE /api/comments/:id`.

**Why it's surprising:** Same class, two table names: create and list use `comment`, update and delete use `comments`.

**Don't:** Don't stop at the table name. Once it is right, deleting a comment that has replies fails for a second reason (G08).

**Update 2026-10-05 (REQ-fs-001):** Table name fixed. Deleting a comment that has replies still fails (G08).

**Related:** [[knowledge/gotchas#^g06|G06]], [[knowledge/gotchas#^g08|G08]], [[knowledge/gotchas#^g23|G23]]. Origin: SQL problems.

---

## G08 — Deleting a row that other rows point to fails ^g08

| Field | Value |
|---|---|
| Discovered | 2026-10-02 |
| REQ | — |
| Component | `backend/src/dal/query/PostQuery.ts`, `CommentQuery.ts`, `UserQuery.ts`; database |
| Status | fixed by REQ-fs-003 (2026-10-07) — kept for history |
| Severity | trap (will bite a normal change) |

**What:** No foreign key has `ON DELETE CASCADE`. Deleting a post that has comments, a comment that has replies, or a user who has posts, comments or an alumni row fails with a foreign-key error.

**Where:** `PostQuery.deletePost`, `CommentQuery.deleteComment`, `UserQuery.deleteUser`, each a single `DELETE`. Constraints are listed in `db/schema.md`.

**Why it's surprising:** Delete works in a quick test on a fresh row and fails only once related rows exist. The controllers return it as a 400 with the raw database message.

**Don't:** Don't add `ON DELETE CASCADE` or any migration. The decided handling is in [[architecture/adr-06-deleting-rows-that-other-rows-reference|ADR-06]]: posts and comments delete their comments / replies in the backend in one transaction; users with related rows are never deleted.

**Update 2026-10-07 (REQ-fs-003):** Deleting a post removes its comments and every reply under them in one transaction (`PostQuery.deletePost`). Deleting a comment removes every reply under it in one recursive statement (`CommentQuery.deleteComment`). Deleting a user who has posts, comments or an alumni profile answers 409 and deletes nothing; a user with none is deleted; an unknown id is 404. Confirmed by the owner's runs against the real database (2026-10-07). Still open: how an admin removes a user who has content (ADR-06).

**Related:** [[architecture/adr-06-deleting-rows-that-other-rows-reference|ADR-06]], [[knowledge/gotchas#^g07|G07]]. Origin: SQL problems.

---

## G09 — Editing a user without a password locks them out ^g09

| Field | Value |
|---|---|
| Discovered | 2026-10-02 |
| REQ | — |
| Component | `backend/src/dal/query/UserQuery.ts`, `backend/src/api/controllers/UserController.ts` |
| Status | fixed by REQ-fs-002 (2026-10-06) — kept for history |
| Severity | landmine (can cause an outage) |

**What:** `updateUser` always writes `name`, `photo_url`, `password` and `email`. A request that leaves one out sends it as NULL. `password` and `email` are NOT NULL, so that update is rejected; any nullable field left out (`name`, `photo_url`) is silently wiped.

**Where:** `backend/src/dal/query/UserQuery.ts` → `updateUser`; `UserController.updateUser` passes `undefined` for a missing password. Reached by `PUT /api/users/:id`.

**Why it's surprising:** It takes `Partial<UserDTO>` and the controller hashes the password only "if given", which reads like a partial update. The retired plan recorded the effect as "sets the password to NULL and locks the user out"; with the NOT NULL constraint in `db/schema.md` the database should refuse that instead — which of the two happens has not been tested (`STATUS: needs verification`).

**Don't:** Don't build a profile-edit form that sends only the changed fields until this query stops overwriting omitted ones.

**Update 2026-10-06 (REQ-fs-002):** `updateUser` writes only the sent ones of `name`, `email`, `password`, `photo_url`. No password sent keeps the hash. `email` or `password` sent as `null`, empty or only spaces is 400. `role` cannot be changed through this route. Confirmed by the owner's 39-check run against the real database (2026-10-06, 39 passed).

**Related:** [[knowledge/gotchas#^g10|G10]], [[knowledge/gotchas#^g18|G18]], [[knowledge/gotchas#^g17|G17]]. Origin: SQL problems.

---

## G10 — `PostQuery.updatePost` overwrites omitted fields with NULL ^g10

| Field | Value |
|---|---|
| Discovered | 2026-10-02 |
| REQ | — |
| Component | `backend/src/dal/query/PostQuery.ts` |
| Status | fixed by REQ-fs-002 (2026-10-06) — kept for history |
| Severity | trap (will bite a normal change) |

**What:** The update always sets both `caption` and `media_url`. Leaving one out of the request sets it to NULL.

**Where:** `backend/src/dal/query/PostQuery.ts` → `updatePost`. Reached by `PUT /api/posts/:id`.

**Why it's surprising:** Editing only the caption silently removes the post's media, and nothing reports an error.

**Don't:** Until the query is fixed, any caller must send both `caption` and `media_url` on every edit.

**Update 2026-10-06 (REQ-fs-002):** `updatePost` writes only `caption` / `media_url` when sent; editing the caption keeps the media. Confirmed by the owner's 39-check run against the real database (2026-10-06, 39 passed).

**Related:** [[knowledge/gotchas#^g09|G09]], [[knowledge/gotchas#^g21|G21]]. Origin: SQL problems, L.10.

---

## G11 — `posts.comment_count` is never updated ^g11

| Field | Value |
|---|---|
| Discovered | 2026-10-02 |
| REQ | — |
| Component | `backend/src/dal/query/PostQuery.ts` |
| Status | closed by REQ-fs-003 (2026-10-07): the count is worked out when read; the stored column is unused |
| Severity | careful (check before touching) |

**What:** `PostQuery.updateCommentCount` exists but nothing calls it, so `comment_count` stays at its default, 0.

**Where:** `backend/src/dal/query/PostQuery.ts` → `updateCommentCount`; no call on comment create or delete.

**Why it's surprising:** The column and the method both exist, so the count looks maintained.

**Don't:** Don't show `comment_count` on a screen as if it were correct. Either call the method on comment create / delete, or compute the count.

**Update 2026-10-07 (REQ-fs-003):** `comment_count` in every post answer is counted at read time, replies included (`POST_READ` in `PostQuery.ts`). `updateCommentCount` is gone. The column `posts.comment_count` is still in the table, is never read or written, and stays 0. **Don't** select it or `p.*` in a new post read: the row would carry the stale 0. Confirmed by the owner's runs against the real database (2026-10-07).

**Related:** [[knowledge/gotchas#^g24|G24]]. Origin: SQL problems, L.11.

---

## G12 — The backend says `graduation_yr`; the column is `graduation_year` ^g12

| Field | Value |
|---|---|
| Discovered | 2026-10-02 |
| REQ | — |
| Component | `backend/src/dal/dto/AlumniDTO.ts`, `backend/src/api/controllers/AlumniController.ts`, `backend/src/dal/query/AlumniQuery.ts` |
| Status | fixed by REQ-fs-001 (2026-10-05) — kept for history |
| Severity | trap (will bite a normal change) |

**What:** The DTO, the controller and the queries use `graduation_yr`. The real column, and the type in `@alumni/shared`, is `graduation_year` (integer).

**Where:** `AlumniDTO.ts`, `AlumniController.createAlumni` (reads `graduation_yr` from the body), `AlumniQuery.createAlumni` / `updateAlumni`.

**Why it's surprising:** A client that sends the correct name, `graduation_year`, has the value dropped by the controller.

**Don't:** Don't rename the database column to match the code. The schema is the source of truth; fix the three backend files together.

**Update 2026-10-05 (REQ-fs-001):** `AlumniDTO`, `AlumniController.createAlumni` and `AlumniQuery` all say `graduation_year`. A client that still sends `graduation_yr` has the year ignored (create) or written as NULL (update).

**Related:** [[knowledge/gotchas#^g01|G01]], [[knowledge/gotchas#^g02|G02]]. Origin: SQL problems (related), L.7.

---

## G13 — Comments take `post_id` in the request but the column is `posts_id` ^g13

| Field | Value |
|---|---|
| Discovered | 2026-10-02 |
| REQ | — |
| Component | `backend/src/api/controllers/CommentController.ts` |
| Status | fixed by REQ-fs-003 (2026-10-07) — kept for history |
| Severity | trap (will bite a normal change) |

**What:** `POST /api/comments` and `PUT /api/comments/:id` read `post_id` from the body. The column, the DTO field and the response field are `posts_id`.

**Where:** `backend/src/api/controllers/CommentController.ts` → `createComment`, `updateComment`.

**Why it's surprising:** The same value has one name going in and another coming out. A client that sends `posts_id` creates a comment attached to no post.

**Don't:** Don't "fix" one side without the other. Until they are aligned, send `post_id` and read `posts_id`.

**Update 2026-10-07 (REQ-fs-003):** `POST /api/comments` reads `posts_id`, the same name as the column and the answer. `post_id` is not read: a body with only `post_id` answers 400 `Invalid posts_id`. Decided by the owner at the REQ-fs-003 implement gate. Before this, a body with `posts_id` answered 201 and saved a comment attached to no post; comments made that way by earlier test runs may still be in the database with an empty `posts_id`. Confirmed by the owner's runs against the real database (2026-10-07).

**Related:** [[knowledge/gotchas#^g24|G24]]. Origin: SQL problems (related), L.14.

---

## G14 — Sign-up takes `role` from the request body ^g14

| Field | Value |
|---|---|
| Discovered | 2026-10-02 |
| REQ | — |
| Component | `backend/src/api/controllers/UserController.ts` |
| Status | fixed by REQ-fs-002 (2026-10-06) — kept for history |
| Severity | landmine (can cause an outage) |

**What:** `POST /api/users` is public and stores whatever `role` the body contains, so anyone can register as `admin`.

**Where:** `backend/src/api/controllers/UserController.ts` → `createUser`; route in `backend/src/api/routes/UserRoutes.ts`.

**Why it's surprising:** A sign-up form that offers only student and alumni looks safe. The limit is in the UI only.

**Don't:** Don't rely on the form. [[architecture/adr-01-sign-up-role-is-student-or-alumni|ADR-01]] decides that admin is never selectable; the backend must enforce it.

**Update 2026-10-06 (REQ-fs-002):** `createUser` accepts only the exact values `student` and `alumni`; anything else, or no role, is 400 and no user is created. Sign-up can no longer create an admin: today the first admin is made by hand in the database (ADR-01 leaves this open). Confirmed by the owner's 39-check run against the real database (2026-10-06, 39 passed).

**Related:** [[architecture/adr-01-sign-up-role-is-student-or-alumni|ADR-01]]. Origin: SQL problems (related), L.4.

---

## G15 — `PUT /api/users/:id/login` needs no login ^g15

| Field | Value |
|---|---|
| Discovered | 2026-10-02 |
| REQ | — |
| Component | `backend/src/api/routes/UserRoutes.ts` |
| Status | fixed by REQ-fs-002 (2026-10-06) — kept for history |
| Severity | careful (check before touching) |

**What:** The route that stamps `login_at` has no `authMiddleware`. Anyone can set any user's login time.

**Where:** `backend/src/api/routes/UserRoutes.ts` (`router.put("/:id/login", updateLoginTime)`); the code comment says "called during login flow, no token yet".

**Why it's surprising:** Every other write on `/api/users/:id` requires a token. Nothing calls this route: `POST /api/auth/login` does not stamp `login_at` either.

**Don't:** Don't call it from the frontend. Review it (remove it, or stamp `login_at` inside the login itself) before anything depends on `login_at`.

**Update 2026-10-06 (REQ-fs-002):** The route and the controller, Manager and Query code behind it are removed. Nothing stamps `login_at` now; the column stays unused.

**Related:** [[knowledge/gotchas#^g18|G18]]. Origin: SQL problems (related), L.3.

---

## G16 — Alumni lookups return 200 with an empty body when nothing is found ^g16

| Field | Value |
|---|---|
| Discovered | 2026-10-02 |
| REQ | — |
| Component | `backend/src/api/controllers/AlumniController.ts` |
| Status | fixed by REQ-fs-003 (2026-10-07) — kept for history |
| Severity | careful (check before touching) |

**What:** `findAlumniById` and `findAlumniByEmail` send `res.status(200).json(alumni)` even when `alumni` is `undefined`. A missing record is a 200 with no body, not a 404.

**Where:** `backend/src/api/controllers/AlumniController.ts`. The user lookups in `UserController.ts` (`findUserById`, `findUserByEmail`) behave the same way.

**Why it's surprising:** The `catch` block returns 404, which reads as "not found is handled". It only runs when the query throws.

**Don't:** Don't treat a 200 from these endpoints as "found". Check for an empty body until they return 404.

**Update 2026-10-07 (REQ-fs-003):** The four lookups (`GET /api/users/:id`, `/api/users/email/:email`, `/api/alumni/:id`, `/api/alumni/email/:email`) answer 404 `{ error }` when nothing is found. Confirmed by the owner's runs against the real database (2026-10-07).

**Related:** [[knowledge/gotchas#^g03|G03]], [[knowledge/gotchas#^g04|G04]]. Origin: SQL problems (related), L.6.

---

## G17 — User endpoints return the password hash ^g17

| Field | Value |
|---|---|
| Discovered | 2026-10-02 |
| REQ | — |
| Component | `backend/src/dal/query/UserQuery.ts`, `backend/src/api/controllers/UserController.ts` |
| Status | fixed by REQ-fs-002 (2026-10-06) — kept for history |
| Severity | landmine (can cause an outage) |

**What:** Every user query uses `SELECT *` or `RETURNING *`, and the controllers send the row as it is. Create, get all, get by id, get by email and update all return the `password` column (the bcrypt hash).

**Where:** `UserQuery.createUser`, `findUserByEmail`, `findUserById`, `updateUser`, `getAllUsers`; the matching functions in `UserController.ts`.

**Why it's surprising:** `GET /api/users/:id` is open to any logged-in user, so any user can read any other user's hash.

**Don't:** Don't add a join to `"User"` with `SELECT *`. No endpoint may return `password`. The login path still needs the hash internally, so don't remove it from `findUserByEmail` without giving login another way to read it.

**Update 2026-10-06 (REQ-fs-002):** Every `UserQuery` read and write names its columns without `password`. One read, `findUserWithPasswordByEmail`, selects the hash and is used only by login. The row log in `getAllUsers` is gone. See [[knowledge/lessons/LESSON-REQ-fs-002-2]]. Confirmed by the owner's 39-check run against the real database (2026-10-06, 39 passed).

**Related:** [[knowledge/gotchas#^g05|G05]], [[architecture/adr-05-post-list-returns-author-name-and-photo|ADR-05]]. Origin: L.1.

---

## G18 — Any logged-in user can update any user ^g18

| Field | Value |
|---|---|
| Discovered | 2026-10-02 |
| REQ | — |
| Component | `backend/src/api/routes/UserRoutes.ts`, `backend/src/api/controllers/UserController.ts` |
| Status | fixed by REQ-fs-002 (2026-10-06) — kept for history |
| Severity | landmine (can cause an outage) |

**What:** `PUT /api/users/:id` checks only that a token is present. It does not compare `:id` with `req.user.sub`, so a student can change another user's email or password.

**Where:** `backend/src/api/routes/UserRoutes.ts` (comment: "ideally check self/admin inside controller"); `UserController.updateUser`.

**Why it's surprising:** A UI that only links to "my profile" hides the hole; the API does not.

**Don't:** Don't treat the UI as the guard. Allow only the owner or an admin.

**Update 2026-10-06 (REQ-fs-002):** `PUT /api/users/:id` is allowed only for that user or an admin; anyone else gets 403. The 403 comes before the 404, so a non-admin cannot learn which ids exist. An admin can change another user's email or password (the owner asked for owner-or-admin). The non-admin paths are confirmed by the owner's 39-check run against the real database (2026-10-06, 39 passed). The admin path is not yet tested (`STATUS: needs verification`).

**Related:** [[knowledge/gotchas#^g09|G09]], [[knowledge/gotchas#^g19|G19]], [[knowledge/gotchas#^g21|G21]], [[knowledge/gotchas#^g23|G23]]. Origin: L.2.

---

## G19 — Any logged-in user can update any alumni profile ^g19

| Field | Value |
|---|---|
| Discovered | 2026-10-02 |
| REQ | — |
| Component | `backend/src/api/routes/AlumniRoutes.ts`, `backend/src/api/controllers/AlumniController.ts` |
| Status | fixed by REQ-fs-002 (2026-10-06) — kept for history |
| Severity | trap (will bite a normal change) |

**What:** `PUT /api/alumni/:id` has `authMiddleware` only: no role check, no owner check. Students can call it. `updateAlumni` also passes `req.body` straight to the Manager.

**Where:** `backend/src/api/routes/AlumniRoutes.ts` (comment: "ideally check ownership in controller too"); `AlumniController.updateAlumni`.

**Why it's surprising:** Creating a profile is limited to alumni and admin on the same router; editing one is not. It is masked today because the query itself fails (G02).

**Don't:** Don't fix G02 without adding the owner-or-admin check in the same change, or the hole opens the moment the query works.

**Update 2026-10-05 (REQ-fs-001):** The query now works, so this is no longer masked: any logged-in user can edit any alumni profile. The owner accepted this at the spec gate; the check is follow-up work and should land before any screen uses the endpoint.

**Update 2026-10-06 (REQ-fs-002):** `PUT /api/alumni/:id` is allowed only for the profile's owner or an admin; a missing id is 404; `req.body` is no longer passed through. The non-admin paths are confirmed by the owner's 39-check run against the real database (2026-10-06, 39 passed). The admin path is not yet tested (`STATUS: needs verification`).

**Related:** [[knowledge/gotchas#^g02|G02]], [[architecture/adr-03-one-alumni-profile-per-user-created-by-that-user|ADR-03]]. Origin: L.5.

---

## G20 — `POST /api/posts` takes `user_id` from the body ^g20

| Field | Value |
|---|---|
| Discovered | 2026-10-02 |
| REQ | — |
| Component | `backend/src/api/controllers/PostController.ts` |
| Status | fixed by REQ-fs-002 (2026-10-06) — kept for history |
| Severity | trap (will bite a normal change) |

**What:** The author of a new post is whatever `user_id` the request says, not the logged-in user (`req.user.sub`). An alumni can post as anyone.

**Where:** `backend/src/api/controllers/PostController.ts` → `createPost`.

**Why it's surprising:** The route requires a token and a role, so the author looks verified.

**Don't:** Don't design the frontend to choose the author. Take `user_id` from `req.user.sub`.

**Update 2026-10-06 (REQ-fs-002):** `createPost` stores `req.user.sub`; a `user_id` in the body is ignored. Confirmed by the owner's 39-check run against the real database (2026-10-06, 39 passed).

**Related:** [[knowledge/gotchas#^g22|G22]]. Origin: L.8.

---

## G21 — Any logged-in user can edit any post ^g21

| Field | Value |
|---|---|
| Discovered | 2026-10-02 |
| REQ | — |
| Component | `backend/src/api/routes/PostRoutes.ts`, `backend/src/api/controllers/PostController.ts` |
| Status | fixed by REQ-fs-002 (2026-10-06) — kept for history |
| Severity | trap (will bite a normal change) |

**What:** `PUT /api/posts/:id` checks only the token. `deletePost` checks owner or admin; `updatePost` checks nothing, so a student can edit anyone's post.

**Where:** `backend/src/api/routes/PostRoutes.ts` (comment: "ownership check ideally in controller"); `PostController.updatePost`.

**Why it's surprising:** Delete on the same resource is protected, so edit looks protected too.

**Don't:** Don't copy the delete rule as it is. [[architecture/adr-02-admin-deletes-any-post-edits-only-own|ADR-02]]: an admin may delete any post but edit only their own, so edit is owner-only.

**Update 2026-10-06 (REQ-fs-002):** `PUT /api/posts/:id` is author-only, admins included (ADR-02); a missing id is 404. The non-admin paths are confirmed by the owner's 39-check run against the real database (2026-10-06, 39 passed). The admin path is not yet tested (`STATUS: needs verification`).

**Related:** [[architecture/adr-02-admin-deletes-any-post-edits-only-own|ADR-02]], [[knowledge/gotchas#^g10|G10]]. Origin: L.9.

---

## G22 — `POST /api/comments` takes `user_id` from the body ^g22

| Field | Value |
|---|---|
| Discovered | 2026-10-02 |
| REQ | — |
| Component | `backend/src/api/controllers/CommentController.ts` |
| Status | fixed by REQ-fs-002 (2026-10-06) — kept for history |
| Severity | trap (will bite a normal change) |

**What:** The author of a new comment is the `user_id` in the request, not `req.user.sub`. Any logged-in user can comment as anyone.

**Where:** `backend/src/api/controllers/CommentController.ts` → `createComment`.

**Why it's surprising:** Same as G20: the token is checked, the author is not.

**Don't:** Don't send or trust `user_id` from the client. Take it from `req.user.sub`.

**Update 2026-10-06 (REQ-fs-002):** `createComment` stores `req.user.sub`; a `user_id` in the body is ignored. It still reads `post_id` (G13). Confirmed by the owner's 39-check run against the real database (2026-10-06, 39 passed).

**Related:** [[knowledge/gotchas#^g20|G20]], [[knowledge/gotchas#^g13|G13]]. Origin: L.12.

---

## G23 — Any logged-in user can edit or delete any comment ^g23

| Field | Value |
|---|---|
| Discovered | 2026-10-02 |
| REQ | — |
| Component | `backend/src/api/routes/CommentRoutes.ts`, `backend/src/api/controllers/CommentController.ts` |
| Status | fixed by REQ-fs-002 (2026-10-06) — kept for history |
| Severity | trap (will bite a normal change) |

**What:** `PUT` and `DELETE /api/comments/:id` check only the token: no owner check, no role check.

**Where:** `backend/src/api/routes/CommentRoutes.ts` (comment: "ownership check ideally in controller"); `CommentController.updateComment`, `deleteComment`.

**Why it's surprising:** It is masked today because both queries fail (G06, G07). Fixing the SQL alone turns a broken feature into an open one.

**Don't:** Don't fix G06 / G07 without the check: edit is owner-only; delete is owner or admin.

**Update 2026-10-05 (REQ-fs-001):** Both queries now work, so this is no longer masked: any logged-in user can edit or delete any comment. The owner accepted this at the spec gate; the check is follow-up work and should land before any screen uses the endpoints.

**Update 2026-10-06 (REQ-fs-002):** Edit is author-only (admins too) and changes only `content`; delete is author or admin; a missing id is 404 on both. Deleting a comment with replies still fails (G08). The non-admin paths are confirmed by the owner's 39-check run against the real database (2026-10-06, 39 passed). The admin path is not yet tested (`STATUS: needs verification`).

**Related:** [[knowledge/gotchas#^g06|G06]], [[knowledge/gotchas#^g07|G07]], [[architecture/adr-06-deleting-rows-that-other-rows-reference|ADR-06]]. Origin: L.13.

---

## G24 — There is no "comments for one post" endpoint ^g24

| Field | Value |
|---|---|
| Discovered | 2026-10-02 |
| REQ | — |
| Component | `backend/src/api/routes/CommentRoutes.ts`, `backend/src/dal/query/CommentQuery.ts` |
| Status | fixed by REQ-fs-003 (2026-10-07) — kept for history |
| Severity | careful (check before touching) |

**What:** The only read is `GET /api/comments`, which returns every comment in the system. Showing one post's comments means downloading all of them and filtering by `posts_id` on the client.

**Where:** `backend/src/api/routes/CommentRoutes.ts`; `CommentQuery.getAllComments`.

**Why it's surprising:** A comment thread per post is the only way comments are shown, and it has no endpoint of its own.

**Don't:** Don't treat client-side filtering as the design. It is a stopgap until a comments-by-post endpoint exists.

**Update 2026-10-07 (REQ-fs-003):** `GET /api/posts/:id/comments` answers every comment of one post, replies included, oldest first, each with the author's `name` and `photo_url`; a missing post is 404. `GET /api/comments` still returns every comment in the system, unpaged, newest first, now with the author fields too. Confirmed by the owner's runs against the real database (2026-10-07).

**Related:** [[knowledge/gotchas#^g11|G11]], [[knowledge/gotchas#^g13|G13]]. Origin: L.15.

---

## G25 — Alumni reads and alumni writes return different shapes ^g25

| Field | Value |
|---|---|
| Discovered | 2026-10-05 |
| REQ | REQ-fs-001 |
| Component | `backend/src/dal/query/AlumniQuery.ts`, `backend/src/dal/dto/AlumniDTO.ts`, `shared/types/alumni.types.ts` |
| Status | fixed by REQ-fs-003 (2026-10-07) — kept for history |
| Severity | careful (check before touching) |

**What:** `getAllAlumni`, `findAlumniById` and `findAlumniByEmail` return the alumni columns plus the user's `name`, `email` and `photo_url`. `createAlumni` and `updateAlumni` return the alumni columns only. On a read, the three user fields are `null` when the alumni row has no user.

**Where:** `AlumniQuery.ts` — the reads use a `LEFT JOIN "User"`; the writes use `RETURNING *`, which cannot join. `AlumniDTO` declares the three fields as optional `string`; the shared `Alumni` type does not declare them at all.

**Why it's surprising:** Both paths are typed as `AlumniDTO`. A screen that refreshes a card from the POST or PUT response loses the name and photo, and the types say `string | undefined` where the database sends `null`.

**Why it exists:** The owner asked for the join on reads only, and chose `LEFT JOIN` and optional DTO fields at the design gate to keep REQ-fs-001 inside four files.

**Don't:** Don't refresh UI state from a create or update response; GET the row again. Treat `name`, `email`, `photo_url` as nullable. Add them to the shared `Alumni` type (as `string | null`) before the first screen uses them.

**Update 2026-10-07 (REQ-fs-003):** Create and update for alumni now answer through the same joined read as the reads (`ALUMNI_READ`), so every alumni answer has `name`, `email`, `photo_url` (review finding M1). Comments and posts do the same. The shared `Alumni`, `Post` and `Comment` types declare the author fields as `string | null`. Confirmed by the owner's runs against the real database (2026-10-07).

**Related:** [[knowledge/concepts/user-join-read-shape]], [[knowledge/gotchas#^g05|G05]], [[knowledge/components/dal-query-classes]].

---

## G26 — `getAllAlumni` returns rows in no fixed order ^g26

| Field | Value |
|---|---|
| Discovered | 2026-10-05 |
| REQ | REQ-fs-001 |
| Component | `backend/src/dal/query/AlumniQuery.ts` |
| Status | fixed by REQ-fs-003 (2026-10-07) — kept for history |
| Severity | careful (check before touching) |

**What:** The alumni list query has no `ORDER BY`. PostgreSQL may return the rows in a different order after any row is updated.

**Where:** `AlumniQuery.getAllAlumni`. Reached by `GET /api/alumni`. (`getAllComments` does sort, by `created_at DESC`.)

**Why it's surprising:** On a small, never-edited table the rows come back in insert order, so it looks sorted.

**Why it exists:** Found in the REQ-fs-001 review (finding m2); the owner approved the REQ as-is under "No other change".

**Don't:** Don't rely on the list order in a screen or a pagination scheme. Add `ORDER BY a.id` (or sort in the client) first.

**Update 2026-10-07 (REQ-fs-003):** Every list has a fixed order: alumni newest first (`a.id DESC`), users by `id` ascending, posts newest first (`created_at DESC, id DESC`), all comments newest first, comments of one post oldest first. The direction differs per endpoint; see G39. Confirmed by the owner's runs against the real database (2026-10-07).

**Related:** [[knowledge/gotchas#^g05|G05]].

---

## G27 — Updating or deleting a row that does not exist reports success ^g27

| Field | Value |
|---|---|
| Discovered | 2026-10-05 |
| REQ | REQ-fs-001 |
| Component | `backend/src/dal/query/AlumniQuery.ts`, `backend/src/dal/query/CommentQuery.ts`, their controllers |
| Status | fixed by REQ-fs-003 (2026-10-07) — kept for history |
| Severity | careful (check before touching) |

**What:** `PUT /api/alumni/:id` and `PUT /api/comments/:id` with an id that does not exist return 200 with an empty body. `DELETE /api/comments/:id` reports success whether or not a row was deleted.

**Where:** `AlumniQuery.updateAlumni`, `CommentQuery.updateComment` (`UPDATE … RETURNING *` gives no row; `rows[0]` is `undefined`); `CommentQuery.deleteComment` returns nothing. The controllers send whatever they get.

**Why it's surprising:** These paths could not run before REQ-fs-001, so nothing ever showed it. Same family as G16.

**Why it exists:** Out of scope for REQ-fs-001 (review finding m1).

**Don't:** Don't treat a 200 from these endpoints as "saved". Check for an empty body until they return 404.

**Update 2026-10-06 (REQ-fs-002):** `PUT /api/alumni/:id`, `PUT /api/comments/:id` and `DELETE /api/comments/:id` now answer 404 for a missing id, and the Query methods are typed as possibly returning no row ([[knowledge/lessons/LESSON-REQ-fs-002-1]]). Still open: the user and alumni lookups (G16).

**Update 2026-10-07 (REQ-fs-003):** The lookups that were still open (G16) now answer 404 too.

**Related:** [[knowledge/gotchas#^g16|G16]], [[knowledge/gotchas#^g02|G02]].

---

## G28 — `npm run build` does not compile a DAL file that nothing imports ^g28

| Field | Value |
|---|---|
| Discovered | 2026-10-06 |
| REQ | REQ-fs-002 |
| Component | `backend/src/api/tsconfig.json`, `backend/src/dal/` |
| Status | confirmed |
| Severity | careful (check before touching) |

**What:** The API build type-checks only `backend/src/api` plus whatever it reaches by import. A new file in `dal/` or `businessLogic/` with no importer passes the build unread.

**Where:** `backend/src/api/tsconfig.json` (`include`); seen with `backend/src/dal/query/updateSet.ts` before any Query class used it.

**Why it's surprising:** The root command is called "build everything", and it exits 0.

**Why it exists:** Each backend workspace has its own `tsconfig.json`; the root script builds only `@alumni/api` and the frontend.

**Don't:** Don't treat a green build as proof a new DAL or Manager file compiles. Run `npx tsc --noEmit -p backend/src/dal` (or `-p backend/src/businessLogic`) until something imports it.

**Related:** [[knowledge/lessons/LESSON-REQ-fs-001-1]], [[knowledge/components/dal-query-classes]].

---

## G29 — Error responses use two different keys: `error` and `message` ^g29

| Field | Value |
|---|---|
| Discovered | 2026-10-06 |
| REQ | REQ-fs-002 |
| Component | `backend/src/api/controllers/`, `backend/src/api/MiddleWare/`, `backend/src/api/routes/AuthRoutes.ts` |
| Status | fixed by REQ-fs-003 (2026-10-07) — kept for history |
| Severity | careful (check before touching) |

**What:** Controllers answer `{ error: "..." }`. `authMiddleware`, `requireRole` and login answer `{ message: "..." }`. A 403 from the role check and a 403 from an owner check on the same route have different body keys.

**Where:** `authMiddleware.ts`, `roleMiddleware.ts`, `AuthRoutes.ts` (`message`); every `*Controller.ts` (`error`).

**Why it's surprising:** Same status code, same route, two shapes.

**Why it exists:** Never unified; the shared error middleware (roadmap B3) is where it should be.

**Don't:** Don't read only one key in the frontend's error handling. Read both until B3 settles one shape.

**Update 2026-10-07 (REQ-fs-003):** Every error body is `{ "error": "<message>" }`, from the token check, the role check, login and every controller, through one error middleware (ADR-11). The `message` key is only in three 200 answers (`... deleted successfully`). Confirmed by the owner's runs against the real database (2026-10-07).

**Related:** [[knowledge/components/api-controllers-and-routes]].

---

## G30 — Each update's allowed-field list is written twice ^g30

| Field | Value |
|---|---|
| Discovered | 2026-10-06 |
| REQ | REQ-fs-002 |
| Component | `UserController` + `UserQuery`, `PostController` + `PostQuery`, `AlumniController` + `AlumniQuery` |
| Status | confirmed — still open; more copies since REQ-fs-003 |
| Severity | trap (will bite a normal change) |

**What:** The fields an update may change are listed once in the controller (which keys to pick from the body) and once in the Query class (which columns may appear in the SQL). A column added to only one list is silently dropped and the call still answers 200.

**Where:** `USER_UPDATE_FIELDS` / `UPDATABLE_USER_COLUMNS`; `UPDATABLE_FIELDS` / `UPDATABLE_COLUMNS` in the alumni and post files.

**Why it's surprising:** The update compiles and returns 200; only the missing change in the row shows it.

**Why it exists:** Deliberate: the Query builds SQL only from its own constant and never trusts a list handed down (REQ-fs-002 review finding m3, kept by the owner).

**Don't:** Don't add an updatable column in one place. Change the controller list, the Query list and the type check together. Don't replace the Query's list with one passed in from the controller.

**Update 2026-10-07 (REQ-fs-003):** The alumni lists now have nine fields. They exist in four places that must change together: `UPDATABLE_FIELDS` and `FIELD_RULES` in `AlumniController.ts` (the first also drives create), `UPDATABLE_COLUMNS` in `AlumniQuery.ts`, and the column list of the `INSERT` in `createAlumni`. A mismatch between the controller's keys and the Query's column type is now a compile error, because both sides are typed with `UpdateFields<...>`.

**Related:** [[knowledge/concepts/partial-update-sent-fields]], [[architecture/adr-08-mentoring-and-field-stay-two-new-alumni-columns|ADR-08]] (the next columns to add).

---

## G31 — DTO types do not allow `null`, but the database sends it and updates accept it ^g31

| Field | Value |
|---|---|
| Discovered | 2026-10-06 |
| REQ | REQ-fs-002 |
| Component | `backend/src/dal/dto/*DTO.ts`, the three update controllers, `UserManager.updateUser` |
| Status | fixed by REQ-fs-003 (2026-10-07) — kept for history |
| Severity | careful (check before touching) |

**What:** DTO fields are typed `string` or `string | undefined`. A nullable column read with `SELECT *` arrives as `null`, and a partial update may send `null` to clear a field. So the controllers cast (`fields as Partial<PostDTO>`, `as Partial<AlumniDTO>`) and `updateUser` takes `Record<string, unknown>`: three shapes for the same thing.

**Where:** `PostController.updatePost`, `AlumniController.updateAlumni`, `UserManager.updateUser`, `UserQuery.updateUser`; `CommentDTO.parent_id`.

**Why it's surprising:** The types read as if `null` cannot happen, and the casts hide that it can.

**Why it exists:** Fixing the DTO types was outside the files REQ-fs-002 named (review finding m4, left for the controller rewrite, roadmap B3).

**Don't:** Don't trust a DTO type to tell you a value is not `null`. Don't add a fourth shape: when B3 lands, give the three updates one input type that allows `null`.

**Update 2026-10-07 (REQ-fs-003):** DTO fields follow `db/schema.md`: every nullable column is `T | null`. The three updates take one input type, `UpdateFields<K>` (`dal/query/updateSet.ts`), built by `checkFields` in the controller; the casts are gone (review finding m4 of REQ-fs-002).

**Related:** [[knowledge/gotchas#^g25|G25]], [[knowledge/concepts/partial-update-sent-fields]].

---

## G32 — An alumni profile always belongs to whoever created it, and nothing stops a second one ^g32

| Field | Value |
|---|---|
| Discovered | 2026-10-06 |
| REQ | REQ-fs-002 |
| Component | `backend/src/api/controllers/AlumniController.ts`, `backend/src/api/routes/AlumniRoutes.ts` |
| Status | partly fixed by REQ-fs-003 (2026-10-07) |
| Severity | careful (check before touching) |

**What:** `POST /api/alumni` stores the caller's id as `user_id`. An admin who calls it creates a profile for themself and cannot create one for another user. A user who calls it twice gets two profiles.

**Where:** `AlumniController.createAlumni`; the route still allows the `admin` role. `alumni.user_id` has no UNIQUE constraint (`db/schema.md`).

**Why it's surprising:** The route lets admins in, which reads as "admin can set up a profile for someone". And ADR-03 says one profile per user, which reads as enforced.

**Why it exists:** ADR-03 chose "created only by that user"; enforcing one-per-user needs a check or a schema change, both outside REQ-fs-002 (review finding m7).

**Don't:** Don't build an admin "create profile for user" screen on this endpoint. Hide "add my profile" once the user has one, until the backend refuses a second.

**Update 2026-10-07 (REQ-fs-003):** A second `POST /api/alumni` by the same user answers 409 `You already have an alumni profile`; the check and the insert run under a per-user database lock, so two requests at once cannot both pass. Still true: an admin creates a profile only for themself; `alumni.user_id` has no UNIQUE constraint; duplicates made before this REQ remain (see G37). Confirmed by the owner's runs against the real database (2026-10-07).

**Related:** [[architecture/adr-03-one-alumni-profile-per-user-created-by-that-user|ADR-03]], [[knowledge/gotchas#^g19|G19]].

---

## G33 — There is no `GET /api/posts/:id` route, although the controller function exists ^g33

| Field | Value |
|---|---|
| Discovered | 2026-10-06 |
| REQ | REQ-fs-002 |
| Component | `backend/src/api/routes/PostRoutes.ts`, `backend/src/api/controllers/PostController.ts` |
| Status | confirmed |
| Severity | trivia (good to know) |

**What:** `PostController.findPostById` is exported but no route line calls it. One post can only be read from the `GET /api/posts` list.

**Where:** `PostRoutes.ts` (no `router.get("/:id", ...)`).

**Why it's surprising:** The controller, Manager and Query methods all exist, so the endpoint looks finished.

**Why it exists:** Not recorded (`STATUS: needs verification`).

**Don't:** Don't call `GET /api/posts/:id` from the frontend before the route line exists.

**Related:** [[architecture/adr-05-post-list-returns-author-name-and-photo|ADR-05]].

---

## G34 — Raw database messages still reach the client on bad ids and duplicate emails ^g34

| Field | Value |
|---|---|
| Discovered | 2026-10-06 |
| REQ | REQ-fs-002 |
| Component | `backend/src/api/controllers/*Controller.ts` |
| Status | fixed by REQ-fs-003 (2026-10-07) — kept for history |
| Severity | careful (check before touching) |

**What:** A non-numeric `:id` (for example `/api/posts/abc`) reaches PostgreSQL as `NaN` and comes back as 400 with the database's own message. So does a sign-up or a user update with an email that is already taken (the message names the constraint `User_email_key`).

**Where:** Every controller `catch` block (`res.status(400).json({ error: error.message })`); `PostController.deletePost` joined the list in REQ-fs-002's fix round (review finding t2); `UserController.updateUser` and `createUser` for the duplicate email (finding m6).

**Why it's surprising:** The new 400 / 403 / 404 answers have clear messages, so the remaining raw ones look like a bug in this change.

**Why it exists:** Accepted by the owner at the REQ-fs-002 design and review gates; the shared error middleware (roadmap B3) is where it gets fixed. The legacy sign-up form matches on `User_email_key` to show "email taken".

**Don't:** Don't change the duplicate-email message without updating whatever screen matches on it. Don't parse these messages in new frontend code; wait for B3's error shape.

**Update 2026-10-07 (REQ-fs-003):** A `:id` that is not a positive whole number (or is above 2147483647) answers 400 `Invalid id` before any query. A taken email on sign-up or user update answers 409 `This email is already registered`. Any other database refusal answers a fixed text (400 `Invalid value in request` or 409 `Request conflicts with existing data`); nothing nobody planned for answers 500 `Internal server error`. The legacy sign-up form's match on `User_email_key` no longer fires; the form shows the server's message instead. Confirmed by the owner's runs against the real database (2026-10-07).

**Related:** [[knowledge/gotchas#^g29|G29]], [[knowledge/gotchas#^g16|G16]].


**Update 2026-10-07 (REQ-fs-004):** The legacy sign-up form is deleted. The new form shows "This email is already registered." under the Email field on any 409, and never reads or shows the server's own text; it matches on the status only (`SignUpPage.tsx`, `lib/validation.ts`).

---

## G35 — `checkFields` passes on only the keys that have a rule, and always says "has the wrong type" ^g35

| Field | Value |
|---|---|
| Discovered | 2026-10-07 |
| REQ | REQ-fs-003 |
| Component | `backend/src/api/utils/requestHelpers.ts`, every controller that calls `checkFields` |
| Status | confirmed |
| Severity | trap (will bite a normal change) |

**What:** `checkFields(fields, rules)` returns a new object holding only the keys that have an entry in `rules`. A key with no rule is dropped without an error. For a key that fails its rule it always throws `<key> has the wrong type`. Each value comes back typed as the wide `UpdateValue`, whatever rule it passed.

**Where:** `requestHelpers.ts` (`checkFields`); `USER_UPDATE_RULES` in `UserController.ts`; `FIELD_RULES` in `AlumniController.ts`; `PostController.ts`.

**Why it's surprising:** A rule that "can never fail" looks like dead code (review finding m5 said so for `email` and `password`). Deleting it would silently stop email and password changes while the call still answers 200.

**Why it exists:** One function does both jobs: check the types and build the typed update object, so no cast is needed (G31).

**Don't:** Don't delete a rule because an earlier check already covers it. Run a field's own-message check (for example `email must be a non-empty string`) before `checkFields`, or the client gets the generic message. To build a DTO from the result, narrow each value with `typeof`; don't cast.

**Related:** [[knowledge/concepts/partial-update-sent-fields]], [[knowledge/gotchas#^g30|G30]], [[knowledge/gotchas#^g31|G31]].

---

## G36 — Fixed paths must be registered above `/:id` in a router ^g36

| Field | Value |
|---|---|
| Discovered | 2026-10-07 |
| REQ | REQ-fs-003 |
| Component | `backend/src/api/routes/AlumniRoutes.ts`, `UserRoutes.ts`, `PostRoutes.ts` |
| Status | confirmed |
| Severity | trap (will bite a normal change) |

**What:** Express matches routes in the order they are registered. `GET /api/alumni/filters`, `/me` and `/email/:email` sit above `GET /api/alumni/:id`. A fixed path added below `/:id` would be read as an id and answer 400 `Invalid id`.

**Where:** `AlumniRoutes.ts` (order: `/`, `/filters`, `/me`, `/email/:email`, `/:id`); the same holds for `/email/:email` in `UserRoutes.ts`.

**Why it's surprising:** The new route compiles and its handler is never reached; the 400 looks like a bug in the caller.

**Why it exists:** How Express routers work.

**Don't:** Don't add a new fixed path at the bottom of a route file. Put it above the first `/:id` line.

**Related:** [[knowledge/components/api-controllers-and-routes]].

---

## G37 — Duplicate alumni profiles made before the lock are still there; `/me` returns the lowest `id` ^g37

| Field | Value |
|---|---|
| Discovered | 2026-10-07 |
| REQ | REQ-fs-003 |
| Component | `backend/src/dal/query/AlumniQuery.ts` (`createAlumni`, `findAlumniByUserId`) |
| Status | confirmed |
| Severity | careful (check before touching) |

**What:** `createAlumni` refuses a second profile for a user under `pg_advisory_xact_lock(<namespace>, user_id)`. That stops new duplicates only. `alumni.user_id` has no UNIQUE constraint, so rows made before REQ-fs-003 can still be duplicates, and `GET /api/alumni/me` then returns the one with the lowest `id`. The lock function takes no lock when the key is `null`, so the check is skipped for a profile with no `user_id`.

**Where:** `AlumniQuery.createAlumni`, `findAlumniByUserId`; `AlumniController.createAlumni` always sets `user_id` from the token. The check script itself leaves three test users with profiles per run.

**Why it's surprising:** ADR-03 says one profile per user and the API now answers 409, which reads as "there is never more than one".

**Why it exists:** A UNIQUE constraint is a schema change, which is the owner's decision (ADR-03, open).

**Don't:** Don't assume one row per `user_id` in old data. Don't call `createAlumni` with a `user_id` that can be `null`.

**Related:** [[knowledge/gotchas#^g32|G32]], [[architecture/adr-03-one-alumni-profile-per-user-created-by-that-user|ADR-03]].

---

## G38 — The compiled `.js` / `.d.ts` files in `shared/` are older than the `.ts` sources ^g38

| Field | Value |
|---|---|
| Discovered | 2026-10-07 |
| REQ | REQ-fs-003 |
| Component | `shared/types/*.js`, `*.d.ts`, `*.map`; `shared/index.ts` |
| Status | confirmed |
| Severity | careful (check before touching) |

**What:** REQ-fs-003 changed the `.ts` types (new alumni fields, author fields, string dates, `PublicUser`, `SignUpUserDTO`, `UpdateUserDTO`, list types) and added `shared/index.ts`. The checked-in compiled files beside them were not rebuilt: `alumni.types.d.ts` has no `mentorship_available`, and `list.types.ts` and `index.ts` have no compiled twin at all.

**Where:** `shared/types/`. Nothing imports the compiled files: TypeScript resolves the `.ts` first, and the frontend imports by file path.

**Why it's surprising:** Root `CLAUDE.md` says the compiled output is checked in "alongside the sources", which reads as "kept in step".

**Why it exists:** The owner chose to leave them (REQ-fs-003 review gate, finding M2); deleting or rebuilding them is a later clean-up.

**Don't:** Don't read or edit the `.js` / `.d.ts` files. Edit the `.ts`. In `user.types.ts`, `User` (it has `password`) and `CreateUserDTO` are kept only for the legacy frontend and are not exported from `shared/index.ts`; new code uses `PublicUser`, `SignUpUserDTO` and `UpdateUserDTO`.

**Related:** [[knowledge/gotchas#^g25|G25]].


**Update 2026-10-07 (REQ-fs-004):** The legacy frontend is deleted. Nothing under `frontend/src` imports `User` or `CreateUserDTO` any more, and the new frontend reads only `shared/index.ts`. The lines in `shared/types/user.types.ts` that say "kept for the legacy frontend" are now stale; removing them (and the two legacy types) is shared code and waits for the owner (review finding m18).

---

## G39 — List order and filter rules differ per endpoint ^g39

| Field | Value |
|---|---|
| Discovered | 2026-10-07 |
| REQ | REQ-fs-003 |
| Component | `AlumniController.ts`, `UserQuery.ts`, `AlumniQuery.ts`, `PostQuery.ts`, `CommentQuery.ts` |
| Status | confirmed |
| Severity | careful (check before touching) |

**What:** Alumni and posts come newest first; users come by `id` ascending; the comments of one post come oldest first. `mentoring=true` filters; any other value, including `mentoring=false`, is 400, so a switched-off toggle must leave the key out. `department` and `field` match the whole value after outer spaces are stripped (spaces only, the same as SQL `btrim`). A filter sent empty counts as not sent; a key sent twice is 400. A `limit` above 50 is treated as 50 and the answer's `limit` says 50.

**Where:** `AlumniController.getAllAlumni`, `requestHelpers.ts` (`parsePaging`, `queryText`, `queryFilterValue`), the `ORDER BY` of each list query.

**Why it's surprising:** ADR-12 promises "a fixed order", not one direction; and `mentoring=false` looks like a valid way to say "no filter".

**Why it exists:** The owner's request named `mentoring=true` only and "newest first" for alumni and posts; review finding m9 was accepted as is.

**Don't:** Don't send `mentoring=false`. Don't assume one sort direction across lists in the UI.

**Related:** [[architecture/adr-12-list-endpoints-answer-items-total-page-limit|ADR-12]], [[knowledge/concepts/paged-list-query]].

---

## G40 — Importing `@alumni/businesslogic` or the app connects to the database ^g40

| Field | Value |
|---|---|
| Discovered | 2026-10-07 |
| REQ | REQ-fs-003 |
| Component | `backend/src/dal/config/db.ts`, `backend/src/businessLogic/index.ts`, `backend/src/api/utils/requestHelpers.ts` |
| Status | confirmed |
| Severity | careful (check before touching) |

**What:** `dal/config/db.ts` loads the root `.env` and opens a connection when it is imported. `businessLogic/index.ts` exports the Managers beside the typed errors, so importing even one error class loads the DAL. `requestHelpers.ts` imports `ValidationError`, so a script that imports a pure helper such as `parseId` also connects to the database.

**Where:** The import chain `requestHelpers.ts` → `@alumni/businesslogic` → `@alumni/dal` → `config/db.ts`. `utils/token.ts` reads `JWT_SECRET` inside its functions for the same reason: `.env` is loaded as a side effect of that chain.

**Why it's surprising:** A helper with no database code cannot be run in a quick check without a database.

**Why it exists:** The typed errors live in `businessLogic` so Managers can throw them (ADR-11); `db.ts` has connected on import since before the pipeline.

**Don't:** Don't import backend files in a script meant to run without a database. To prove a pure expression, run a copy of it alone ([[knowledge/lessons/LESSON-REQ-fs-003-2]]). Don't read `process.env` at the top of a new backend file.

**Related:** [[architecture/adr-11-typed-errors-and-one-error-middleware|ADR-11]], [[knowledge/gotchas#^g28|G28]].

---

## G41 — A DTO built with `new` carries made-up timestamps; `logout` answers an empty 200 ^g41

| Field | Value |
|---|---|
| Discovered | 2026-10-07 |
| REQ | REQ-fs-003 |
| Component | `backend/src/dal/dto/*DTO.ts`, `UserController.updateLogoutTime` |
| Status | confirmed |
| Severity | trivia (good to know) |

**What:** The DTO constructors stamp `new Date()` into `created_at`, `updated_at`, and for users `login_at` and `logout_at`. Those are not what the database holds. Separately, `PUT /api/users/:id/logout` answers 200 with an empty body, because the Manager returns nothing.

**Where:** `UserDTO.ts`, `PostDTO.ts`, `CommentDTO.ts`, `AlumniDTO.ts` constructors; `UserController.updateLogoutTime`.

**Why it's surprising:** A freshly built `UserDTO` claims a login and a logout time for someone who has done neither. And every other 200 has a JSON body.

**Why it exists:** Both predate the pipeline; left unchanged in REQ-fs-003 (AC12 for logout).

**Don't:** Don't read a timestamp from a DTO you built; read it from the row the database returns. Don't parse the logout answer as JSON.

**Related:** [[knowledge/components/dal-query-classes]].

---

## G42 — Not decided: any logged-in user can read every alumni's email, and a user with no role still gets a token ^g42

| Field | Value |
|---|---|
| Discovered | 2026-10-07 |
| REQ | REQ-fs-003 |
| Component | `AlumniQuery.ts` (`ALUMNI_READ`), `AlumniRoutes.ts`, `AuthController.ts` |
| Status | confirmed — `STATUS: needs verification` that this is what the owner wants |
| Severity | careful (check before touching) |

**What:** Every alumni answer includes the person's `email`, and the alumni routes ask only for a login, so a student can list every alumni's email. No ADR decides who may see it. Separately, `"User".role` is nullable: a user with no role can log in and gets a token with role `""`, which passes the token check and matches no role check (403 on role-guarded routes). A token whose role is not text is refused with 401.

**Where:** `ALUMNI_READ` (`u.email`); `GET /api/alumni`, `/:id`, `/email/:email`, `/me`; `AuthController.login` (`role ?? ""`); `utils/token.ts`.

**Why it's surprising:** The approved screens show names and tags on cards, not emails; and the review found the 401 for an old no-role token was 403 before (finding m1, accepted).

**Why it exists:** The email has been in the alumni reads since REQ-fs-001; nobody was asked. Sign-up now always sets a role, so a no-role user can only be an old or hand-made row.

**Don't:** Don't show the email on a public-facing card without asking the owner. Don't rely on "no role" meaning "cannot log in".

**Related:** [[knowledge/concepts/user-join-read-shape]], [[architecture/adr-01-sign-up-role-is-student-or-alumni|ADR-01]].

---

## G43 — `index.html` rewrites placeholders everywhere, and the theme rule exists twice ^g43

| Field | Value |
|---|---|
| Discovered | 2026-10-07 |
| REQ | REQ-fs-004 |
| Component | `frontend/index.html`, `frontend/vite.config.ts`, `store/themeAtoms.ts` |
| Status | confirmed |
| Severity | careful (check before touching) |

**What:** The Vite plugin replaces `%APP_NAME%` and `%THEME_STORAGE_KEY%` in the whole of `index.html`, comments included. The rule that picks the theme (saved light or dark wins, else ask the system, no answer means light) is written twice: in the head script and in `themeAtoms.ts`. The head script must stay above everything else in the head.

**Where:** `frontend/index.html` (head script), `vite.config.ts` (plugin), `frontend/src/store/themeAtoms.ts`.

**Why it's surprising:** A placeholder named in a comment is replaced too; and the head script cannot import the store, so the rule cannot be shared. Vite adds its own module script and stylesheet at the end of the head, so a script placed by hand stays first.

**Why it exists:** The page needs the theme before React starts, to avoid a flash (AC15, [[architecture/adr-14-session-and-theme-kept-in-the-browser|ADR-14]]).

**Don't:** Don't write a `%PLACEHOLDER%` in a comment. Don't change the theme rule in one place only. Don't move the script below the stylesheet.

**Related:** [[knowledge/components/frontend-app]]

---

## G44 — The frontend style check trips on a few innocent things ^g44

| Field | Value |
|---|---|
| Discovered | 2026-10-07 |
| REQ | REQ-fs-004 |
| Component | `scripts/frontend-style-check.mjs` |
| Status | confirmed |
| Severity | trivia (good to know) |

**What:** A string such as `"#feed"` or `"#123"` reads as a hex color. A type-only import from `services/` in a component, page, route, hook or icon fails rule d. The px/em/rem rule covers `base.css` as well as module stylesheets. Rule i ignores the bare `"/"` on purpose. Comments are skipped; strings are not.

**Where:** `scripts/frontend-style-check.mjs` (rules a to j); run with `npm run check:frontend`.

**Why it's surprising:** It looks at text, not at meaning, so it cannot tell an in-page link from a color.

**Why it exists:** No parser runs; a regular pass is enough for the rules the owner set.

**Don't:** Don't weaken a rule to pass. Add a token for a size that has none; reach a type through the store; reword a string that starts with `#` and hex letters.

**Related:** [[knowledge/lessons/LESSON-REQ-fs-004-6-a-check-that-reads-only-tracked-files]]

---

## G45 — A native `<dialog>`: style it on `[open]`; tokens in `::backdrop` need a 2024 browser ^g45

| Field | Value |
|---|---|
| Discovered | 2026-10-07 |
| REQ | REQ-fs-004 |
| Component | `components/ui/Dialog/`, `hooks/useModalDialog.ts` |
| Status | confirmed |
| Severity | careful (check before touching) |

**What:** The dialog stays in the page while closed, so its layout (`display: flex`) must be set on `.dialog[open]` only, or it shows when closed. `var(--token)` inside `::backdrop` works only in Chrome 122, Firefox 120, Safari 17.4 and later. `onClose` must set `open` to false: the dialog does not close itself on Escape.

**Where:** `Dialog.module.css:22,29`, `Dialog.tsx`, `PhoneMenu.tsx` (also a native `<dialog>`).

**Why it's surprising:** A plain `display` beats the browser's `display: none` for a closed dialog. Before 2024 the backdrop inherited nothing and is clear.

**Why it exists:** The browser owns focus trapping, Escape, the inert page and focus return.

**Don't:** Don't put `display` on `.dialog` without `[open]`. Don't call `showModal()` on an open dialog (it throws).

**Related:** [[knowledge/lessons/LESSON-REQ-fs-004-4-check-focus-for-real]]

---

## G46 — A table turned into cards, and a fieldset, both need a line of CSS or markup ^g46

| Field | Value |
|---|---|
| Discovered | 2026-10-07 |
| REQ | REQ-fs-004 |
| Component | `components/ui/Table/`, `components/ui/RadioCards/` |
| Status | confirmed |
| Severity | trivia (good to know) |

**What:** When CSS turns a `<table>` into cards with `display: block` or `grid`, some browsers stop telling a screen reader it is a table: the roles are written on the elements by hand. A cell that becomes a grid needs its content wrapped in one element, or each child lands in its own grid cell. A `<fieldset>` needs `min-width: 0`, or it cannot get narrower than its content.

**Where:** `Table.tsx:27,57`, `RadioCards.module.css:3`.

**Why it's surprising:** Changing `display` changes accessibility; a fieldset's default width is its content.

**Why it exists:** The phone layout shows each row as a card ([[context/design-system]], Table row).

**Don't:** Don't drop the explicit roles or the cell wrapper. Not proven with a real screen reader.

**Related:** [[knowledge/components/frontend-app]]

---

## G47 — The API client: axios needs its two type parameters, and a 200 may not be the API ^g47

| Field | Value |
|---|---|
| Discovered | 2026-10-07 |
| REQ | REQ-fs-004 |
| Component | `services/apiClient.ts`, `store/sessionActions.ts` |
| Status | confirmed |
| Severity | careful (check before touching) |

**What:** To add a field to axios's `AxiosRequestConfig`, repeat its exact parameters (`<D = any, P = any>` in axios 1.20) or the build fails. A log in that answers 200 with something that is not a token (Apache serving `index.html` for `/api` when its proxy is off) must count as a failure, so the token is read before it is stored. A 401 ends the session only when the request carried a token and it is still the current one. Only log out has a timeout (5 s).

**Where:** `apiClient.ts:12,54`, `sessionActions.ts` (`requestToken`), `userService.ts`.

**Why it's surprising:** Older axios examples show one type parameter; a 200 from a proxy looks like success.

**Why it exists:** See [[architecture/adr-14-session-and-theme-kept-in-the-browser|ADR-14]] and [[knowledge/lessons/LESSON-REQ-fs-004-3-401-flag-token-header-timeout]].

**Don't:** Don't treat any 200 from log in as a session. Don't reuse `skipAuthHandling` to mean "no header".

**Related:** [[knowledge/concepts/frontend-session-flow]], G41

---

## G48 — Store traps: updates after `await`, StrictMode effects, other tabs, hot reload ^g48

| Field | Value |
|---|---|
| Discovered | 2026-10-07 |
| REQ | REQ-fs-004 |
| Component | `store/sessionActions.ts`, `store/sessionAtoms.ts`, `store/themeAtoms.ts`, `AppShell.tsx` |
| Status | confirmed |
| Severity | careful (check before touching) |

**What:** In a Jotai write atom, after an `await`, separate `set` calls each notify listeners alone: change several atoms through one inner write-only atom (log out must clear the token and set the `loggedOut` notice in one update, or the guard sees a logged-out user with no notice). A token another tab stored is adopted in memory only, never written back. An effect that must run once per state reads the state from the store inside the effect: StrictMode runs the same closure twice. A module that adds listeners when loaded removes them in `import.meta.hot.dispose`.

**Where:** `sessionActions.ts:48`, `sessionAtoms.ts:33`, `AppShell.tsx:51`, `themeAtoms.ts:97`.

**Why it's surprising:** Each one worked on the first try and failed only with a listener, a second tab or development mode.

**Why it exists:** Found by running the store in a scratch harness with listeners (not shipped: finding m17).

**Don't:** Don't rewrite these "for tidiness".

**Related:** [[knowledge/concepts/frontend-session-flow]]

---

## G49 — Shell traps: toast order, lazy-page focus, two guards, router state ^g49

| Field | Value |
|---|---|
| Discovered | 2026-10-07 |
| REQ | REQ-fs-004 |
| Component | `App.tsx`, `AppShell.tsx`, `routes/PublicOnly.tsx`, `routes/RequireAuth.tsx` |
| Status | confirmed |
| Severity | careful (check before touching) |

**What:** `ToastViewport` is mounted after the routes, so the skip link stays the first Tab stop (the plan said "at the top"). react-router 7 keeps the old page until a lazy page's file arrives, so a "focus the new heading" effect runs when the real page is there. After a log in, the focus step is a sibling component inside the same `Suspense`. `RequireAuth` ends an expired session in an effect while `PublicOnly` still sees the old token for one render, so `PublicOnly` also judges expiry. `AFTER_LOG_IN_STATE` stays in `history.state` after a reload (finding n1, open).

**Where:** `App.tsx:51`, `AppShell.tsx:65`, `PublicOnly.tsx:42`, `paths.ts:22`.

**Why it's surprising:** Each is invisible until a screen reader user or a reload hits it.

**Why it exists:** Seen in review rounds 1 and 2 ([[knowledge/lessons/LESSON-REQ-fs-004-1-router-state-survives-a-reload]]).

**Don't:** Don't mount a fixed region with buttons before the skip link. Don't navigate from a page after a log in: `PublicOnly` is the only code that does.

**Related:** [[knowledge/concepts/frontend-session-flow]]

---

## G50 — Checking a page in headless Chrome: seven ways to fool yourself ^g50

| Field | Value |
|---|---|
| Discovered | 2026-10-07 |
| REQ | REQ-fs-004 |
| Component | tooling (review and implement phases) |
| Status | confirmed |
| Severity | trivia (good to know) |

**What:** Headless Chrome on Windows will not go narrower than about 500 px (check 360 px in an `<iframe>`). `element.focus()` shows no ring on buttons, links, checkboxes or radios (press Tab for real). An image with `loading="lazy"` neither loads nor fails until scrolled into view. A full-page screenshot over the debugging port changes the page width by the 15 px scrollbar, so measure first. A synthetic mouse press can leave the tab deaf to later key events. `--dump-dom` runs no animation frames, so a dialog's `close` event never fires. Each parallel Chrome run needs its own `--user-data-dir`.

**Where:** No file: how the implement and review agents looked at the app (headless Chrome at `C:/Program Files/Google/Chrome/Application/chrome.exe`, driven with plain Node over the debugging port; Node 22+ has `WebSocket`).

**Why it's surprising:** Each produced a false "it is broken" or a false "it works".

**Why it exists:** Chrome behaviour, not our code.

**Don't:** Don't read one headless result as proof; re-run in a fresh browser before calling it a page bug.

**Related:** [[knowledge/lessons/LESSON-REQ-fs-004-4-check-focus-for-real]], [[knowledge/lessons/LESSON-REQ-fs-004-5-find-out-what-listens-on-the-api-port]]
