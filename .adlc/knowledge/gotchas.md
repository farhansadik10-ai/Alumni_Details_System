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

**Update 2026-10-05 (REQ-fs-001):** The insert now targets `alumni` with the schema's column names. Not yet run against the database (`STATUS: needs verification` until the owner's manual check).

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

**Update 2026-10-06 (REQ-fs-002):** `updateAlumni` writes only the columns that were sent. `null` clears a field; a body with no updatable field is 400. Not yet run against the database (`STATUS: needs verification` until the owner's manual check).

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
| Status | fixed by REQ-fs-002 (2026-10-06) — kept for history |
| Severity | landmine (can cause an outage) |

**What:** `updateUser` always writes `name`, `photo_url`, `password` and `email`. A request that leaves one out sends it as NULL. `password` and `email` are NOT NULL, so that update is rejected; any nullable field left out (`name`, `photo_url`) is silently wiped.

**Where:** `backend/src/dal/query/UserQuery.ts` → `updateUser`; `UserController.updateUser` passes `undefined` for a missing password. Reached by `PUT /api/users/:id`.

**Why it's surprising:** It takes `Partial<UserDTO>` and the controller hashes the password only "if given", which reads like a partial update. The retired plan recorded the effect as "sets the password to NULL and locks the user out"; with the NOT NULL constraint in `db/schema.md` the database should refuse that instead — which of the two happens has not been tested (`STATUS: needs verification`).

**Don't:** Don't build a profile-edit form that sends only the changed fields until this query stops overwriting omitted ones.

**Update 2026-10-06 (REQ-fs-002):** `updateUser` writes only the sent ones of `name`, `email`, `password`, `photo_url`. No password sent keeps the hash. `email` or `password` sent as `null`, empty or only spaces is 400. `role` cannot be changed through this route. Not yet run against the database (`STATUS: needs verification` until the owner's manual check).

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

**Update 2026-10-06 (REQ-fs-002):** `updatePost` writes only `caption` / `media_url` when sent; editing the caption keeps the media. Not yet run against the database (`STATUS: needs verification` until the owner's manual check).

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
| Status | fixed by REQ-fs-002 (2026-10-06) — kept for history |
| Severity | landmine (can cause an outage) |

**What:** `POST /api/users` is public and stores whatever `role` the body contains, so anyone can register as `admin`.

**Where:** `backend/src/api/controllers/UserController.ts` → `createUser`; route in `backend/src/api/routes/UserRoutes.ts`.

**Why it's surprising:** A sign-up form that offers only student and alumni looks safe. The limit is in the UI only.

**Don't:** Don't rely on the form. [[architecture/adr-01-sign-up-role-is-student-or-alumni|ADR-01]] decides that admin is never selectable; the backend must enforce it.

**Update 2026-10-06 (REQ-fs-002):** `createUser` accepts only the exact values `student` and `alumni`; anything else, or no role, is 400 and no user is created. Sign-up can no longer create an admin: today the first admin is made by hand in the database (ADR-01 leaves this open). Not yet run against the database (`STATUS: needs verification` until the owner's manual check).

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
| Status | fixed by REQ-fs-002 (2026-10-06) — kept for history |
| Severity | landmine (can cause an outage) |

**What:** Every user query uses `SELECT *` or `RETURNING *`, and the controllers send the row as it is. Create, get all, get by id, get by email and update all return the `password` column (the bcrypt hash).

**Where:** `UserQuery.createUser`, `findUserByEmail`, `findUserById`, `updateUser`, `getAllUsers`; the matching functions in `UserController.ts`.

**Why it's surprising:** `GET /api/users/:id` is open to any logged-in user, so any user can read any other user's hash.

**Don't:** Don't add a join to `"User"` with `SELECT *`. No endpoint may return `password`. The login path still needs the hash internally, so don't remove it from `findUserByEmail` without giving login another way to read it.

**Update 2026-10-06 (REQ-fs-002):** Every `UserQuery` read and write names its columns without `password`. One read, `findUserWithPasswordByEmail`, selects the hash and is used only by login. The row log in `getAllUsers` is gone. See [[knowledge/lessons/LESSON-REQ-fs-002-2]]. Not yet run against the database (`STATUS: needs verification` until the owner's manual check).

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

**Update 2026-10-06 (REQ-fs-002):** `PUT /api/users/:id` is allowed only for that user or an admin; anyone else gets 403. The 403 comes before the 404, so a non-admin cannot learn which ids exist. An admin can change another user's email or password (the owner asked for owner-or-admin). Not yet run against the database (`STATUS: needs verification` until the owner's manual check).

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

**Update 2026-10-06 (REQ-fs-002):** `PUT /api/alumni/:id` is allowed only for the profile's owner or an admin; a missing id is 404; `req.body` is no longer passed through. Not yet run against the database (`STATUS: needs verification` until the owner's manual check).

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

**Update 2026-10-06 (REQ-fs-002):** `createPost` stores `req.user.sub`; a `user_id` in the body is ignored. Not yet run against the database (`STATUS: needs verification` until the owner's manual check).

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

**Update 2026-10-06 (REQ-fs-002):** `PUT /api/posts/:id` is author-only, admins included (ADR-02); a missing id is 404. Not yet run against the database (`STATUS: needs verification` until the owner's manual check).

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

**Update 2026-10-06 (REQ-fs-002):** `createComment` stores `req.user.sub`; a `user_id` in the body is ignored. It still reads `post_id` (G13). Not yet run against the database (`STATUS: needs verification` until the owner's manual check).

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

**Update 2026-10-06 (REQ-fs-002):** Edit is author-only (admins too) and changes only `content`; delete is author or admin; a missing id is 404 on both. Deleting a comment with replies still fails (G08). Not yet run against the database (`STATUS: needs verification` until the owner's manual check).

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

---

## G25 — Alumni reads and alumni writes return different shapes ^g25

| Field | Value |
|---|---|
| Discovered | 2026-10-05 |
| REQ | REQ-fs-001 |
| Component | `backend/src/dal/query/AlumniQuery.ts`, `backend/src/dal/dto/AlumniDTO.ts`, `shared/types/alumni.types.ts` |
| Status | confirmed |
| Severity | careful (check before touching) |

**What:** `getAllAlumni`, `findAlumniById` and `findAlumniByEmail` return the alumni columns plus the user's `name`, `email` and `photo_url`. `createAlumni` and `updateAlumni` return the alumni columns only. On a read, the three user fields are `null` when the alumni row has no user.

**Where:** `AlumniQuery.ts` — the reads use a `LEFT JOIN "User"`; the writes use `RETURNING *`, which cannot join. `AlumniDTO` declares the three fields as optional `string`; the shared `Alumni` type does not declare them at all.

**Why it's surprising:** Both paths are typed as `AlumniDTO`. A screen that refreshes a card from the POST or PUT response loses the name and photo, and the types say `string | undefined` where the database sends `null`.

**Why it exists:** The owner asked for the join on reads only, and chose `LEFT JOIN` and optional DTO fields at the design gate to keep REQ-fs-001 inside four files.

**Don't:** Don't refresh UI state from a create or update response; GET the row again. Treat `name`, `email`, `photo_url` as nullable. Add them to the shared `Alumni` type (as `string | null`) before the first screen uses them.

**Related:** [[knowledge/concepts/user-join-read-shape]], [[knowledge/gotchas#^g05|G05]], [[knowledge/components/dal-query-classes]].

---

## G26 — `getAllAlumni` returns rows in no fixed order ^g26

| Field | Value |
|---|---|
| Discovered | 2026-10-05 |
| REQ | REQ-fs-001 |
| Component | `backend/src/dal/query/AlumniQuery.ts` |
| Status | confirmed |
| Severity | careful (check before touching) |

**What:** The alumni list query has no `ORDER BY`. PostgreSQL may return the rows in a different order after any row is updated.

**Where:** `AlumniQuery.getAllAlumni`. Reached by `GET /api/alumni`. (`getAllComments` does sort, by `created_at DESC`.)

**Why it's surprising:** On a small, never-edited table the rows come back in insert order, so it looks sorted.

**Why it exists:** Found in the REQ-fs-001 review (finding m2); the owner approved the REQ as-is under "No other change".

**Don't:** Don't rely on the list order in a screen or a pagination scheme. Add `ORDER BY a.id` (or sort in the client) first.

**Related:** [[knowledge/gotchas#^g05|G05]].

---

## G27 — Updating or deleting a row that does not exist reports success ^g27

| Field | Value |
|---|---|
| Discovered | 2026-10-05 |
| REQ | REQ-fs-001 |
| Component | `backend/src/dal/query/AlumniQuery.ts`, `backend/src/dal/query/CommentQuery.ts`, their controllers |
| Status | partly fixed by REQ-fs-002 (2026-10-06) |
| Severity | careful (check before touching) |

**What:** `PUT /api/alumni/:id` and `PUT /api/comments/:id` with an id that does not exist return 200 with an empty body. `DELETE /api/comments/:id` reports success whether or not a row was deleted.

**Where:** `AlumniQuery.updateAlumni`, `CommentQuery.updateComment` (`UPDATE … RETURNING *` gives no row; `rows[0]` is `undefined`); `CommentQuery.deleteComment` returns nothing. The controllers send whatever they get.

**Why it's surprising:** These paths could not run before REQ-fs-001, so nothing ever showed it. Same family as G16.

**Why it exists:** Out of scope for REQ-fs-001 (review finding m1).

**Don't:** Don't treat a 200 from these endpoints as "saved". Check for an empty body until they return 404.

**Update 2026-10-06 (REQ-fs-002):** `PUT /api/alumni/:id`, `PUT /api/comments/:id` and `DELETE /api/comments/:id` now answer 404 for a missing id, and the Query methods are typed as possibly returning no row ([[knowledge/lessons/LESSON-REQ-fs-002-1]]). Still open: the user and alumni lookups (G16).

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
| Status | confirmed |
| Severity | careful (check before touching) |

**What:** Controllers answer `{ error: "..." }`. `authMiddleware`, `requireRole` and login answer `{ message: "..." }`. A 403 from the role check and a 403 from an owner check on the same route have different body keys.

**Where:** `authMiddleware.ts`, `roleMiddleware.ts`, `AuthRoutes.ts` (`message`); every `*Controller.ts` (`error`).

**Why it's surprising:** Same status code, same route, two shapes.

**Why it exists:** Never unified; the shared error middleware (roadmap B3) is where it should be.

**Don't:** Don't read only one key in the frontend's error handling. Read both until B3 settles one shape.

**Related:** [[knowledge/components/api-controllers-and-routes]].

---

## G30 — Each update's allowed-field list is written twice ^g30

| Field | Value |
|---|---|
| Discovered | 2026-10-06 |
| REQ | REQ-fs-002 |
| Component | `UserController` + `UserQuery`, `PostController` + `PostQuery`, `AlumniController` + `AlumniQuery` |
| Status | confirmed |
| Severity | trap (will bite a normal change) |

**What:** The fields an update may change are listed once in the controller (which keys to pick from the body) and once in the Query class (which columns may appear in the SQL). A column added to only one list is silently dropped and the call still answers 200.

**Where:** `USER_UPDATE_FIELDS` / `UPDATABLE_USER_COLUMNS`; `UPDATABLE_FIELDS` / `UPDATABLE_COLUMNS` in the alumni and post files.

**Why it's surprising:** The update compiles and returns 200; only the missing change in the row shows it.

**Why it exists:** Deliberate: the Query builds SQL only from its own constant and never trusts a list handed down (REQ-fs-002 review finding m3, kept by the owner).

**Don't:** Don't add an updatable column in one place. Change the controller list, the Query list and the type check together. Don't replace the Query's list with one passed in from the controller.

**Related:** [[knowledge/concepts/partial-update-sent-fields]], [[architecture/adr-08-mentoring-and-field-stay-two-new-alumni-columns|ADR-08]] (the next columns to add).

---

## G31 — DTO types do not allow `null`, but the database sends it and updates accept it ^g31

| Field | Value |
|---|---|
| Discovered | 2026-10-06 |
| REQ | REQ-fs-002 |
| Component | `backend/src/dal/dto/*DTO.ts`, the three update controllers, `UserManager.updateUser` |
| Status | confirmed |
| Severity | careful (check before touching) |

**What:** DTO fields are typed `string` or `string | undefined`. A nullable column read with `SELECT *` arrives as `null`, and a partial update may send `null` to clear a field. So the controllers cast (`fields as Partial<PostDTO>`, `as Partial<AlumniDTO>`) and `updateUser` takes `Record<string, unknown>`: three shapes for the same thing.

**Where:** `PostController.updatePost`, `AlumniController.updateAlumni`, `UserManager.updateUser`, `UserQuery.updateUser`; `CommentDTO.parent_id`.

**Why it's surprising:** The types read as if `null` cannot happen, and the casts hide that it can.

**Why it exists:** Fixing the DTO types was outside the files REQ-fs-002 named (review finding m4, left for the controller rewrite, roadmap B3).

**Don't:** Don't trust a DTO type to tell you a value is not `null`. Don't add a fourth shape: when B3 lands, give the three updates one input type that allows `null`.

**Related:** [[knowledge/gotchas#^g25|G25]], [[knowledge/concepts/partial-update-sent-fields]].

---

## G32 — An alumni profile always belongs to whoever created it, and nothing stops a second one ^g32

| Field | Value |
|---|---|
| Discovered | 2026-10-06 |
| REQ | REQ-fs-002 |
| Component | `backend/src/api/controllers/AlumniController.ts`, `backend/src/api/routes/AlumniRoutes.ts` |
| Status | confirmed |
| Severity | careful (check before touching) |

**What:** `POST /api/alumni` stores the caller's id as `user_id`. An admin who calls it creates a profile for themself and cannot create one for another user. A user who calls it twice gets two profiles.

**Where:** `AlumniController.createAlumni`; the route still allows the `admin` role. `alumni.user_id` has no UNIQUE constraint (`db/schema.md`).

**Why it's surprising:** The route lets admins in, which reads as "admin can set up a profile for someone". And ADR-03 says one profile per user, which reads as enforced.

**Why it exists:** ADR-03 chose "created only by that user"; enforcing one-per-user needs a check or a schema change, both outside REQ-fs-002 (review finding m7).

**Don't:** Don't build an admin "create profile for user" screen on this endpoint. Hide "add my profile" once the user has one, until the backend refuses a second.

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
| Status | confirmed |
| Severity | careful (check before touching) |

**What:** A non-numeric `:id` (for example `/api/posts/abc`) reaches PostgreSQL as `NaN` and comes back as 400 with the database's own message. So does a sign-up or a user update with an email that is already taken (the message names the constraint `User_email_key`).

**Where:** Every controller `catch` block (`res.status(400).json({ error: error.message })`); `PostController.deletePost` joined the list in REQ-fs-002's fix round (review finding t2); `UserController.updateUser` and `createUser` for the duplicate email (finding m6).

**Why it's surprising:** The new 400 / 403 / 404 answers have clear messages, so the remaining raw ones look like a bug in this change.

**Why it exists:** Accepted by the owner at the REQ-fs-002 design and review gates; the shared error middleware (roadmap B3) is where it gets fixed. The legacy sign-up form matches on `User_email_key` to show "email taken".

**Don't:** Don't change the duplicate-email message without updating whatever screen matches on it. Don't parse these messages in new frontend code; wait for B3's error shape.

**Related:** [[knowledge/gotchas#^g29|G29]], [[knowledge/gotchas#^g16|G16]].
