# API check for REQ-fs-003

| Field | Value |
|---|---|
| REQ | REQ-fs-003 |
| Script | `scripts/api-check.mjs` |
| Written | 2026-10-06, TASK-012 |
| Run by Claude | No. Only `node --check`. |
| Run by the owner | Yes, twice, 2026-10-07. See the first section. |

## Owner's run against the real database (2026-10-07)

Run by the repo owner, not by Claude. Recorded from the owner's report.

| Round | Owner's own script | `scripts/api-check.mjs` |
|---|---|---|
| 1 | 71 passed, 4 failed, one cause: `POST /api/comments` with `{ posts_id, content }` answered 400 `Invalid post_id` | 89 passed, 0 failed, 11 skipped (no admin account set) |
| 2, after the fix | 91 of 91 passed, 14 of them admin checks | run with the admin account: 0 failed |

Fix between the rounds: comment create reads `posts_id` (the column's name) and needs non-empty content.

The 14 admin checks in the owner's script covered: list and search users; role filter; an admin updates another user; an admin cannot edit another user's post; an admin deletes another user's comment and post; 409 on deleting a user who has content; 200 on deleting a user who has none; 404 for an unknown user. These are the admin paths that REQ-fs-002 left untested.

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

**Things reading turned up that the script does not check. For the owner to decide; none is a spec failure.**

- **An id too big for the database** (for example `GET /api/users/99999999999`). Found while writing this script; fixed afterwards by the orchestrator: `parseId` now refuses any id above 2147483647 with 400 `Invalid id`, before any query. The script has no check for it.
- **"All or nothing" (AC30, AC31) and the one-profile lock (AC24) cannot be shown over HTTP.** The script checks the end result (everything gone, nothing extra created). The transaction and the lock were checked by reading `PostQuery.deletePost`, `CommentQuery.deleteComment` and `AlumniQuery.createAlumni`.
- **AC22 "sorted A to Z".** The database sorts text by its own collation. F12 accepts plain character order or dictionary order.

## How to run it

**It writes test rows to whatever database the API uses.** Run it on a quiet database: the stats and "newest first" checks assume nobody else is adding rows during the run.

1. In one terminal, from the repo root: `npm run dev:api`
2. In a second terminal, from the repo root, one of the following.

Without the admin checks (11 of the 100 checks are skipped):

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

100 checks. Ids starting with `X`, and `D04`, need the admin variables.

| AC | Checks |
|---|---|
| AC2 login answers `{ token }` | S03, X01 |
| AC3 one error middleware (seen from outside: one shape from every layer) | A06 |
| AC4 every error is `{ error }`, no `message` key | A01, A02, A03, A04, A05; also every error answer in every other check |
| AC5 no raw database text | A07; also every error answer in every other check is searched for PostgreSQL wording |
| AC6 bad `:id` is 400 | B01 to B10 (every non-admin route with `:id`), X10 (`DELETE /api/users/:id`) |
| AC7 taken email is 409 | C01, C02 |
| AC8 sign-up and login input | C03, C04, C05, C06 |
| AC9 nothing found is 404 | D01, D02, D03, D04 |
| AC10 comment on a missing post, bad `parent_id`, body key `posts_id`, content required | J01, J02, J04, J06 |
| AC12 REQ-fs-002 rules still hold | S02, S05, C07, D05, E01, G05, H01, H02, H03, I01, I02, J09, J10, K01, X06 |
| AC14 create with the two new fields | E02, E04, E05 |
| AC15 update with the two new fields | G01, G02, G03 |
| AC16 every read and write answer has them | E09, G04 |
| AC18 alumni list shape and paging | F01, F02, F03 |
| AC19 `q` | F04, F05 |
| AC20 filters | F06, F07, F08, F09, F10 |
| AC21 fixed order | F11 |
| AC22 `/filters` | F12 |
| AC23 `/me` | E03, E08 |
| AC24 second profile is 409 | E07 |
| AC25 user list (admin) | H04, X02, X03, X04 |
| AC26 stats | S04, S06, E06, I03 |
| AC27 post list | I04, I05, I06 |
| AC28 `comment_count` | J03, J05, J13 |
| AC29 comments of one post | J07, J08 |
| AC30 post delete takes its comments | K02, K03, K04, X09 |
| AC31 comment delete takes its replies | J11, J12, X08 |
| AC32 post edit is author-only | I07, X05 |
| AC33 user delete | H05, X07, X10 |

**Without the admin variables these stay unproven:** AC25 apart from the 403 (H04); AC33 apart from the 403 (H05); `GET /api/users/email/:email` in AC9; the "or an admin" halves of AC12, AC30, AC31 and the admin half of AC32.

**Not checked over HTTP at all:** AC1, AC11, AC13, AC17, AC34, AC35, AC36 (code and build facts; see the next section) and AC38 (wrap-up).

## What is left behind

The script deletes its own comments and posts at the end, and sets Bob's blank department to `null`. It then prints what it could not remove.

- **Alice and Bob always stay**, each with one alumni profile. No endpoint deletes a profile, and a user with a profile cannot be deleted (ADR-06). Their emails are `apicheck-<run tag>-alice@example.com` and `...-bob@example.com`; the run prints the ids.
- **Sam and Dana (students)** are deleted when the admin variables are set. Without them they stay.
- To remove the rest by hand, the owner deletes the `alumni` rows and then the `"User"` rows whose email starts with `apicheck-`.

## Checks Claude already ran (no database needed)

Run on 2026-10-06, after the `updateSet.ts` edit, on branch `feat/REQ-fs-003-finish-backend-api`. Nothing below started the API, ran the script, or imported the DAL.

| # | Check | Result |
|---|---|---|
| 1 | `npm run build` (AC34) | exit 0 |
| 2 | `npx tsc --noEmit -p backend/src/dal` and `-p backend/src/businessLogic` (AC34) | both exit 0. `-p backend/src/api` also exit 0 |
| 3 | `node --check scripts/api-check.mjs` | exit 0. The script was not run |
| 4 | `backend/src/api` shape (AC1 to AC4) | pass: no `try` or `catch` in `controllers/`; every `controllers/` export is one class; `{ message: ... }` appears only in three 200 answers (user, post and comment deleted), never with a 4xx or 5xx; 25 route lines, 25 `handler(` calls, each the last argument |
| 5 | SQL (AC35) | pass: no `pool.query`, `client.query` or SQL keyword in any `.ts` under `backend/src` outside `dal/query/`; every table and column in `dal/query/` is in `db/schema.md`; every `$n` has a value (counted statement by statement); no `u.*`; `password` is in the sign-up insert and the update column list, and the one `SELECT *` on `"User"` is `findUserWithPasswordByEmail` |
| 6 | Nothing under `frontend/` changed (AC36) | pass: `git status --short -- frontend` is empty; `git diff --name-only redesign` lists 54 files, none under `frontend/` |
| 7 | No `as Partial<PostDTO>` / `as Partial<AlumniDTO>` in `backend/src` (AC11) | pass: no `as Partial<` anywhere |

Two more, beyond the list:

- `buildUpdateSet`'s first parameter is now `UpdateFields` (`backend/src/dal/query/updateSet.ts`). All three callers (`UserQuery`, `AlumniQuery`, `PostQuery`) compile with it.
- The script was type-checked as JavaScript (`tsc --allowJs --checkJs --noEmit`) to catch a misspelled name without running it. One report, a header-type note on the `fetch` call that does not affect Node; no unknown name.

## Related

- Task: TASK-012
- Spec: REQ-fs-003 `requirement.md` (AC34 to AC37)
- [[architecture/adr-06-deleting-rows-that-other-rows-reference|ADR-06]], [[architecture/adr-01-sign-up-role-is-student-or-alumni|ADR-01]]
