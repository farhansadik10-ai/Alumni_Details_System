# TASK-004 — Posts: author from token, owner-only partial update

| Field | Value |
|---|---|
| REQ | REQ-fs-002 |
| Tier | 1 |
| Status | complete |
| Repo | alumni-details-system |
| Depends on | TASK-001, TASK-002 |
| Blocks | TASK-007 |

## Goal

A new post belongs to the caller; only its author can edit a post, and an edit changes only the fields that were sent.

## Files to touch

| Path | Action |
|---|---|
| `backend/src/dal/query/PostQuery.ts` | edit |
| `backend/src/businessLogic/src/PostManager.ts` | edit |
| `backend/src/api/controllers/PostController.ts` | edit |
| `backend/src/api/routes/PostRoutes.ts` | edit — comment on the `PUT` line only |

## Approach

- **PostQuery.** `findPostById(id: number)` (it took a `PostDTO`; nothing calls it). `updatePost(id: number, data: Partial<PostDTO>)` with `buildUpdateSet(data, ["caption","media_url"])`, then `updated_at = NOW() WHERE id = $n RETURNING *`; when nothing was sent, run no `UPDATE` and return `findPostById(id)`.
- **PostManager.** `updatePost(id, data)`; add `findPostById(id)`.
- **PostController.**
  - `createPost`: `new PostDTO(req.user.sub, caption, media_url)`; stop reading `user_id` from the body.
  - `updatePost`: `existing = await postManager.findPostById(id)`; none gives 404 `{ error: "Post not found" }`; not `isSelf(req, existing.user_id)` gives 403 `{ error: "Not authorized to edit this post" }` (admins too — ADR-02). `fields = pickSent(req.body, ["caption","media_url"])`; empty gives 400 `{ error: "No fields to update" }`. A field that is not a string or `null` gives 400 `{ error: "<field> has the wrong type" }`. Update; no row gives 404.

## Acceptance

- [ ] AC4, AC6, AC7 hold for `PUT /api/posts/:id` by reading the code
- [ ] AC18: `createPost` does not read `user_id` from `req.body`
- [ ] AC22: an admin who is not the author gets 403; a missing id gets 404
- [ ] `deletePost`, `getAllPosts` and the controller's `findPostById` behave as before
- [ ] Every column name in the new SQL is in the `posts` table of `db/schema.md`
- [ ] `npm run build` exits 0

## Notes

- Leave `deletePost` as it is (it still loads all posts; the ADR-06 work will rewrite it). Leave the `console.log` in `getAllPosts` (out of scope in the spec).
- Gotchas: G10, G20, G21.

### Implementation notes (task-implementer, 2026-10-06)

- `npm run build` exited 0 after the edits. Nothing was run against the database; the SQL is checked by reading only.
- SQL produced by `updatePost` for `{ caption }`: `UPDATE posts SET caption = $1, updated_at = NOW() WHERE id = $2 RETURNING *`. For both fields: `SET caption = $1, media_url = $2, updated_at = NOW() WHERE id = $3`. Columns used: `caption`, `media_url`, `updated_at`, `id` — all in `posts` in `db/schema.md`.
- `PostQuery.updatePost` now returns `PostDTO | null` (it used to promise a `PostDTO` and give `undefined` for a missing id). The controller maps `null` to 404, which also covers a post deleted between the owner check and the write.
- The controller passes `fields as Partial<PostDTO>`. The cast is needed because `PostDTO.caption` / `media_url` are `string | undefined` and a sent `null` (clear the field) is allowed. `PostDTO.ts` is not in this task's files, so the type was left alone.
- Order in `updatePost` is 404, then 403, then 400, as in the architecture flowchart: a non-author who sends an empty body gets 403, not 400.
- Not changed, as told: `deletePost` (still loads all posts and compares `user_id === req.user.sub` directly), the controller's `findPostById`, the `console.log` in `getAllPosts`.
- `createPost` still does not check the type of `caption` / `media_url`; the task asks for that check on update only. Follow-up candidate.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-002-backend-security-data-loss-gaps/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-001-1]], [[knowledge/lessons/LESSON-REQ-fs-001-2]]
