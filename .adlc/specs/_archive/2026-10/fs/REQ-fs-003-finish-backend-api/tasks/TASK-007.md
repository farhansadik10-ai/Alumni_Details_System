# TASK-007 — Posts and comments data layer: joined reads, counted comments, deletes that take replies

| Field | Value |
|---|---|
| REQ | REQ-fs-003 |
| Tier | 1 |
| Status | pending |
| Repo | alumni-details-system |
| Depends on | TASK-001, TASK-002 |
| Blocks | TASK-010 |

## Goal

Post reads carry the author and a counted `comment_count`; one post's comments can be listed with their authors; deleting a post or a comment removes everything under it, all or nothing.

## Files to touch

| Path | Action |
|---|---|
| `backend/src/dal/query/PostQuery.ts` | edit |
| `backend/src/dal/query/CommentQuery.ts` | edit |
| `backend/src/businessLogic/src/PostManager.ts` | edit |
| `backend/src/businessLogic/src/CommentManager.ts` | edit |

## Approach

- **PostQuery — one read constant.**
  ```sql
  SELECT p.id, p.user_id, p.caption, p.media_url, p.created_at, p.updated_at,
         u.name, u.photo_url,
         (SELECT COUNT(*)::int FROM comment c WHERE c.posts_id = p.id) AS comment_count
  FROM posts p LEFT JOIN "User" u ON u.id = p.user_id
  ```
  - `listPosts(page: PageRequest): Promise<PageRows<PostDTO>>` — count from `posts`; page read `ORDER BY p.created_at DESC, p.id DESC LIMIT $1 OFFSET $2`. Remove `getAllPosts`.
  - `findPostById(id): Promise<PostDTO | undefined>` — the read constant `WHERE p.id = $1`.
  - `createPost` — `INSERT … RETURNING id`, then return `findPostById(id)`.
  - `updatePost(id, data: UpdateFields<PostUpdateColumn>)` — `UPDATE … RETURNING id`; no row → `undefined`; else return `findPostById(id)`. Nothing to write → `findPostById(id)`.
  - `deletePost(id: number): Promise<boolean>` — inside `withTransaction(client => …)`, using `client.query` for both statements:
    ```sql
    WITH RECURSIVE doomed AS (
      SELECT id FROM comment WHERE posts_id = $1
      UNION
      SELECT c.id FROM comment c JOIN doomed d ON c.parent_id = d.id
    )
    DELETE FROM comment WHERE id IN (SELECT id FROM doomed)
    ```
    then `DELETE FROM posts WHERE id = $1`; return whether the post row was deleted.
  - Remove `updateCommentCount` and `getPostsByUserId` (nothing calls them; the stored column is no longer used).
- **CommentQuery.**
  - `listCommentsByPost(postId): Promise<CommentDTO[]>` — `SELECT c.*, u.name, u.photo_url FROM comment c LEFT JOIN "User" u ON u.id = c.user_id WHERE c.posts_id = $1 ORDER BY c.created_at ASC, c.id ASC`.
  - `deleteComment(id: number): Promise<number>` — one statement: the same recursive shape starting from `SELECT id FROM comment WHERE id = $1`; return `rowCount`.
  - `getAllComments`, `createComment`, `findCommentById`, `updateComment` unchanged.
- **Managers.** `PostManager`: `listPosts(page)`, `deletePost(id)`; remove `getAllPosts`, `updateCommentCount`, `getPostsByUserId`; `updatePost` takes `Parameters<PostQuery["updatePost"]>[1]` (no new export from `dal/index.ts`; that file is not edited here). `CommentManager`: `listCommentsByPost(postId)`, `deleteComment(id)`.

## Acceptance

- [ ] AC27, AC28 (data half): every post read goes through the one read constant; no statement reads or writes `posts.comment_count`
- [ ] AC29 (data half): order is oldest first; author columns are named, never `u.*`
- [ ] AC30, AC31 (data half): the post delete runs both statements on the same client inside `withTransaction`; the comment delete is one statement
- [ ] The recursive query follows `parent_id` only from parent to child
- [ ] Every `$n` has a matching value; every name is in `db/schema.md`
- [ ] `npx tsc --noEmit -p backend/src/dal` and `-p backend/src/businessLogic` pass
- [ ] A search of `backend/src` (not `node_modules`, not `Test*.ts`) finds no caller of the removed methods outside `backend/src/api/controllers`

## Notes

- `UNION` (not `UNION ALL`) keeps the recursion safe if the data ever held a loop.
- Do not add `ON DELETE CASCADE` or any schema change (ADR-06).
- No row logging. `"User"` double-quoted.
- The API workspace will not compile after this task; TASK-010 fixes that. Do not edit controllers. Do not touch `TestManager.ts` / `TestDal.ts`.

### Implementation notes (2026-10-06)

- `PostQuery` exports `PostUpdateColumn` (`"caption" | "media_url"`), taken from its own column list. It is not re-exported from `dal/index.ts`; `PostManager.updatePost` takes `Parameters<PostQuery["updatePost"]>[1]`, and `listPosts` takes `Parameters<PostQuery["listPosts"]>[0]`.
- `createPost` returns `PostDTO | undefined`, not `PostDTO`: it is an INSERT followed by `findPostById`, and the type says honestly that the second read can find nothing (LESSON-REQ-fs-002-1). TASK-010's `createPost` handler must handle `undefined`.
- `deletePost(id)` returns `boolean`; `deleteComment(id)` returns the number of rows deleted (the comment plus its replies), 0 when the id does not exist. TASK-010 keeps its own 404 check before calling either.
- `findPostById` now returns `undefined` for no row, where it returned `null`. `PostController` compares with `!post`, so both work.
- `listCommentsByPost` uses `c.*`, as the task says. `comment` has no secret column; the `"User"` columns are named.
- SQL read against `db/schema.md`: `posts` (id, user_id, caption, media_url, created_at, updated_at), `comment` (id, posts_id, parent_id, user_id, created_at), `"User"` (id, name, photo_url). Placeholder counts: insert 3/3, page 2/2, find 1/1, update n+1/n+1, both deletes in `deletePost` 1/1 each, comment list 1/1, comment delete 1/1.
- Checks run: `npx tsc --noEmit -p backend/src/dal` and `-p backend/src/businessLogic`, both exit 0. Search for `getAllPosts`, `updateCommentCount`, `getPostsByUserId` in `backend/src`: only `api/controllers`, `api/routes` (the controller's own export name) and the commented-out `TestManager.ts`.
- Not mine, found while reading: `backend/src/dal/query/listHelpers.ts:24` — `likePattern` is `text.replace(/[\%_]/g, "\$&")`. The class holds no backslash and the replacement is just the match, so nothing is escaped. It should be `/[\\%_]/g` and `"\\$&"`. This breaks AC for `q` search in TASK-005 / TASK-006 (a `%` in the search matches everything).

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-003-finish-backend-api/architecture]]
- Lessons checked: LESSON-REQ-fs-001-1, LESSON-REQ-fs-001-4, LESSON-REQ-fs-002-1, LESSON-REQ-fs-002-2
