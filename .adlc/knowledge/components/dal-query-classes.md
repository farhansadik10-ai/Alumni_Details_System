# DAL Query classes (`backend/src/dal/query/`)

| Field | Value |
|---|---|
| Component | `@alumni/dal` — `query/*Query.ts` and `dto/*DTO.ts` |
| Status | current as of REQ-fs-001 (2026-10-05) |
| Created | 2026-10-05 |

One class per table (`UserQuery`, `AlumniQuery`, `PostQuery`, `CommentQuery`). Each method holds one parameterized SQL string run on the shared `pg` pool (`dal/config/db.ts`) and returns rows typed as the matching `dto/*DTO.ts` class. This is the only place SQL lives. Table and column names must match `db/schema.md` (`"User"`, `alumni`, `posts`, `comment`).

## What to know before changing it

- **The build does not check SQL.** `pool.query` takes a string and returns untyped rows, so a wrong table name, a typo or an unbound `$n` compiles. Check each statement against `db/schema.md` and run it ([[knowledge/lessons/LESSON-REQ-fs-001-1]]).
- **There are no tests and the pipeline has no database.** A query change is only proven by the owner running the endpoint.
- **Reads that need the person join `"User"` with named columns** — see [[knowledge/concepts/user-join-read-shape]]. Today only the three alumni reads do.
- **Reads and writes can return different shapes.** Alumni reads carry `name`, `email`, `photo_url` (possibly `null`); alumni create and update return alumni columns only ([[knowledge/gotchas#^g25|G25]]).
- **DTOs are declared types, not validators.** `AlumniDTO` has `created_at` although `alumni` has no such column, and optional joined fields that arrive as `null`.
- **Updates write every column.** `updateAlumni`, `updateUser` and `updatePost` set omitted fields to NULL (G02, G09, G10).
- **A missing row is not an error.** Lookups, updates and deletes on an id that does not exist return success with an empty body (G16, G27).
- **`console.log` of each row** is still in `UserQuery.getAllUsers` and `CommentQuery.getAllComments`. It was removed from `AlumniQuery.getAllAlumni` when the join started returning names and emails ([[knowledge/lessons/LESSON-REQ-fs-001-4]]).

## State of each class (2026-10-05)

| Class | State |
|---|---|
| `AlumniQuery` | SQL matches the schema (REQ-fs-001). Open: G02 NULL overwrite, G26 no `ORDER BY`, G27. Not yet run against the database. |
| `CommentQuery` | SQL matches the schema (REQ-fs-001). Open: G08 delete with replies, G24 no per-post read, G27. Not yet run against the database. |
| `UserQuery` | Returns `password` (G17); update overwrites omitted fields (G09). |
| `PostQuery` | No author join yet (ADR-05); G10, G11. |

## Touched by

- REQ-fs-001 — fixed `AlumniQuery` and `CommentQuery` SQL against the schema; `graduation_yr` → `graduation_year`; alumni reads join `"User"`.

## Related

- [[context/architecture]] (Database schema, Layering rules)
- [[knowledge/gotchas]] G01–G12, G17, G25–G27
- [[knowledge/concepts/user-join-read-shape]]
