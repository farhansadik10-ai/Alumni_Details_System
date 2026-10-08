# TASK-009 — `FeedPage`

| Field | Value |
|---|---|
| REQ | REQ-fs-006 |
| Tier | 3 |
| Status | pending |
| Repo | alumni-details-system |
| Depends on | TASK-007, TASK-008 |
| Blocks | TASK-013 |

## Goal

Replace the "being built" Feed with the real page (AC1 to AC9, AC15 to AC20, AC35).

## Files to touch

| Path | Action |
|---|---|
| `frontend/src/pages/FeedPage/FeedPage.tsx` | replace |
| `frontend/src/pages/FeedPage/FeedPage.module.css` | create |

## Approach

- `PageLayout` with the design's heading and sub text. Two columns as drawn (main `flex: 2 1`, side `flex: 1 1`, wrapping; on a phone the side list falls below the posts). The first child of the column overlaps the band: the composer for alumni and admin; for a student the one-sentence note (in a `Card`/`PageNote` style) so the overlap still holds.
- On mount: `loadFeedAtom` and `loadPeopleAtom("mentoring")`; on close: `clearFeedAtom` and `clearPeopleAtom` (cleanup of the effect). An `idle` feed state counts as loading. `StrictMode` runs the effect twice: the latest-request rule makes that harmless.
- Composer: `PostForm` with `publishPostAtom`; on ok: clear, toast, focus the caption field; on failure: words (403: who can post; others: `saveFailureText` with the post words).
- The composer (or the student note) is drawn only when the feed is `ready`; while it loads or has failed, the first card is a skeleton or the error state (ADV-003).
- List: a visually hidden `h2` "Posts" (`tabIndex={-1}`, a ref) **rendered outside the list-or-empty branch**, so it exists when the last post is deleted (ADV-004), and a visually hidden polite status line ("Showing N of M posts"); skeleton cards while loading; empty state (alumni/admin: write the first post, the action focuses the caption field; student: posts will appear here); `ErrorState` with retry on a failed first load (`loadFailureText`); `FeedPost` per item with `open={commentsAtom.postId === post.id}` and a toggle that calls `openCommentsAtom` / `closeCommentsAtom`; `onDeleted` raises a focus request (a counter in state) and an effect focuses the hidden heading after the commit; `onPostGone` removes the post (`removePostLocallyAtom`) and shows the "that post is gone" words.
- "Load more posts": a secondary `Button`, busy while `more === "loading"`, shown while `items.length < total`; on a failed load more, a `Message` with "Try again" under the list and the held posts stay.
- Side: `PeopleBlock` ("Open to mentoring") with the link "See all in the directory" to the directory with the mentoring filter on (build the address with the existing directory query helpers, `writeDirectoryQuery`, not by gluing text; pattern 24).
- No service import, no hard-coded text, no pixel number.

## Acceptance

- [ ] `npm run build`, `node scripts/frontend-style-check.mjs`, `npx tsx scripts/frontend-lib-check.ts` exit 0; `BeingBuilt` is no longer used by this page.
- [ ] With the mock API: first load, empty, error plus retry, load more (including after a delete: no post twice, none skipped), publish, edit, delete, comments open/close, student view, admin view, a 403 and a 404 on a write, slow and out-of-order answers (AC1 to AC20). Evidence screenshots at 1280 and 360 in both themes go in `ui-evidence/` of this REQ folder.
- [ ] Leave the page and come back: no flash of the last visit's posts (AC35). Log out and in as another user: no old data.
- [ ] Real Tab key through the whole page: composer, posts, buttons, Load more, side list; each has a ring.

## Notes

The sub text of the old placeholder is replaced by the design's. The page file stays a default export (pattern 13).

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-006-frontend-feed-and-dashboard/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-005-2-store-state-outlives-the-page]], [[knowledge/lessons/LESSON-REQ-fs-004-5-find-out-what-listens-on-the-api-port]], [[knowledge/lessons/LESSON-REQ-fs-004-4-check-focus-for-real]]
