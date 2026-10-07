# DAL Query classes (`backend/src/dal/query/`)

| Field | Value |
|---|---|
| Component | `@alumni/dal` — `query/*Query.ts`, `query/` helpers, `dto/*DTO.ts`, `errors.ts` |
| Status | current as of REQ-fs-003 (2026-10-07) |
| Created | 2026-10-05 |

One class per table (`UserQuery`, `AlumniQuery`, `PostQuery`, `CommentQuery`) plus `StatsQuery`. Each method holds parameterized SQL run on the shared `pg` pool (`dal/config/db.ts`) and returns rows typed as the matching `dto/*DTO.ts` class. This is the only place SQL lives. Table and column names must match `db/schema.md` (`"User"`, `alumni`, `posts`, `comment`).

## Helpers beside the classes

| File | Gives |
|---|---|
| `query/updateSet.ts` | `buildUpdateSet`; `UpdateFields<K>`, the one input type for updates |
| `query/listHelpers.ts` | `PageRequest`, `PageRows<T>`, `likePattern` |
| `query/transaction.ts` | `withTransaction(work)` |
| `errors.ts` | `classifyDbError(err)`: names a PostgreSQL error by its code. The only code that reads those codes to decide an answer |

## What to know before changing it

- **The build does not check SQL.** `pool.query` takes a string and returns untyped rows, so a wrong table name, a typo or an unbound `$n` compiles. Check each statement against `db/schema.md` and run it ([[knowledge/lessons/LESSON-REQ-fs-001-1]]).
- **There are no tests and the pipeline has no database.** A query change is only proven by the owner running the endpoint. Prove the pure parts by running them alone ([[knowledge/lessons/LESSON-REQ-fs-003-2]]).
- **One read constant per resource, used by every read and every write.** `ALUMNI_READ`, `POST_READ`, `COMMENT_READ` join `"User"` with named columns; create and update write, then return the row through the same constant ([[knowledge/lessons/LESSON-REQ-fs-003-3]], [[knowledge/concepts/user-join-read-shape]]).
- **`password` is never selected**, except by `UserQuery.findUserWithPasswordByEmail`, which only login uses. Every other `"User"` query names its columns ([[knowledge/lessons/LESSON-REQ-fs-002-2]]).
- **Lists** follow [[knowledge/concepts/paged-list-query]]: values pushed before their `$n`, a count and a page query sharing one `WHERE`, `COUNT(*)::int`, a fixed `ORDER BY`.
- **Search text goes through `likePattern`** and the SQL is plain `ILIKE $n` with no `ESCAPE` clause: backslash is PostgreSQL's default, and a backslash typed in a template string is easy to lose.
- **Updates write only the columns that were sent**, built with `buildUpdateSet` from a fixed column list in the Query class ([[knowledge/concepts/partial-update-sent-fields]]). The same list also lives in the controller ([[knowledge/gotchas#^g30|G30]]).
- **Inside `withTransaction`, every statement goes through the `client` argument.** A `pool.query` there runs on another connection and is not rolled back; it still compiles. Use a transaction only when there is more than one statement: one `WITH RECURSIVE ... DELETE` is all-or-nothing by itself.
- **Deletes:** `PostQuery.deletePost` removes the post's comments and everything under them, then the post, in one transaction. `CommentQuery.deleteComment` removes the comment and every reply under it in one recursive statement. `UserQuery.deleteUser` is one `DELETE`; the database's foreign keys refuse a user who has content and `UserManager` turns that into a 409 ([[architecture/adr-06-deleting-rows-that-other-rows-reference|ADR-06]]).
- **A method that returns `rows[0]` is typed "row or undefined"** ([[knowledge/lessons/LESSON-REQ-fs-002-1]]). That includes a write that re-reads its row: the row can be deleted between the two statements. Read `rowCount` as `rowCount ?? 0`.
- **`posts.comment_count` is not used.** The count is a sub-query in `POST_READ` ([[knowledge/gotchas#^g11|G11]]).
- **One alumni profile per user** is enforced in `AlumniQuery.createAlumni` with a per-user advisory lock ([[knowledge/gotchas#^g37|G37]]).
- **DTO fields follow the schema's nullability.** A DTO you build with `new` carries made-up timestamps ([[knowledge/gotchas#^g41|G41]]).
- **No Query method logs rows.** Keep it that way ([[knowledge/lessons/LESSON-REQ-fs-001-4]]).
- **A new DAL file that nothing imports is not compiled by `npm run build`** ([[knowledge/gotchas#^g28|G28]]). Importing the DAL connects to the database ([[knowledge/gotchas#^g40|G40]]).
- **Managers take their parameter types from the Query methods** (`Parameters<UserQuery["listUsers"]>[0]`), because the filter and column types are not exported from `dal/index.ts`. Accepted at the REQ-fs-003 review.

## State of each class (2026-10-07)

Run against the real database by the owner on 2026-10-07, admin paths and deletes included.

| Class | State |
|---|---|
| `AlumniQuery` | Two new columns; search list, filter values, own profile; one profile per user; writes answer the joined shape. Open: G30 (four field lists), G37 (old duplicates). |
| `CommentQuery` | Every read and write answers `name`, `photo_url`; comments of one post; recursive delete. Open: `getAllComments` is unpaged. |
| `UserQuery` | Search list with paging; `deleteUser` reports whether a row went. No `password` in any result but the login read. |
| `PostQuery` | Paged list, joined reads, counted comments, transactional delete. The stored `comment_count` column is unused. |
| `StatsQuery` | One statement, four counts. |

## Touched by

- REQ-fs-001 — fixed `AlumniQuery` and `CommentQuery` SQL against the schema; `graduation_yr` → `graduation_year`; alumni reads join `"User"`.
- REQ-fs-002 — partial updates through `buildUpdateSet`; `password` out of every user result; `findCommentById`; row logs removed; no-row return types.
- REQ-fs-003 — lists, search and paging; joined reads and writes for posts and comments; deletes that take what is under them; `StatsQuery`; `errors.ts`, `transaction.ts`, `listHelpers.ts`; nullable DTO fields.

## Related

- [[context/architecture]] (Database schema, Layering rules)
- [[knowledge/gotchas]] G08, G11, G25–G28, G30, G31, G37, G40, G41
- [[knowledge/concepts/partial-update-sent-fields]], [[knowledge/concepts/user-join-read-shape]], [[knowledge/concepts/paged-list-query]]
- [[knowledge/components/api-controllers-and-routes]]
