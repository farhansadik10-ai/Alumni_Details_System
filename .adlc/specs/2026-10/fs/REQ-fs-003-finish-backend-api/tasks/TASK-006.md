# TASK-006 — Alumni data layer: new columns, search list, filter values, own profile

| Field | Value |
|---|---|
| REQ | REQ-fs-003 |
| Tier | 1 |
| Status | pending |
| Repo | alumni-details-system |
| Depends on | TASK-001, TASK-002 |
| Blocks | TASK-009 |

## Goal

`AlumniQuery` and `AlumniManager` read and write the two new columns, list alumni with search, filters and paging in a fixed order, return the filter choices, and find a user's own profile.

## Files to touch

| Path | Action |
|---|---|
| `backend/src/dal/query/AlumniQuery.ts` | edit |
| `backend/src/businessLogic/src/AlumniManager.ts` | edit |

## Approach

- **One read constant.** `ALUMNI_READ = SELECT a.*, u.name, u.email, u.photo_url FROM alumni a LEFT JOIN "User" u ON u.id = a.user_id`. `findAlumniById`, `findAlumniByEmail`, the new list and `findAlumniByUserId` all use it; no method keeps its own copy.
- **Writes.** `createAlumni(alumni): Promise<AlumniDTO | undefined>` inserts `mentorship_available` and `field` too (ten columns, ten values; `mentorship_available` falls back to `false` when the DTO has none). It enforces one profile per user without a schema change: inside `withTransaction`, first `SELECT pg_advisory_xact_lock($1, $2)` with a named constant for this purpose as the first key and `user_id` as the second, then `SELECT 1 FROM alumni WHERE user_id = $1 LIMIT 1`; if a row exists return `undefined`, else insert. All three statements run on the transaction's client. The lock is released when the transaction ends, so two creates for the same user cannot both pass the check. Add both names to `UPDATABLE_COLUMNS`; export `type AlumniUpdateColumn`; `updateAlumni(id, data: UpdateFields<AlumniUpdateColumn>)`. Writes keep `RETURNING *` (G25 stays as it is).
- **`listAlumni(filter, page): Promise<PageRows<AlumniDTO>>`** with `filter: { q?: string; department?: string; graduation_year?: number; field?: string; mentoring?: boolean }`. Conditions, each added only when its filter is set, values bound in the same order:
  - `q` → `(u.name ILIKE $n OR a.current_company ILIKE $n OR a.job_title ILIKE $n)` with `likePattern(q)` (no `ESCAPE` clause, see TASK-002)
  - `department` → `btrim(a.department) = $n`; `field` → `btrim(a.field) = $n` (the filter choices are trimmed, so the match must be too); `graduation_year` → `a.graduation_year = $n`
  - `mentoring === true` → `a.mentorship_available = true`
  Count: `SELECT COUNT(*)::int AS total FROM alumni a LEFT JOIN "User" u ON u.id = a.user_id <where>`. Page: `ALUMNI_READ <where> ORDER BY a.id DESC LIMIT $n OFFSET $n`. Remove `getAllAlumni`.
- **`getFilterValues(): Promise<{ departments: string[]; graduation_years: number[]; fields: string[] }>`** — three reads: `SELECT DISTINCT btrim(department) AS value FROM alumni WHERE department IS NOT NULL AND btrim(department) <> '' ORDER BY value` (same for `field`), and `SELECT DISTINCT graduation_year FROM alumni WHERE graduation_year IS NOT NULL ORDER BY graduation_year`.
- **`findAlumniByUserId(userId): Promise<AlumniDTO | undefined>`** — `ALUMNI_READ WHERE a.user_id = $1 ORDER BY a.id LIMIT 1`.
- **AlumniManager.** Pass-throughs `listAlumni`, `getFilterValues`, `findAlumniByUserId`; remove `getAllAlumni`. Parameter types come from the Query methods (`Parameters<AlumniQuery["updateAlumni"]>[1]`, `Parameters<AlumniQuery["listAlumni"]>[0]`); `dal/index.ts` is not edited here. `createAlumni` passes the `undefined` through.

## Acceptance

- [ ] AC16 (data half): every read uses `ALUMNI_READ`; `a.*` now carries both new columns
- [ ] AC19, AC20, AC21 (data half) hold by reading the SQL; the wildcard characters in `q` are escaped
- [ ] AC22, AC23, AC24 (data half) hold by reading the SQL; the lock, the check and the insert run on the same transaction client
- [ ] Every `$n` has a value at the matching position for: no filter, each filter alone, all five together
- [ ] Every table and column name is in `db/schema.md` (after TASK-001)
- [ ] `npx tsc --noEmit -p backend/src/dal` and `-p backend/src/businessLogic` pass

## Notes

- Never `u.*`; never `password` ([[knowledge/concepts/user-join-read-shape]]).
- G30: the updatable list is also in the controller; TASK-009 adds the two names there. Do not pass a list down from the controller.
- No row logging.
- The API workspace will not compile after this task; TASK-009 fixes that. Do not edit controllers.

### Implementation notes (2026-10-06)

- **Open problem, not in this task's files: `likePattern` escapes nothing.** `backend/src/dal/query/listHelpers.ts:24` reads `text.replace(/[\%_]/g, "\$&")` on disk. The backslashes TASK-002 meant (`/[\\%_]/g`, `"\\$&"`) are missing, so the regex matches only `%` and `_` and replaces each with itself. Evaluating that one expression in Node on `50%_a\b` gives `50%_a\b` back, unchanged. Effect on `listAlumni`: `q=%` matches every profile and `q=_` matches any one character. No injection (the value is still bound), but AC "the wildcard characters in `q` are escaped" does not hold until that line is fixed. `listAlumni` calls the helper as designed and needs no change once it is.
- `ALUMNI_FROM` holds the `FROM alumni a LEFT JOIN "User" u ...` text; `ALUMNI_READ` is built from it and the count uses it, so the join is written once. The task named one constant; this is two, with the same single source.
- The lock statement is `SELECT pg_advisory_xact_lock($1::int, $2::int)`. The casts are added to the task's text so PostgreSQL always picks the two-integer form.
- `createAlumni` with `user_id` null: the lock function returns null without locking and `user_id = NULL` matches no row, so the insert runs unguarded. Today the controller always sets `user_id` from the token, so this path is not reached. TASK-009 must keep it that way.
- `updateAlumni` will bind `mentorship_available: null` if it is sent, and the column is `not null`, so the database rejects it. TASK-009 should refuse a non-boolean value for that field before it gets here.
- `$n` positions, read by hand: no filter → count has no parameters, page uses `$1 $2` = limit, offset. `q` alone → `$1` pattern (used three times), page `$2 $3`. `department`, `graduation_year` or `field` alone → `$1`, page `$2 $3`. `mentoring` alone → no parameter, page `$1 $2`. All five → `$1` q, `$2` department, `$3` graduation_year, `$4` field, mentoring takes none, page `$5 $6`.
- `filter.q` and the other text filters are added when they are not `undefined`. An empty string is a filter here (`q=""` gives `%%`, which also drops profiles whose name, company and job title are all null). TASK-009 should leave empty values out.
- Checks run: `npx tsc --noEmit -p backend/src/dal` exit 0, `npx tsc --noEmit -p backend/src/businessLogic` exit 0. No SQL was executed.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-003-finish-backend-api/architecture]]
- Lessons checked: LESSON-REQ-fs-001-1, LESSON-REQ-fs-001-4, LESSON-REQ-fs-002-1, LESSON-REQ-fs-002-3
