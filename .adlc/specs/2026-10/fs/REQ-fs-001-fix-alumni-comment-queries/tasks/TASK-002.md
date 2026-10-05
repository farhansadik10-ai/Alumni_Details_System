# TASK-002 — Alumni reads join "User" for name, email and photo_url

| Field | Value |
|---|---|
| REQ | REQ-fs-001 |
| Tier | 1 |
| Status | pending |
| Repo | alumni-details-system |
| Depends on | TASK-001 |
| Blocks | — |

## Goal

`getAllAlumni`, `findAlumniById` and `findAlumniByEmail` read from `alumni` joined to `"User"` and return the alumni columns plus the user's `name`, `email` and `photo_url`, never `password`.

## Files to touch

| Path | Action |
|---|---|
| `backend/src/dal/query/AlumniQuery.ts` | edit (`getAllAlumni`, `findAlumniById`, `findAlumniByEmail` only) |
| `backend/src/dal/dto/AlumniDTO.ts` | edit (add three optional fields) |

## Approach

- All three reads use this select, written out in each method (no shared constant or helper):
  `SELECT a.*, u.name, u.email, u.photo_url FROM alumni a LEFT JOIN "User" u ON u.id = a.user_id`
- `findAlumniById`: add `WHERE a.id = $1`. `findAlumniByEmail`: add `WHERE u.email = $1`. `getAllAlumni`: no filter; keep its loop and `console.log` as they are.
- `AlumniDTO.ts`: add `name?: string;`, `email?: string;`, `photo_url?: string;` as plain optional fields. Do not add them to the constructor.

## Acceptance

- [ ] No SQL in `AlumniQuery.ts` contains `users`.
- [ ] Each of the three reads contains `LEFT JOIN "User"` and selects `u.name, u.email, u.photo_url`.
- [ ] No read contains `SELECT *`, `u.*` or `password`.
- [ ] `findAlumniByEmail` filters on `u.email`; `findAlumniById` filters on `a.id`.
- [ ] Method signatures and return types are unchanged.
- [ ] `npm run build` (repo root) exits 0.
- [ ] Only the two files above are modified by this task.

## Notes

- `"User"` must be double-quoted. Follow the quoting in `backend/src/dal/query/UserQuery.ts`; use a template string so the double quotes need no escaping.
- `a.*` is alumni columns only, so `id` and `updated_at` in the result stay the alumni row's.
- Do not touch `createAlumni` / `updateAlumni` (TASK-001), `AlumniManager`, `dal/index.ts` or `shared/`.
- No git commands.

### Implementation notes (task-implementer, 2026-10-05)

- Done as written; no deviation. All seven acceptance items checked: the three text checks by grep on `AlumniQuery.ts` (no `users`, `SELECT *`, `u.*` or `password`; three `LEFT JOIN "User"` lines), `npm run build` exit 0 (API then frontend), and `git status` shows no file beyond the REQ's four.
- The SQL was checked by eye against `db/schema.md`: `"User"` has `id`, `name`, `email`, `photo_url`; `alumni` has `id`, `user_id`. It was not run against a database (the pipeline has none) — the owner's manual checklist in architecture.md is the real test.
- Follow-up, not done here: the kept `console.log(alumni)` in `getAllAlumni` now prints each user's name and email to the server log on every `GET /api/alumni` (CAND-005). Removing it is outside this task ("keep its loop and `console.log` as they are").
- Follow-up, not done here: for an alumni row with no user, `name` / `email` / `photo_url` arrive as `null`, while the DTO declares them `string | undefined` (CAND-006). Callers should treat them as nullable.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-001-fix-alumni-comment-queries/architecture]]
- Lessons checked: none exist. Gotchas: G03, G04, G05, G17. ADR-05 (same join rule for posts).

### After the implementation gate (orchestrator, 2026-10-05)

- The owner chose at the implementation gate to remove `console.log(alumni)` from `getAllAlumni`, because with the join it printed each user's name and email to the server log. One line deleted; `npm run build` exit 0 afterwards. This overrides "keep its `console.log`" above.
