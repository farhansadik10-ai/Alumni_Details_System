# Before fixing code that never ran, list what it was hiding ^L-REQ-fs-001-2

| Field | Value |
|---|---|
| ID | LESSON-REQ-fs-001-2 |
| Captured | 2026-10-05 |
| REQ | REQ-fs-001 |
| Component | `backend/src/dal/query/`, `backend/src/api/routes/` |
| Tags | dal, auth, api, scope |
| Severity | trap (cost real time before) |
| Supersedes | — |

## The lesson

When a fix makes a dead code path run for the first time, list what becomes reachable — missing owner checks, NULL overwrites, "not found" returning 200, raw database errors — and put that list in front of the owner at the spec gate, before the fix is scoped.

## Saw it in

- `backend/src/dal/query/AlumniQuery.ts` (`updateAlumni`) and `backend/src/dal/query/CommentQuery.ts` (`updateComment`, `deleteComment`) — the broken SQL was the only thing stopping any logged-in user from editing any alumni profile or editing/deleting any comment (G19, G23). The owner accepted that at the spec gate with the facts in hand.
- REQ-fs-001 review finding m1 — an update on a missing id returns 200 with an empty body; that path could not run before.
