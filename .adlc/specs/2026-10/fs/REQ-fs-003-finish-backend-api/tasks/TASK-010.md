# TASK-010 — Post and comment controllers as classes; paged feed, comments of a post

| Field | Value |
|---|---|
| REQ | REQ-fs-003 |
| Tier | 2 |
| Status | pending |
| Repo | alumni-details-system |
| Depends on | TASK-004, TASK-007 |
| Blocks | TASK-012 |

## Goal

`PostController` and `CommentController` are classes; the feed is paged; one post's comments can be read; comment create checks its post and parent; deletes call the new all-or-nothing data methods.

## Files to touch

| Path | Action |
|---|---|
| `backend/src/api/controllers/PostController.ts` | edit |
| `backend/src/api/controllers/CommentController.ts` | edit |
| `backend/src/api/routes/PostRoutes.ts` | edit |
| `backend/src/api/routes/CommentRoutes.ts` | edit |

## Approach

- **PostController** (today's names, no `try`/`catch`):
  - `createPost` — `pickSent` + `checkFields` over `caption`, `media_url` (`isStringOrNull`); author from the token; 201 with the joined row.
  - `getAllPosts` — `parsePaging`; answer `{ items, total, page, limit }`.
  - `findPostById` — stays a method and stays without a route (G33 is out of scope); `parseId`, 404.
  - `updatePost` — `parseId`; 404, 403 (author only, ADR-02), 400, write, 404; today's messages; typed through `checkFields`, no cast.
  - `deletePost` — `parseId`; 404; 403 unless author or admin; `postManager.deletePost(id)`; 200 `{ message: "Post deleted successfully" }`.
- **CommentController** (it holds a `CommentManager` and a `PostManager`):
  - `createComment` — `post_id` via `parseId(req.body?.post_id, "post_id")`; post missing → `NotFoundError("Post not found")`. `parent_id`, when sent and not `null`: read with `parseId(value, "parent_id")` (the same rule as `post_id`) and must be an existing comment whose `posts_id` equals `post_id`, else `ValidationError("parent_id must be a comment on the same post")`. Author from the token; 201. The body key stays `post_id` (G13 is out of scope).
  - `getAllComments` — unchanged answer.
  - `getCommentsByPost` — `parseId(req.params.id)`; post missing → `NotFoundError("Post not found")`; answer the array.
  - `updateComment` — as today (author only, content only), with `parseId` and thrown errors.
  - `deleteComment` — `parseId`; 404; 403 unless author or admin; `commentManager.deleteComment(id)`; 200 with today's message.
- **Routes.** `PostRoutes`: today's four lines plus `router.get("/:id/comments", authMiddleware, handler(comments, "getCommentsByPost"))`. `CommentRoutes`: today's four lines. Every handler through `handler(...)`.

## Acceptance

- [ ] AC1, AC3 hold for both controllers; AC6 for every `:id` route
- [ ] AC10, AC27, AC29, AC30, AC31, AC32 hold by reading the code
- [ ] AC11: no `as Partial<PostDTO>` is left
- [ ] AC12: post edit is author-only; post and comment delete are author-or-admin; comment edit is author-only and changes `content` only; authors still come from the token
- [ ] No `new PostDTO(0)` / `new CommentDTO(0, 0, "")` placeholder objects are left for deletes
- [ ] `npx tsc --noEmit -p backend/src/api` reports no error in these four files

## Notes

- Do not add a `GET /api/posts/:id` route.
- `post_id` and `parent_id` follow one rule: a positive whole number, as a JSON number or a string of digits. `0`, `1.5`, `"abc"` are 400. For `parent_id`, `null` and absent mean "top-level comment".
- Lesson: [[knowledge/lessons/LESSON-REQ-fs-002-4]] for every id read from a body.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-003-finish-backend-api/architecture]]
- Lessons checked: LESSON-REQ-fs-001-3, LESSON-REQ-fs-002-3, LESSON-REQ-fs-002-4
