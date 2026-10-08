# REQ-fs-007 — lesson candidates

## CAND-001 [implement-task]
**Claim:** Measure build size before/after with one fixed command (`gzip -c`, default level), never mix in Vite's printed gzip kB.
**Saw it in:** `.adlc/specs/2026-10/fs/REQ-fs-007-frontend-users-about-polish-perf/build-size.md:13`
**Context:** Vite's gzip figure for the entry script (98.14 kB) differs from `gzip -c` (98,078 B) and from `gzip -9` (97,819 B); mixing them fakes a change.

## CAND-002 [implement-task]
**Claim:** For a fail-proof copy of the lib check outside the repo, rewrite its `../frontend/` imports to absolute paths with sed and flip expectations in the same pass.
**Saw it in:** `scripts/frontend-lib-check.ts:15`
**Context:** G-gotcha says the copy must live outside the repo, but its relative imports then break; `sed 's#"\.\./frontend/#"C:/.../frontend/#'` makes it run from the scratchpad.

## CAND-003 [implement-task]
**Claim:** A words object in config/text.ts can match a lib/ interface by shape alone; build it there without importing the type.
**Saw it in:** `frontend/src/config/text.ts` (`userDeleteFailureWords`, `POST_SAVE_FAILURE_WORDS`)
**Context:** G58 bars new imports in text.ts, so the type check happens where the caller passes the object to the lib function.

## CAND-004 [implement-task]
**Claim:** The Write tool saves LF; on this CRLF work tree convert a fully rewritten file back with `sed -i 's/\r\?$/\r/'` and confirm with `file`.
**Saw it in:** `frontend/src/components/ui/Tag/RoleTag.tsx:1`
**Context:** Edit keeps CRLF, Write does not (G54 covers scripted rewrites, not the Write tool).

## CAND-005 [implement-task]
**Claim:** Before carrying an old `verification.md` item forward, re-read the code and the wrap-up line in `hot.md`; several were fixed or half-fixed since.
**Saw it in:** `.adlc/specs/_archive/2026-10/fs/REQ-fs-004-frontend-foundation-shell-auth/verification.md:35` (n3: the MyProfilePage half is fixed, the layout.ts half is not)
**Context:** Archived verification files freeze at the verify gate; wrap-up fixes are not marked back in them.

## CAND-006 [implement-task]
**Claim:** To prove a lib-check case can fail from outside the repo, rewrite the `../frontend/` imports to absolute paths in the copy.
**Saw it in:** `scripts/frontend-lib-check.ts:15`
**Context:** The script imports lib/ by relative path, so a plain copy in the scratchpad cannot resolve them; a sed on the import prefix is enough.

## CAND-007 [implement-task]
**Claim:** Build every mailto link with `mailtoHref`, even from the `CONTACT_EMAIL` constant; the log-in page still writes `mailto:${CONTACT_EMAIL}` by hand.
**Saw it in:** `frontend/src/pages/LoginPage/LoginPage.tsx:207`, `frontend/src/pages/AboutPage/AboutPage.tsx:29`
**Context:** The About page uses mailtoHref, so a non-plain address set by the owner shows as text; LoginPage would make a broken or header-carrying link.

## CAND-008 [implement-task]
**Claim:** When moving effects from a page into a hook, check effect order: the hook's effects now run before every effect the page declares.
**Saw it in:** `frontend/src/hooks/useListAddress.ts:206` (past-the-end effect vs the page's load effect)
**Context:** Safe here only because the load effect runs on a queryKey change, when `current` is null and the clamp is idle.

## CAND-009 [implement-task]
**Claim:** A shared list hook should return the matched list (`current`), not just flags, typed generic over the page's state.
**Saw it in:** `frontend/src/hooks/useListAddress.ts:197`
**Context:** Without it each page repeats `list.queryKey === queryKey` to draw items and failure, the copy ADV-003 set out to avoid.

## CAND-010 [implement-task]
**Claim:** Check a words object in config/text.ts against its lib/ words type with a scratchpad `tsc --strict` file; neither the build nor tsx catches a mismatch until a component joins them.
**Saw it in:** `frontend/src/config/text.ts:505`, `frontend/src/lib/writeFailure.ts:35`
**Context:** TASK-004 and TASK-005 wrote the two halves in parallel; tsx strips types, so the lib check alone cannot prove the shapes agree.

## CAND-011 [implement-task]
**Claim:** Load a store harness with `--import <repo>/node_modules/tsx/dist/loader.mjs`, not `tsx/dist/esm/index.mjs`; the ESM-only entry leaves the store's CommonJS `require` of `../services/x` unresolved.
**Saw it in:** scratchpad `userscheck/` run of `frontend/src/store/usersAtoms.ts:3`
**Context:** The repo has no `"type": "module"` (G56), so tsx turns store files into CommonJS; only the full loader hooks both.

## CAND-012 [implement-task]
**Claim:** A fail-proof copy of a store file outside the repo must also point `jotai` at `<repo>/node_modules/jotai`, not just rewrite the relative imports.
**Saw it in:** scratchpad `userscheck/broken/usersAtoms.ts:1`
**Context:** From the scratchpad `require("jotai")` finds nothing; the real store resolves it from the repo root.

## CAND-013 [implement-task]
**Claim:** When one page-level dialog serves many rows, track the open row's id (not a boolean) and a per-row busy set, so a late answer for row X never closes or writes into row Y's dialog.
**Saw it in:** `frontend/src/pages/UsersPage/UsersPage.tsx` (`confirmOpenRef`, `deletingIds`)
**Context:** FeedPost's boolean works because each post owns its dialog; the Users page has one dialog for all rows.

## CAND-014 [implement-task]
**Claim:** A list patched locally after a delete can reach zero rows while `total > 0` on page 1; reload the address then, or the page shows the "nothing found" empty state wrongly.
**Saw it in:** `frontend/src/pages/UsersPage/UsersPage.tsx` (`refillEmptiedPage`)
**Context:** The hook's past-the-end rule covers page 2 and later only (`page > lastPage`).

## CAND-015 [implement-task]
**Claim:** Keep a dialog outside the dev page's `NoRequests` guard: `Dialog` uses `showModal()` with no portal, so the capture guard would stop its Cancel and confirm.
**Saw it in:** `frontend/src/pages/dev/ComponentsPage/ComponentsPage.tsx` (`UserSamples`, `FeedPostSamples`)
**Context:** Wrap only parts whose presses can start a request; give the dialog page-only handlers instead.

## CAND-016 [implement-task]
**Claim:** Put a table's column set in a function under components/, not inline in the page, so the dev page can show the real table.
**Saw it in:** `frontend/src/components/users/UserCells/usersColumns.tsx`
**Context:** UsersPage built its columns inline; the dev page would otherwise have had to copy them (L-REQ-fs-006-5).

## CAND-017 [implement-task]
**Claim:** Close every tab a CDP script opened, even when it crashes; open tabs share localStorage and reload on a token change, so they add requests to the mock's log and make later key presses miss.
**Saw it in:** scratchpad `t012/cdp.mjs` (TASK-012 notes)
**Context:** 11 stray tabs after crashed runs; a fresh tab per pass and closing strays fixed it.

## CAND-018 [implement-task]
**Claim:** A Tag that allows a break anywhere lets a table shrink its column until the word splits; give one-word tags `overflow-wrap: normal`.
**Saw it in:** `frontend/src/components/ui/Tag/Tag.module.css` (role variants)
**Context:** Users table at 1280 showed "Alum / ni"; nothing at 360 showed it, only the wide table did.

## CAND-019 [implement-task]
**Claim:** Emulate a phone with `Emulation.setDeviceMetricsOverride` plus `setScrollbarsHidden`; it reaches 360px in headless Chrome without an iframe.
**Saw it in:** scratchpad `t012/cdp.mjs` `viewport()`
**Context:** G50 says headless will not go under about 500px; that holds for the window size, not for the emulated screen.

## CAND-020 [implement-task]
**Claim:** In Git Bash, set `MSYS_NO_PATHCONV=1` before passing an app path like `/feed` to a script; otherwise it arrives as `C:/Program Files/Git/feed`.
**Saw it in:** scratchpad `t012/crop.mjs` (TASK-012 notes)
**Context:** Chrome refused "invalid URL" until path conversion was turned off.

## CAND-021 [implement-task]
**Claim:** When an `<img>` has `width`/`height` attributes, keep `height: auto` in its CSS; the attribute sets the height unless CSS does, and `aspect-ratio` is then ignored.
**Saw it in:** `frontend/src/components/posts/FeedPost/FeedPost.module.css:19`
**Context:** The task said remove `height: auto` for a fixed 4:3 box; with `height="3"` that would draw a 3px picture.

## CAND-022 [implement-task]
**Claim:** A reserved picture box plus "hide on error" moves the page when a link fails late; decide failure behaviour together with the reserved box.
**Saw it in:** `frontend/src/components/posts/FeedPost/FeedPost.tsx:223` (`onError`)
**Context:** Wide and tall pictures gave layout shift 0; a link that 404s after 2 s gave 0.17 to 0.20.

## CAND-023 [implement-task]
**Claim:** Count re-renders with a scratch Vite `transform` plugin (enforce "pre") that adds a no-deps effect to named components; nothing touches the repo.
**Saw it in:** scratchpad `t013/vite.count.mjs`
**Context:** A per-commit effect counts a StrictMode update once and adds nothing for a row that `memo` skipped.

## CAND-024 [implement-task]
**Claim:** `memo` on a component that takes `children` JSX, or a closure made in a parent's render function (`Table`'s `render`), never skips; check props before adding it.
**Saw it in:** `frontend/src/components/posts/CommentsPanel/CommentsPanel.tsx` (`renderItem`), `frontend/src/components/users/UserCells/usersColumns.tsx:69`
**Context:** That is why `CommentItem` and `UserActionsCell` were left without `memo`.

## CAND-025 [implement-task]
**Claim:** A handler that reads changing state can stay stable by reading the atom at call time with `useStore().get(atom)`.
**Saw it in:** `frontend/src/pages/FeedPage/FeedPage.tsx` (`handleToggleComments`)
**Context:** It depended on `comments.postId`, so every post drew again whenever any thread opened.

## CAND-026 [implement-task]
**Claim:** Page-only stores reach the entry script through the session reset in `sessionActions.ts`; a lazy or registered reset would cut about 2.5 KB gzip from the entry.
**Saw it in:** `frontend/src/store/sessionActions.ts:11-21`
**Context:** Measured with a what-if scratch build; left for a later REQ.

## CAND-027 [implement-task]
**Claim:** Compare build sizes by content groups (entry, pages, shared, fonts), not by chunk name: Vite renames shared chunks after whichever module lands in them.
**Saw it in:** `frontend/dist/assets/Textarea-qy1Ih9V_.css` (was `saveFailure-qy1Ih9V_.css`, same hash)
**Context:** `gzip -c` also stores the file name, so a renamed but identical file differs by a few bytes.

## CAND-028 [implement-task]
**Claim:** A code comment that cites a style-check rule must match what the rule checks; grep the rule before writing "(rule x)".
**Saw it in:** `frontend/src/hooks/useListAddress.ts:30` (says rule d keeps hooks out of store/; rule d checks only axios and services/)
**Context:** Found while writing pattern 35 from the code.

## CAND-029 [implement-task]
**Claim:** When the last user of a placeholder component goes, delete the component in the same REQ, or list it as an open point.
**Saw it in:** `frontend/src/components/shell/BeingBuilt/BeingBuilt.tsx` (no importer after the Users page became real)
**Context:** Pattern 14 said "delete BeingBuilt when the last unbuilt page is gone"; no task of REQ-fs-007 owned it.
