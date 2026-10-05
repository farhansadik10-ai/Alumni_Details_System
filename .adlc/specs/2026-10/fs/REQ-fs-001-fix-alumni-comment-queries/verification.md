# REQ-fs-001-fix-alumni-comment-queries — Verification

| Field | Value |
|---|---|
| Generated | 2026-10-05 |
| Work path | C:/Users/Lenovo/Alumni_Details_System |
| Isolation | branch |
| Branch | feat/REQ-fs-001-fix-alumni-comment-queries |
| Files changed | 4 (code) |
| Commits | 3 (2 code, 1 vault notes) |
| Base | redesign |

Full reviewer narratives: `review-log.md` — not loaded by later phases; open on demand.

## Summary

- **Counts:** 0 critical · 0 major · 7 minor · 1 trivial (after merging one duplicate).
- **Pattern:** no reviewer found a fault in the changed SQL. Every statement was checked against `db/schema.md`; every `$n` is bound; `password` cannot come back through the join. The findings are about what sits next to the change: behaviour that is newly reachable now the queries run, and vault pages that still describe the old code.
- **ADR conflicts:** none. The join follows ADR-05's rule and G17.
- **Vault now out of date (needs a decision, handled at wrap-up):** gotchas G01–G07, G12 and their preamble; `context/architecture.md` line 72; the component stub; this REQ's own spec/architecture lines that say the `console.log` in `getAllAlumni` stays.
- **UI review:** not run. The project has a frontend, but nothing under `frontend/src` calls `/api/alumni` or `/api/comments` (only `authApi.ts` and `usersApi.ts` exist; the alumni pages are placeholders).
- **Not verified by anyone:** the SQL was never run. No test runner, no database access. The owner's manual checklist in `architecture.md` (Test strategy) is still to do.
- **Packet:** 31KB, diff 8KB; `.adlc/**` excluded. No packet gaps reported.
- **Candidate numbering:** `lesson-candidates.md` has CAND-007 and CAND-008 twice (correctness and quality wrote at the same moment). Told apart by their `[review-corr]` / `[review-qual]` tags.

## Findings at a glance

| ID | Severity | Finding (one line) | Where | Effort | Fix |
|----|----------|--------------------|-------|--------|-----|
| m1 | minor | Update of a missing alumni/comment id returns 200 with an empty body; delete always returns success (CORR-001) | `AlumniQuery.updateAlumni`, `CommentQuery.updateComment` / `deleteComment` + controllers | medium | your call — outside "No other change"; G16 family |
| m2 | minor | `getAllAlumni` has no `ORDER BY`; row order can change after an edit (CORR-002) | `backend/src/dal/query/AlumniQuery.ts:61` | small | yes |
| m3 | minor | `console.log` removed from `getAllAlumni` but its twin in `getAllComments` stays (QUAL-001) | `backend/src/dal/query/CommentQuery.ts:19` | small | yes |
| m4 | minor | Shared `Alumni` type does not declare the joined `name`, `email`, `photo_url` (ARCH-001) | `shared/types/alumni.types.ts` | small | your call — a fifth file, deferred by the design |
| m5 | minor | Gotchas G01–G07, G12, `context/architecture.md:72` and two lines in this REQ's notes describe the pre-fix code (REFL-001, ARCH-002) | `.adlc/knowledge/gotchas.md`, `.adlc/context/architecture.md` | small | your call — vault, at wrap-up |
| m6 | minor | Component page `dal-query-classes` is still a stub (REFL-002) | `.adlc/knowledge/components/dal-query-classes.md` | small | your call — vault, at wrap-up |
| m7 | minor | Alumni fixes the joined field names as `name`/`email`/`photo_url`; ADR-05 left them open for posts, so posts could differ (REFL-003) | ADR-05 | — | your call — a decision |
| t1 | trivial | `LEFT JOIN` in `findAlumniByEmail` acts as an inner join because of `WHERE u.email` (QUAL-002) | `AlumniQuery.ts` | — | no action |

Reviewed by: correctness (balanced) · quality (balanced) · architecture (balanced) · reflector (balanced). UI reviewer not dispatched.

## Consolidated by severity

### Critical (0)

### Major (0)

### Minor (7)

#### `AlumniQuery.ts`, `CommentQuery.ts` — m1 missing id returns success
- **Source:** correctness
- **What:** `UPDATE … RETURNING *` on an id that does not exist returns no row; the controller sends 200 with an empty body. `deleteComment` returns nothing either way. These paths could not run before this REQ.
- **Recommendation:** follow-up REQ that returns 404 (same family as G16). Not in this REQ's scope.

#### `AlumniQuery.ts:61` — m2 no ORDER BY in the alumni list
- **Source:** correctness
- **What:** PostgreSQL gives no row order without `ORDER BY`; an updated row can move in the list.
- **Recommendation:** add `ORDER BY a.id` to `getAllAlumni`.

#### `CommentQuery.ts:19` — m3 console.log twin
- **Source:** quality
- **What:** the alumni log was removed at the owner's request; `getAllComments` still logs every comment row. `architecture.md` (Convention alignment) still says both logs stay.
- **Recommendation:** remove the line, or keep it and record why; correct the architecture note either way.

#### `shared/types/alumni.types.ts` — m4 shared type lacks joined fields
- **Source:** architecture
- **What:** the API now returns `name`, `email`, `photo_url` on alumni reads; the shared `Alumni` type the frontend will import does not have them.
- **Recommendation:** add them as `string | null` before the first screen uses them. The design deferred this to the alumni-screens REQ.

#### Vault — m5 pages describe the old code
- **Source:** reflector, architecture
- **What:** G01, G03, G04, G05, G06, G07, G12 are fixed; G02 is half fixed; G19 and G23 are now live, not masked. The gotchas preamble says "None has been fixed". `context/architecture.md:72` calls `graduation_yr` the backend's name.
- **Recommendation:** update statuses at wrap-up. **Vault refs:** [[knowledge/gotchas]]

#### Vault — m6 component stub
- **Source:** reflector
- **What:** the page should record the join shape, that create/update return no joined fields, that joined fields can be `null`, and that the build never checks SQL.
- **Recommendation:** fill in at wrap-up.

#### ADR-05 — m7 joined field names
- **Source:** reflector
- **What:** ADR-05 has an open question on the author field names for posts. Alumni now uses `name`, `email`, `photo_url`.
- **Recommendation:** owner decides whether posts must use the same names; record it in ADR-05 or a new ADR.

### Trivial (1)

- t1 — `findAlumniByEmail` `LEFT JOIN` is effectively inner. Harmless; keeps the three reads identical.

## Acceptance criteria check

- [✓] `createAlumni`: `INSERT INTO alumni`, eight schema columns, no `INSER` / `users` / `?`
- [✓] `updateAlumni`: `UPDATE alumni`, `graduation_year`, no `?`, `id` bound as `$8`
- [✓] `findAlumniById` reads `alumni`, filtered by `a.id`
- [✓] `findAlumniByEmail` joins `"User"`, filters on `u.email`
- [✓] The three reads return alumni columns plus `name`, `email`, `photo_url`
- [✓] No alumni read selects `password`; no `SELECT *` or `u.*` (`a.*` is the alumni table only)
- [✓] No SQL in `AlumniQuery.ts` contains `users`, `graduation_yr` or a `?` after a column
- [✓] `updateComment`: `UPDATE comment`, comma present
- [✓] `deleteComment`: `DELETE FROM comment`
- [✓] No SQL in `CommentQuery.ts` contains `comments` (the word remains only as a local variable name)
- [✓] `AlumniDTO` declares `graduation_year`, not `graduation_yr`
- [✓] `AlumniController.createAlumni` reads and sets `graduation_year`
- [✓] `graduation_yr`: zero matches under `backend/src`
- [✓] `npm run build` exit 0 (run after the last code change)
- [✓] Code diff vs `redesign` is exactly the four named files. One line beyond the spec: `console.log` removed from `getAllAlumni`, by owner decision at the implement gate.

All checks above are by reading the code and building. None is a runtime check against the database.
