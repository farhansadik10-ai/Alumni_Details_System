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

- [x] `npm run build`, `node scripts/frontend-style-check.mjs`, `npx tsx scripts/frontend-lib-check.ts` exit 0.
- [x] `grep -rlF "Compare each section with" frontend/dist` prints nothing.
- [ ] Screenshots of the new sections at 1280 and 360 in light and dark are saved in `ui-evidence/` of this REQ folder, and each state is compared with `docs/design/screens/feed.html`, `dashboard.html`, `profile.html`.

## Notes

Take screenshots with a real browser pointed at the dev server and a mock API; never at the real backend (LESSON-REQ-fs-004-5).

### Implementation notes (2026-10-08, task-implementer)

- **Checks:** `npm run build` exit 0 (`tsc -b` covers the page, `include: ["src"]`); style check PASS; lib check 434 passed, 0 failed; `grep -rlF "Compare each section with" frontend/dist` and `grep -rlF "Nothing was sent" frontend/dist` print nothing.
- **Not done here (needs a browser, by instruction):** acceptance item 3 (screenshots at 1280 and 360, light and dark, into `ui-evidence/`; comparison with feed.html, dashboard.html, profile.html). Also left for the review: real Tab through the new sections (focus rings on ButtonLink, block links, post and comment buttons), 200% zoom, and pressing the form samples.
- **Sections added** (after "Messages and states", each a small function in the same file): Button links (+ EmptyState with a link), Post byline and text, Post and comment forms, Feed posts, Comments, People lists, Recent posts, Counts, Your profile. The subtitle now also names feed.html, dashboard.html, profile.html (the grep string is kept).
- **No request can start (the owner's rule).** `NoRequests` is a `display: contents` div with `onClickCapture`, `onAuxClickCapture`, `onSubmitCapture` that call `preventDefault` + `stopPropagation`. React stops the dispatch in the capture phase, so no press reaches FeedPost, CommentItem, or any block link/retry; Enter and Space on a button fire `click`, so the keyboard is stopped too. Focus is not touched. It wraps: every FeedPost, the CommentItems, the comments error state, the ButtonLink/EmptyState-link samples, and all four dashboard sections. Not wrapped: PostForm and CommentForm samples, whose `onSubmit` is a function on this page (toast "Nothing was sent..." or a fixed failure text or a 4-second wait); and the delete-dialog openers.
- **Drawn from parts, not live (surfaced):** FeedPost's editing state and its delete dialog live in its own `useState`, so they cannot be set from props: editing = Card + PostByline + PostForm (POST_EDIT_LABEL, secondary Save) + the footer button; the dialog = a page-local ConfirmDialog with FeedPost's words (`POST_DELETE_TITLE`, `postDeleteBody(4)`, and a variant with `POST_CHANGE_FORBIDDEN_TEXT` inside). FeedPost's own `post` layout class is not used, so the gaps come from the page's `cardBody` (same `--space-3`).
- **CommentsPanel** reads `commentsAtom`, so it is not rendered; its loading (same skeleton), error, empty + form, and a thread (built with `buildThreads`/`countReplies`, replies as CommentItem `children`) are drawn from parts. The panel's ground and list rules are copied into `ComponentsPage.module.css` (`.commentPanel`, `.threads`, `.replies`, `.reply`, plus the phone indent), with a comment to change both together. CommentItem is live (its `editing` is a prop), seen by Nadia (userId 1): Edit/Delete on her own reply only.
- **FeedPost viewers:** another alumnus (no buttons), with an image (favicon.svg on this origin), the author (Edit + Delete), an admin (Delete only), a student, no session, and a post with no name, no date, an unbroken string and a failing image link (hidden by onError). `open` is always false: an open post renders the live CommentsPanel.
- **Blocks:** PeopleBlock plain and card in loading, empty, error, ready; RecentPostsBlock ready with author (+ "Write a post" action) and without (profile words), plus loading, empty with `emptyAction`, error; CountsBlock ready, all-zero, loading, error; YourProfileBlock student, ready, none, loading, error.
- **Known look:** the block samples carry their own h2 under the section h2, so the dev page's heading outline repeats levels (the existing ProfileBand samples already do this with h1).
- No word added to `config/text.ts`; dev-only captions are written inline, as the page already does. No other file touched.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-006-frontend-feed-and-dashboard/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-004-5-find-out-what-listens-on-the-api-port]]
