# Fix AlumniQuery and CommentQuery against db/schema.md — Architecture

| Field | Value |
|---|---|
| REQ | REQ-fs-001 |
| Status | validated |
| Created | 2026-10-05 |
| Related ADRs | [[architecture/adr-05-post-list-returns-author-name-and-photo\|ADR-05]] (same join, for posts), [[architecture/adr-03-one-alumni-profile-per-user-created-by-that-user\|ADR-03]], [[architecture/adr-06-deleting-rows-that-other-rows-reference\|ADR-06]] |

## Summary

Four files in the backend change. The SQL strings in `AlumniQuery.ts` and `CommentQuery.ts` are corrected to the real table and column names in `db/schema.md`. The field `graduation_yr` is renamed to `graduation_year` in `AlumniDTO.ts`, `AlumniQuery.ts` and `AlumniController.ts`. The three alumni reads gain a join to `"User"` that returns `name`, `email` and `photo_url` by name, never `password`. No route, Manager, middleware, shared type, schema or frontend file changes.

## Blast radius

| Path | Why touched | Risk |
|---|---|---|
| `backend/src/dal/query/AlumniQuery.ts` | Fix SQL in all five methods; add the `"User"` join to the three reads; bind `id` as `$8` in `updateAlumni`; `graduation_yr` → `graduation_year` | medium |
| `backend/src/dal/query/CommentQuery.ts` | `comments` → `comment` in `updateComment` and `deleteComment`; add the missing comma in `updateComment` | low |
| `backend/src/dal/dto/AlumniDTO.ts` | Rename `graduation_yr` → `graduation_year`; add three optional read-only-in-practice fields `name`, `email`, `photo_url` for the joined reads | low |
| `backend/src/api/controllers/AlumniController.ts` | `createAlumni` reads `graduation_year` from the body and sets it on the DTO (two lines) | low |

Read and confirmed unchanged: `AlumniManager.ts`, `CommentManager.ts` (pass-through, no signature change), `AlumniRoutes.ts`, `CommentRoutes.ts`, `dal/index.ts`, `shared/types/alumni.types.ts` (already says `graduation_year`).

User-facing docs: `README.md` holds only a folder tree and no `docs/` page describes these endpoints, so no doc file is in the blast radius. The `postman/` collections may still send `graduation_yr`; they are not touched (see Risks).

## Approach

**SQL fixes (no behaviour change beyond "it now runs").** Each query keeps its method signature, its parameter order and its `RETURNING *` / `rows[0]` shape. Only the SQL text and, in `updateAlumni`, the value list change:

- `createAlumni`: `INSERT INTO alumni (user_id, department, graduation_year, current_company, job_title, experience, bio, linkedin_url) VALUES ($1..$8) RETURNING *`.
- `updateAlumni`: `UPDATE alumni SET department=$1, graduation_year=$2, current_company=$3, job_title=$4, experience=$5, bio=$6, linkedin_url=$7, updated_at=NOW() WHERE id=$8 RETURNING *`, with `id` appended as the eighth value. It still writes all seven columns (owner decision at the spec gate; [[knowledge/gotchas#^g02|G02]] second half stays open).
- `updateComment`: `UPDATE comment SET content=$1, updated_at=NOW() WHERE id=$2 RETURNING *`.
- `deleteComment`: `DELETE FROM comment WHERE id = $1`.

**Alumni reads.** `getAllAlumni`, `findAlumniById` and `findAlumniByEmail` share one select shape:

```sql
SELECT a.*, u.name, u.email, u.photo_url
FROM alumni a
LEFT JOIN "User" u ON u.id = a.user_id
```

- `a.*` is the `alumni` table only, so `id` and `updated_at` in the result are the alumni row's, with no clash with `"User".id` / `"User".updated_at`. The `"User"` columns are named one by one; `password` cannot come back. This is the same rule ADR-05 set for posts and G17 warns about.
- `findAlumniById` adds `WHERE a.id = $1` (the alumni row's own id, as today's route `GET /api/alumni/:id` implies).
- `findAlumniByEmail` adds `WHERE u.email = $1`.
- `LEFT JOIN`, not inner: an alumni row whose `user_id` is NULL still shows in the list and in by-id, with `name`, `email`, `photo_url` as `null`. Nothing that is listed today disappears. (By-email filters on `u.email`, so it only ever returns rows that have a user.)
- The select text is repeated in the three methods, matching how the other Query classes are written. No shared constant or helper is introduced ("No other change").

**Typing the joined rows.** `pool.query` returns untyped rows, so the code compiles either way. To keep the declared return type honest, `AlumniDTO` gains three optional fields: `name?: string`, `email?: string`, `photo_url?: string`. They are not constructor parameters and are never written by `createAlumni` / `updateAlumni`. This keeps the change inside the four files named in the spec. The alternative — a new `AlumniWithUserDTO` class exported from `dal/index.ts` — is cleaner but touches a fifth and sixth file and changes method signatures; left for the REQ that rebuilds the alumni screens. `shared/types/alumni.types.ts` (`Alumni`) is not changed here either; the frontend REQ that first shows these fields adds them.

**`graduation_year` rename.** `AlumniDTO.graduation_yr` → `graduation_year`; `AlumniQuery` reads `alumni.graduation_year` in both value lists; `AlumniController.createAlumni` destructures `graduation_year` from `req.body` and assigns `alumni.graduation_year`. A request that still sends `graduation_yr` has the value ignored (stored as NULL), the mirror image of today's behaviour.

No diagram: the change is text edits inside one layer and adds no flow.

## Task DAG

### Tier 0
- `TASK-001` — Alumni writes and the `graduation_year` rename (`AlumniDTO.ts`, `AlumniController.ts`, `AlumniQuery.createAlumni` / `updateAlumni`)
- `TASK-003` — Comment SQL (`CommentQuery.updateComment` / `deleteComment`)

### Tier 1
- `TASK-002` — Alumni reads join `"User"` (`AlumniQuery` three reads; three optional fields on `AlumniDTO`) — depends on TASK-001 (same two files)

`TASK-001, TASK-003 → TASK-002`

## Test strategy

There is no test runner ([[context/conventions]], Testing), so nothing automated is added.

- **Build:** `npm run build` from the repo root must exit 0. Baseline checked on 2026-10-05 before any change: API build exit 0, frontend build exit 0.
- **Text checks (run by the implementer, repeated by review):** under `backend/src` excluding `node_modules`, `graduation_yr` has zero matches; `AlumniQuery.ts` has no `users`, no `INSER ` and no `?` inside SQL; `CommentQuery.ts` has no `comments` inside SQL; no alumni read contains `SELECT *` or `u.*` or `password`.
- **Diff check:** `git diff --name-only redesign...HEAD -- backend shared frontend` lists exactly the four files in the blast radius.
- **Manual checklist for the owner** (needs the real database and a token; the pipeline cannot run it): `POST /api/alumni` with `graduation_year` → 201 and the row has the year; `GET /api/alumni` → rows carry `name`, `email`, `photo_url` and no `password`; `GET /api/alumni/:id` and `GET /api/alumni/email/:email` → same shape; `PUT /api/alumni/:id` with all seven fields → 200 and `updated_at` moves; `PUT /api/comments/:id` → 200; `DELETE /api/comments/:id` on a comment with no replies → 200.

## Convention alignment

- **Layering** (routes → controllers → Managers → Query classes): unchanged; SQL stays only in `dal/query/*Query.ts` and stays parameterized.
- **Real names from `db/schema.md`** (`"User"`, `alumni`, `comment`): this REQ is what brings these two classes into line.
- **No endpoint returns `password`:** the join names its three `"User"` columns.
- **No schema change:** none.
- **Deviations, all inherited and left alone on the owner's "No other change":** `AlumniController` stays exported functions with per-function `try`/`catch` (target rule is classes + one error middleware); the `console.log` calls in `getAllAlumni` / `getAllComments` stay; `AlumniDTO.created_at` stays although `alumni` has no such column; `PUT /api/alumni/:id`, `PUT` and `DELETE /api/comments/:id` stay without owner checks (see Risks).

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Once the SQL works, any logged-in user can edit any alumni profile and edit or delete any comment ([[knowledge/gotchas#^g19\|G19]], [[knowledge/gotchas#^g23\|G23]]). Today the broken SQL hides this. | high (certain) | Accepted by the owner at the spec gate, 2026-10-05. Not fixed here. A follow-up REQ should add the checks before any screen uses these endpoints or this reaches production. |
| `updateAlumni` sets every omitted field to NULL ([[knowledge/gotchas#^g02\|G02]]). | high (certain) | Accepted by the owner at the spec gate. Callers send all seven fields until a follow-up REQ fixes it. |
| The SQL cannot be run by the pipeline (no database access, no tests); a typo would only show at runtime. | low | Queries are short and checked against `db/schema.md` column by column in review; the owner's manual checklist is the real test. |
| A client that still sends `graduation_yr` silently loses the year, on create **and** on update: `PUT /api/alumni/:id` passes `req.body` straight through, so the year is written as NULL with a 200 (stress-test finding ADV-002). | low | Called out in the PR notes. Nothing in `frontend/src`, `postman/` or `.postman/` calls these endpoints today. |
| Create and update return alumni columns only (`RETURNING *` cannot join); only the three reads carry `name`, `email`, `photo_url`. A screen that refreshes from the POST/PUT response would lose the name and photo (stress-test finding ADV-001). | medium | Deliberate: the spec asks for the join on reads only. Recorded here and in the PR notes; clients re-GET after a write. |
| `findAlumniByEmail` returns only the first row if a user has two profiles (`alumni.user_id` has no UNIQUE; ADR-03). | low | Same `rows[0]` behaviour as today; out of scope. |
| `DELETE /api/comments/:id` on a comment that has replies still fails with a foreign-key error ([[knowledge/gotchas#^g08\|G08]]). | medium | Known; ADR-06 work, out of scope. |

## Open questions

- [x] Optional fields on `AlumniDTO` vs a separate joined type. **Decided by the owner at the design gate, 2026-10-05: optional fields on `AlumniDTO`.**
- [x] `LEFT JOIN` (rows without a user still listed, user fields `null`) vs inner join (such rows hidden). **Decided by the owner at the design gate, 2026-10-05: `LEFT JOIN`.**

## Related

- Spec: REQ-fs-001 — resolve the folder per `core/VAULT-LAYOUT.md`
- Concepts: (none)
- Components: [[knowledge/components/dal-query-classes]]
- Lessons checked: none exist yet (`knowledge/lessons/` is empty). Gotchas checked: [[knowledge/gotchas#^g01|G01]]–[[knowledge/gotchas#^g08|G08]], [[knowledge/gotchas#^g12|G12]], [[knowledge/gotchas#^g16|G16]], [[knowledge/gotchas#^g17|G17]], [[knowledge/gotchas#^g19|G19]], [[knowledge/gotchas#^g23|G23]]
- ADRs: [[architecture/adr-03-one-alumni-profile-per-user-created-by-that-user|ADR-03]], [[architecture/adr-05-post-list-returns-author-name-and-photo|ADR-05]], [[architecture/adr-06-deleting-rows-that-other-rows-reference|ADR-06]]. No new ADR: the alumni join was decided by the owner in the request and follows ADR-05's rule.
