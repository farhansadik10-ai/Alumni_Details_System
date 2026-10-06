# DAL Query classes (`backend/src/dal/query/`)

| Field | Value |
|---|---|
| Component | `@alumni/dal` — `query/*Query.ts` and `dto/*DTO.ts` |
| Status | current as of REQ-fs-002 (2026-10-06) |
| Created | 2026-10-05 |

One class per table (`UserQuery`, `AlumniQuery`, `PostQuery`, `CommentQuery`). Each method holds one parameterized SQL string run on the shared `pg` pool (`dal/config/db.ts`) and returns rows typed as the matching `dto/*DTO.ts` class. This is the only place SQL lives. Table and column names must match `db/schema.md` (`"User"`, `alumni`, `posts`, `comment`).

## What to know before changing it

- **The build does not check SQL.** `pool.query` takes a string and returns untyped rows, so a wrong table name, a typo or an unbound `$n` compiles. Check each statement against `db/schema.md` and run it ([[knowledge/lessons/LESSON-REQ-fs-001-1]]).
- **There are no tests and the pipeline has no database.** A query change is only proven by the owner running the endpoint.
- **Reads that need the person join `"User"` with named columns** — see [[knowledge/concepts/user-join-read-shape]]. Today only the three alumni reads do.
- **Reads and writes can return different shapes.** Alumni reads carry `name`, `email`, `photo_url` (possibly `null`); alumni create and update return alumni columns only ([[knowledge/gotchas#^g25|G25]]).
- **DTOs are declared types, not validators.** `AlumniDTO` has `created_at` although `alumni` has no such column, and optional joined fields that arrive as `null`.
- **Updates write only the columns that were sent** (since REQ-fs-002). `updateUser`, `updatePost` and `updateAlumni` build their `SET` list with `buildUpdateSet` (`query/updateSet.ts`) from a fixed column list in the Query class; values are bound. See [[knowledge/concepts/partial-update-sent-fields]]. The same list also lives in the controller and the two must change together ([[knowledge/gotchas#^g30|G30]]).
- **`password` is never selected**, except by `UserQuery.findUserWithPasswordByEmail`, which only login uses. Every other `"User"` query names its columns. The `PublicUserDTO` type is a compile-time help, not the protection ([[knowledge/lessons/LESSON-REQ-fs-002-2]]).
- **A method that returns `rows[0]` is typed "row or undefined"** ([[knowledge/lessons/LESSON-REQ-fs-002-1]]). Updates on a missing id now reach a 404 in the controller; the plain lookups still answer 200 with an empty body (G16).
- **DTO types do not allow `null`**, though nullable columns arrive as `null` and updates accept it ([[knowledge/gotchas#^g31|G31]]).
- **No Query method logs rows any more** (REQ-fs-002). Keep it that way ([[knowledge/lessons/LESSON-REQ-fs-001-4]]).
- **A new DAL file that nothing imports is not compiled by `npm run build`** ([[knowledge/gotchas#^g28|G28]]).

## State of each class (2026-10-06)

The REQ-fs-002 changes were run against the real database by the owner (39 checks, 39 passed, 2026-10-06). Not covered by that run: admin paths and deleting a user.

| Class | State |
|---|---|
| `AlumniQuery` | SQL matches the schema (REQ-fs-001). Partial update (REQ-fs-002). Open: G26 no `ORDER BY`, G16 lookups. |
| `CommentQuery` | SQL matches the schema (REQ-fs-001). `findCommentById` added (REQ-fs-002). Open: G08 delete with replies, G24 no per-post read. |
| `UserQuery` | No `password` in any result but the login read; partial update; `updateLoginTime` removed (REQ-fs-002). Open: G16 lookups, G08 delete. |
| `PostQuery` | Partial update; `findPostById(id)` (REQ-fs-002). Open: no author join yet (ADR-05), G11, G08. |

## Touched by

- REQ-fs-001 — fixed `AlumniQuery` and `CommentQuery` SQL against the schema; `graduation_yr` → `graduation_year`; alumni reads join `"User"`.
- REQ-fs-002 — partial updates through `buildUpdateSet`; `password` out of every user result; `findCommentById`; row logs removed; no-row return types.

## Related

- [[context/architecture]] (Database schema, Layering rules)
- [[knowledge/gotchas]] G01–G12, G17, G25–G28, G30, G31
- [[knowledge/concepts/partial-update-sent-fields]]
- [[knowledge/concepts/user-join-read-shape]]
