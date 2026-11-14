# A passing build says nothing about SQL strings ^L-REQ-fs-001-1

| Field | Value |
|---|---|
| ID | LESSON-REQ-fs-001-1 |
| Captured | 2026-10-05 |
| REQ | REQ-fs-001 |
| Component | `backend/src/dal/query/` |
| Tags | dal, sql, testing |
| Severity | trap (cost real time before) |
| Supersedes | — |

## The lesson

`npm run build` checks types only. Check every SQL string against `db/schema.md` by eye, column by column, and have it run against the real database before calling it done; `tsc` never reads the SQL, and `pool.query` rows are untyped.

## Saw it in

- `backend/src/dal/query/AlumniQuery.ts` (`createAlumni`, `updateAlumni`) — `INSER INTO users …` and an unbound `$8` compiled cleanly and sat in the repo until REQ-fs-001.
- REQ-fs-001 review — all 15 acceptance criteria were met by reading and building; none by running a query.
