# API check for REQ-fs-003

| Field | Value |
|---|---|
| REQ | REQ-fs-003 |
| Script | `scripts/api-check.mjs` |
| Written | 2026-10-06, TASK-012 |
| Changed | 2026-10-07, review round 1 (findings M4, m3): 100 checks became 110 |
| Run by Claude | No. Only `node --check`. |
| Run by the owner | Yes, twice, 2026-10-07, both times the earlier 100-check version. See the first section. |

## Owner's run against the real database (2026-10-07)

Run by the repo owner, not by Claude. Recorded from the owner's report.

| Round | Owner's own script | `scripts/api-check.mjs` |
|---|---|---|
| 1 | 71 passed, 4 failed, one cause: `POST /api/comments` with `{ posts_id, content }` answered 400 `Invalid post_id` | 89 passed, 0 failed, 11 skipped (no admin account set) |
| 2, after the fix | 91 of 91 passed, 14 of them admin checks | run with the admin account: 0 failed |
| 3, after review rounds 2 and 3 | passed (the owner reported "both pass"; no counts given) | passed, the 110-check version (no counts given) |

Fix between the rounds: comment create reads `posts_id` (the column's name) and needs non-empty content.

Round 3 was run on the code after the review fixes: alumni and comment create/update and every comment read answer the author fields; the script has 110 checks.

The 14 admin checks in the owner's script covered: list and search users; role filter; an admin updates another user; an admin cannot edit another user's post; an admin deletes another user's comment and post; 409 on deleting a user who has content; 200 on deleting a user who has none; 404 for an unknown user. These are the admin paths that REQ-fs-002 left untested.

**The script changed after these runs (review round 1, 2026-10-07) and needs a re-run.** It now has 110 checks, and some expect the API as it is after the same fix round (see "What changed in review round 1").

## What changed in review round 1

Not run by Claude. Only `node --check scripts/api-check.mjs` (exit 0).

| Finding | Change | Checks |
|---|---|---|
| M4: delete only proven two levels deep | The top comment is now deleted while its reply and the reply to that reply are still under it. The check first reads the thread and confirms the three levels, then confirms all three answer 404 on edit, the post's list and `comment_count` drop by three, and the sibling comment still works. The post delete does the same with a three-level thread. | J11, J12, K02, K03, K04 |
| m3: A07 took 400 or 500 | One status per case: 400 with the exact text `Invalid value in request`. A second column (email) and a zero byte were added. | A07, A08 |
| m3: thin "no database text" pattern | Wider pattern (constraint and index name endings, `violates`, `relation`, `syntax`, `duplicate key`, `pg_`, `"User"`, `does not exist`, `permission denied`, `invalid byte sequence`, `ECONNREFUSED` and more). It now searches every key and value of an error body, not only `error`. | every error answer |
| m3: F11 needed the newest profile in the whole database | Compares only this run's two profiles (Bob's before Alice's). | F11 |
| m3: no id above 2147483647 | `2147483648` and `99999999999` joined the bad-id forms; each must answer 400 with the exact text `Invalid id`. Body ids too. | B01 to B10, X10, J02 |
| m3: no password change | Dana changes her password; the new one logs in (200), the old one does not (401). | H06 |
| m3: no `GET /api/comments` | 200, an array, no `password` key, the keys `name` and `photo_url` on this run's own comments (review round 2, n2), and none of the deleted comments. | J14 |
| m3: no two creates at once | Two `POST /api/alumni` in one `Promise.all` for a new user, Carol: one 201, one 409, one profile. | R01, R02 |
| m3: repeated query keys | `?department=a&department=b` (and `q`, `graduation_year`, `field`, `mentoring`, `page`, `limit`) answer 400. | F13 |
| M1 (fixed in the same round): write answers | `POST` and `PUT /api/alumni` must carry `name`, `email`, `photo_url`; `POST` and `PUT /api/comments` must carry `name`, `photo_url`. | E10, G06, J15, J16, R01 |

**These fail against the API as it was before the round's fixes:** E10, G06, J15, J16 and R01 (the write answers had no `name`). That is the intended reading, not a script fault.

## Problems found

**None by reading the code or by the seven checks below.** All seven passed. The script itself has not been run, so nothing here proves how the API behaves against the database. The owner's run does that.

Where the script's expectation comes from: the spec (`requirement.md`) first. Where the spec gives no exact text or leaves an order open, the script expects what the earlier tasks decided and wrote in their Notes. Those places are listed here so a failure can be read correctly.

**Places where the code does more than the spec says (not failures; the script expects the code's answer):**

| Where | Spec | Code | Check |
|---|---|---|---|
| `graduation_year` filter above 2147483647 | "must be a whole number (else 400)" | 400, because the column is a PostgreSQL integer | F07 |
| `POST /api/alumni`, older fields (for example `department: 5`) | type checks on older create fields are "out of scope" | 400 `department has the wrong type` (TASK-009 note) | not checked |
| `POST /api/posts` with `caption: 5` | no rule | 400 `caption has the wrong type` | I02 |
| `POST /api/comments` body key and content | changed by the owner at the implement gate (2026-10-07), now AC10 | the key is `posts_id` (`post_id` alone is 400); missing, `null`, empty, only-spaces or non-text `content` is 400 `Content is required` | J02, J06 |
| Comment on a missing post with a malformed `parent_id` | missing post is 404, bad parent is 400; order not given | 400 (the body is checked before any query) | J02 |
| Login password of only spaces | "missing or not a string" is 400 | 401 (it is text, so it is compared) | C06 |
| A value the database refuses (too long, a zero byte) | "no raw database text" (AC5); status not given | 400 `Invalid value in request` (PostgreSQL class 22, ADR-11) | A07, A08 |
| An id above 2147483647 | "a positive whole number" (AC6) | 400 `Invalid id`, before any query | B01 to B10, X10, J02 |
| A query key sent twice | no rule | 400 `<key> must be a single value` | F13 |

A08 rests on one thing that was read, not run: that PostgreSQL refuses a zero byte in text with a class 22 code. If A08 fails with a 500, the middleware's mapping is the place to look; if it fails with a 201, a user row named `zero…byte` was stored.

**Things reading turned up that the script does not check. For the owner to decide; none is a spec failure.**

- **"No database query runs" for a bad id (AC6).** HTTP shows the 400 and its text, not whether a query ran first. Checked by reading: every controller calls `parseId` before its first Manager call.
- **The 500 `Internal server error` branch (AC5).** No request is known to reach it, and the script does not fake one. Checked by reading `errorMiddleware.ts`: that branch sends a fixed text.
- **"All or nothing" (AC30, AC31).** The script checks the end result (every level gone, nothing else touched). That a failure half-way leaves nothing deleted was checked by reading `PostQuery.deletePost` and `CommentQuery.deleteComment`.
- **The one-profile lock (AC24).** R01 sends two creates in one `Promise.all` and expects one 201 and one 409. Two requests on one machine usually overlap, but nothing forces them to; a pass shows the result is right, not that the lock was the reason. The lock itself was checked by reading `AlumniQuery.createAlumni`.
- **A nested query key (`?q[x]=a`).** Whether it reaches the controller as an object depends on Express's query parser setting, so no check pins it. The repeated key (F13) is checked.
- **A filter value that ends in a tab** (finding m2). No check sends one.
- **AC22 "sorted A to Z".** The database sorts text by its own collation. F12 accepts plain character order or dictionary order.

## How to run it

**It writes test rows to whatever database the API uses.** Run it on a quiet database: the stats and "newest first" checks assume nobody else is adding rows during the run.

1. In one terminal, from the repo root: `npm run dev:api`
2. In a second terminal, from the repo root, one of the following.

Without the admin checks (11 of the 110 checks are skipped):

```
node scripts/api-check.mjs
```

With the admin checks. An admin account must already exist; sign-up cannot make one (ADR-01). The lines below ask for the password and keep it out of files and out of the shell history.

PowerShell:

```powershell
$env:ADMIN_EMAIL = "<the admin's email>"
$env:ADMIN_PASSWORD = Read-Host "Admin password"
node scripts/api-check.mjs
Remove-Item Env:ADMIN_EMAIL, Env:ADMIN_PASSWORD
```

(`Read-Host` shows what you type. In PowerShell 7 use `Read-Host "Admin password" -MaskInput`.)

Git Bash:

```bash
read -r -s -p "Admin password: " ADMIN_PW; echo
ADMIN_EMAIL="<the admin's email>" ADMIN_PASSWORD="$ADMIN_PW" node scripts/api-check.mjs
unset ADMIN_PW
```

Settings, all from the environment:

| Variable | Default | Meaning |
|---|---|---|
| `API_URL` | `http://localhost:3000` | where the API listens |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | not set | both set: the admin checks run |
| `API_CHECK_ALLOW_REMOTE` | not set | must be `1` before the script will talk to an `API_URL` that is not this machine |

The script reads no file, imports nothing from the repo, and never prints a token, a password or a whole response body. On a failure it prints the expected and the actual status and the response's `error` text.

## Reading the output

One line per check: `PASS`, `FAIL` or `SKIP`, the check id, the AC in brackets, and what was checked. A failure adds a `->` line with the reason. At the end: the clean-up list, the totals, and every failure again. The exit code is 1 when any check failed, else 0.

A check that depends on an earlier one that failed says `cannot run: ... is missing because an earlier step failed`. Fix the first failure and run again.

## What it covers

110 checks. Ids starting with `X`, and `D04`, need the admin variables. The `R` checks run last, after the admin checks, so that Carol and her profile are not there while earlier checks count this run's users and profiles.

| AC | Checks |
|---|---|
| AC2 login answers `{ token }` | S03, X01 |
| AC3 one error middleware (seen from outside: one shape from every layer) | A06 |
| AC4 every error is `{ error }`, no `message` key | A01, A02, A03, A04, A05; also every error answer in every other check |
| AC5 no raw database text | A07, A08; also every error answer in every other check is searched, key and value, for PostgreSQL wording |
| AC6 bad `:id` is 400 | B01 to B10 (every non-admin route with `:id`), X10 (`DELETE /api/users/:id`); ids in a comment body: J02. Seven bad forms each, two of them above 2147483647 |
| AC7 taken email is 409 | C01, C02 |
| AC8 sign-up and login input | C03, C04, C05, C06 |
| AC9 nothing found is 404 | D01, D02, D03, D04 |
| AC10 comment on a missing post, bad `parent_id`, body key `posts_id`, content required | J01, J02, J04, J06 |
| AC12 REQ-fs-002 rules still hold | S02, S05, C07, D05, E01, G05, H01, H02, H03, H06 (password change), I01, I02, J09, J10, J14 (`GET /api/comments`), J15, J16 (comment write answers), K01, X06 |
| AC14 create with the two new fields | E02, E04, E05 |
| AC15 update with the two new fields | G01, G02, G03 |
| AC16 every read and write answer has them | E09, G04; the write answers in full, with `name`, `email`, `photo_url`: E10 (`POST`), G06 (`PUT`) |
| AC18 alumni list shape and paging | F01, F02, F03 |
| AC19 `q` | F04, F05 |
| AC20 filters | F06, F07, F08, F09, F10, F13 (a key sent twice) |
| AC21 fixed order | F11 |
| AC22 `/filters` | F12 |
| AC23 `/me` | E03, E08 |
| AC24 second profile is 409 | E07; two creates at once: R01, R02 |
| AC25 user list (admin) | H04, X02, X03, X04 |
| AC26 stats | S04, S06, E06, I03 |
| AC27 post list | I04, I05, I06 |
| AC28 `comment_count` | J03, J05, J13 |
| AC29 comments of one post | J07, J08 |
| AC30 post delete takes its comments | K02, K03 (three levels deep), K04, X09 |
| AC31 comment delete takes its replies | J11 (a leaf), J12 (three levels deep), X08 |
| AC32 post edit is author-only | I07, X05 |
| AC33 user delete | H05, X07, X10 |

**Without the admin variables these stay unproven:** AC25 apart from the 403 (H04); AC33 apart from the 403 (H05); `GET /api/users/email/:email` in AC9; the "or an admin" halves of AC12, AC30, AC31 and the admin half of AC32.

**Not checked over HTTP at all:** AC1, AC11, AC13, AC17, AC34, AC35, AC36 (code and build facts; see the next section) and AC38 (wrap-up).

## What is left behind

The script deletes its own comments and posts at the end, and sets Bob's blank department to `null`. It then prints what it could not remove.

- **Alice, Bob and Carol always stay**, each with one alumni profile: three users and three profiles per run (it was two before review round 1). No endpoint deletes a profile, and a user with a profile cannot be deleted (ADR-06). Their emails are `apicheck-<run tag>-alice@example.com`, `...-bob@example.com` and `...-carol@example.com`; the run prints the user ids and the profile ids.
- **Carol** is the user of the two-creates-at-once check (R01). If that check fails with two 201s she has two profiles and the run prints only one of the ids; find the other by her user id. If both creates fail she has no profile and is deleted with the students.
- **Sam and Dana (students)** are deleted when the admin variables are set. Without them they stay. Dana's password is changed once during the run (H06); both values are random and are never printed.
- **Nothing else.** The sign-ups that A07 and A08 expect to be refused create no row when they pass. If one fails with "the sign-up was accepted", a user `apicheck-<run tag>-longname@...`, `apicheck-<run tag>-eee...@...` or `...-zerobyte@...` exists and is not in the printed list.
- To remove the rest by hand, the owner deletes the `alumni` rows and then the `"User"` rows whose email starts with `apicheck-`.

## Checks Claude already ran (no database needed)

Run on 2026-10-06, after the `updateSet.ts` edit, on branch `feat/REQ-fs-003-finish-backend-api`. Nothing below started the API, ran the script, or imported the DAL.

| # | Check | Result |
|---|---|---|
| 1 | `npm run build` (AC34) | exit 0 |
| 2 | `npx tsc --noEmit -p backend/src/dal` and `-p backend/src/businessLogic` (AC34) | both exit 0. `-p backend/src/api` also exit 0 |
| 3 | `node --check scripts/api-check.mjs` | exit 0. The script was not run. Run again on 2026-10-07 after the review round 1 changes: exit 0 |
| 4 | `backend/src/api` shape (AC1 to AC4) | pass: no `try` or `catch` in `controllers/`; every `controllers/` export is one class; `{ message: ... }` appears only in three 200 answers (user, post and comment deleted), never with a 4xx or 5xx; 25 route lines, 25 `handler(` calls, each the last argument |
| 5 | SQL (AC35) | pass: no `pool.query`, `client.query` or SQL keyword in any `.ts` under `backend/src` outside `dal/query/`; every table and column in `dal/query/` is in `db/schema.md`; every `$n` has a value (counted statement by statement); no `u.*`; `password` is in the sign-up insert and the update column list, and the one `SELECT *` on `"User"` is `findUserWithPasswordByEmail` |
| 6 | Nothing under `frontend/` changed (AC36) | pass: `git status --short -- frontend` is empty; `git diff --name-only redesign` lists 54 files, none under `frontend/` |
| 7 | No `as Partial<PostDTO>` / `as Partial<AlumniDTO>` in `backend/src` (AC11) | pass: no `as Partial<` anywhere |

Two more, beyond the list:

- `buildUpdateSet`'s first parameter is now `UpdateFields` (`backend/src/dal/query/updateSet.ts`). All three callers (`UserQuery`, `AlumniQuery`, `PostQuery`) compile with it.
- The script was type-checked as JavaScript (`tsc --allowJs --checkJs --noEmit`) to catch a misspelled name without running it. One report, a header-type note on the `fetch` call that does not affect Node; no unknown name. The 110-check version was checked the same way on 2026-10-07 (a copy, not run): the same header-type note and no unknown name.

## Related

- Task: TASK-012
- Spec: REQ-fs-003 `requirement.md` (AC34 to AC37)
- [[architecture/adr-06-deleting-rows-that-other-rows-reference|ADR-06]], [[architecture/adr-01-sign-up-role-is-student-or-alumni|ADR-01]]
