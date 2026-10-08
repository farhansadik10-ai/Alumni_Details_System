# TASK-005 — Store: `postAtoms.ts`, `postActions.ts`, reset wiring

| Field | Value |
|---|---|
| REQ | REQ-fs-006 |
| Tier | 1 |
| Status | pending |
| Repo | alumni-details-system |
| Depends on | TASK-002, TASK-003 |
| Blocks | TASK-007, TASK-008 |

## Goal

All feed, comment, recent-post, people and stats state lives in atoms with loaders and write actions that follow patterns 7 and 23 (AC5, AC6, AC9, AC12 to AC14, AC16 to AC19, AC35).

## Files to touch

| Path | Action |
|---|---|
| `frontend/src/store/postAtoms.ts` | create: state, loaders, clear and reset atoms |
| `frontend/src/store/postActions.ts` | create: the six writes |
| `frontend/src/store/sessionActions.ts` | edit: call `resetPostsAtom` beside every `resetAlumniAtom` (3 places) |

## Approach

- Copy the structure of `alumniAtoms.ts`: an `IDLE_*` constant per atom, one `createLatestRequest()` per loader, `isCancelled` checked before any failure is stored, `toApiFailure`, a re-export of `ApiFailure` so pages never import `services/`.
- **State and loaders** (see the architecture): `feedAtom` + `loadFeedAtom` (page 1; items empty while loading) + `loadMoreFeedAtom` (page from `nextFeedPage(items.length, limit)`, merged with `mergePosts`, `total` from the answer, `more` status and its own failure; on failure the held posts stay); `commentsAtom` + `openCommentsAtom(postId)` + `closeCommentsAtom`; `recentPostsAtom` keyed by `authorId` + `loadRecentPostsAtom({ authorId })` + `clearRecentPostsAtom` (limit 3; `user_id` sent only for a number); `peopleAtom` keyed by `kind` + `loadPeopleAtom(kind)` + `clearPeopleAtom` (limit 3; `mentoring: "true"` for `"mentoring"`); `statsAtom` + `loadStatsAtom` + `clearStatsAtom`; `clearFeedAtom` (cancels the feed and comments loaders and empties both); `resetPostsAtom` cancels every loader and empties every atom.
- **Writes** (write-only atoms returning `{ ok: true }` or `{ ok: false, failure }`, never throwing): `publishPostAtom({caption, media_url})`, `savePostAtom({id, caption, media_url})`, `deletePostAtom(id)`, `addCommentAtom({posts_id, content, parent_id})`, `saveCommentAtom({id, content})`, `deleteCommentAtom(id)`. Trim and turn an empty image link into `null` once, in the action (the page trims too, as in pattern 7). After the server answers: patch `feedAtom` only when its status is `ready` (publish puts the post on top and adds one to `total`; save replaces by id; delete removes by id and takes one off `total`, and closes the comment thread if it belongs to that post); for comments patch `commentsAtom` with the `lib/commentThread` functions only when it is `ready` and for the same post, then set that post's `comment_count` in `feedAtom` to the list length. A 404 on `savePost`/`deletePost`/`saveComment`/`deleteComment` still returns the failure but also removes the item locally, so the caller can say "already gone".
- A late answer (the atom is `idle`, another user) patches nothing and still returns its result.
- **The comment count is adjusted whenever the feed is `ready`, even when the thread is closed or another post's thread is open** (ADV-003): add one for a created comment, take off `1 + countReplies` for a deleted one, using the post id of the write; the thread list itself is patched only when it is `ready` for the same post.
- **Deleted ids are remembered for the visit** (`removedIds` in `feedAtom`, emptied by `clearFeedAtom` and `resetPostsAtom`): a load or a load more that was already running when a delete finished drops those ids from its answer, so a deleted post cannot come back as a ghost (ADV-003). `total` is adjusted by the same count.
- Writes are only offered while the feed is `ready` (the page hides the composer otherwise), so a publish never lands on a feed that cannot show it.
- Error mapping for the page, from the failure: a 400 on `addCommentAtom` with a `parent_id` is returned as a failure the panel turns into "That comment is gone. Your reply was not sent." (ADV-005); a 404 on the comments load is returned as a failure with status 404 so the page can remove the post from the feed (add `removePostLocallyAtom(id)`).
- `sessionActions.ts`: add `set(resetPostsAtom)` next to each of the three `set(resetAlumniAtom)` lines (53, 60, 175 at the time of writing). Grep for `resetAlumniAtom` after the edit and confirm every call site has its sibling (LESSON-REQ-fs-002-3).
- The student-versus-alumni decision is the page's, not the store's.

## Acceptance

- [ ] `npm run build` and `node scripts/frontend-style-check.mjs` exit 0 (no UI code imports `services/`; the store may).
- [ ] A throwaway check **outside the repo** (fake services, a plain jotai store; see G48, G50) shows: an old answer never replaces a newer one for feed, comments and recent posts; a cancelled call stores no error; `loadMoreFeed` after a delete asks for the aligned page and never shows an id twice; a late write answer after `resetPostsAtom` changes nothing; deleting a comment with replies leaves a count equal to the list length; a 404 on delete removes the item. Record the result in the task note.
- [ ] The same throwaway check shows: a comment written while another post's thread is open still changes the right post's count; a delete that finishes while a load more is running leaves no ghost.
- [ ] `grep -n resetAlumniAtom frontend/src/store/sessionActions.ts` and `grep -n resetPostsAtom ...` list the same number of call sites.

## Notes

Keep each atom's idle state with empty items, and a key (`authorId`, `kind`, `postId`) that a page can compare (pattern 23). The comments loader takes the post id as the key, so `commentsAtom.postId !== post.id` means "not this post's".

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-006-frontend-feed-and-dashboard/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-005-2-store-state-outlives-the-page]], [[knowledge/lessons/LESSON-REQ-fs-002-3-new-helper-convert-every-sibling]]
- Concepts: [[knowledge/concepts/latest-request-wins]]
