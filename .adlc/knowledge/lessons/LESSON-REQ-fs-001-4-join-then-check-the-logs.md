# Before adding joined columns to a read, check whether the method logs its rows ^L-REQ-fs-001-4

| Field | Value |
|---|---|
| ID | LESSON-REQ-fs-001-4 |
| Captured | 2026-10-05 |
| REQ | REQ-fs-001 |
| Component | `backend/src/dal/query/` |
| Tags | dal, logging, privacy, joins |
| Severity | guideline (a rule to follow) |
| Supersedes | — |

## The lesson

A join can turn a harmless debug log into a personal-data log. Before widening a `SELECT`, look for `console.log` of the rows in that method and in its sibling methods, and settle each one in the same change.

## Saw it in

- `backend/src/dal/query/AlumniQuery.ts` (`getAllAlumni`) — a per-row `console.log` would have printed every user's name and email on each `GET /api/alumni` after the join; removed at the implement gate.
- `backend/src/dal/query/CommentQuery.ts` (`getAllComments`) — the same log is still there (REQ-fs-001 review finding m3).
