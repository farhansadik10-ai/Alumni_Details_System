# Type a Query method that returns `rows[0]` as "row or undefined" ^L-REQ-fs-002-1

| Field | Value |
|---|---|
| ID | LESSON-REQ-fs-002-1 |
| Captured | 2026-10-06 |
| REQ | REQ-fs-002 |
| Component | `backend/src/dal/query/` |
| Tags | dal, types, not-found, controllers |
| Severity | trap (cost real time before) |
| Supersedes | — |

## The lesson

A Query method that returns `info.rows[0]` must be typed `Promise<XDTO | undefined>`, and every sibling Query gets the same type in the same change. Typed as always returning a row, the "no such id" case is invisible to the compiler and the controller answers 200 with an empty body.

## Saw it in

- `backend/src/dal/query/UserQuery.ts` (`findUserById`) and `PostQuery.ts` (`updatePost`) — typed as always returning a row; the 404 for a missing id needed the honest type first.
- `backend/src/dal/query/AlumniQuery.ts` (`findAlumniById`, `updateAlumni`) and `CommentQuery.ts` (`updateComment`) — left with the old type in the same REQ and caught at review (finding m5); fixed in the fix round.
