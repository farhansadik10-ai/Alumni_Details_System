# TASK-008 — `PeopleBlock`, `PostSummaryCard`, `RecentPostsBlock`, `CountsBlock`, `YourProfileBlock`

| Field | Value |
|---|---|
| REQ | REQ-fs-006 |
| Tier | 2 |
| Status | done |
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

- [x] `npm run build`, `node scripts/frontend-style-check.mjs`, `npx tsx scripts/frontend-lib-check.ts` exit 0.
- [ ] Each block shows loading, empty, error and ready on the dev page (TASK-012) and a failing block does not hide another one.
- [ ] A student never triggers an alumni-profile request from `YourProfileBlock` (the page must not call the loader; verified in TASK-010).
- [ ] No second copy of a people row or of a post summary: the Dashboard and the profile import the same two components.

## Notes

A person with no `name` shows the existing "Name not given" words via `displayName`. A person with neither job title nor company shows no second line.

### Implementation notes (2026-10-08, task-implementer)

- **Blocks take props only; none reads an atom.** Each block exports its own state type with status `loading | ready | error` (`PeopleBlockState`, `RecentPostsBlockState`, `CountsBlockState`). The page maps the atom: `idle`, or another `kind` / `authorId`, becomes `"loading"` (pattern 23). `YourProfileBlock` takes `MyAlumniState` as is (idle draws the skeleton).
- **Additions beyond the Approach, each small:** `PeopleBlock` takes `emptyHeading` (the PEOPLE_*_EMPTY_HEADING words exist) and `variant: "plain" | "card"`: dashboard.html draws a ruled list under a 24px h2, feed.html draws it inside a card with an 18px h2. Feed page passes `variant="card"`. `RecentPostsBlock` takes `emptyAction?: { label, to }` for the empty state's next step (DASHBOARD_RECENT_EMPTY_LINK "Open the feed"; leave it out on the profile).
- **Links:** the mentoring count card goes to the directory with the mentoring filter on, built with `writeDirectoryQuery` (no address typed by hand). The summary card's count link goes to `PATHS.feed`. `PeopleBlock.footerLink.to` is a router `To`, so the Feed can pass the same mentoring address.
- **PostSummaryCard** is named by its byline (`aria-labelledby` on a wrapper of `PostByline`), or by its date when `showAuthor` is off; with neither it has no name rather than a dangling id.
- **YourProfileBlock:** any role other than alumni/admin (student, or an unknown `null` role) gets the "Complete your account" prompt and `state` is never read. Ready uses the profile's name/photo, falling back to `userName`/`userPhoto`. The "none" and student prompts are drawn in a `Card` with h3 + text + `ButtonLink`, not `EmptyState` (EmptyState has its own dashed border, which would double inside the card).
- **Sizes:** count number is `--text-display` (44, design 52) and the profile avatar `md` (44, design 56), as the architecture says. No token added. CountsBlock's grid minimum is `calc(var(--space-8) * 4)` = 256px (design 260px).
- **Retry buttons are secondary** in every block, so a dashboard with several failed blocks still has one primary action.
- **Unused words:** `PEOPLE_LOADING`, `DASHBOARD_COUNTS_LOADING`, `DASHBOARD_RECENT_LOADING`, `DASHBOARD_PROFILE_LOADING`, `PROFILE_POSTS_LOADING` are not used: `SkeletonGroup` reads out the one `LOADING_TEXT` and takes no label, and the block's h2 already names it (architecture "Live regions"). Review may drop them from text.ts or give `SkeletonGroup` a label (not this task's file). No word added to text.ts.
- **Checks:** style check PASS, lib check 420 passed. Build: first two runs failed only in TASK-007's `FeedPost.tsx` (its `CommentsPanel` not written yet; `tsc -b` showed no error in this task's files); after that file appeared, `npm run build` exit 0.
- **Left for the review (needs a browser / mock):** each block in loading, empty, error, ready on the dev page (TASK-012); one failing block does not hide another; a student triggers no alumni-profile request (TASK-010's page owns the loader call); focus ring on the ButtonLinks and links by real Tab; wrap at 360px and 200% zoom.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-006-frontend-feed-and-dashboard/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-002-3-new-helper-convert-every-sibling]], [[knowledge/lessons/LESSON-REQ-fs-005-2-store-state-outlives-the-page]]
