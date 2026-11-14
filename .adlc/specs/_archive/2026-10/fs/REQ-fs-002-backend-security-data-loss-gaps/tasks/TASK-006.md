# TASK-006 — Comments: author from token, owner checks, content-only edit

| Field | Value |
|---|---|
| REQ | REQ-fs-002 |
| Tier | 1 |
| Status | complete |
| Repo | alumni-details-system |
| Depends on | TASK-002 |
| Blocks | TASK-007 |

## Goal

A new comment belongs to the caller; only its author can edit a comment (content only); only its author or an admin can delete it.

## Files to touch

| Path | Action |
|---|---|
| `backend/src/dal/query/CommentQuery.ts` | edit — add `findCommentById` |
| `backend/src/businessLogic/src/CommentManager.ts` | edit — add `findCommentById` |
| `backend/src/api/controllers/CommentController.ts` | edit |
| `backend/src/api/routes/CommentRoutes.ts` | edit — comments on the `PUT` and `DELETE` lines only |

## Approach

- **CommentQuery.** `findCommentById(id: number): Promise<CommentDTO | undefined>` — `SELECT * FROM comment WHERE id = $1`. The `updateComment` and `deleteComment` SQL stays as it is.
- **CommentManager.** `findCommentById(id)`.
- **CommentController.**
  - `createComment`: `new CommentDTO(req.user.sub, post_id, content, parent_id)`; stop reading `user_id` from the body. It still reads `post_id` (G13 is out of scope).
  - `updateComment`: `existing = findCommentById(id)`; none gives 404 `{ error: "Comment not found" }`; not `isSelf(req, existing.user_id)` gives 403 `{ error: "Not authorized to edit this comment" }` (admins too). `content` must be a non-empty string, else 400 `{ error: "Content is required" }`. Build the DTO from `existing.user_id`, `existing.posts_id`, `existing.parent_id` and the new `content`; update; no row gives 404.
  - `deleteComment`: load `existing`; none gives 404; not `isSelf` and not `isAdmin` gives 403 `{ error: "Not authorized to delete this comment" }`; then delete as today.

## Acceptance

- [ ] AC15: an admin who is not the author gets 403 on `PUT`
- [ ] AC16: the author and an admin can delete; anyone else gets 403 and no `DELETE` runs
- [ ] AC17 (comments): a missing id gets 404 on `PUT` and `DELETE`
- [ ] AC19: `createComment` does not read `user_id` from `req.body`
- [ ] AC20: `updateComment` reads only `content` from `req.body`
- [ ] The new SQL names only `comment` and `id`, both in `db/schema.md`
- [ ] `npm run build` exits 0

## Notes

- Deleting a comment that has replies still fails with a foreign-key error (G08, ADR-06 — out of scope). The 400 from the existing `catch` stays.
- Leave the `console.log` in `getAllComments` (out of scope in the spec).
- Gotchas: G22, G23.

### Implementation notes (2026-10-06)

- Order in `updateComment`: 404 (no row), 403 (not the author), 400 (content missing, not a string, or only white space), then the write; a write that returns no row is 404. `deleteComment`: 404, 403, delete.
- `content` is stored as sent; it is checked with `isNonEmptyString` but not trimmed.
- `updateComment` reads `req.body?.content`, so a request with no body gives 400 "Content is required" and not a thrown error.
- `createComment` still does not check `content` or `post_id`; a bad value comes back as the database's own message through the existing `catch` (unchanged, out of scope).
- An id that is not a number reaches PostgreSQL as `NaN` in `findCommentById` and comes back as 400 with the raw database message (accepted risk in the architecture doc).
- Build: `npm run build` exited 0 on 2026-10-06. The owner checks and the new SQL have not been run against a database; that is TASK-007's manual checklist.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-002-backend-security-data-loss-gaps/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-001-2]]
