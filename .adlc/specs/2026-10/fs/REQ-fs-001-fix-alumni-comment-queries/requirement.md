# Fix AlumniQuery and CommentQuery against db/schema.md

| Field | Value |
|---|---|
| REQ | REQ-fs-001 |
| Status | complete — awaiting merge |
| Phase | wrapup |
| Created | 2026-10-05 |
| Primary repo | alumni-details-system |
| Touched repos | alumni-details-system |
| Related | [[knowledge/gotchas#^g01\|G01]], [[knowledge/gotchas#^g02\|G02]], [[knowledge/gotchas#^g03\|G03]], [[knowledge/gotchas#^g04\|G04]], [[knowledge/gotchas#^g05\|G05]], [[knowledge/gotchas#^g06\|G06]], [[knowledge/gotchas#^g07\|G07]], [[knowledge/gotchas#^g12\|G12]] |

## Problem

The SQL in `backend/src/dal/query/AlumniQuery.ts` and `backend/src/dal/query/CommentQuery.ts` does not match the real database in `db/schema.md`. Alumni create, update, find-by-id and find-by-email all fail: they target a table `users` that does not exist, the insert says `INSER`, column names carry a stray `?`, the update uses `$8` for the id but passes only seven values, and the code says `graduation_yr` where the column is `graduation_year`. Comment update and delete fail: they target `comments` (the table is `comment`), and the update is missing a comma. The alumni list works but returns no name, email or photo, because it does not join `"User"`. Anyone building a screen on these endpoints hits a 400/404 or an alumni row with no person attached.

## Goal

Every query in `AlumniQuery` and `CommentQuery` is valid SQL against the tables and columns in `db/schema.md`. The backend uses `graduation_year` everywhere (`AlumniQuery`, `AlumniDTO`, `AlumniController`). Every alumni read returns the alumni row together with the owning user's `name`, `email` and `photo_url` from `"User"`, and never `password`.

## Non-goals

- No change to routes, middleware, Managers, or any other Query class (`UserQuery`, `PostQuery`).
- No authorization changes: no owner or role checks are added to `PUT /api/alumni/:id`, `PUT /api/comments/:id` or `DELETE /api/comments/:id` (G19, G23 stay open).
- No change to update behaviour beyond making the SQL run: `updateAlumni` still writes all seven columns, so omitted fields are still set to NULL (the second half of G02 stays open).
- No schema change and no migration.
- No frontend change.

## Acceptance criteria

`AlumniQuery`

- [ ] `createAlumni` runs `INSERT INTO alumni` with the columns `user_id, department, graduation_year, current_company, job_title, experience, bio, linkedin_url` — no `INSER`, no `users`, no `?` in column names.
- [ ] `updateAlumni` runs `UPDATE alumni`, uses `graduation_year`, has no `?` in column names, and passes `id` as the eighth value so `$8` is bound.
- [ ] `findAlumniById` reads from `alumni` (not `users`), filtered by `alumni.id`.
- [ ] `findAlumniByEmail` reads from `alumni` joined to `"User"` and filters on `"User".email`.
- [ ] `getAllAlumni`, `findAlumniById` and `findAlumniByEmail` each return, per row, the alumni columns plus the user's `name`, `email` and `photo_url`.
- [ ] No alumni read selects `password`: the join names its `"User"` columns and never uses `SELECT *` or `"User".*`.
- [ ] No SQL in `AlumniQuery.ts` contains `users`, `graduation_yr`, or a `?` after a column name.

`CommentQuery`

- [ ] `updateComment` runs `UPDATE comment` and has a comma between `content=$1` and `updated_at=NOW()`.
- [ ] `deleteComment` runs `DELETE FROM comment`.
- [ ] No SQL in `CommentQuery.ts` contains `comments`.

`graduation_year` rename

- [ ] `AlumniDTO` declares `graduation_year` and no longer declares `graduation_yr`.
- [ ] `AlumniController.createAlumni` reads `graduation_year` from the request body and sets it on the DTO.
- [ ] `graduation_yr` appears nowhere under `backend/src` (outside `node_modules`).

Whole change

- [ ] `npm run build` exits 0.
- [ ] The diff touches only `AlumniQuery.ts`, `CommentQuery.ts`, `AlumniDTO.ts` and `AlumniController.ts`, plus whatever type the joined read needs to compile (for `/architect` to name).

## Assumptions

- `db/schema.md` (captured by the owner on 2026-10-02) still matches the live database.
- The join is `alumni.user_id = "User".id`, the only foreign key between the two tables.
- `findAlumniById` keeps looking up by the alumni row's own `id`, not by `user_id` — `STATUS: needs verification`.
- The joined fields come back under the names `name`, `email` and `photo_url`, as the request words them — `STATUS: needs verification`.
- "No other change" is taken literally: the `console.log` in `getAllComments` (the one in `getAllAlumni` was removed by owner decision at the implement gate, 2026-10-05), the `created_at` field on `AlumniDTO` (the `alumni` table has no such column), and the formatting of untouched lines all stay as they are.
- There is no test runner; `npm run build` plus the owner's manual check stands in for tests ([[context/conventions]], Testing).

## Open questions

- [x] [[knowledge/gotchas#^g19|G19]] and [[knowledge/gotchas#^g23|G23]] say: don't fix these queries without adding the owner checks in the same change, because the broken SQL is what hides the open endpoints today. **Decided by the owner at the spec gate, 2026-10-05: leave the checks out of this REQ.** The endpoints are open to any logged-in user until a follow-up REQ adds them.
- [x] [[knowledge/gotchas#^g02|G02]] says: fix the NULL overwrite in `updateAlumni` in the same change, or a partial edit wipes the profile. **Decided by the owner at the spec gate, 2026-10-05: leave it out of this REQ.** Callers must send all seven fields on every edit until a follow-up REQ fixes it.
- [x] An alumni row whose `user_id` is NULL or points to no user: is it left out of reads, or returned with empty name/email/photo? **Decided by the owner at the design gate, 2026-10-05: returned, with name/email/photo empty (`LEFT JOIN`).**

## Out of scope (for now)

- Owner-or-admin check on `PUT /api/alumni/:id` (G19); owner checks on comment edit and delete (G23).
- Partial-update behaviour of `updateAlumni` (G02, second half).
- 404 for alumni lookups that find nothing (G16).
- Deleting a comment that has replies (G08, ADR-06).
- `post_id` / `posts_id` naming in the comment controller (G13); `user_id` taken from the body (G22, and ADR-03 for alumni create).
- The same join for posts (ADR-05) and removing `password` from user endpoints (G17).

## Related

- Concepts: (none)
- Components: `backend/src/dal/query/AlumniQuery.ts`, `backend/src/dal/query/CommentQuery.ts`, `backend/src/dal/dto/AlumniDTO.ts`, `backend/src/api/controllers/AlumniController.ts`
- Gotchas: [[knowledge/gotchas#^g01|G01]], [[knowledge/gotchas#^g02|G02]], [[knowledge/gotchas#^g03|G03]], [[knowledge/gotchas#^g04|G04]], [[knowledge/gotchas#^g05|G05]], [[knowledge/gotchas#^g06|G06]], [[knowledge/gotchas#^g07|G07]], [[knowledge/gotchas#^g12|G12]]; left open on purpose: [[knowledge/gotchas#^g08|G08]], [[knowledge/gotchas#^g16|G16]], [[knowledge/gotchas#^g17|G17]], [[knowledge/gotchas#^g19|G19]], [[knowledge/gotchas#^g23|G23]]
- Lessons: (none yet)
- ADRs: [[architecture/adr-03-one-alumni-profile-per-user-created-by-that-user|ADR-03]], [[architecture/adr-05-post-list-returns-author-name-and-photo|ADR-05]] (same join decided for posts; names G05 as a follow-up), [[architecture/adr-06-deleting-rows-that-other-rows-reference|ADR-06]]

## Backlinks

_(populated by /wrapup or manually)_
