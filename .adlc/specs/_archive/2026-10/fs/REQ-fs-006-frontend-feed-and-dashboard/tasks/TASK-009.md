# TASK-009 — `FeedPage`

| Field | Value |
|---|---|
| REQ | REQ-fs-006 |
| Tier | 3 |
| Status | done (browser items left for review) |
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

- [x] `npm run build`, `node scripts/frontend-style-check.mjs`, `npx tsx scripts/frontend-lib-check.ts` exit 0; `BeingBuilt` is no longer used by this page.
- [ ] With the mock API: first load, empty, error plus retry, load more (including after a delete: no post twice, none skipped), publish, edit, delete, comments open/close, student view, admin view, a 403 and a 404 on a write, slow and out-of-order answers (AC1 to AC20). Evidence screenshots at 1280 and 360 in both themes go in `ui-evidence/` of this REQ folder.
- [ ] Leave the page and come back: no flash of the last visit's posts (AC35). Log out and in as another user: no old data.
- [ ] Real Tab key through the whole page: composer, posts, buttons, Load more, side list; each has a ring.

## Notes

The sub text of the old placeholder is replaced by the design's. The page file stays a default export (pattern 13).

### Implementation notes (2026-10-08, task-implementer)

- **Checks:** `npm run build` exit 0; style check PASS (182 files, every rule 0); lib check 434 passed, 0 failed. `grep -rn "HTTP_NOT_FOUND\|HTTP_FORBIDDEN" frontend/src/components frontend/src/store/postActions.ts frontend/src/pages` prints nothing. `BeingBuilt` is no longer imported by the page.
- **Extra scope (owner agreed):** `CommentsPanel.tsx` (thread 404 and add-comment 404) and `postActions.ts` (three call sites, the private `isNotFound` deleted) now use `isGone` from `lib/writeFailure.ts`. Same test (`kind === "http"` and status 404), same places; behaviour unchanged. This closes TASK-014's open grep item.
- **Layout:** the whole two-column row is the page frame's first child, so its top overlaps the band, as feed.html draws (the row, not only the composer, is pulled up). The first thing in the main column is always opaque: composer card, student note card, skeleton cards, or the error state. The hidden h2 and status line are `visuallyHidden` (absolute), so they take no room and no gap. Gaps: design 24 by 40, used `--space-5` by `--space-6` (32). Side basis 280 = `calc(var(--space-8) * 4.375)`.
- **Effect:** one effect keyed on `userId` loads the feed and `loadPeople("mentoring")` and clears both on close or user change (same shape as DashboardPage, CAND-024). No role key: the role changes no request here.
- **Publish failure:** `writeFailureText` with `{ forbidden: POST_WHO_CAN_POST, notFound: POST_GONE_TEXT, save: POST_SAVE_FAILURE_WORDS }`. `POST_GONE_TEXT` for 404 keeps exactly what `saveFailureText` would give; no status mapping of my own. On ok: toast, focus the caption, `reset: true`.
- **Focus:** `onDeleted` (also fired on save/delete 404s) and `onPostGone` raise a counter; an effect focuses the hidden "Posts" heading after the commit. `handlePostGone` is a stable `useCallback` because CommentsPanel's effect depends on it. Retry of the first load focuses the same heading (the error and its button go away). The empty state's "Write the first post" focuses the caption field.
- **Load more:** one `Button` that reads "Try again" after a failed load more, so focus stays on it across failure and retry (CAND-026). The failure shows as a `Message` (heading words + `loadFailureText`) above it; the posts held stay.
- **Status line:** `role="status"`, visually hidden: "Loading posts" while loading, "Showing N of M posts" when there are posts, empty otherwise (the empty and error states speak for themselves).
- **Copies made, flagged (not fixed, lib/ out of scope):** `isWriter` (alumni or admin) is now the fourth copy (DashboardPage, YourProfileBlock, MyProfilePage) and `MENTORING_DIRECTORY` the second (CountsBlock). Follow-up: one function each in `lib/` (CAND-027).
- **No word added to `config/text.ts`.**
- **Left for review (needs a browser, a mock API, a real Tab key; not started here):** acceptance items 2 to 4: first load, empty, error and retry, load more after a delete (no post twice, none skipped), publish, edit, delete, comments open and close, student and admin views, a 403 and a 404 on a write, slow and out-of-order answers; screenshots at 1280 and 360 in both themes into `ui-evidence/`; leave and return with no flash of old posts, log out and in as another user; real Tab through composer, posts, buttons, Load more and the side list with a ring on each. Also check by eye that the overlapped row looks right when the side list is taller than the composer.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-006-frontend-feed-and-dashboard/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-005-2-store-state-outlives-the-page]], [[knowledge/lessons/LESSON-REQ-fs-004-5-find-out-what-listens-on-the-api-port]], [[knowledge/lessons/LESSON-REQ-fs-004-4-check-focus-for-real]]
