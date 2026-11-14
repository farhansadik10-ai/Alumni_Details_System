# TASK-011 — Alumni profile: "Recent posts"

| Field | Value |
|---|---|
| REQ | REQ-fs-006 |
| Tier | 3 |
| Status | pending |
| Repo | alumni-details-system |
| Depends on | TASK-001, TASK-008 |
| Blocks | TASK-013 |

## Goal

The profile page shows that person's 3 newest posts below the About block, as `profile.html` draws it (AC27, AC28).

## Files to touch

| Path | Action |
|---|---|
| `frontend/src/pages/AlumniProfilePage/AlumniProfilePage.tsx` | edit |
| `frontend/src/pages/AlumniProfilePage/AlumniProfilePage.module.css` | edit only if the block needs a layout rule |

## Approach

- When the viewed profile is `ready` and `alumni.user_id` is a number, start `loadRecentPostsAtom({ authorId: alumni.user_id })` in an effect keyed on that id; clean up with `clearRecentPostsAtom`. A profile with no `user_id` shows the empty state and sends no request.
- Render `RecentPostsBlock` (heading "Recent posts", `showAuthor={false}`, empty text "has not posted yet", no action) in the same column as About, after it. It loads on its own: its failure, loading and empty states never change the rest of the profile, and the block is not drawn while the profile itself is loading, not found or failed.
- The state is keyed by `authorId`; the page treats another `authorId` or `idle` as loading, so the previous person's posts never show for a frame on the next profile (AC28).
- Update the page's header comment: the block that part 2 left out is now here.

## Acceptance

- [x] `npm run build`, `node scripts/frontend-style-check.mjs`, `npx tsx scripts/frontend-lib-check.ts` exit 0.
- [ ] Mock API: a person with posts, with none, with a failing posts call (profile unaffected), no `user_id`; going from one profile to another through the directory never shows the first person's posts (AC28).
- [ ] The request is `GET /api/posts?user_id=<id>&limit=3`.

## Notes

The directory-return state (pattern 27) and the profile band are untouched.

### Implementation notes (2026-10-08, task-implementer)

- **Shape:** a local `ProfileRecentPosts` component inside `ProfileContent`, after the About card, in a new `.mainColumn` wrapper (flex column, gap `--space-6` = 32px; the design draws 40px, which is not on the scale). Details stays the narrow column. On a phone the order is About, Recent posts, Details.
- **Loading rule:** `ProfileContent` is drawn only when the profile is `ready`, so the block never shows while the profile loads, is not found or failed. Its effect, keyed on `alumni.user_id`, calls `loadRecentPostsAtom({ authorId })` and cleans up with `clearRecentPostsAtom`. Going from A to B: the page goes to loading (viewed.id differs), the block unmounts and clears A's posts, then mounts for B. The block state is "loading" when the atom is idle/loading or its `authorId` is not this person's (it may hold the Dashboard's `null`).
- **No user_id:** a fixed `{ status: "ready", items: [] }`, no request; the empty heading is `profilePostsEmptyHeading(firstName(name))` ("Nadia has not posted yet" / "No posts yet"), text `PROFILE_POSTS_EMPTY_TEXT`, no `emptyAction`.
- **Request:** the loader sends `page: 1, limit: 3, user_id` (TASK-005); the order of query keys depends on axios, so the review should check `user_id=<id>&limit=3` is present, not the order.
- No word added to text.ts. `PROFILE_POSTS_LOADING` is unused (TASK-008 note: SkeletonGroup takes no label).
- **Checks:** style check PASS; lib check 434 passed, 0 failed; `npm run build` exit 0 (the first run failed only on TASK-010's then-missing `DashboardPage.module.css`; tsc passed).
- **Left for review (mock API / browser):** person with posts, with none, failing posts call (profile unaffected, retry works), no user_id; directory A -> back -> B never shows A's posts (AC28); the request's query; layout at 360px and 200% zoom.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-006-frontend-feed-and-dashboard/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-005-2-store-state-outlives-the-page]]
