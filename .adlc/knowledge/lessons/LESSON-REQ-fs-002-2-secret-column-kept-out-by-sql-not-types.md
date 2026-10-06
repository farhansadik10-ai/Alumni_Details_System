# A secret column is kept out of responses by the SQL column list, not by a type ^L-REQ-fs-002-2

| Field | Value |
|---|---|
| ID | LESSON-REQ-fs-002-2 |
| Captured | 2026-10-06 |
| REQ | REQ-fs-002 |
| Component | `backend/src/dal/query/UserQuery.ts` |
| Tags | dal, auth, password, sql, types |
| Severity | critical (must never repeat) |
| Supersedes | — |

## The lesson

To keep a column such as `password` out of every response, name the columns in the SQL (never `SELECT *` or `RETURNING *` on that table) and give the one query that must read the secret a name that says so. A type like `Omit<UserDTO, "password">` only stops code from reading the field; `pg` rows are untyped, so it compiles over `SELECT *` and the hash still goes out.

## Saw it in

- `backend/src/dal/query/UserQuery.ts` — `PUBLIC_USER_COLUMNS` replaces `*` in five methods; `findUserWithPasswordByEmail` is the only read of the hash, reached only through `UserManager.findUserForLogin` and `login`.
- `backend/src/dal/dto/UserDTO.ts` — `PublicUserDTO` is the compile-time half of the rule; it is not what protects the response.
