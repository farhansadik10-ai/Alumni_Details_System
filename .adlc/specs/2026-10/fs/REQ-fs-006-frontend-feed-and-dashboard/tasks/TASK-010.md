# TASK-010 — `DashboardPage`

| Field | Value |
|---|---|
| REQ | REQ-fs-006 |
| Tier | 3 |
| Status | pending |
| Repo | alumni-details-system |
| Depends on | TASK-008 |
| Blocks | TASK-013 |

## Goal

Replace the "being built" Dashboard with four independent blocks (AC21 to AC25, AC35).

## Files to touch

| Path | Action |
|---|---|
| `frontend/src/pages/DashboardPage/DashboardPage.tsx` | replace |
| `frontend/src/pages/DashboardPage/DashboardPage.module.css` | create |

## Approach

- `PageLayout` heading from `dashboardGreeting(firstName(profile.user?.name))`; sub text from the design. The name comes from `profileAtom` (loaded by `AppShell`); while it is not known the heading is "Welcome back" and keeps the same element when the name arrives (focus is not lost).
- On mount start four loads in one effect: `loadStatsAtom`, `loadRecentPostsAtom({ authorId: null })`, `loadPeopleAtom("newest")`, and `loadMyAlumniAtom` **only when `session.role` is alumni or admin**. On close clear all of them (`clearStatsAtom`, `clearRecentPostsAtom`, `clearPeopleAtom`, `clearMyAlumniAtom`). Each block treats `idle` or a key that is not its own as loading.
- Layout as drawn: counts row (overlapping the band), then two columns: Recent posts (with the "Write a post" `ButtonLink` to the Feed **only for alumni and admin**) and an aside with Your profile and New in the directory. Columns wrap on a phone.
- Each block gets its own retry that reloads only that block.

## Acceptance

- [ ] `npm run build`, `node scripts/frontend-style-check.mjs`, `npx tsx scripts/frontend-lib-check.ts` exit 0.
- [ ] Mock API: each of the four blocks failing alone leaves the other three working; all four empty; a student sends **no** request to `/api/alumni/me` (check the mock's request log); alumni with and without a profile; admin; counts of 0 (AC21 to AC25).
- [ ] Greeting with a name, with a null name, after a profile change on My profile.
- [ ] Leave and return, and log in as another user: no old data shows.

## Notes

The student count from `GET /api/stats` is not shown (the design has three cards).

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-006-frontend-feed-and-dashboard/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-005-2-store-state-outlives-the-page]]
