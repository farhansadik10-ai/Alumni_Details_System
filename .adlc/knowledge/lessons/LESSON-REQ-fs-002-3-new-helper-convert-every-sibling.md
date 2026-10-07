# When a change adds a shared helper, convert every existing inline copy in the same change ^L-REQ-fs-002-3

| Field | Value |
|---|---|
| ID | LESSON-REQ-fs-002-3 |
| Captured | 2026-10-06 |
| REQ | REQ-fs-002 |
| Component | `backend/src/api/controllers/`, `backend/src/dal/query/` |
| Tags | api, controllers, auth, helpers, scope |
| Severity | guideline (a rule to follow) |
| Supersedes | — |

## The lesson

When a change adds a shared helper or removes a bad pattern, grep for every other place that does the same thing by hand and settle each one in that change: convert it, or write down why it stays. A task note that says "leave this one alone" still leaves two ways of doing the same check side by side, and reviewers will find it.

## Saw it in

- `backend/src/api/controllers/PostController.ts` (`deletePost`, `findPostById`) — kept an inline `===` owner check and a load-all-posts lookup beside the new `isSelf` / `isAdmin` and `postManager.findPostById`; four reviewers flagged it (finding m2); fixed in the fix round.
- `backend/src/dal/query/PostQuery.ts`, `CommentQuery.ts` — the row `console.log` was removed from `UserQuery` and left in the two siblings (finding m1). Same pattern as [[knowledge/lessons/LESSON-REQ-fs-001-4]], second time.
- **Again in REQ-fs-003 (2026-10-07).** `backend/src/api/controllers/AlumniController.ts`, `PostController.ts` — `textOrNull` and a digits-only parse were written twice beside the new `requestHelpers.ts` (review findings m4). The fix round then added `queryFilterValue` as a near copy of `queryText` (finding n4). Second and third sighting: search the controllers for a local copy before closing any task that adds a helper.
