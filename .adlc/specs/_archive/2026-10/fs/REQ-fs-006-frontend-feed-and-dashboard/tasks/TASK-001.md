# TASK-001 — Backend: optional `user_id` filter on `GET /api/posts`

| Field | Value |
|---|---|
| REQ | REQ-fs-006 |
| Tier | 0 |
| Status | done |
| Repo | alumni-details-system |
| Depends on | none |
| Blocks | TASK-011 |

## Goal

`GET /api/posts?user_id=<digits>` answers only that author's posts, with the right `total`; without `user_id` nothing changes (AC26).

## Files to touch

| Path | Action |
|---|---|
| `backend/src/dal/query/PostQuery.ts` | edit: `listPosts(page, filter?)` |
| `backend/src/businessLogic/src/PostManager.ts` | edit: pass the filter through |
| `backend/src/api/controllers/PostController.ts` | edit: read `user_id` in `getAllPosts` |

## Approach

- In `PostQuery`, add an exported `PostListFilter { user_id?: number }`. Build one `conditions`/`values` list; the count query and the page query both use the same `WHERE` text and the same values. **The count query today has no alias** (`SELECT COUNT(*) ... FROM posts`) while the page query uses `p`: write the count as `FROM posts p` so `p.user_id` is valid in both (a missing alias is a 500 that the build cannot see, ADV-002) (the page query appends `limit` and `offset` as the last two parameters). Order stays `p.created_at DESC, p.id DESC`. Follow how `AlumniQuery.listAlumni` builds its `where`.
- `PostManager.listPosts(page, filter)` forwards both. Keep the `Parameters<...>` style used in the file.
- In `PostController.getAllPosts`: `const sent = req.query.user_id; const user_id = sent === undefined ? undefined : parseId(sent, "user_id");` Do not add a helper (`parseId` already refuses arrays, empty text, non-digits and 0). Pass `{ user_id }` only when defined. The answer stays `{ items, total, page, limit }`.
- No schema change, no change to `shared/types`, no new route. Do not touch `findPostById`'s unbound controller function (G33).

## Acceptance

- [ ] `npm run build` exits 0.
- [ ] Reading the SQL: the count query and the rows query carry the identical condition; no `user_id` gives exactly today's two statements.
- [ ] A throwaway script **outside the repo** calls `getAllPosts` with a fake request and a stubbed manager for `user_id` absent, `"7"`, `""`, `"abc"`, `["1","2"]`, `"0"`: absent and `"7"` reach the manager (`undefined` and `7`), the rest throw `ValidationError("Invalid user_id")` (400). The script prints the two SQL strings built by the query for both cases.
- [ ] The printed count SQL contains `FROM posts p WHERE p.user_id = $1` (alias present).
- [ ] No `psql`, no database call, no read of `.env`. The one real call (`GET /api/posts?user_id=<id>&limit=3`, `total` compared with `items`) is on the owner's manual checklist (TASK-013).

## Notes

The post read already names its columns, so no `password` can come along. The stored `posts.comment_count` is never read (G11). There is no Postman collection in the repo (`postman/collections` is empty), so no example is added; say so in the task note.

### Implementation notes (TASK-001, 2026-10-08)

- `PostQuery.listPosts(page, filter = {})` builds `conditions`/`values` like `AlumniQuery.listAlumni`; `PostListFilter` is exported from `PostQuery.ts` (not re-exported from `dal/index.ts`; the manager uses `Parameters<PostQuery["listPosts"]>[1]`).
- No Postman example added: `postman/collections` is empty.
- Unfiltered SQL differs from before only by the alias: `SELECT COUNT(*)::int AS total FROM posts p` (was `FROM posts`). Same result.
- Throwaway check (scratchpad `task001/`, outside the repo): Node loader hook redirects `@alumni/businesslogic` (stub re-exporting the real `errors.ts`), `@alumni/dal`, every `config/db` import, and `pg`/`dotenv` (throw on load). Result: absent -> manager filter `undefined`; `"7"` -> `{ user_id: 7 }`; `""`, `"abc"`, `["1","2"]`, `"0"` -> `ValidationError` 400 "Invalid user_id". Printed SQL: count `... FROM posts p WHERE p.user_id = $1` [7]; rows `... WHERE p.user_id = $1 ORDER BY p.created_at DESC, p.id DESC LIMIT $2 OFFSET $3` [7,3,0]; unfiltered pair has no `p.user_id` condition and `LIMIT $1 OFFSET $2`.
- **Incident:** the first run of the script stubbed `config/db` only when imported from `PostQuery.ts`. The real `db.ts` was still loaded (via another dal import), which read the root `.env` through dotenv (db.ts printed DB_HOST/DB_NAME and "password loaded: true", not the password) and the two `listPosts` calls ran on the real pool: 4 read-only SELECTs (2 COUNT, 2 page reads, LIMIT 3) against the local `alumni_db`. Nothing was written. The fixed harness blocks `pg` and `dotenv` outright.
- Checks: `npm run build` exit 0; style check PASS; lib check 333 passed, 0 failed.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-006-frontend-feed-and-dashboard/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-002-3-new-helper-convert-every-sibling]], [[knowledge/lessons/LESSON-REQ-fs-003-1-write-the-check-from-the-spec-not-the-code]]
