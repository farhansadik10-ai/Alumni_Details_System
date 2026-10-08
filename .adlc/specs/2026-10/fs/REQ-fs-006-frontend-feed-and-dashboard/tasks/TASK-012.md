# TASK-012 — Dev components page: the new components in every state

| Field | Value |
|---|---|
| REQ | REQ-fs-006 |
| Tier | 4 |
| Status | pending |
| Repo | alumni-details-system |
| Depends on | TASK-007, TASK-008 |
| Blocks | TASK-013 |

## Goal

Every new component can be seen in every state in one development-only place, in both themes (AC38, pattern 22).

## Files to touch

| Path | Action |
|---|---|
| `frontend/src/pages/dev/ComponentsPage/ComponentsPage.tsx` | edit: new sections |
| `frontend/src/pages/dev/ComponentsPage/ComponentsPage.module.css` | edit if needed |

## Approach

- Add sections, with fake data written in the page (no store, no network): `ButtonLink` (primary, secondary), `EmptyState` with a link action, `PostByline` (sm, md; with and without a date or a photo), `PostText` (long text, line breaks, an unbroken string, clamped), `PostForm` (empty, with errors, busy, edit), `CommentForm` (add, reply, edit, error), `FeedPost` (plain, with image, author, other user, admin, student, editing, delete dialog open), `CommentsPanel` pieces (loading, error, empty, a thread with replies), `PeopleBlock` (loading, empty, error, ready), `RecentPostsBlock` (loading, empty, error, ready, with and without author), `CountsBlock` (loading, error, ready, zero), `YourProfileBlock` (student, ready, none, loading, error).
- Where a component needs the store (comments panel), render its inner presentational parts with fixed props instead of wiring atoms.
- Keep the import of this page behind `import.meta.env.DEV` (unchanged), and check the production build does not contain it.

## Acceptance

- [ ] `npm run build`, `node scripts/frontend-style-check.mjs`, `npx tsx scripts/frontend-lib-check.ts` exit 0.
- [ ] `grep -rlF "Compare each section with" frontend/dist` prints nothing.
- [ ] Screenshots of the new sections at 1280 and 360 in light and dark are saved in `ui-evidence/` of this REQ folder, and each state is compared with `docs/design/screens/feed.html`, `dashboard.html`, `profile.html`.

## Notes

Take screenshots with a real browser pointed at the dev server and a mock API; never at the real backend (LESSON-REQ-fs-004-5).

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-006-frontend-feed-and-dashboard/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-004-5-find-out-what-listens-on-the-api-port]]
