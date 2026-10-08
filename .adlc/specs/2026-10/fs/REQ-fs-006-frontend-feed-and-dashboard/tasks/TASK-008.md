# TASK-008 — `PeopleBlock`, `PostSummaryCard`, `RecentPostsBlock`, `CountsBlock`, `YourProfileBlock`

| Field | Value |
|---|---|
| REQ | REQ-fs-006 |
| Tier | 2 |
| Status | pending |
| Repo | alumni-details-system |
| Depends on | TASK-005, TASK-006 |
| Blocks | TASK-009, TASK-010, TASK-011, TASK-012 |

## Goal

The blocks the Dashboard, the Feed's side list and the profile share, each with its own loading, empty and error states (AC20 to AC25, AC27, AC28, AC34).

## Files to touch

| Path | Action |
|---|---|
| `frontend/src/components/alumni/PeopleBlock/PeopleBlock.tsx` + `.module.css` | create |
| `frontend/src/components/posts/PostSummaryCard/PostSummaryCard.tsx` + `.module.css` | create |
| `frontend/src/components/dashboard/RecentPostsBlock/RecentPostsBlock.tsx` + `.module.css` | create |
| `frontend/src/components/dashboard/CountsBlock/CountsBlock.tsx` + `.module.css` | create |
| `frontend/src/components/dashboard/YourProfileBlock/YourProfileBlock.tsx` + `.module.css` | create |

## Approach

- `PeopleBlock` props: `heading`, `state` (status, items, failure), `emptyText`, `errorHeading`, `onRetry`, `footerLink` (`{ label, to }`). Heading is an `h2`. Items: `Avatar sm`, the name as a `Link` to `alumniProfilePath(id)` (strong), a second line from `jobLine`/company (`presentText`, `displayName`). Skeleton rows while loading; `EmptyState` (h3) when empty; `ErrorState` (h3) with retry. Used by the Feed ("Open to mentoring") and the Dashboard ("New in the directory"); the page maps its `peopleAtom` into `state`, treating an `idle` state or another `kind` as loading.
- `PostSummaryCard` (`Card as="article"`): optional `PostByline` (sm) when `showAuthor`, else only the date; `PostText` clamped; a `Link` to the Feed with `commentCountText`. Used by `RecentPostsBlock` for both pages.
- `RecentPostsBlock` props: `heading`, `state`, `showAuthor`, `emptyHeading`/`emptyText`, `action?` (a node, e.g. the "Write a post" `ButtonLink`), `onRetry`. Skeleton cards, empty state with the next step, error state with retry. The page decides whether `action` exists (not for students).
- `CountsBlock`: reads the stats state as props; three `Card`s (alumni, mentoring, posts) with the number in the Display type step (no new type size unless it is added to "Added by later tasks" in `tokens.css` with a comment) and the design's link; a count of 0 still shows "0"; skeleton cards while loading; one `ErrorState` with retry replacing the three cards on a failure. The cards sit in the overlapping first row (the page frame does this for the first child).
- `YourProfileBlock` props: `role`, `state` (the `myAlumniAtom` shape), `userName`, `userPhoto`, `onRetry`. Student: a card with the "complete your account" prompt and a `ButtonLink` to My profile; **no profile state is read**. Alumni/admin: `loading` skeleton; `ready` avatar (md), name, `jobLine`, a secondary `ButtonLink` "Edit my profile"; `none` a prompt with a `ButtonLink` to create it; `error` an `ErrorState` with retry.
- All blocks: headings in order (page `h1`, block `h2`, state headings `h3`), words from `config/text.ts`, tokens only, wrap at 360px.

## Acceptance

- [ ] `npm run build`, `node scripts/frontend-style-check.mjs`, `npx tsx scripts/frontend-lib-check.ts` exit 0.
- [ ] Each block shows loading, empty, error and ready on the dev page (TASK-012) and a failing block does not hide another one.
- [ ] A student never triggers an alumni-profile request from `YourProfileBlock` (the page must not call the loader; verified in TASK-010).
- [ ] No second copy of a people row or of a post summary: the Dashboard and the profile import the same two components.

## Notes

A person with no `name` shows the existing "Name not given" words via `displayName`. A person with neither job title nor company shows no second line.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-006-frontend-feed-and-dashboard/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-002-3-new-helper-convert-every-sibling]], [[knowledge/lessons/LESSON-REQ-fs-005-2-store-state-outlives-the-page]]
