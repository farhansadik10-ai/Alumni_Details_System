# One resource, one answer shape: route every write and every read through the same joined query ^L-REQ-fs-003-3

| Field | Value |
|---|---|
| ID | LESSON-REQ-fs-003-3 |
| Captured | 2026-10-07 |
| REQ | REQ-fs-003 |
| Component | `backend/src/dal/query/*Query.ts`, `shared/types/` |
| Tags | dal, api, contract, joins, shared-types |
| Severity | guideline (a rule to follow) |
| Supersedes | — |

## The lesson

When a read of a resource joins extra columns (the author's name and photo), make create, update and every other read of that resource return the row through the same read constant, in the same change. A write that answers `RETURNING *` gives the frontend a second shape for the same thing, and one shared type cannot describe both.

## Saw it in

- `backend/src/dal/query/PostQuery.ts` (`POST_READ`) — done right from the start: create and update write, then re-read.
- `backend/src/dal/query/AlumniQuery.ts`, `CommentQuery.ts` — writes returned bare rows while reads were joined (review finding M1, round 1). The fix joined the writes but left `getAllComments` and `findCommentById` bare, which took a third round (finding n2).
- [[knowledge/gotchas#^g25|G25]] recorded the alumni half of this on 2026-10-05; it was accepted then and cost two review rounds here.
