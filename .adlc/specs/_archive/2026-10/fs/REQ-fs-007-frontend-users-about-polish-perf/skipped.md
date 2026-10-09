# REQ-fs-007 — Skipped review items (AC29, AC30)

| Field | Value |
|---|---|
| REQ | REQ-fs-007 |
| Written by | TASK-011 |
| Sources | the archived `verification.md` of REQ-fs-004, REQ-fs-005 and REQ-fs-006 |

Every item those files left open, that is still open and is not a one-line safe fix. One line each: the item, then why it is skipped. "Checked" means the current code was read on 2026-10-08 and the item still holds; "as listed" means it was taken from the file and not re-checked in code. Items resolved at a wrap-up (for example REQ-fs-004 m18 and t7, REQ-fs-005 M2, m15 and n9, REQ-fs-006 M1 and m16) are left out.

## Done in this REQ, not skipped

- REQ-fs-006 m6 (Save on an unchanged edit sends a `PUT`): fixed by TASK-011 in `FeedPost.handleSave` and `CommentItem.handleSave` (AC28).
- REQ-fs-005 m13 (about 150 lines of address and search-timer code in `DirectoryPage`): moved into `useListAddress` by TASK-007.

## Skipped: needs a decision, is not one line, or is not safe

### From REQ-fs-006

- n2 (Load more total one off after a racing delete): `totalAfterAnswer` applies a `-1` edit even when the server answered after the delete and its `total` already left the post out. The browser cannot tell the two orders apart, so there is no safe one-line fix; needs a decision. (Checked: `store/postAtoms.ts` lines 170 to 183.)
- n6 (`toPeopleBlockState` has no check cases): new library-check cases, more than one line; checked, `scripts/frontend-lib-check.ts` has none.
- m14 (pages turn atom state into block state by hand): a refactor across pages; medium effort.
- m15 (`ApiFailure` imported from the big `postAtoms`): checked, `CountsBlock` and `RecentPostsBlock` still do; moving the type touches several files.
- t1 to t10 (lib-check gaps, dev page size, `countText` home, `postSummaryLinkContext` with no case, repeated candidate numbers, same-id edit race, pattern 32/33 wording, `postActions.ts` header comment, "still the same edit" rule in two files): trivial, owner's call; listed only as a group in the file, so not judged one by one (as listed).

### From REQ-fs-005

- n11 (after a 409 on create the focused Save turns off and focus drops to the page): needs a focus target chosen; still named in the patterns doc Open points (as listed).
- n3 (the two profile cards keep typed text and move focus in two different ways): one shared rule is a design choice and medium effort (as listed).
- n4 (the failure shape declared twice; `alumniAtoms.ts` writes 404 itself): checked, `ApiFailure` in `services/apiError.ts` and `CallFailure` in `lib/loadFailure.ts`, and `NOT_FOUND = 404` in `store/alumniAtoms.ts`; touches services, store and lib.
- n5 (style-check rule k covers only part of pattern 1): new check rules, not one line (as listed).
- n6 (`AlumniProfileCard` CSS composes four blocks from `AccountCard`): checked, still four `composes` lines; needs a new shared module.
- n7 and m14 (comments end in finding ids or cite AC numbers with no REQ id): about 90 comments in many files; owner's call (as listed).
- n8 (`mailtoHref` checks the same thing three ways): checked, still three checks; simplifying changes which addresses pass, needs a decision.
- n10 (a disabled Save or Discard says nothing about why): new words and markup; owner's call (as listed).
- m6 (no timeout on API calls): checked, the patterns doc Open points still say only log out has one; a client-wide timeout changes every call.
- m10 (Enter and Search replace history, so Back skips the plain directory): a behaviour decision; TASK-007 keeps today's behaviour on purpose (as listed).
- m17 (only "LinkedIn link" says "(optional)"): which fields carry the word is a design decision (as listed).

### From REQ-fs-004

- n1 (the "after log in" router state stays in history, so a reload moves focus again): checked, `AppShell.tsx` still reads it once with `isAfterLogIn`; clearing history state is more than one line and needs a browser check.
- n2 (Pagination's `keepFocus` stays true if the parent does not change the page): checked, still set before `onChange` and cleared only on a page change; the reset needs a choice of when.
- m2 (an idle open page is not ended at token expiry until the next call): accept it or add a timer; owner's call (as listed).
- m5 (a photo link of just `https://` passes): changes AC53 of REQ-fs-004 as written; owner's call (as listed).
- m13 (password Show/Hide says its state twice): keep the changing name or the pressed state; a design choice (as listed).
- m15 (dark `--edge` on `--sunken` is 2.87:1): a token value from the design README; owner's call (as listed).
- m16 (frontend naming and comment rules not in `conventions.md`): a vault rule; owner's call (as listed).
- m17 (store logic proven only by a scratch harness): putting it in `scripts/` is medium effort and the harness must not load app code that reaches the network (G56) (as listed).
- t3 (`frontend/README.md` is the Vite template; the ESLint config has no packages): installing ESLint is a new package, which this REQ forbids (as listed).
- t8 (the shrunk header name has no tooltip): new behaviour; owner's call (as listed).

## Still open one-line fixes, not made here

These look like one-line safe fixes but sit in files no task of this REQ names, so they were not made. The orchestrator decides whether a task takes them.

- REQ-fs-006 r1 (a 404 on saving a comment moves focus even when another edit or reply started meanwhile): checked, the 404 branch of `CommentItem.handleSave` still calls `onRemoved()` with no `editingRef` check. The file is TASK-011's, but the fix is not in its approach.
- REQ-fs-004 n3 (comment in `config/layout.ts` says rule i; the media-query rule is j): checked, still "rule i".
- REQ-fs-004 n4 (`isLiveSession` is a type predicate, so its false branch is typed `null` though an expired session lands there): checked, still a predicate; a doc line would do, changing the type would not be one line.
- REQ-fs-004 n5 (three `pageRange` cases missing: (1,8), (22,25), (5,8)): checked, still missing in `scripts/frontend-lib-check.ts`.
- REQ-fs-004 t5 (comment in `sessionAtoms.ts` says the guards call `isExpired`; they call `isLiveSession`): checked, the comment still says `isExpired`.

## From TASK-012 (phone audit), not fixed

- Inline text links are 18 to 21px tall ("Create an account", "Go to the Dashboard", "Browse the directory", names and post links in the dashboard and feed side lists, the profile email): text inside a line or a list, which WCAG 2.5.8 leaves out; raising them means changing the shared `Link` or each list's design, an owner's call.
- A toast on a phone can cover a button that sits exactly on the bottom edge of the screen (seen with My profile "Save account" scrolled to the edge): the toast leaves after 5 s and has Dismiss; moving phone toasts or adding room under every page is a design decision.
- 200% zoom was checked as a 640 x 400 viewport at device scale 2 in headless Chrome, not by a real browser zoom; a real-browser check at 200% is on the owner's manual checklist.
