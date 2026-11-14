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

- [x] `npm run build`, `node scripts/frontend-style-check.mjs`, `npx tsx scripts/frontend-lib-check.ts` exit 0.
- [ ] Mock API: each of the four blocks failing alone leaves the other three working; all four empty; a student sends **no** request to `/api/alumni/me` (check the mock's request log); alumni with and without a profile; admin; counts of 0 (AC21 to AC25).
- [ ] Greeting with a name, with a null name, after a profile change on My profile.
- [ ] Leave and return, and log in as another user: no old data shows.

## Notes

The student count from `GET /api/stats` is not shown (the design has three cards).

### Implementation notes (2026-10-08, task-implementer)

- **Checks:** `npm run build` exit 0; style check PASS (no findings); lib check 434 passed, 0 failed. Only the two named files changed; no word added to text.ts.
- **Mapping (pattern 23):** three small pure functions in the page turn each atom into its block's state: `idle` becomes loading for all three; recent posts with `authorId !== null` and people with `kind !== "newest"` also become loading (the profile page and the Feed share those atoms). `YourProfileBlock` gets `myAlumniAtom` as is.
- **One effect, keyed on `userId` and writer-or-not:** starts the four loads (`loadMyAlumniAtom` only for alumni/admin) and its cleanup calls the four clears. So leaving clears everything, and a user or role change while the page is open clears and reloads (a student never calls `/api/alumni/me`). With no session it does nothing.
- **Retries:** one `useCallback` per block, each reloading only its own atom.
- **Greeting:** `dashboardGreeting(firstName(profile.user?.name))`, read from `profileAtom` only when ready; PageLayout's Band keeps the same `<h1>`, only its text changes. The tab title follows the heading (PageLayout's `useDocumentTitle`).
- **Choices:** "Write a post" is `ButtonLink variant="primary"` (design draws it in the accent; every block's retry is secondary, so it stays the one primary). Empty recent posts: writer text vs reader text, with the "Open the feed" link for both. `PeopleBlock` gets no footer link (dashboard.html draws none). Column sizes: 480/320 minimum (design 300 for the aside, kept equal to My profile's 320), gap 32 x 48 (design 40 x 56, nearest steps).
- **Left for the review (needs a browser / mock API):** each of the four blocks failing alone; all four empty; student sends no request to `/api/alumni/me` (mock request log); alumni with and without a profile; admin; counts of 0; greeting with a name, a null name, and after a name change on My profile; leave and return, and log in as another user, with no old data; wrap at 360px and 200% zoom; Tab focus on the ButtonLink.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-006-frontend-feed-and-dashboard/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-005-2-store-state-outlives-the-page]]
