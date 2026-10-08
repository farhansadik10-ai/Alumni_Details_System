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

- [ ] `npm run build`, `node scripts/frontend-style-check.mjs`, `npx tsx scripts/frontend-lib-check.ts` exit 0.
- [ ] Mock API: a person with posts, with none, with a failing posts call (profile unaffected), no `user_id`; going from one profile to another through the directory never shows the first person's posts (AC28).
- [ ] The request is `GET /api/posts?user_id=<id>&limit=3`.

## Notes

The directory-return state (pattern 27) and the profile band are untouched.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-006-frontend-feed-and-dashboard/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-005-2-store-state-outlives-the-page]]
