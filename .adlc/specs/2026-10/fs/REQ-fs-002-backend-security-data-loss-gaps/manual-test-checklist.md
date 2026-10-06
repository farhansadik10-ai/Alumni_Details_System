# REQ-fs-002 — Manual test checklist

| Field | Value |
|---|---|
| REQ | REQ-fs-002 |
| Written by | task-implementer (TASK-007), 2026-10-06 |
| Run by | the repo owner, by hand, against their own database |
| Status | not yet run |

This list proves acceptance criteria AC1–AC24 against the real database. Claude wrote it from the code and did not run any of it: no API server was started and no database command was run. Until you run it, AC1–AC24 are "built, not proven".

## Problems found

None. While reading the code for this list, every acceptance criterion had matching code. Things you will notice that are **not** failures of this REQ are listed under "Known behaviour you will see" at the end.

## Checks Claude already ran (no database needed)

| Check | Result |
|---|---|
| AC25 — `npm run build` from the repo root | exit 0 (2026-10-06) |
| AC26 — `db/schema.md` unchanged; every table and column in changed SQL is in it | confirmed, see "SQL check" |
| AC27 — no file under `frontend/` changed | confirmed: `git diff redesign --stat` and `git status` show nothing under `frontend/`, `db/` or `shared/` |
| AC28 — SQL is parameterized and only in `backend/src/dal/query/` | confirmed: a search of `backend/src` finds `pool.query` and SQL text only in `dal/query/*Query.ts` |
| AC10 — no user row or hash printed (code side) | confirmed: the `console.log(user)` in `UserQuery.getAllUsers` is gone; no other `console.*` call prints a user. You confirm it live in step U11 |
| AC21 — route and its code removed (code side) | confirmed: `updateLoginTime` is left only in a commented-out line of `TestManager.ts` (a scratch script). You confirm it live in step R1 |

## Before you begin

1. **Start the API:** `npm run dev:api` from the repo root. It listens on `http://localhost:3000`.
2. **You need an admin account.** Sign-up can no longer create one (that is AC12). Pick one:
   - **(a)** Use an admin account that already exists in your database. Recommended.
   - **(b)** Create the test user "Adam" in step S4 as a `student`, then set his role by hand in your database, then log in again. The role is read from the token, so a token made before the change is still a student token. The statement, for you to run yourself (Claude does not run it):
     ```sql
     UPDATE "User" SET role = 'admin' WHERE email = 'adam.test@example.com';
     ```
   The admin is needed for steps S5, U9, U10, U11, P6, A6, C3, C5 and L1.
3. **Headers.** Every request with a body needs `Content-Type: application/json`. Every request except sign-up (`POST /api/users`) and login needs `Authorization: Bearer <token>`.
4. **Tokens last 1 hour.** If a step suddenly answers 401 `Invalid or expired token`, log in again (step S6).
5. **Placeholders.** Replace anything in `<...>`. Choose your own test passwords; do not write real ones into this file.

   | Placeholder | Where it comes from |
   |---|---|
   | `<alice-id>`, `<bob-id>`, `<sam-id>` | `id` in the sign-up responses (S1–S3) |
   | `<alice-token>`, `<bob-token>`, `<sam-token>`, `<admin-token>` | login responses (S6) |
   | `<alice-post-id>` | step P1 |
   | `<alice-profile-id>` | step A1 |
   | `<sam-comment-id>`, `<sam-comment-2-id>` | step C1 |
6. **Two shapes of error body.** The controllers answer `{ "error": "..." }`. The token check, the role check and login answer `{ "message": "..." }`.
7. **Steps marked [WRITES] change data.** They only touch the test rows created here. The test rows cannot all be removed through the API afterwards (see "Cleaning up").
8. **If you run this list twice**, the sign-up emails are already taken and sign-up answers 400. Change the emails (for example `alice2.test@example.com`).

Postman is the easiest way to run this on Windows. One curl example (Git Bash or cmd, not PowerShell):

```bash
curl -i -X PUT http://localhost:3000/api/users/<alice-id> -H "Content-Type: application/json" -H "Authorization: Bearer <alice-token>" -d "{\"name\":\"Alice Renamed\"}"
```

## Part 1 — Login still works (do this first)

- [ ] **S0 — AC9.** Log in with an account that already exists in your database (your admin, if you chose option (a)).
  `POST /api/auth/login`, no token.
  ```json
  { "email": "<existing-email>", "password": "<existing-password>" }
  ```
  Expect **200** and `{ "token": "..." }`. Nothing else in the body.
  Then send the same request with a wrong password: expect **401** `{ "message": "Invalid" }`.
  Then an email that does not exist: expect **401** `{ "message": "Invalid" }`.
  **If the first request fails, stop here and report it.** Login reads the password hash through a new, separate query.

## Part 2 — Sign-up and the test accounts

- [ ] **S1 — AC11, AC8. [WRITES]** `POST /api/users`, no token.
  ```json
  { "name": "Test Alice", "email": "alice.test@example.com", "password": "<alice-password>", "role": "alumni" }
  ```
  Expect **201**. The body has `id`, `name`, `email`, `role: "alumni"`, `photo_url: null`, `login_at`, `logout_at`, `created_at`, `updated_at`. **There is no `password` key.** Note the `id` as `<alice-id>`.

- [ ] **S2 — AC11. [WRITES]** Same request for Bob.
  ```json
  { "name": "Test Bob", "email": "bob.test@example.com", "password": "<bob-password>", "role": "alumni" }
  ```
  Expect **201**, `role: "alumni"`, no `password` key. Note `<bob-id>`.

- [ ] **S3 — AC11. [WRITES]** Same request for Sam, a student.
  ```json
  { "name": "Test Sam", "email": "sam.test@example.com", "password": "<sam-password>", "role": "student" }
  ```
  Expect **201**, `role: "student"`, no `password` key. Note `<sam-id>`.

- [ ] **S4 — only if you chose option (b). [WRITES]** Sign up Adam as a student, then run the `UPDATE` from "Before you begin" yourself.
  ```json
  { "name": "Test Adam", "email": "adam.test@example.com", "password": "<adam-password>", "role": "student" }
  ```

- [ ] **S5 — AC12.** `POST /api/users`, no token, four times, one body each:
  ```json
  { "name": "No One 1", "email": "noone1.test@example.com", "password": "<any-password>", "role": "admin" }
  ```
  ```json
  { "name": "No One 2", "email": "noone2.test@example.com", "password": "<any-password>", "role": "Alumni" }
  ```
  ```json
  { "name": "No One 3", "email": "noone3.test@example.com", "password": "<any-password>" }
  ```
  ```json
  { "name": "No One 4", "email": "noone4.test@example.com", "password": "<any-password>", "role": "" }
  ```
  Expect **400** `{ "error": "Role must be student or alumni" }` each time.
  Then, after S6, call `GET /api/users` with `<admin-token>`: none of the four `noone` emails is in the list.

- [ ] **S6 — AC9.** Log in as Alice, Bob, Sam and the admin, one request each. `POST /api/auth/login`, no token.
  ```json
  { "email": "alice.test@example.com", "password": "<alice-password>" }
  ```
  Expect **200** `{ "token": "..." }` each time. Keep the four tokens.
  Send Alice's once more with a wrong password: expect **401** `{ "message": "Invalid" }`.

## Part 3 — Users (`PUT /api/users/:id`)

After each step that says "look", call `GET /api/users/<alice-id>` with any token and read the row.

- [ ] **U1 — AC1, AC8. [WRITES]** As Alice: `PUT /api/users/<alice-id>`
  ```json
  { "photo_url": "https://example.com/alice.png" }
  ```
  Expect **200**. `photo_url` is the new value. `name` is still `Test Alice`, `email` and `role` unchanged, `updated_at` is newer. No `password` key.

- [ ] **U2 — AC1. [WRITES]** As Alice: `PUT /api/users/<alice-id>`
  ```json
  { "name": "Alice Renamed" }
  ```
  Expect **200**. `name` changed. `photo_url` is still `https://example.com/alice.png` (before this REQ it would have been wiped).

- [ ] **U3 — AC2.** Log in as Alice again with `<alice-password>` (as in S6). Expect **200** and a token. U1 and U2 sent no password, so the stored hash must be untouched.

- [ ] **U4 — AC3. [WRITES]** As Alice: `PUT /api/users/<alice-id>`
  ```json
  { "name": "Alice Again", "role": "admin", "id": 999999 }
  ```
  Expect **200**. `name` changed. `role` is still `alumni` and `id` is still `<alice-id>`.
  Then send only `{ "role": "admin" }`: expect **400** `{ "error": "No fields to update" }`. Look: `role` still `alumni`.

- [ ] **U5 — AC6 (clear a field). [WRITES]** As Alice: `PUT /api/users/<alice-id>`
  ```json
  { "photo_url": null }
  ```
  Expect **200**. `photo_url` is `null`. `name` and `email` unchanged.

- [ ] **U6 — AC6 (email and password cannot be emptied).** First look and note Alice's `updated_at`. Then as Alice, `PUT /api/users/<alice-id>` with each body:
  ```json
  { "email": null }
  ```
  ```json
  { "email": "" }
  ```
  ```json
  { "password": null }
  ```
  ```json
  { "password": "" }
  ```
  ```json
  { "name": "Should Not Save", "password": "   " }
  ```
  Expect **400** each time: `{ "error": "email must be a non-empty string" }` for the first two, `{ "error": "password must be a non-empty string" }` for the last three. A password of only spaces counts as empty.
  Look: `name` is still `Alice Again`, `email` unchanged, `updated_at` unchanged. Log in as Alice with `<alice-password>`: still **200**.

- [ ] **U7 — AC7.** As Alice, `PUT /api/users/<alice-id>` with `{}` and then with:
  ```json
  { "nickname": "x", "login_at": "2020-01-01" }
  ```
  Expect **400** `{ "error": "No fields to update" }` both times. Look: `updated_at` unchanged.

- [ ] **U8 — AC1, AC2 (the password does change when sent). [WRITES]** As Alice: `PUT /api/users/<alice-id>`
  ```json
  { "password": "<alice-new-password>" }
  ```
  Expect **200**, no `password` key in the body, `name` and `email` unchanged.
  Log in with `<alice-password>`: expect **401**. Log in with `<alice-new-password>`: expect **200**. From here on Alice's password is the new one.

- [ ] **U9 — AC13. [WRITES on the last request only]** `PUT /api/users/<alice-id>` with:
  ```json
  { "name": "Changed By Someone Else" }
  ```
  - As Bob (`<bob-token>`): expect **403** `{ "error": "Not authorized to update this user" }`.
  - As Sam (`<sam-token>`): expect **403**, same message.
  - Look: `name` is still `Alice Again`.
  - As the admin (`<admin-token>`): expect **200**, `name` is now `Changed By Someone Else`.

- [ ] **U10 — AC17 (users).** `PUT /api/users/999999` (an id that does not exist) with `{ "name": "x" }`.
  - As the admin: expect **404** `{ "error": "User not found" }`.
  - As Bob: expect **403** `{ "error": "Not authorized to update this user" }`. This is the agreed exception: a non-admin gets 403 for any id that is not their own, so they cannot learn which ids exist.

- [ ] **U11 — AC8, AC10.** Read users three ways and check that no object has a `password` key:
  - `GET /api/users` as the admin.
  - `GET /api/users/<alice-id>` as Sam.
  - `GET /api/users/email/alice.test@example.com` as the admin.

  While `GET /api/users` runs, watch the terminal where `npm run dev:api` is running: **no user rows are printed** (before this REQ every row, hash included, was printed there).

## Part 4 — Posts

There is no `GET /api/posts/:id` route. To look at a post, call `GET /api/posts` and find it by `id`.

- [ ] **P1 — AC18, AC8. [WRITES]** As Alice: `POST /api/posts`
  ```json
  { "caption": "Alice's post", "media_url": "https://example.com/a.png", "user_id": <bob-id> }
  ```
  Expect **201**. `user_id` is `<alice-id>`, **not** `<bob-id>`. No `password` key. Note `id` as `<alice-post-id>`.

- [ ] **P2 — AC4. [WRITES]** As Alice: `PUT /api/posts/<alice-post-id>`
  ```json
  { "caption": "Edited caption" }
  ```
  Expect **200**. `caption` changed. `media_url` is still `https://example.com/a.png`.

- [ ] **P3 — AC4. [WRITES]** As Alice: `PUT /api/posts/<alice-post-id>`
  ```json
  { "media_url": "https://example.com/b.png", "user_id": <bob-id> }
  ```
  Expect **200**. `media_url` changed. `caption` is still `Edited caption`. `user_id` is still `<alice-id>`.

- [ ] **P4 — AC6. [WRITES]** As Alice: `PUT /api/posts/<alice-post-id>`
  ```json
  { "media_url": null }
  ```
  Expect **200**. `media_url` is `null`. `caption` is still `Edited caption`.

- [ ] **P5 — AC7.** As Alice, `PUT /api/posts/<alice-post-id>` with `{}` and then with `{ "user_id": <bob-id> }`.
  Expect **400** `{ "error": "No fields to update" }` both times. Look: the post's `user_id` and `updated_at` are unchanged.

- [ ] **P6 — AC22. [no write expected]** `PUT /api/posts/<alice-post-id>` with `{ "caption": "Changed by someone else" }`.
  - As Bob: expect **403** `{ "error": "Not authorized to edit this post" }`.
  - As the admin: expect **403**, same message (an admin may delete any post but edit only their own).
  - Look: `caption` is still `Edited caption`.

- [ ] **P7 — AC22 (missing id).** As Alice: `PUT /api/posts/999999` with `{ "caption": "x" }`. Expect **404** `{ "error": "Post not found" }`.

## Part 5 — Alumni profiles

To look at the profile, call `GET /api/alumni/<alice-profile-id>` with any token.

- [ ] **A1 — AC23, AC8. [WRITES]** As Alice: `POST /api/alumni`
  ```json
  {
    "user_id": <bob-id>,
    "department": "Computer Science",
    "graduation_year": 2020,
    "current_company": "Test Co",
    "job_title": "Engineer",
    "experience": "3 years",
    "bio": "Test bio",
    "linkedin_url": "https://example.com/in/alice"
  }
  ```
  Expect **201**. `user_id` is `<alice-id>`, **not** `<bob-id>`. Note `id` as `<alice-profile-id>`.

- [ ] **A2 — AC5. [WRITES]** As Alice: `PUT /api/alumni/<alice-profile-id>`
  ```json
  { "job_title": "Lead Engineer" }
  ```
  Expect **200**. `job_title` changed. `department`, `graduation_year`, `current_company`, `experience`, `bio` and `linkedin_url` keep the values from A1 (before this REQ all six would have been wiped).

- [ ] **A3 — AC5. [WRITES]** As Alice: `PUT /api/alumni/<alice-profile-id>`
  ```json
  { "department": "Physics", "graduation_year": 2019, "user_id": <bob-id> }
  ```
  Expect **200**. `department` and `graduation_year` changed. `user_id` is still `<alice-id>`. The other five fields are unchanged.

- [ ] **A4 — AC6. [WRITES]** As Alice: `PUT /api/alumni/<alice-profile-id>`
  ```json
  { "bio": null }
  ```
  Expect **200**. `bio` is `null`. Everything else unchanged.

- [ ] **A5 — AC7.** As Alice, `PUT /api/alumni/<alice-profile-id>` with `{}` and then with `{ "user_id": <bob-id> }`.
  Expect **400** `{ "error": "No fields to update" }` both times. Look: `user_id` and `updated_at` unchanged.

- [ ] **A6 — AC14. [WRITES on the last request only]** `PUT /api/alumni/<alice-profile-id>` with:
  ```json
  { "experience": "Changed by someone else" }
  ```
  - As Bob: expect **403** `{ "error": "Not authorized to update this profile" }`.
  - As Sam: expect **403**, same message.
  - Look: `experience` is still `3 years`.
  - As the admin: expect **200**, `experience` changed, the other fields unchanged.

- [ ] **A7 — AC17 (alumni).** As Alice: `PUT /api/alumni/999999` with `{ "bio": "x" }`. Expect **404** `{ "error": "Alumni profile not found" }`.

- [ ] **A8 — AC8.** `GET /api/alumni`, `GET /api/alumni/<alice-profile-id>` and `GET /api/alumni/email/alice.test@example.com`, any token. These rows carry the user's `name`, `email` and `photo_url`. Check there is no `password` key.

## Part 6 — Comments

To look at a comment, call `GET /api/comments` and find it by `id`. Note: you send `post_id`, and the response calls the same value `posts_id` (a known naming difference, not part of this REQ).

- [ ] **C1 — AC19, AC8. [WRITES]** As Sam: `POST /api/comments`, twice, with these two bodies:
  ```json
  { "post_id": <alice-post-id>, "content": "Sam's first comment", "user_id": <bob-id> }
  ```
  ```json
  { "post_id": <alice-post-id>, "content": "Sam's second comment", "user_id": <bob-id> }
  ```
  Expect **201** both times. `user_id` is `<sam-id>`, **not** `<bob-id>`. Note the ids as `<sam-comment-id>` and `<sam-comment-2-id>`.

- [ ] **C2 — AC15, AC20. [WRITES]** As Sam: `PUT /api/comments/<sam-comment-id>`
  ```json
  { "content": "Edited by Sam", "user_id": <bob-id>, "post_id": 999999, "posts_id": 999999, "parent_id": 999999 }
  ```
  Expect **200**. `content` changed. `user_id` is still `<sam-id>`, `posts_id` is still `<alice-post-id>`, `parent_id` is still `null`.

- [ ] **C3 — AC15. [no write expected]** `PUT /api/comments/<sam-comment-id>` with `{ "content": "Changed by someone else" }`.
  - As Bob: expect **403** `{ "error": "Not authorized to edit this comment" }`.
  - As the admin: expect **403**, same message (an admin may delete a comment but not rewrite it).
  - Look: `content` is still `Edited by Sam`.

- [ ] **C4 — AC17 (comments).** As Sam:
  - `PUT /api/comments/999999` with `{ "content": "x" }`: expect **404** `{ "error": "Comment not found" }`.
  - `DELETE /api/comments/999999`: expect **404**, same message.

- [ ] **C5 — AC16. [WRITES: deletes the two test comments]**
  - As Bob: `DELETE /api/comments/<sam-comment-id>`. Expect **403** `{ "error": "Not authorized to delete this comment" }`. Look: the comment is still in `GET /api/comments`.
  - As Sam (the author): `DELETE /api/comments/<sam-comment-id>`. Expect **200** `{ "message": "Comment deleted successfully" }`. Look: it is gone.
  - As the admin: `DELETE /api/comments/<sam-comment-2-id>`. Expect **200**, same message. Look: it is gone.

## Part 7 — The removed login-stamp route and logout

- [ ] **R1 — AC21.** `PUT /api/users/<alice-id>/login` with **no** `Authorization` header and no body.
  Expect **404**. The body is Express's own page (`Cannot PUT /api/users/<alice-id>/login`, HTML, not JSON) because the route no longer exists.
  Send it again with `<alice-token>`: still **404**.
  Look at `GET /api/users/<alice-id>`: `login_at` is still `null`.

- [ ] **L1 — AC24. [WRITES on the last request only]** `PUT /api/users/<alice-id>/logout`, no body.
  - As Bob: expect **403** `{ "error": "Not authorized to log out this user" }`.
  - As the admin: expect **403**, same message (logout is for the user themself only).
  - Look at `GET /api/users/<alice-id>`: `logout_at` is still `null`.
  - As Alice: expect **200** with an empty body. Look: `logout_at` now has a time.

- [ ] **Z1 — AC8 (last sweep).** Search every response you saved during this run for the word `password`. It must not appear as a key in any of them. (It appears only in the 400 messages of step U6, as text.)

## Which step proves which criterion

| AC | Steps | AC | Steps |
|---|---|---|---|
| AC1 | U1, U2, U8 | AC13 | U9 |
| AC2 | U3, U6, U8 | AC14 | A6 |
| AC3 | U4 | AC15 | C2, C3 |
| AC4 | P2, P3 | AC16 | C5 |
| AC5 | A2, A3 | AC17 | U10, A7, C4 |
| AC6 | U5, U6, P4, A4 | AC18 | P1 |
| AC7 | U4, U7, P5, A5 | AC19 | C1 |
| AC8 | S1–S3, U1, U8, U11, P1, A1, A8, C1, Z1 | AC20 | C2 |
| AC9 | S0, S6, U3, U8 | AC21 | R1 |
| AC10 | U11 | AC22 | P6, P7 |
| AC11 | S1, S2, S3 | AC23 | A1 |
| AC12 | S5 | AC24 | L1 |

## Cleaning up

The test rows cannot all be removed through the API:

- The two test comments are already deleted in C5.
- Alice's post: `DELETE /api/posts/<alice-post-id>` as Alice or the admin.
- Alice's alumni profile: there is no delete route for alumni profiles.
- The test users: `DELETE /api/users/<id>` as the admin works for Bob, Sam and Adam (they own no rows). For Alice it fails with a database message while her alumni profile exists.

To remove Alice and her profile you have to do it by hand in the database, or leave them. Claude does not run that.

## Known behaviour you will see (not failures of this REQ)

- `GET /api/users/<id>` and `GET /api/alumni/<id>` answer **200 with an empty body** for an id that does not exist (G16, G27 — out of scope).
- An `:id` that is not a number (for example `/api/posts/abc`) answers **400** with the raw database message (accepted risk in the architecture).
- A student calling `POST /api/posts` or `POST /api/alumni` gets **403** `{ "message": "Forbidden" }`. That is the existing role rule, not an owner check.
- An admin calling `POST /api/alumni` creates a profile under the **admin's own** id. Nothing stops one user creating two profiles (ADR-03 is not enforced; a unique index is a schema change).
- `PUT /api/users/:id` with an email another user already has answers **400** with the raw database message.
- The terminal still prints every post row on `GET /api/posts` and every comment row on `GET /api/comments` (no password in them; out of scope). At start-up it prints the database host and name and whether a password was loaded, not the password.
- Deleting a comment that has replies, or a post that has comments, still fails with **400** (G08, ADR-06).
- Changing a password does not cancel tokens already handed out; they stay valid until they expire (up to 1 hour).
- The wrong-type check, which is not an acceptance criterion but is in the design: `PUT /api/posts/<alice-post-id>` with `{ "caption": { "x": 1 } }` answers 400 `caption has the wrong type`; `PUT /api/alumni/<alice-profile-id>` with `{ "graduation_year": "2020" }` (a string, not a number) answers 400 `graduation_year has the wrong type`.

## Helper checks

Run on 2026-10-06 with a throwaway `tsx` script in the session scratch folder (not in the repo). No database, no server.

`pickSent(body, ["name", "email", "password", "photo_url"])`:

| Body | Result |
|---|---|
| `{}` (nothing sent) | `{}` |
| no body at all (`undefined`) | `{}` |
| `{ name: "A" }` (one field) | `{"name":"A"}` |
| all four fields | `{"name":"A","email":"a@x","password":"p","photo_url":"u"}` |
| `{ photo_url: null }` | `{"photo_url":null}` — `null` is kept |
| `{ name: undefined }` | `{}` — `undefined` is dropped |
| `{ nickname: "z" }` (unknown key) | `{}` |
| `{ role: "admin", id: 9, user_id: 9, name: "A" }` | `{"name":"A"}` |
| an array body `["name"]` | `{}` |
| `{}` with the key list `["constructor"]` (inherited name) | `{}` |

`buildUpdateSet(data, ["name", "email", "password", "photo_url"])`:

| Data | Assignments | Values |
|---|---|---|
| `{}` (nothing sent) | `[]` | `[]` |
| `{ name: "A" }` | `["name = $1"]` | `["A"]` |
| all four, keys in reverse order | `["name = $1","email = $2","password = $3","photo_url = $4"]` | `["A","a@x","h","u"]` — order follows the fixed list, not the data |
| `{ photo_url: null }` | `["photo_url = $1"]` | `[null]` |
| `{ name: undefined, email: "a@x" }` | `["email = $1"]` | `["a@x"]` |
| `{ nickname: "z" }` (unknown key) | `[]` | `[]` |
| `{ role: "admin", name: "A" }` (a real column, not in the list) | `["name = $1"]` | `["A"]` |
| `{ "name = 'x'; DROP TABLE posts; --": 1, caption: "c" }` with the posts list | `["caption = $1"]` | `["c"]` — a key name never reaches the SQL text |

## SQL check

Every SQL string changed on this branch (`git diff redesign -- backend/src/dal/query`), checked by eye against `db/schema.md`. None of it has been run.

| File | Method | What changed | Table | Columns named | In `db/schema.md` |
|---|---|---|---|---|---|
| `UserQuery.ts` | `createUser` | `RETURNING *` became the public column list | `"User"` | insert: `name, email, password, role, photo_url`; returns: `id, name, email, role, photo_url, login_at, logout_at, created_at, updated_at` | yes, all |
| `UserQuery.ts` | `findUserByEmail` | `SELECT *` became the public column list | `"User"` | the nine public columns; `email` in `WHERE` | yes, all |
| `UserQuery.ts` | `findUserWithPasswordByEmail` (new, login only) | new method; `SELECT *` | `"User"` | `*`; `email` in `WHERE` | yes |
| `UserQuery.ts` | `findUserById` | `SELECT *` became the public column list | `"User"` | the nine public columns; `id` in `WHERE` | yes, all |
| `UserQuery.ts` | `updateUser` | fixed four-column `SET` became a built `SET` | `"User"` | any of `name, email, password, photo_url`; `updated_at`; `id` in `WHERE`; returns the nine public columns | yes, all |
| `UserQuery.ts` | `getAllUsers` | `SELECT *` became the public column list; row log removed | `"User"` | the nine public columns | yes, all |
| `UserQuery.ts` | `updateLoginTime` | deleted | `"User"` | — | — |
| `PostQuery.ts` | `findPostById` | takes a number now; SQL text unchanged | `posts` | `*`; `id` in `WHERE` | yes |
| `PostQuery.ts` | `updatePost` | fixed two-column `SET` became a built `SET` | `posts` | any of `caption, media_url`; `updated_at`; `id` in `WHERE`; `RETURNING *` | yes, all |
| `AlumniQuery.ts` | `updateAlumni` | fixed seven-column `SET` became a built `SET` | `alumni` | any of `department, graduation_year, current_company, job_title, experience, bio, linkedin_url`; `updated_at`; `id` in `WHERE`; `RETURNING *` | yes, all |
| `AlumniQuery.ts` | `updateAlumni`, nothing-sent path | new `SELECT * FROM alumni WHERE id = $1` | `alumni` | `*`; `id` | yes |
| `CommentQuery.ts` | `findCommentById` (new) | new `SELECT * FROM comment WHERE id = $1` | `comment` | `*`; `id` | yes |

The public column list is the ten `"User"` columns in `db/schema.md` minus `password`. `password` is named in three places only: the `INSERT` in `createUser`, the `SET` list of `updateUser`, and (through `*`) the login-only read.

SQL produced by each `update*` for two sample bodies (from the helper script; the id is always the last parameter):

| Method | Fields sent | SQL | Parameters |
|---|---|---|---|
| `updateUser` | `{ name }` | `UPDATE "User" SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, email, role, photo_url, login_at, logout_at, created_at, updated_at` | `["Alice B", id]` |
| `updateUser` | `{ email, password, photo_url: null }` | `UPDATE "User" SET email = $1, password = $2, photo_url = $3, updated_at = NOW() WHERE id = $4 RETURNING id, name, email, role, photo_url, login_at, logout_at, created_at, updated_at` | `["a@x", "<hash>", null, id]` |
| `updatePost` | `{ caption }` | `UPDATE posts SET caption = $1, updated_at = NOW() WHERE id = $2 RETURNING *` | `["New", id]` |
| `updatePost` | `{ media_url: null, caption }` | `UPDATE posts SET caption = $1, media_url = $2, updated_at = NOW() WHERE id = $3 RETURNING *` | `["New", null, id]` |
| `updateAlumni` | `{ job_title }` | `UPDATE alumni SET job_title = $1, updated_at = NOW() WHERE id = $2 RETURNING *` | `["Lead", id]` |
| `updateAlumni` | `{ bio: null, graduation_year }` | `UPDATE alumni SET graduation_year = $1, bio = $2, updated_at = NOW() WHERE id = $3 RETURNING *` | `[2020, null, id]` |

## Related

- Spec: REQ-fs-002 (AC1–AC28)
- Lessons: [[knowledge/lessons/LESSON-REQ-fs-001-1]] (a passing build does not check SQL)
- Concepts: [[knowledge/concepts/partial-update-sent-fields]]
