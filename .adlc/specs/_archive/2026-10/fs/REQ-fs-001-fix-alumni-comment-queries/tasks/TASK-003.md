# TASK-003 — Comment update and delete use the comment table

| Field | Value |
|---|---|
| REQ | REQ-fs-001 |
| Tier | 0 |
| Status | pending |
| Repo | alumni-details-system |
| Depends on | — |
| Blocks | — |

## Goal

`CommentQuery.updateComment` and `deleteComment` run valid SQL against the `comment` table.

## Files to touch

| Path | Action |
|---|---|
| `backend/src/dal/query/CommentQuery.ts` | edit (`updateComment`, `deleteComment` only) |

## Approach

- `updateComment`: change `UPDATE comments SET content=$1 updated_at=NOW()` to `UPDATE comment SET content=$1, updated_at=NOW()`. Keep the `WHERE id=$2 RETURNING *` and the value list.
- `deleteComment`: change `DELETE FROM comments` to `DELETE FROM comment`.

## Acceptance

- [ ] No SQL in `CommentQuery.ts` contains `comments`.
- [ ] `updateComment` has a comma between `content=$1` and `updated_at=NOW()`.
- [ ] `createComment` and `getAllComments` are byte-for-byte unchanged.
- [ ] `npm run build --workspace=@alumni/api` exits 0.
- [ ] Only `CommentQuery.ts` is modified by this task.

## Notes

- Do not add owner checks, do not delete replies first (ADR-06 is a later REQ), do not remove `console.log`. "No other change."
- No git commands.
- Implemented 2026-10-05 (task-implementer). Two one-line SQL edits, exactly as in Approach; `git diff` shows only lines 27 and 35 of `CommentQuery.ts` changed, so `createComment` and `getAllComments` are untouched.
- `npm run build --workspace=@alumni/api` exited 0, run while TASK-001's edits to the three alumni files were also in the tree.
- A plain search for `comments` in the file still finds lines 17, 20 and 22. Those are the local array variable in `getAllComments`, not SQL. No SQL string contains `comments`.
- G23's "Don't fix G06 / G07 without the check" conflicts with this task on its face. Not treated as a blocker because architecture.md (Risks, row 1) records the owner accepting it at the spec gate on 2026-10-05. Flagged in the status report so the orchestrator can confirm.
- The SQL was not run: the pipeline has no database. The owner's manual checks (`PUT` and `DELETE /api/comments/:id`) are the real test.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-001-fix-alumni-comment-queries/architecture]]
- Lessons checked: none exist. Gotchas: G06, G07.
