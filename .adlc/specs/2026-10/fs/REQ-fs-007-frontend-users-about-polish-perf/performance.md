# REQ-fs-007 — Performance (AC23 to AC27)

| Field | Value |
|---|---|
| REQ | REQ-fs-007 |
| Written by | TASK-013 (task-implementer), 2026-10-09 |
| Method | Builds and headless Chrome from the session scratchpad (mock API 127.0.0.1:4317, Vite 5317, preview 5318, Chrome 9317); port 3000 never used |
| Sizes | `gzip -c <file> \| wc -c`, as in `build-size.md`. The full After table is TASK-014's. |

## Summary

| Area | Result | Changed |
|---|---|---|
| Entry script (AC23) | No page file in it. Three page stores sit in it on purpose (log-out reset). Nothing moved. | nothing |
| Font (AC24) | One `rel="preload"` for the Latin file, `crossorigin`, the same file the CSS asks for; one request; no console warning | `frontend/vite.config.ts` |
| Images (AC25) | Both `<img>` have `width`, `height`, `decoding="async"`, `loading="lazy"`; post pictures sit in a fixed 4:3 box | `Avatar.tsx`, `FeedPost.tsx`, `FeedPost.module.css` |
| Re-renders (AC26) | `memo` on `FeedPost`, `AlumniCard`, `UserNameCell`; not on `CommentItem` or `UserActionsCell` (reasons below) | those 3 + `FeedPage.tsx` |
| Motion (AC27) | Nothing animates; `base.css` turns any animation off under `prefers-reduced-motion` | nothing |

## Entry script (AC23)

How: a scratch build with a plugin that lists the modules of each chunk (Rollup's rendered length, before minifying).

- **No page in the entry.** All 11 pages and the dev page are `React.lazy` (`App.tsx`, `RequireAdmin.tsx`); none of `src/pages/` is in the entry chunk. About and Users are their own files (`AboutPage-*.js`, `UsersPage-*.js`).
- **Page-only modules that are in the entry, and why:**

| Module | Bytes (before minify) | Pages that use it | Pulled in by |
|---|---:|---|---|
| `store/postAtoms.ts` | 8,723 | Feed, Dashboard, profiles | `sessionActions.ts` (reset on log out / user change) |
| `store/alumniAtoms.ts` | 4,791 | Directory, Dashboard, profiles | `sessionActions.ts` (same) |
| `store/usersAtoms.ts` | 1,667 | Users only | `sessionActions.ts` (same) |
| `lib/feedPaging.ts`, 4 services | 729 + 2,174 | through the stores | the stores |
| `lib/validation.ts` | 3,369 | every form page | `Avatar.tsx` (`isWebLink`) in the header: shell, not page-only |
| `config/text.ts` | 16,330 | all | the shell; one words file by convention |

- **Decision: nothing moved.** The three stores are imported by `sessionActions.ts` so a log out or a change of user resets them (the three reset places, architecture item 3). Taking them out is a design change (a reset list, or a lazy reset), not a safe import change, and the task says not to invent a split.
- **What it would save, measured:** a what-if scratch build with those three imports stubbed out: entry 291,986 → 283,438 raw, 99,270 → 96,808 gzip (−2,462 gzip, 2.5%). The bytes would move into page files, not go away. Listed for a later REQ, not done.
- **This task's own effect on the entry** (same scratch method before and after): 291,945 → 291,986 raw, 99,227 → 99,270 gzip (+43 gzip: the Avatar attributes). Real `npm run build` now: `index-*.js` 292,023 raw, 99,291 gzip.

## Font (AC24)

- `fontPreload()` in `frontend/vite.config.ts`: in a build it finds the bundle key whose file name contains `hanken-grotesk-latin-wght-normal` and ends in `.woff2`, and adds one `<link rel="preload" as="font" type="font/woff2" crossorigin href="/assets/…">` to the head. No match: the build stops with an error. In dev (no bundle) it adds nothing.
- Built `frontend/dist/index.html`: exactly one font preload, `href="/assets/hanken-grotesk-latin-wght-normal-CaVRRdDk.woff2"`, with `crossorigin`. The built CSS asks for `url(/assets/hanken-grotesk-latin-wght-normal-CaVRRdDk.woff2)`: the same file. latin-ext and vietnamese are not preloaded. The fourth subset, cyrillic-ext, is under Vite's 4 KB limit and is written into the CSS as data, so it is no file at all (one reason the plugin matches the name, not a count of files).
- Built CSS: every `@font-face` has `font-display:swap` and a `unicode-range`, so the other subsets load only when a text needs them. The token font stack keeps its fallbacks.
- Plugin alone (scratch `tsx` script, fake bundles): dev adds nothing; the Latin file is picked from four subsets; no Latin file → throws; a `.woff` does not count. 4 of 4 pass.
- Browser, built app (`vite preview`): on Log in, Feed and Users, one request for the Latin file (by the preload, priority High), no second request from the CSS, the face reports "loaded", and the console shows no "preloaded but not used" warning after 4.5 s. The one console line on the Feed is the mock's broken image link.
- `index.html`: 1,336 → 1,467 raw, 672 → 734 gzip (+62 gzip, the link).

## Images (AC25)

- `Avatar`: `width`, `height` (1 and 1: they give only the square shape; the stylesheet's `width/height: 100%` of the token box wins), `loading="lazy"`, `decoding="async"`. The header avatar keeps `lazy` too: the spec allows leaving it off at the top, it does not require it, and a prop for one small box was not worth it. Its box size never depends on the photo, so it cannot move the page.
- `FeedPost`: `width` 4, `height` 3, `loading="lazy"`, `decoding="async"`; CSS `aspect-ratio: 4 / 3` (no `auto`), `width: 100%`, `max-height` and `object-fit: contain` kept. **`height: auto` is kept, not removed** as the task file said: with the height attribute present and no CSS height, the attribute would set the height (3px).
- Measured (built app, mock pictures sent 2 s late, `PerformanceObserver` for layout shifts, post positions before and after):

| Picture | 1280 | 360 |
|---|---|---|
| Wide (1600x400) | box 659x494 before and after; nothing moved; shift 0 | 278x209; nothing moved; shift 0 |
| Tall (300x1200) | same box, letterboxed; shift 0 | same; shift 0 |
| Link that fails late (404 after 2 s), in view | box removed on error: posts below move up 506px, shift 0.17 | 220px, shift 0.20 |

- **Open point for the gate:** a broken link still moves the page once, because `onError` hides the picture (REQ-fs-006: "a broken link leaves no empty box"). Before this task the unloaded picture had no height, so it hardly moved; now the reserved box is taken away. Option A (as built): keep hiding it. Option B: keep the empty 4:3 box on failure; no move, but an empty grey box in the post. A link that fails at once (unknown host) is removed before or near the first paint.
- No sideways scroll on the Feed with both pictures loaded: 360, 390 and 200% zoom, both themes, 6 of 6.

## Re-renders (AC26)

How: a counter injected by a scratch Vite plugin at serve time (`vite.count.mjs`): an effect with no dependency list, added to each counted component, adds one per commit in which that row drew. Nothing was written to `frontend/`; `grep -rn "__rc\|__t013" frontend/` finds nothing and `git diff` holds no counter. Dev build with StrictMode, 1280 wide; counts are the draws of the rows that did **not** change.

| Action | Rows counted | Before | After |
|---|---|---:|---:|
| Feed: open the thread of post 1 | 11 other posts | 22 | 0 |
| Feed: "Load more posts" | 12 posts already shown | 24 | 0 |
| Feed: close the thread | 19 other posts | 19 | 0 |
| Feed: type 4 letters in the composer | all posts | 0 | 0 |
| Directory: type 4 letters in the search (before it runs) | 12 cards shown | 48 | 0 |
| Users: type 4 letters in the search | 12 name cells | 48 | 0 |
| Users: open the delete dialog of one row | 12 name cells | 12 | 0 |
| Users: Escape closes it | 12 name cells | 12 | 0 |
| Users: the same three actions | 12 actions cells (not memoized) | 48 / 12 / 12 | 48 / 12 / 12 |
| Comments: Edit on one comment, then Cancel | 3 other comments (not memoized) | 3 / 3 | 3 / 3 |
| Comments: type 4 letters in the comment field | all comments | 0 | 0 |

What changed:
- **`FeedPost`**: `memo`. `FeedPage.handleToggleComments` is now a `useCallback` that reads the open post from the store (`store.get(commentsAtom)`) at the press, so it no longer changes when a thread opens. The other handlers were already stable; posts keep their object when "Load more" merges (`mergePosts`).
- **`AlumniCard`**: `memo`. Its props are the alumni object and the committed query string; typing changes neither.
- **`UserNameCell`**: `memo`. Its props are plain values.

Not changed, and why:
- **Users table / `UserActionsCell`**: `Table` is not memoized and calls each column's `render` inline on every draw, so every `<tr>`/`<td>` is rebuilt; `memo` can only skip a cell component whose props are plain. The actions cell gets a new `() => onDelete(user)` each draw, and is one `Button`; making it skip needs a new prop shape (`user` + `onDelete(user)`), also on the dev page. Not worth it.
- **`CommentItem`**: one extra draw per other comment per action (the task's bar is "above one"). `memo` would also need four `useCallback`s and a new `onEndEdit(id)` shape, and would still not skip a comment that has replies: its replies come in as `children`, new JSX on every draw. A thread is one post's comments, loaded at once.
- Checked after the change: opening post 2's thread closes post 1's; adding a comment updates that post's count; a saved edit shows; a deleted post leaves (8 of 8, both themes).

## Motion (AC27)

`styles/base.css` lines 53 to 61: under `prefers-reduced-motion: reduce`, every element and pseudo-element gets `transition: none`, `animation: none`, `scroll-behavior: auto`. The Skeleton (`Skeleton.module.css`: "No animation, on purpose"), the toast (`ToastViewport.module.css`: no enter or leave animation) and the dialog (`Dialog.module.css`: no transition, `::backdrop` colour only) have no animation of their own; no stylesheet in `src/` has an `animation`, `transition` or `@keyframes`. Nothing to change.

## Related

- REQ: REQ-fs-007; sizes before: `build-size.md`; phone re-run: `phone-audit.md`
- Architecture: [[specs/2026-10/fs/REQ-fs-007-frontend-users-about-polish-perf/architecture]]
