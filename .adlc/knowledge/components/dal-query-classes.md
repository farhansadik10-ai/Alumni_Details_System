# DAL Query classes (`backend/src/dal/query/`)

| Field | Value |
|---|---|
| Component | `@alumni/dal` — `query/*Query.ts` and `dto/*DTO.ts` |
| Status | stub — `STATUS: needs verification` (filled in at wrap-up) |
| Created | 2026-10-05 |

One class per table (`UserQuery`, `AlumniQuery`, `PostQuery`, `CommentQuery`). Each method holds one parameterized SQL string run on the shared `pg` pool (`dal/config/db.ts`) and returns rows typed as the matching `dto/*DTO.ts` class. This is the only place SQL lives. Table and column names must match `db/schema.md` (`"User"`, `alumni`, `posts`, `comment`).

## Touched by

- REQ-fs-001 — fixed `AlumniQuery` and `CommentQuery` SQL against the schema; alumni reads join `"User"`.

## Related

- [[context/architecture]] (Database schema, Layering rules)
- [[knowledge/gotchas]] G01–G12, G17
