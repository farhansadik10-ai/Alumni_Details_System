# TASK-003 — Services: posts, comments, stats; `limit` on the alumni list

| Field | Value |
|---|---|
| REQ | REQ-fs-006 |
| Tier | 0 |
| Status | pending |
| Repo | alumni-details-system |
| Depends on | none |
| Blocks | TASK-005 |

## Goal

Every call the feed and dashboard make is one function in `frontend/src/services/`, with relative `/api` paths and `@alumni/shared` types.

## Files to touch

| Path | Action |
|---|---|
| `frontend/src/services/postService.ts` | create |
| `frontend/src/services/commentService.ts` | create |
| `frontend/src/services/statsService.ts` | create |
| `frontend/src/services/alumniService.ts` | edit: optional `limit` in `AlumniListParams` |

## Approach

- Copy the shape of `alumniService.ts`: `apiClient`, one path constant per file, `Paged<T>` from `@alumni/shared`.
- `postService`: `listPosts(params: { page?: number; limit?: number; user_id?: number }, signal?)` returning `Paged<Post>`; `createPost(body: CreatePostDTO)` returning `Post`; `updatePost(id, body: UpdatePostDTO)` returning `Post`; `deletePost(id)`.
- `commentService`: `getCommentsByPost(postId, signal?)` -> `GET /api/posts/:id/comments` returning `Comment[]`; `createComment(body: CreateCommentDTO)` (the body key stays `posts_id`) returning `Comment`; `updateComment(id, body: UpdateCommentDTO)`; `deleteComment(id)`.
- `statsService`: `getStats(signal?)` returning `Stats`.
- `AlumniListParams` gets `limit?: number`; update the comment that says it is never sent. It is sent only when given. `getMyAlumni` is untouched.
- Write calls take no `signal` (a write is never cancelled). No error handling here: failures become `ApiFailure` in the store.

## Acceptance

- [x] `npm run build` and `node scripts/frontend-style-check.mjs` exit 0.
- [x] No path is written twice; no service imports the store; no absolute URL.
- [x] The directory page still sends no `limit` (its params are unchanged).

## Notes

The comment-create body uses `posts_id`, not `post_id` (root `CLAUDE.md`). Check the response shape of create/update in `CommentController` and `PostController` before typing the return values (both answer the joined read).

**Implementation (2026-10-08):**
- Checked: `PostQuery.createPost/updatePost` return `findPostById` (joined read with `comment_count`, `name`, `photo_url`); `CommentQuery.createComment/updateComment` return `COMMENT_READ`. So create/update are typed `Post` / `Comment`. Deletes answer `{ message }`, which no caller needs, so `deletePost` / `deleteComment` return `void`.
- `postService` exports `POSTS_PATH`; `commentService` imports it for `GET /api/posts/:id/comments`, so `/api/posts` is written once in the frontend. Small deviation from "one path constant per file": the comment file has its own `COMMENTS_PATH` plus the imported one.
- `PostListParams` is an exported interface (named like `AlumniListParams`) rather than an inline type; same keys as the task asked.
- The directory's params come from `lib/directoryQuery.ts`, which sets no `limit`; unchanged. Its comment "`limit` is never sent" (line 106) is still true for the directory and was left alone (not a file this task names).
- Checks: `npm run build` exit 0 (`tsc -b` covers all of `src`), style check PASS, lib check 333 passed / 0 failed.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-006-frontend-feed-and-dashboard/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-003-6-change-the-shared-types-with-the-endpoint]]
