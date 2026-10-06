# TASK-007 — Build, SQL check and the owner's manual test checklist

| Field | Value |
|---|---|
| REQ | REQ-fs-002 |
| Tier | 2 |
| Status | complete |
| Repo | alumni-details-system |
| Depends on | TASK-003, TASK-004, TASK-005, TASK-006 |
| Blocks | — |

## Goal

The whole change builds, every changed SQL string is checked against the schema, and the owner has a checklist that proves each acceptance criterion against the real database.

## Files to touch

| Path | Action |
|---|---|
| `.adlc/specs/2026-10/fs/REQ-fs-002-backend-security-data-loss-gaps/manual-test-checklist.md` | create |

No source file changes in this task. If a check fails, stop and report; do not fix it here.

## Approach

- Run `npm run build` from the repo root; record the exit code.
- From the session scratch folder (not the repo), run a throwaway `tsx` script over `buildUpdateSet` and `pickSent`: nothing sent, one field, all fields, `null`, `undefined`, an unknown key. Record the outputs in the checklist file under "Helper checks".
- List every SQL string changed on this branch (`git diff redesign -- backend/src/dal/query`) in a table: method, table, columns, each ticked against `db/schema.md`. For each `update*`, write out the SQL produced for two sample bodies.
- Write the manual checklist: one numbered step per AC1–AC24 with the request (method, path, who is logged in, body), the expected status, and what to look for in the response or the row. Put AC9 (login still works) first. Mark every step that changes data, and say what to create first (two alumni users, one student, one admin).
- Start the checklist with a "Before you begin" block: sign-up can no longer create an admin (AC12), so the owner needs an existing admin account, or sets `role = 'admin'` on a test user by hand in the database and then logs in again (the role is read from the token). Claude does not run that statement. Steps for AC13, AC14, AC15, AC16, AC17 (users) and AC22 need the admin.
- Check AC26–AC28 with `git diff redesign --stat`: nothing under `frontend/`, `db/` or `shared/`; no SQL outside `backend/src/dal/query/`.

## Acceptance

- [x] AC25: `npm run build` exits 0
- [x] AC26, AC27, AC28 confirmed from the diff
- [x] SQL table complete; no column or table outside `db/schema.md`
- [x] `manual-test-checklist.md` has a step for every one of AC1–AC24
- [x] No database command, no API server start, no read of `.env`

## Notes

Session rules from the owner: never read `.env`, never run `psql` or anything that changes the database, never `git push`, never delete files outside `.adlc/`.

### Implementation notes (task-implementer, 2026-10-06)

- `npm run build` exited 0 with all of TASK-001 to TASK-006 in the working tree.
- No place was found where the code misses an acceptance criterion. The checklist's "Problems found" says "None".
- AC1–AC24 are still unproven: nothing was run against a database or a running API. They stay "not yet run" until the owner works through `manual-test-checklist.md`.
- AC26–AC28: `git diff redesign --stat` and `git status` show no path under `frontend/`, `db/` or `shared/`. A search of `backend/src` finds `pool.query` and SQL text only in `dal/query/*Query.ts`. All changed SQL binds its values; the built `SET` lists take column names from constants in the Query files.
- AC10 (code side): the only `console.*` calls left that print rows are `PostQuery.getAllPosts` and `CommentQuery.getAllComments` (out of scope in the spec). `dal/config/db.ts` prints the database host and name and whether a password was loaded, not the password.
- The helper script ran from the session scratch folder with `npx tsx`, importing the two source files by absolute path. Its output is in the checklist under "Helper checks" and "SQL check".
- The checklist reads rows back through `GET` routes, so the owner needs no `psql` to run it. Two limits: there is no `GET /api/posts/:id` route (the list is used), and the test alumni profile cannot be removed through the API (no delete route), so the "Cleaning up" section says what stays.
- The one database statement in the checklist is the `UPDATE "User" SET role = 'admin' ...` for the owner to run by hand if no admin exists. It was written, not run.
- Expected error texts were copied from the controllers. Token, role and login errors use the key `message`; controller errors use `error`. The checklist says so up front.
- `PUT /api/users/:id/logout` answers 200 with an empty body on success (`updateLogoutTime` returns nothing). The checklist expects that.

### Follow-ups spotted, not done

- No delete route for alumni profiles, so test data (and real profiles) can only be removed in the database.
- Changing a password does not cancel tokens already handed out (valid up to 1 hour).
- `PUT /api/users/:id` accepts `name: ""` (a string, so it passes the type check).

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-002-backend-security-data-loss-gaps/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-001-1]]
