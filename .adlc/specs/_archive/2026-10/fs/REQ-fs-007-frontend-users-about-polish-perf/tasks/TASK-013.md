# TASK-013 — Performance

| Field | Value |
|---|---|
| REQ | REQ-fs-007 |
| Tier | 5 |
| Status | done (one open point for the gate: a broken picture link) |
| Repo | alumni-details-system |
| Depends on | TASK-012 |
| Blocks | TASK-014 |

## Goal

The entry script holds only what every page needs, the one Latin font file is preloaded, images carry size hints, and list rows do not draw again for no reason (spec AC23 to AC27).

## Files to touch

| Path | Action |
|---|---|
| `frontend/vite.config.ts` | edit: a small plugin, `fontPreload`, with `transformIndexHtml` using `ctx.bundle` |
| `frontend/src/components/ui/Avatar/Avatar.tsx` + css | edit: `width`, `height`, `decoding="async"` |
| `frontend/src/components/posts/FeedPost/FeedPost.tsx` + css | edit: image `width`, `height` (4:3 hint), `decoding="async"`, `aspect-ratio: auto 4 / 3` |
| `frontend/src/components/posts/FeedPost/FeedPost.tsx`, `.../CommentItem/CommentItem.tsx`, `.../AlumniCard/AlumniCard.tsx`, the Users cells | edit: `memo`, and `useCallback` for the handlers they receive, only where the render counter shows a saving |
| `frontend/src/App.tsx`, `frontend/src/components/shell/**` | edit only if the entry script pulls in a page-only module |
| `.adlc/specs/2026-10/fs/REQ-fs-007-frontend-users-about-polish-perf/performance.md` | create: what was measured and changed, with sizes |

## Approach

- Entry script: read `frontend/dist/index.html` and the entry file's imports; list every module in it that only one page uses (a store, a validator, a page-only component) and move the import into the page. Record the size effect.
- Font: the plugin looks through the keys of `ctx.bundle` (they start with `assets/`) for a file name that contains `hanken-grotesk-latin-wght-normal` and ends in `.woff2`. In a production build, if none is found it throws, so the preload cannot silently go missing after a package update. It returns `[{ tag: "link", attrs: { rel: "preload", as: "font", type: "font/woff2", crossorigin: "", href: "/" + fileName }, injectTo: "head" }]`. In dev (`ctx.bundle` is undefined) it returns nothing. Do not preload the latin-ext, vietnamese or cyrillic files. `font-display: swap` is already in the package's CSS (verify in the built CSS).
- Images: `Avatar` keeps its fixed token-sized box and gets a square `width`/`height` hint. `FeedPost`'s picture gets a **fixed 4:3 box** (`aspect-ratio: 4 / 3`, `width: 100%`, `height: auto` removed, `max-height` kept, `object-fit: contain` and the `--sunken` background it already has), so the page cannot jump when a picture of any shape arrives; a picture of another shape is letterboxed. Keep `loading="lazy"`, add `decoding="async"` and 4:3 `width`/`height` attributes.
- Re-renders: with a temporary render counter in a headless run (not committed), count how many times a `FeedPost`, a `CommentItem`, an `AlumniCard` and a Users row draw when a sibling changes. Add `memo` only where that count is above one for a sibling change, and record before and after in `performance.md`. Stable props first (`useCallback`/`useMemo`), then `memo`.
- Motion: confirm by reading `base.css` and the Skeleton, Toast and Dialog CSS that animation stops under `prefers-reduced-motion`; change nothing if it does.

## Acceptance

- [x] The built `frontend/dist/index.html` has exactly one `rel="preload"` for a font, with `crossorigin`, and the file it names is the one the page requests; the browser console shows no "preloaded but not used" warning.
- [x] Every `<img>` has `width`, `height`, `decoding="async"` and (where not at the top) `loading="lazy"`.
- [x] `performance.md` lists each `memo` with its before and after render counts, and the entry script change with its bytes.
- [x] `npm run build`, the style check and the library check exit 0.
- [x] The browser scenarios of TASK-012 are run again on every screen this task touched: no sideways scroll at 360px, 390px and 200% zoom; the Directory scenarios of TASK-007; the unchanged-edit scenarios of TASK-011; Users search, role, page and delete with Escape. `phone-audit.md` records the re-run, and the screenshots of the Feed and the Users page are refreshed.
- [ ] A post picture that is wide, tall and broken (a link that fails) does not move the page when it loads. Wide and tall: met (shift 0). Broken: not met; the open point in Notes.

## Notes

Written by: task-implementer (tier: deep), 2026-10-09. Full numbers in `performance.md`.

- **Entry script:** no page in it. `postAtoms`, `alumniAtoms`, `usersAtoms` (and their services) are in it because `sessionActions.ts` resets them on log out; moving them is a design change, not an import move, so nothing moved. A what-if scratch build without those imports: −2,462 gzip on the entry (bytes move to pages). `validation.ts` is there through `Avatar` (`isWebLink`), shell code.
- **Font:** `fontPreload()` in `vite.config.ts`; one preload, `crossorigin`, same file as the CSS `url()`; one request in Chrome, no unused-preload warning. Checked alone with fake bundles (throws with no Latin file). cyrillic-ext is inlined as data by Vite (under 4 KB).
- **Images:** deviation: `height: auto` kept in `.image`. Without it the `height="3"` attribute sets the height (the attribute is a presentational hint that only a CSS height overrides). `aspect-ratio: 4 / 3` with no `auto` gives the fixed box.
- **Open point (AC25 "broken"):** a link that fails after the box is drawn is still hidden by `onError` (REQ-fs-006 rule "no empty box"), so the page moves up once (shift 0.17 to 0.20 in view). Wide and tall: shift 0. Choice for the owner: keep (A, built) or keep an empty 4:3 box on failure (B).
- **Render counter:** injected only by a scratch Vite plugin at serve time (`t013/vite.count.mjs`); never in `frontend/`. `grep -rn "__rc\|__t013" frontend/` finds nothing.
- **memo:** `FeedPost` (+ stable `handleToggleComments` reading `store.get(commentsAtom)`), `AlumniCard`, `UserNameCell`. Not `CommentItem` (one draw per sibling; `children` JSX defeats memo) nor `UserActionsCell` (inline closure from `Table` render; one Button).
- **Motion:** nothing animates; `base.css` stops all motion under reduced motion. No change.
- **Re-run:** all browser scenarios pass; see `phone-audit.md`, "Re-run after TASK-013".

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-007-frontend-users-about-polish-perf/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-006-3-patched-list-total-needs-a-log-of-local-changes|L-REQ-fs-006-3]], [[knowledge/gotchas#^g50|G50]]
