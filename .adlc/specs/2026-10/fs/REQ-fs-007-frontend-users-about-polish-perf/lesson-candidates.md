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

## CAND-030 [review-arch]
**Claim:** When a shared hook takes the page's list state as a parameter, constrain its `status` to the union, not `string`.
**Saw it in:** `frontend/src/hooks/useListAddress.ts:1396`
**Context:** The seam is typed loosely so any list fits; a typo in a status word compiles.

## CAND-031 [review-arch]
**Claim:** A fixed wording in an accepted ADR needs a deviation note when the UI text changes.
**Saw it in:** `frontend/src/config/text.ts:497` vs ADR-06
**Context:** The delete-blocked message differs from the ADR's quoted text.

## CAND-032 [review-arch]
**Claim:** Put "reload after the last row of a page is removed" in the store action, not the page.
**Saw it in:** `frontend/src/pages/UsersPage/UsersPage.tsx:2779`
**Context:** The page reads store state and re-parses the query key to decide a reload.

## CAND-030 [review-qual]
**Claim:** When a new page needs "is this string one of our roles", add one `asRole()` next to `ROLES` instead of a fourth inline test.
**Saw it in:** `frontend/src/components/users/UserCells/usersColumns.tsx:19` (also `RoleTag.tsx:14`, `usersQuery.ts:40`, `UsersFilters.tsx:56`)
**Context:** One rule, four spellings, written in one REQ, only one of them has lib-check cases.

## CAND-031 [review-qual]
**Claim:** Copy-and-adapt of a page's view-state chain (loading/error/empty/ready + count text) is a missing pure helper; extract it when the second page appears.
**Saw it in:** `frontend/src/pages/UsersPage/UsersPage.tsx:213` and `frontend/src/pages/DirectoryPage/DirectoryPage.tsx:109`
**Context:** Same hook was extracted for the address, but the 10-line view chain beside it was copied.

## CAND-032 [review-qual]
**Claim:** An "Open points" line in the docs that describes a code comment must be re-read against the comment before it ships.
**Saw it in:** `docs/frontend-patterns.md` (Open points, part 4) vs `frontend/src/hooks/useListAddress.ts:31`
**Context:** The doc says the comment claims something the comment does not say (LESSON-REQ-fs-006-4 variant).

## CAND-033 [review-qual]
**Claim:** A carried "no check cases" review item (toPeopleBlockState) that is skipped REQ after REQ should be done in the next REQ that touches lib-check.
**Saw it in:** `frontend/src/store/peopleBlockState.ts` (no case in `scripts/frontend-lib-check.ts`)
**Context:** REQ-fs-006 n6 was skipped again in REQ-fs-007 skipped.md although the REQ added 67 cases beside it.

## CAND-034 [review-corr]
**Claim:** A ref that records "which dialog is open" must be cleared on unmount, or a late async answer on the unmounted page takes the dialog-open branch and drops its message.
**Saw it in:** `frontend/src/pages/UsersPage/UsersPage.tsx:2713, 2805`
**Context:** handleConfirmDelete decides toast versus in-dialog error from confirmOpenRef after an await.

## CAND-035 [review-corr]
**Claim:** When an image gets width/height attributes as a shape hint, check the stylesheet sets both dimensions, or a 1x1 attribute renders a 1px image.
**Saw it in:** `frontend/src/components/ui/Avatar/Avatar.tsx:672`, `Avatar.module.css:41`
**Context:** Checked and safe here (.photo is 100% by 100%); the shape of bug is easy to introduce for a new img.

## CAND-036 [review-reflect]
**Claim:** When a fix adds a guard to one branch of an async handler, add it to every branch in the same edit.
**Saw it in:** `frontend/src/components/posts/CommentItem/CommentItem.tsx:132-135`
**Context:** L-REQ-fs-006-2 said every branch; the 404 branch stayed bare.

## CAND-037 [review-reflect]
**Claim:** When a spec narrows what an accepted ADR lists (page content), write the deviation in the ADR at the spec gate.
**Saw it in:** `frontend/src/pages/AboutPage/AboutPage.tsx` vs ADR-10 "About page content"
**Context:** "Who can join" and the app version were dropped by AC14; the ADR open question on the version was never closed.

## CAND-038 [review-reflect]
**Claim:** Remove a known-gap line from the patterns doc in the same round the code is fixed; grep Open points for the file name.
**Saw it in:** `docs/frontend-patterns.md:1115` (comment already fixed at `useListAddress.ts:31`)
**Context:** Repeat of L-REQ-fs-006-4; fits a wrap-up checklist line better than a new lesson.

## CAND-039 [ui-review]
**Claim:** A fixed toast stack needs bottom room on a phone, or it hides the last control (Pagination, footer) of a long card list.
**Saw it in:** `frontend/src/pages/UsersPage/UsersPage.tsx` (Pagination under the card list) at 360px
**Context:** Two 62px toasts cover Next and the footer link for 5 s each; same class as the skipped My profile Save case.

## CAND-040 [ui-review]
**Claim:** A table cell that renders null still gets a label in card mode; hide the whole cell when the value is empty.
**Saw it in:** `frontend/src/components/users/UserCells/UserActionsCell.tsx:20`
**Context:** The own row shows "Actions" with no control beside it at 360px.

## CAND-041 [implement-task]
**Claim:** Before calling a store/ function "not checkable", look at its imports: type-only imports are erased by tsx, so the library check can import it with no atom or axios loaded.
**Saw it in:** `frontend/src/store/peopleBlockState.ts:4` (and `scripts/frontend-lib-check.ts`, toPeopleBlockState block)
**Context:** REQ-fs-006 n6 was skipped twice as "needs the atoms"; a require.cache probe showed only the file itself loads.

## CAND-042 [implement-task]
**Claim:** Table hides an empty phone cell through `.value:empty`; a column render that returns whitespace or an empty fragment wrapper instead of null brings the empty "label + box" line back.
**Saw it in:** `frontend/src/components/ui/Table/Table.module.css` (phone block, `.cell:has(> .value:empty)`)
**Context:** UI-002 fix; the value div must stay the only child of the td with no text around the render call (G46).
