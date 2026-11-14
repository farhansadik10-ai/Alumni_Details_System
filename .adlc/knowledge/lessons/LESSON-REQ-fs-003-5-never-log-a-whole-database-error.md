# Never log a whole database error: its detail can hold the failing row ^L-REQ-fs-003-5

| Field | Value |
|---|---|
| ID | LESSON-REQ-fs-003-5 |
| Captured | 2026-10-07 |
| REQ | REQ-fs-003 |
| Component | `backend/src/api/MiddleWare/errorMiddleware.ts` |
| Tags | api, errors, logging, password, privacy |
| Severity | critical (must never repeat) |
| Supersedes | — |

## The lesson

Do not pass a PostgreSQL error object to `console.error` or any logger. On a constraint failure its `detail` field holds the whole failing row or the duplicate key, which for `"User"` means the password hash and the email. Log a short summary instead: `code`, `message`, `constraint`, `table`, `column`.

## Saw it in

- `backend/src/api/MiddleWare/errorMiddleware.ts` — the task asked for `console.error(err)` in the database branch and it was built that way; the implementer flagged it and it was replaced by `logDbError` before the first commit.
- Same family as [[knowledge/lessons/LESSON-REQ-fs-001-4]] (row logs) and [[knowledge/lessons/LESSON-REQ-fs-002-2]] (the hash is kept out by the column list): this is the third place a hash could have leaked.
