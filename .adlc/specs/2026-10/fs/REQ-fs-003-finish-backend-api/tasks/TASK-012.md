# TASK-012 — API check script and whole-REQ checks

| Field | Value |
|---|---|
| REQ | REQ-fs-003 |
| Tier | 3 |
| Status | pending |
| Repo | alumni-details-system |
| Depends on | TASK-008, TASK-009, TASK-010, TASK-011 |
| Blocks | — |

## Goal

The owner has one script that checks the whole API over HTTP against their own database, and the checks that need no database have been run and recorded.

## Files to touch

| Path | Action |
|---|---|
| `scripts/api-check.mjs` | create |
| `.adlc/specs/2026-10/fs/REQ-fs-003-finish-backend-api/api-check.md` | create (how to run it, what it covers, what Claude already checked) |

## Approach

- **Script.** Plain Node ESM, built-in `fetch`, no dependency, no import from the repo. Settings from the environment only: `API_URL` (default `http://localhost:3000`), `ADMIN_EMAIL`, `ADMIN_PASSWORD` (optional). It never reads a file, never prints a token, a password or a full response body that could hold one.
  - A tiny runner: `check(id, acLabel, description, fn)` records PASS / FAIL (with expected and actual status, and the `error` text) or SKIP; at the end print totals, list failures, list the test rows left behind, and `process.exit(failed ? 1 : 0)`.
  - Test data: emails like `apicheck-<timestamp>-alice@example.com`; passwords made with `crypto.randomUUID()` per run. Users: Alice (alumni), Bob (alumni), Sam (student), Dana (student, never creates content).
  - Checks, grouped as in the spec. At least one check for each of AC2–AC10, AC12, AC14–AC16, AC18–AC33, including: both error-shape checks that used to answer `{ message }`; unknown URL; broken JSON; each bad `:id` form on one route per controller; duplicate email on sign-up and on update; paging defaults, `limit=500` → 50, `page=0` → 400, a page past the end; `q` with `%`; each alumni filter alone and combined; `mentoring=false` → 400; `/filters` sorted and without blanks; `/me` 200 for Alice and 404 for Sam; second profile 409; post list order and author fields; `comment_count` after adding a comment and two nested replies, after deleting a reply, after deleting the top comment; a sibling comment survives a delete; comments of a post oldest first; comments of a missing post 404; deleting a post with comments, then its comments list is 404; the REQ-fs-002 owner rules (edit someone else's post, comment, profile, user → 403).
  - Admin checks (skipped with a clear line when the admin variables are not set): `GET /api/users` shape, `q`, `role`, no `password` key in any item; `DELETE /api/users/<Alice>` → 409 with the exact ADR-06 message; `DELETE /api/users/<Dana>` → 200; then again → 404; a non-admin on `GET /api/users` → 403 `{ error }`.
  - Clean-up at the end: delete the test comments and posts through the API. Alumni profiles cannot be deleted through the API, so Alice and Bob stay; print their emails and ids.
- **`api-check.md`.** How to run (`npm run dev:api` in one terminal; then, in PowerShell and in Git Bash, how to set the admin variables for one command without saving them to a file, and `node scripts/api-check.mjs`); that it writes test rows to whatever database the API uses; a table mapping check ids to ACs; what is left behind; and a section "Checks Claude already ran (no database needed)" with the results of the list below.
- **Whole-REQ checks to run and record** (none touches the database):
  1. `npm run build` exits 0 (AC34).
  2. `npx tsc --noEmit -p backend/src/dal` and `-p backend/src/businessLogic` pass (AC34).
  3. `node --check scripts/api-check.mjs` passes. Do not run the script.
  4. Search `backend/src/api`: no `try` in `controllers/`; no `{ message:` error body with a 4xx / 5xx status anywhere; no exported handler function in `controllers/`; every route line's last argument is a `handler(` call (AC1–AC4).
  5. Search `backend/src` outside `dal/query/`: no `pool.query`, no SQL keywords in strings (AC35). In `dal/query/`: every table and column name is in `db/schema.md`; every `$n` has a value; no `u.*`; `password` appears only in the login read (`findUserWithPasswordByEmail`), the sign-up insert and the user update list.
  6. `git status` and `git diff --stat redesign` show nothing under `frontend/` (AC36).
  7. No `as Partial<PostDTO>` / `as Partial<AlumniDTO>` in `backend/src` (AC11).

## Acceptance

- [ ] AC37: the script exists, passes `node --check`, and `api-check.md` maps every listed AC to at least one check
- [ ] AC34, AC35, AC36 recorded with their real results in `api-check.md`
- [ ] The script holds no secret and reads none from disk
- [ ] Any whole-REQ check that fails is reported as a problem at the top of `api-check.md`, not fixed silently in files another task owns

## Notes

- **Never start the API server and never run `scripts/api-check.mjs`.** Both write to the owner's real database. Do not run `psql`. Do not read `.env`.
- If a whole-REQ check finds a defect in another task's file, describe it (file, line, what is wrong) and stop; the orchestrator decides who fixes it.
- Node on this machine is v25, so `fetch` and `crypto.randomUUID` are built in.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-003-finish-backend-api/architecture]]
- Lessons checked: LESSON-REQ-fs-001-1, LESSON-REQ-fs-001-2
