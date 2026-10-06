# TASK-001 — Schema doc, DTOs and shared types

| Field | Value |
|---|---|
| REQ | REQ-fs-003 |
| Tier | 0 |
| Status | pending |
| Repo | alumni-details-system |
| Depends on | — |
| Blocks | TASK-005, TASK-006, TASK-007 |

## Goal

`db/schema.md`, the DTO classes and the `@alumni/shared` types describe the database and the API answers as they will be after this REQ.

## Files to touch

| Path | Action |
|---|---|
| `db/schema.md` | edit |
| `.adlc/context/architecture.md` | edit (schema summary only) |
| `backend/src/dal/dto/AlumniDTO.ts` | edit |
| `backend/src/dal/dto/PostDTO.ts` | edit |
| `backend/src/dal/dto/CommentDTO.ts` | edit |
| `backend/src/dal/dto/UserDTO.ts` | edit |
| `shared/types/alumni.types.ts` | edit |
| `shared/types/posts.types.ts` | edit |
| `shared/types/comment.types.ts` | edit |
| `shared/types/list.types.ts` | create |

## Approach

- **`db/schema.md`.** In the `Table "public.alumni"` block add two rows after `linkedin_url`, in the same column layout: `mentorship_available | boolean | | not null | false` and `field | text | | | `. Above the code block add one line: the two columns were added by the owner on 2026-10-06 with `ALTER TABLE alumni ADD COLUMN mentorship_available boolean NOT NULL DEFAULT false, ADD COLUMN field text;`, and those two rows were typed in by hand from that statement, not pasted from `psql`. Change nothing else in the file.
- **`.adlc/context/architecture.md`.** In "Database schema": add the two columns to the `alumni` row, and replace the "Decided, not in the database yet" bullet with one saying the columns exist since 2026-10-06 (ADR-08). Touch no other section.
- **DTOs.** Type as `T | null` every column that `db/schema.md` shows without `not null` (G31). Go through the four tables row by row; do not work from memory. That is every column except the four `id`s, `"User".email`, `"User".password` and `alumni.mentorship_available`. It includes `user_id` on alumni, posts and comment, `posts_id`, `role`, and the timestamp columns. Constructor parameters accept `null` and `undefined` and store `null` for a value that was not given.
  - `AlumniDTO`: add `mentorship_available: boolean` (constructor default `false`) and `field: string | null` (default `null`) as the last two optional constructor parameters; the joined read fields `name`, `email`, `photo_url` become `?: string | null`. Remove `created_at` (the table has no such column).
  - `PostDTO`, `CommentDTO`: add optional read-only-by-convention author fields `name?: string | null`, `photo_url?: string | null`.
- **Shared types** (the contract for the new frontend; `.ts` files only, do not touch the compiled `.js` / `.d.ts`):
  - `Alumni`: add `mentorship_available: boolean`, `field: string | null`, and `name`, `email`, `photo_url` as `string | null` (G25). Nullable columns become `T | null`. `CreateAlumniDTO` loses `user_id` (it comes from the token) and gains `mentorship_available?: boolean`, `field?: string | null`. `UpdateAlumniDTO` gains the same two; its other fields allow `null`.
  - `Post`: `comment_count: number`, `name: string | null`, `photo_url: string | null`. `Comment`: `parent_id: number | null`, `name`, `photo_url`.
  - `list.types.ts`: `Paged<T> { items: T[]; total: number; page: number; limit: number }`, `AlumniFilters { departments: string[]; graduation_years: number[]; fields: string[] }`, `Stats { alumni: number; students: number; posts: number; mentoring: number }`.

## Acceptance

- [ ] AC13: both columns are in `db/schema.md` and in the vault schema summary, with type, nullability and default as in the owner's statement
- [ ] AC17: the shared alumni types carry both fields
- [ ] `npx tsc --noEmit -p backend/src/dal` passes (fix only type errors caused by this task's DTO changes, in the DTO files)
- [ ] `npm run build --workspace=@alumni/frontend` exits 0 and `git status` shows nothing changed under `frontend/`

## Notes

- Do not run `psql` or any database command. Do not read `.env`.
- If making a DTO field nullable breaks a Query, Manager or controller file, do not edit that file here: later tasks rewrite them. Note the break in the implementation notes.
- The legacy frontend imports only `user.types` from shared; `user.types.ts` is not edited.
- Gotchas: G25, G31. Lesson: [[knowledge/lessons/LESSON-REQ-fs-001-3]].

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-003-finish-backend-api/architecture]]
- Lessons checked: LESSON-REQ-fs-001-3
