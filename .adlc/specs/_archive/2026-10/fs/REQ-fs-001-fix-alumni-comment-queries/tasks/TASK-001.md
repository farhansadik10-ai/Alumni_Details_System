# TASK-001 — Alumni writes and the graduation_year rename

| Field | Value |
|---|---|
| REQ | REQ-fs-001 |
| Tier | 0 |
| Status | pending |
| Repo | alumni-details-system |
| Depends on | — |
| Blocks | TASK-002 |

## Goal

`AlumniQuery.createAlumni` and `updateAlumni` run valid SQL against the `alumni` table, and the backend says `graduation_year` everywhere.

## Files to touch

| Path | Action |
|---|---|
| `backend/src/dal/dto/AlumniDTO.ts` | edit |
| `backend/src/dal/query/AlumniQuery.ts` | edit (`createAlumni`, `updateAlumni` only) |
| `backend/src/api/controllers/AlumniController.ts` | edit (`createAlumni` only) |

## Approach

- `AlumniDTO.ts`: rename the field `graduation_yr?: number` to `graduation_year?: number`. Nothing else.
- `AlumniQuery.createAlumni`: SQL becomes `INSERT INTO alumni (user_id, department, graduation_year, current_company, job_title, experience, bio, linkedin_url) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`. Keep the value order; change `alumni.graduation_yr` to `alumni.graduation_year`.
- `AlumniQuery.updateAlumni`: SQL becomes `UPDATE alumni SET department=$1, graduation_year=$2, current_company=$3, job_title=$4, experience=$5, bio=$6, linkedin_url=$7, updated_at=NOW() WHERE id=$8 RETURNING *`. Change `alumni.graduation_yr` to `alumni.graduation_year` and append `id` as the eighth value.
- `AlumniController.createAlumni`: destructure `graduation_year` from `req.body` and assign `alumni.graduation_year = graduation_year`.

## Acceptance

- [ ] `createAlumni` SQL targets `alumni`, starts with `INSERT`, and has no `?` in column names.
- [ ] `updateAlumni` SQL targets `alumni`, has no `?` in column names, and the value array has eight entries ending in `id`.
- [ ] `graduation_yr` has zero matches under `backend/src` (excluding `node_modules`).
- [ ] `npm run build --workspace=@alumni/api` exits 0.
- [ ] Only the three files above are modified.

## Notes

- Do not touch `findAlumniById`, `findAlumniByEmail` or `getAllAlumni` here; TASK-002 owns them.
- `updateAlumni` keeps writing all seven columns. Do not add `COALESCE` or a dynamic SET list: the owner decided at the spec gate to leave G02's NULL overwrite for a later REQ.
- Do not add owner or role checks, do not remove `console.log`, do not reformat untouched lines, do not remove `created_at` from the DTO. "No other change."
- No git commands.
- Implemented 2026-10-05. `npm run build --workspace=@alumni/api` exit 0; `graduation_yr` has zero matches under `backend/src`. The SQL was not run against a database (none available to the pipeline); the owner's manual checklist in the architecture doc is the real test.
- Whitespace inside the two rewritten SQL strings was normalised to the text given in Approach. No other line was reformatted.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-001-fix-alumni-comment-queries/architecture]]
- Lessons checked: none exist. Gotchas: G01, G02, G12.
