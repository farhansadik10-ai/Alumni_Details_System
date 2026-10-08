# REQ-fs-006-frontend-feed-and-dashboard — Review log

Full reviewer narratives. The consolidated verdict lives in `verification.md` —
read that first; come here for the long form behind a finding ID.

## Correctness findings

Written by: correctness-reviewer (tier: balanced), dispatched sub-agent.

**Summary:** Read all backend and store/lib/page/component code in the packet (54 files; style-only files skimmed). 0 critical, 0 major, 3 minor. Biggest: a stale "Load more" answer overwrites the feed total and can show "Showing 21 of 20 posts" (CORR-001). Dispatch answers: backend user_id filter (both SQL queries share one WHERE; placeholders $1, then $2/$3 are right; arrays, empty and "0" all give 400 through parseId) checked, nothing. Load-more aligned page / removedIds / creates / late answers: CORR-001 only. Patching from write answers and comment_count: CORR-002 only. latestRequest and key checks, session change / close clearing (visit counter + resetPostsAtom), role rules, focus-after-delete via state + effect, 403/404 mapping, date handling, thread shaping and cycles, double-submit guards, validator limits: checked, nothing. Dialog: CORR-003.

### CORR-001: A late "Load more" answer overwrites the feed total

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `frontend/src/store/postAtoms.ts:7924-7931` (loadMore), `:7878-7886` (loadFeed) |
| Category | concurrency |

**What:** `loadMoreFeedAtom` sets `total: result.total - dropped` from the server answer, replacing the total that `putPostOnTopAtom` / `removePostLocallyAtom` adjusted while the call was running. `dropped` only counts removed posts that are in this page.
**Why it matters:** Publish during a running "Load more" (the composer stays usable while `more` is loading): the answer's total predates the new post, so the feed shows "Showing 21 of 20 posts" and `hasMore` goes false early. A delete of an already-held post while the call runs does the opposite (total one too high, one extra "Load more" click that returns nothing new). Rare and self-heals on the next load.
**Recommendation:** In both loaders keep the local count of posts this browser added or removed since the call began (or take `Math.max(result.total, current.items.length)` for the added case and subtract `removedIds` that are not in the page for the delete case). Simplest: store `created` / `removed` counters in `FeedState` and compute `total` from the answer plus them.

### CORR-002: The post's comment count is not synced when its thread opens

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `frontend/src/store/postAtoms.ts:7948-7969` |
| Category | logic |

**What:** `openCommentsAtom` stores the loaded list but never sets that post's `comment_count` in `feedAtom` to `items.length`; only the six writes do.
**Why it matters:** If someone else commented after the feed loaded, the button says "2 comments" over a list of 3 until this user writes. The delete dialog for a post also reads the stale count. Spec C2 says the count is "always set from the comment list the server just returned".
**Recommendation:** In `openCommentsAtom`, when the answer is current, also call `withCommentCount`-style update on a ready `feedAtom` for `postId` (the helper is in `postActions.ts`; move it to `postAtoms.ts`).

### CORR-003: A native close during a running delete leaves the dialog stuck

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `frontend/src/components/posts/FeedPost/FeedPost.tsx:6105-6111`, `frontend/src/components/posts/CommentItem/CommentItem.tsx:5511-5517`, `frontend/src/hooks/useModalDialog.ts` (handleClose) |
| Category | logic |

**What:** `closeConfirm` returns early while `deletingRef` is set, so `confirmOpen` stays true. But `useModalDialog` says a second Escape is not held back by the browser: the `<dialog>` closes itself while the flag still says open.
**Why it matters:** If the delete then fails, `confirmOpenRef` is still true, so the error goes into the (now hidden) dialog instead of a toast and the user sees nothing. Pressing Delete again sets `confirmOpen` to true again, which is no change, so `showModal()` never re-runs. Needs a browser to confirm (second Escape during the request).
**Recommendation:** In `handleConfirmDelete`'s failure branch, if the dialog is no longer showing, toast the text; or let `closeConfirm` always set `confirmOpen` false and disable only the confirm button while busy (the dialog then closes and the failure goes to the toast branch already written).

### Round 2

Summary: CORR-001, 002 and 003 are closed. The fixes hold under reading; library check 469/0 and style check PASS were re-run. Two new findings, both minor or nit, no blockers. Browser behaviour (native dialog close, focus return) was reasoned from `useModalDialog`, not run.

- CORR-001 resolved: `totalAfterAnswer` applies the log entries made since the call started, skips posts the answer holds, floors at the posts held; the log is kept on reload and cleared by clear/reset.
- CORR-002 resolved: `openCommentsAtom` sets the held post's count to the list length when the answer is current and the feed is ready.
- CORR-003 resolved: `closeConfirm` always clears the flag, a failure after the close goes to the toast, the dialog reopens cleanly (`deletingRef` still blocks a second send, the confirm button is busy). Focus returns to the opener natively.
- Checked, no finding: Cancel busy (aria-disabled, stays focusable), `canWritePosts`, `mentoringDirectoryAddress` (same address as before), `countText`, `toPeopleBlockState`, `withCommentCount` move, `commentAddFailureText` order (400 on a reply, then 404, then 403).

### CORR-004: The total log cannot tell whether a "Load more" answer already counted this browser's own create or delete

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `frontend/src/store/postAtoms.ts:170-183`, `frontend/src/store/postActions.ts:105-110` |
| Category | race |

**What:** The "skip posts the answer holds" rule only works for page 1. A post created (+1) or deleted (-1, held) while "Load more" runs sits on page 1, so a page 2 answer never holds it, and the change is always applied. If the server handled the create or delete before it built the answer, its total already includes the change and it is counted twice (shown one too high or one too low).
**Why it matters:** Too high: "Load more" stays offered with nothing left, and one click fixes it (the next answer has no log entries). Too low is floored at the posts held. Needs the narrow overlap of a write with a Load more.
**Recommendation:** Accept and note it beside ADV-001, or keep the total from the answer when the write finished before the call began and only correct for writes that finished after the answer returned.

### CORR-005: A blank reply refused in the store would be shown as "the comment replied to is gone"

| Field | Value |
|---|---|
| Severity | nit |
| Effort | small |
| File | `frontend/src/store/postActions.ts:75,266-268`, `frontend/src/lib/writeFailure.ts:50-52` |
| Category | logic |

**What:** The store's blank-content guard returns a plain 400. `isReplyTargetGone` reads any 400 with a `parent_id` as "reply target gone", so the reply would end with the wrong words.
**Why it matters:** Not reachable today: `validateComment` uses the same `presentText` and the form stops a blank first. It would show only if a caller skipped the form.
**Recommendation:** Leave, or give the guard its own failure kind so the two 400s differ.

## Quality findings

Written by: quality-reviewer (tier: balanced), dispatched sub-agent.

**Summary.** Checked 54 changed files: names and layout, CSS, comments, duplication, dead exports, the 434 lib-check cases and patterns 29 to 33. Style check passes; lib check passes (434/0). 0 critical, 0 major, 5 minor, 2 trivial. Biggest: 6 text constants in `config/text.ts` are never used (QUAL-001), and the known repeats (isWriter x4, mentoring address x2, toPeopleState x2) are still not fixed (QUAL-002). Dispatch answers: naming/no barrels/CSS tokens/comments: checked, nothing (no TODO, no console, no commented-out code). Dev-page CSS copy: QUAL-004. Two copies of a count/trim rule: QUAL-005. Pattern 29-33 paths all exist; claims match the code (checked, nothing). No Packet-gap.

### QUAL-001: Six text constants are never read
| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `frontend/src/config/text.ts:252,283,350,356,368,398` |
| Category | dead-code |
| Rule | conventions.md, no dead code |

**What:** `POST_IMAGE_ALT`, `COMMENTS_LOADING_TEXT`, `DASHBOARD_COUNTS_LOADING`, `DASHBOARD_PROFILE_LOADING`, `PROFILE_POSTS_LOADING` and `DASHBOARD_RECENT_LOADING` (read only by the unused `PROFILE_POSTS_LOADING`) have no reader anywhere. The blocks show skeletons, and `postImageAlt()` is used instead of `POST_IMAGE_ALT`.
**Recommendation:** Delete them, or use them as the skeleton's accessible name. Also un-export `WRITE_FAILED_NO_ANSWER/SERVER/GENERAL` (193-197), used only inside the file.

### QUAL-002: Known repeats left in place, plus one more
| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `frontend/src/pages/FeedPage/FeedPage.tsx:91,84,97` |
| Category | duplication |
| Rule | LESSON-REQ-fs-002-3; patterns 28 |

**What:** `isWriter` is written in `FeedPage.tsx:91`, `DashboardPage.tsx:51`, `YourProfileBlock.tsx:38` and `MyProfilePage.tsx:42` (inline). The mentoring directory address is built in `FeedPage.tsx:84` and `CountsBlock`. New: `toPeopleState` is near-identical in `FeedPage.tsx:97` and `DashboardPage.tsx:73` (only the kind differs).
**Why it matters:** The ADR-02 writer rule can drift between four copies. The docs (frontend-patterns.md:187) already admit it, so it is a known debt, not a surprise.
**Recommendation:** Add `canWritePosts(role)` to `lib/contentOwner.ts` with lib-check cases; add one `mentoringDirectoryTo` helper next to `writeDirectoryQuery`; give `toPeopleState` a `kind` argument in one shared place.

### QUAL-003: Plural and count words written twice
| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `frontend/src/config/text.ts:260-262,309-311` |
| Category | duplication |
| Rule | pattern 28 |

**What:** `postDeleteBody` and `commentDeleteBody` each do their own "1 x / N xs" plural; `commentCountText` in `lib/postDisplay.ts:56` is the same idea for "comment". Also `dashboardGreeting`, `feedShowingText`, `commentReplyingTo` hold plural/fallback logic in the text file with no lib-check case.
**Recommendation:** Reuse `commentCountText`-style helper for the delete bodies, and add 6 to 8 lib-check cases for these functions (0, 1, N; null name).

### QUAL-004: CommentsPanel stylesheet copied into the dev page
| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `frontend/src/pages/dev/ComponentsPage/ComponentsPage.module.css` (.commentPanel, .threads, .replies, .reply) |
| Category | duplication |
| Rule | pattern 3, 22 |

**What:** About 35 lines copied from `CommentsPanel.module.css:7-46`; the comment says "Change both together", which is how copies drift. The same media query (767.98px) is repeated too.
**Recommendation:** Use `composes: panel from "../../../components/posts/CommentsPanel/CommentsPanel.module.css"` (as ButtonLink already does), or pull the thread list into a small component both use.

### QUAL-005: Two trim rules for the same job
| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `frontend/src/store/postActions.ts:188,269,297` |
| Category | convention |
| Rule | pattern 7 (trimming) |

**What:** Post text goes through `presentText` (trim, empty to null) but comment content uses `input.content.trim()`. `validateRequiredText` in `validation.ts:136` uses `presentText` for both, so the check and the send use different rules for comments.
**Recommendation:** Use `presentText(...) ?? ""` or one named helper in both places, so what is validated is what is sent.

### QUAL-006: lib-check gaps and style
| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `scripts/frontend-lib-check.ts` (REQ-fs-006 block) |
| Category | test-coverage |
| Rule | pattern 16, 28 |

**What:** Expected answers are typed from the spec, which is right. Gaps: `nextFeedPage` has a NaN/negative `held` branch with no case; `commentCountText` has no negative case; the backend `user_id` filter (PostQuery) has no check at all (no runner; manual list only). The block also adds `import` lines mid-file (the writeFailure import), unlike the top-of-file block.
**Recommendation:** Add the two cases and move the import to the top.

### QUAL-007: Dev page is now 1700+ lines
| Field | Value |
|---|---|
| Severity | trivial |
| Effort | medium |
| File | `frontend/src/pages/dev/ComponentsPage/ComponentsPage.tsx` |
| Category | convention |
| Rule | none (convention-gap) |

**What:** It grew by 862 lines in one file. No size rule exists, so this is a note: consider one section file per part before part 4 adds more.

### Round 2

Written by: quality-reviewer (tier: balanced). Checked the 12 fixes, the leftovers grep, the 35 new library-check cases, the dev page and the docs. Library check 469/0, style check PASS. 5 of 5 round-1 findings closed; 4 new, all minor or trivial. Biggest: the docs still say the thread CSS is copied (QUAL-008).

Resolved: QUAL-001 (no unused export left in `config/text.ts`; the three my script flags are used inside the file), QUAL-002 (no `isWriter`, `toPeopleState`, `hasAlumniProfile` or local status constant left), QUAL-003 (one `countText`, 0/1/2 and 0/1/N cases typed out), QUAL-004 (`composes`, phone indent now comes with `.replies`; no G52 clash, the classes have no own declarations), QUAL-005 (both paths use `presentText`). The `config/text.ts` -> `lib/postDisplay` import passes the style check and the header comment says so.

### QUAL-008: Docs still describe things this round removed
| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `docs/frontend-patterns.md:581`, `:772` |
| Category | documentation |

**What:** Line 581 says the thread's look "is copied into the page's stylesheet (see Open points)"; that Open points entry was deleted and the CSS is now `composes`. Line 772 lists `dateText`, `commentCountText` but not `countText`.
**Recommendation:** Reword 581 to "taken with `composes`"; add `countText` to 772. Check pattern 9 for `commentAddFailureText` / `isReplyTargetGone` too.

### QUAL-009: The empty-text guard hard-codes 400 and reads as "reply gone"
| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `frontend/src/store/postActions.ts:75` |
| Category | duplication / test-coverage |

**What:** `EMPTY_TEXT` writes `status: 400` while `HTTP_BAD_REQUEST` now exists in `lib/loadFailure.ts:14`. A blank reply would then pass `isReplyTargetGone` and show "That comment is gone". The guard has no case anywhere (store, so not in the library check).
**Recommendation:** Import `HTTP_BAD_REQUEST`. Today unreachable (forms validate first), so note it or use `{ kind: "network" }` like `NOT_READY`.

### QUAL-010: `postSummaryLinkContext` has a branch and no case; plural words written as literals
| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `frontend/src/config/text.ts:214,309,417` |
| Category | test-coverage |

**What:** The date / no-date branch of `postSummaryLinkContext` (m7) is unchecked, though its sibling words got cases. Also "post/posts" and "reply/replies" are inline literals while the comment words are exported constants.
**Recommendation:** Add two cases with the sentence typed from the UI-001 text; the literals are fine to leave.

### QUAL-011: Duplicate CAND-043 in `lesson-candidates.md` (lines 211 and 221)
| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `lesson-candidates.md:221` |
| Category | documentation |

**What:** Two entries share CAND-043. Wrap-up renumbers; noted once.

### Round 3

Written by: quality-reviewer (tier: balanced). Library check 469/0, style check PASS. QUAL-008 and QUAL-009 closed; QUAL-010/011 still open (not fixed, as agreed). 2 new findings, both trivial. No blockers.

Resolved: QUAL-008 (patterns 9, 22, 30, 32, 33, 16 and Open points checked against the code: `composes` lines, `countText`, `toPeopleBlockState`, `canWritePosts`, `mentoringDirectoryAddress`, `commentAddFailureText`, `isReplyTargetGone` all exist; "469" in both places; the five unused words are gone, only the dev page's own local `PEOPLE_LOADING` remains). QUAL-009 (no `EMPTY_TEXT`, no 400 literal; `HTTP_BAD_REQUEST` only in `lib/loadFailure.ts`/`writeFailure.ts`; the only two callers, `CommentsPanel.handleAdd` and `CommentItem.handleSave`, both handle `"blank" in result` before touching `result.failure`; the type narrows, no dead variant). The n1 change reads well: both refs carry a why-comment (REFL-006) and no unused code was added.

### QUAL-012: The "still the same edit" rule is checked in two files
| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `CommentItem.tsx:~93 (editingRef)`, `CommentsPanel.tsx:~101 (endEdit)` |
| Category | duplication |

**What:** `CommentsPanel.endEdit` already ignores an end for an edit that is no longer active, so the item's `editingRef` check repeats it. The item needs its own check only to skip the focus request, so it is not dead, but the rule lives twice and must change in both.
**Recommendation:** Leave, or let `onEndEdit` return whether it closed anything. Not worth a round on its own.

### QUAL-013: Stale header comment and a repeated blank branch
| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `store/postActions.ts:38-41`, `CommentItem.tsx:~119`, `CommentsPanel.tsx:~155` |
| Category | documentation / duplication |

**What:** The header still says "the page maps ... a 400 on `addCommentAtom` ... to its own words", but that mapping now lives in `lib/writeFailure.ts` (`isReplyTargetGone`). The two blank branches are the same three lines and the same message (fine at two uses).
**Recommendation:** Reword the header to point at `commentAddFailureText`; no action on the branches.

## Architecture findings

Written by: architecture-reviewer (tier: balanced), dispatched sub-agent.

**Summary:** Checked 54 files for layering (import scan of components/pages/lib for `axios`, `services/`, React in lib: clean), the backend user_id filter path, the store design and shared blocks. 0 critical, 0 major, 3 minor. Biggest: the "who may write posts" rule and the "idle or other key means loading" mapping are copied into pages instead of living once (ARCH-001, ARCH-002).
- One-way layering and rules d/k: checked, nothing. Components only import types from `store/`; lib imports only lib and shared types.
- Backend Route -> Controller -> Manager -> Query for `user_id`: checked, nothing (parseId gives 400, parameterized SQL, count and list share one WHERE, ADR-12 shape and ADR-11 errors unchanged).
- Store split (postAtoms/postActions), one-atom-per-kind with key, one open thread: holds up; no cycles (postActions -> postAtoms -> services; sessionActions -> postAtoms). See ARCH-002 and ARCH-003.
- Props-only blocks vs store-reading components: consistent (blocks are props-only; FeedPost/CommentItem/CommentsPanel read actions, same as AlumniProfileCard precedent).
- Shared PostForm/CommentForm/PeopleBlock/RecentPostsBlock/ButtonLink: checked, nothing worth a finding.
- Deviations / ADRs: no ADR-07/09/13/14 breach found; no new ADR needed (module-level `postsVisit` counter follows `latestRequest` precedent).
- Owner rules (ADR-02): FeedPost and CommentItem use `lib/contentOwner`; edit is author-only, delete author or admin: matches the controller.

### ARCH-001: "Writer" role rule copied into two pages

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `frontend/src/pages/FeedPage/FeedPage.tsx:91`, `frontend/src/pages/DashboardPage/DashboardPage.tsx:51` |
| Category | pattern |
| Rule broken | Pattern 28 "One rule, one function in lib" (docs/frontend-patterns.md); ADR-02 |

**What:** `isWriter(role)` (alumni or admin may post) is defined twice, byte for byte, in two pages.
**Why it matters:** The post rule is an ADR-02 rule; a third screen (profile, a "write" link) or a role change will update one copy and miss the other. `lib/contentOwner.ts` and `isAdmin` in `lib/token.ts` already hold the sibling rules.
**Recommendation:** Add `canWritePosts(role)` next to `isAdmin` in `lib/token.ts` (or in `lib/contentOwner.ts`), add a case to `scripts/frontend-lib-check.ts`, and import it in both pages.
**References:** [[architecture/adr-02]] (owner rules), docs/frontend-patterns.md pattern 28 and 31.

### ARCH-002: "Idle or other key counts as loading" mapping written four times in pages

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `frontend/src/pages/DashboardPage/DashboardPage.tsx:57-80`, `frontend/src/pages/FeedPage/FeedPage.tsx:97-103`, `frontend/src/pages/AlumniProfilePage/AlumniProfilePage.tsx:301-309` |
| Category | separation |
| Rule broken | Pattern 33 (one atom per kind with a key) and pattern 23 in docs/frontend-patterns.md |

**What:** Each page converts an atom state (status plus `authorId` or `kind` key) into a block state by hand: `toRecentPostsState`, two `toPeopleState` copies (differing only in the kind string), `toCountsState`, and an inline version on the profile.
**Why it matters:** Pattern 33 makes the key check the page's job, so every new consumer of `peopleAtom` or `recentPostsAtom` must remember it; forgetting it shows another page's data for a frame. This is the same stale-data risk lesson LESSON-REQ-fs-005-2 warns about.
**Recommendation:** Put the check once in the store as read-only derived atoms or small selector functions (for example `peopleForKind(state, kind)` and `recentPostsFor(state, authorId)` exported from postAtoms.ts), and have the pages call those.
**References:** docs/frontend-patterns.md patterns 23 and 33; LESSON-REQ-fs-005-2.

### ARCH-003: Blocks outside the posts topic import `ApiFailure` from `postAtoms`

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `frontend/src/components/alumni/PeopleBlock/PeopleBlock.tsx:7`, `frontend/src/components/dashboard/CountsBlock/CountsBlock.tsx:17`, `frontend/src/store/postAtoms.ts:21-196` |
| Category | separation |
| Rule broken | Pattern 1 and pattern 6 (atoms grouped by topic, one file per topic) |

**What:** `PeopleBlock` (alumni) and `CountsBlock` (dashboard) take their failure type from `store/postAtoms`, and `postAtoms.ts` (409 lines) also holds the people list and the stats, which are not posts and call `alumniService` and `statsService`.
**Why it matters:** The topic split drifts: later dashboard work will keep landing in `postAtoms`, and an alumni component now depends on the posts file for a type that `alumniAtoms.ts` and others already re-export.
**Recommendation:** Move `peopleAtom`, `statsAtom` and their loaders to a `dashboardAtoms.ts` (resetPosts keeps calling their clears), and re-export `ApiFailure` from one neutral store file used by all blocks. Low priority; do it when the next block is added.
**References:** docs/frontend-patterns.md pattern 6 (topics) and pattern 1.

(0 trivials not listed.) No `Packet-gap`. Note: the new `GET /api/posts?user_id=` filter is documented only in docs/frontend-patterns.md:850; no API doc or Postman entry exists for `/api/posts` in the repo, so there was nothing to update.

### Round 2

Written by: architecture-reviewer (tier: balanced), dispatched sub-agent.

**Summary:** Checked the m1 helpers, the new store file, the moved `withCommentCount`, `lib/writeFailure.ts`, `lib/loadFailure.ts`, and `config/text.ts` imports (import scan of lib, store, config). 0 critical, 0 major, 1 minor, 1 trivial. ARCH-001 resolved. No new ADR needed.
- `canWritePosts` (`lib/token.ts:89`) and `mentoringDirectoryAddress` (`lib/directoryQuery.ts:112`, takes the path as an argument): right layer, lib imports nothing new; all four former `isWriter` sites now call one function. Checked, nothing.
- `withCommentCount` in `postAtoms.ts:145`, used by `postActions.ts` and `openCommentsAtom`: correct direction (actions -> atoms), no cycle. Checked, nothing.
- `lib/writeFailure.ts` imports only `loadFailure` and `saveFailure`; `lib/loadFailure.ts` imports only `config/text`; no React, store or services: rules d and k hold.
- `config/text.ts:9` now imports `lib/postDisplay`, which imports nothing, so no cycle (`loadFailure -> text -> postDisplay`). Vite reads only `config/app.ts` and `config/storageKeys.ts` (`vite.config.ts:4-5`), so Node never loads `text.ts`. The header comment (`text.ts:4-6`) states the exception. Acceptable; see ARCH-005.
- Architecture picture: unchanged except one new file; `architecture.md` file table (lines 25-33) does not list it (doc only).

**Resolved:** ARCH-001 fixed (m1). ARCH-002 and ARCH-003 stay open for the owner (m14, m15); the m1 fix did not change their cost, except that `toPeopleState` is now one copy (two of the four mappers are gone).

### ARCH-004: A store file imports a type from a component

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `frontend/src/store/peopleBlockState.ts:4` |
| Category | layering |
| Rule broken | Pattern 1 (layers; components read from the store, not the reverse) |

**What:** `toPeopleBlockState` lives in `store/` but is a pure type mapper, and its return type comes from `components/alumni/PeopleBlock`, so `store/` now points up at `components/`. It is `import type` only, so there is no runtime edge and no cycle (`PeopleBlock` does not import this file), but it is the only store file doing so.
**Why it matters:** `lib/` cannot hold it (rule k forbids importing the store), so it landed here; the next mapper (m14) will copy the shape and a real store -> components edge can follow.
**Recommendation:** Keep it for now, but say in pattern 33 that this file is the one allowed type-only reach upward. If m14 is taken, move all the mappers together into one place next to the atoms and define the block-state types there, so components import them from the store as they already do `ApiFailure`.
**References:** docs/frontend-patterns.md patterns 1 and 33; ARCH-002.

### ARCH-005: Nothing enforces "postDisplay imports nothing" now that `config/text.ts` depends on it

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `frontend/src/config/text.ts:9`, `frontend/src/lib/postDisplay.ts:7` |
| Category | pattern |
| Rule broken | Config file stays plain values (`text.ts:4`) |

**What:** The comment is the only guard. If `postDisplay.ts` later imports a word from `config/text`, a circular import appears (works at load time only by luck of constant order).
**Recommendation:** Optional: move `countText` and the two comment words into a tiny `lib/plural.ts`, or add a line in `frontend-style-check.mjs` rule k that `postDisplay.ts` has no `config/` import. Not blocking.
**References:** `scripts/frontend-style-check.mjs` rules d and k.

No `Packet-gap`. New ADR: none needed (no new pattern chosen; `canWritePosts` follows pattern 28).

## Reflection findings

Written by: reflector (tier: balanced)

**Summary.** Checked 26 lessons (0 superseded), 55 gotchas (the six named plus those on posts, comments and shared types), 14 accepted ADRs, 6 concepts, 3 component pages, and docs patterns 29-33. 5 findings: 1 major, 4 minor (0 critical). Biggest: the near-miss record (REFL-005) is in the candidates only as two narrow tooling claims, with no gotcha, so the owner's safety rules are one careless script from being broken again. ADR-02/05/06/11/12/13/14, G11, G33, G38, G48, G55, LESSON 004-4/004-5/005-2/005-3 (isWebLink gates the image) held. No Mermaid diagram touched. No Packet-gap.
**Dispatch questions.** 002-3 repeated rules: REFL-001. 004-4 focus: checked, nothing (focus-request-in-effect used throughout; the single "Load more"/"Try again" button keeps focus). 004-5 port: checked, nothing (dev-page `NoRequests` guard). 005-1: REFL-002. 005-2: checked, nothing (clear on unmount, `resetPostsAtom` at all 3 session points, visit counter). 005-5 reused parts: checked, nothing (ButtonLink and `EmptyState.actionTo` added before use). Doc drift: REFL-004. Near-misses: REFL-005.

### REFL-001: "May write posts" and the mentoring directory address written again (sixth sighting)

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `FeedPage.tsx:91`, `DashboardPage.tsx:51`, `YourProfileBlock.tsx:38`, `MyProfilePage.tsx:42`; `FeedPage.tsx:87`, `CountsBlock.tsx:46` |
| Category | repeated-mistake |
| Vault reference | [[knowledge/lessons/LESSON-REQ-fs-002-3-new-helper-convert-every-sibling]], [[knowledge/lessons/LESSON-REQ-fs-004-2-one-rule-one-function-in-lib]] |

**What:** The ADR-02 rule "alumni or admin may write" exists four times and the mentoring directory address twice; `toPeopleState` is also written in both pages (same shape, different kind).
**Why it matters:** The lesson has been sighted five times already and each time review found the copies. Implement wrote the gap down (CAND-027, patterns doc "known gaps") instead of closing it. Same cost as before: one more fix round. Arch review has the same item (CAND-033); this is the vault-side count.
**Recommendation:** Add `canWritePosts(role)` to `lib/token.ts` (or `lib/contentOwner.ts`) with check cases and call it from the four places; export one `mentoringDirectoryAddress` from `lib/directoryQuery.ts`. Then delete the "known gaps" bullet in `docs/frontend-patterns.md`. Consider adding "the implement phase may not leave a written-down copy" to LESSON-REQ-fs-002-3's sixth sighting.

### REFL-002: Cancel stays live while an edit saves, and pattern 32 says the traps cannot arise

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `PostForm.tsx:564` (Cancel button), `FeedPost.tsx:155`, `CommentItem.tsx:176`, `docs/frontend-patterns.md` pattern 32 |
| Category | repeated-mistake |
| Vault reference | [[knowledge/lessons/LESSON-REQ-fs-005-1-disable-until-changed-has-three-traps]] |

**What:** Trap 3 of the lesson (a reset control must be off while a save runs) is still open: in `PostForm`/`CommentForm` Cancel is a plain `Button` with no `busy`/disabled, so Cancel during a save closes the edit, then the answer shows "Post saved" (or loses a failure message). The delete dialog's Cancel is guarded (ADV-004); the edit forms' is not. Pattern 32 states "none of the three traps arises", which is wrong for trap 3.
**Recommendation:** Ignore or disable Cancel while `sending.current`/`busy` in both forms (keep focus: use `aria-disabled` like `Button busy`), add it to the manual checklist, and reword pattern 32.

### REFL-003: The "400 on a reply means the comment replied to is gone" rule lives in a component, with its own constant

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `CommentsPanel.tsx:34,93-97` |
| Category | concept-drift |
| Vault reference | [[knowledge/lessons/LESSON-REQ-fs-005-4-a-layer-check-must-say-every-sentence]], [[knowledge/lessons/LESSON-REQ-fs-004-2-one-rule-one-function-in-lib]] |

**What:** `HTTP_BAD_REQUEST = 400` is declared locally while 403/404 sit in `lib/loadFailure.ts`, and the status-to-words choice for adding a comment (400 with a parent, 404, rest) is in the component, so `frontend-lib-check.ts` cannot reach it. Every sibling rule (`writeFailureText`, `isGone`) is in `lib/` with cases.
**Recommendation:** Add `isReplyTargetGone(failure, parentId)` (or a `commentAddFailureText`) to `lib/writeFailure.ts` with 400/404/500/network cases; import the 400 from `loadFailure.ts`.

### REFL-004: Vault and doc pages that now say something false (for wrap-up)

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | see list |
| Category | vault-stale |
| Vault reference | [[knowledge/components/frontend-app]], [[knowledge/concepts/paged-list-query]], [[knowledge/components/api-controllers-and-routes]], [[knowledge/concepts/latest-request-wins]] |

**What:** (1) `components/frontend-app.md` lines 6, 26, 35 still say feed and dashboard are "being built"; it names no `posts/`, `dashboard/` folders, `postAtoms`/`postActions`, or the five new `lib/` files. (2) `concepts/paged-list-query.md` says "`PostQuery.listPosts` - no filter"; it now takes `user_id` (shared alias `p` so count and rows agree). (3) `components/api-controllers-and-routes.md` lists `GET /api/posts` with no `user_id` (400 on a bad value). (4) `concepts/latest-request-wins.md` lists only part-2 loaders and does not mention the visit counter that stops a late write from patching after clear/reset. Docs likely affected (not vault): `docs/roadmap.md` F8/F9 "To do", root `CLAUDE.md` frontend paragraph ("feed, dashboard ... placeholders"), frontend-patterns "known gaps" once REFL-001 is fixed.
**Recommendation:** Update these at wrap-up step 3 and the doc sweep; needs-decision, no implementer.

### REFL-005: Two near-misses with the owner's safety rules, captured only as narrow tooling claims

| Field | Value |
|---|---|
| Severity | major |
| Effort | small |
| File | `lesson-candidates.md` CAND-003, CAND-014; `tasks/TASK-001.md:49`, `TASK-005.md:52` |
| Category | missing-vault-page |
| Vault reference | [[knowledge/gotchas#^g50|G50]] (nearest tooling gotcha), `.adlc/context/conventions.md` |

**What:** In one REQ, a throwaway script loaded the root `.env` and ran read-only SELECTs on the local database (stub keyed on one importer, `dotenv`/`pg` not blocked), and a store check loaded real axios (only an ESM hook; the repo is CommonJS under tsx). Both broke rules the owner states in every dispatch; neither is in the vault as a rule, only as CAND-003/014 (fixes for the specific hooks).
**Why it matters:** Every future REQ with a "prove it in a script" step will write another loader hook; the next one may run an INSERT or reach a network port. Today the only protection is the dispatch text.
**Recommendation:** At wrap-up merge CAND-003 and CAND-014 into one `trap` gotcha, "Throwaway checks that import app code": block `pg`, `dotenv`, `net`/`dns` and sockets first; hook both ESM and CommonJS resolvers; probe `require.cache` for `axios`/`pg` before the first call; never import under `backend/`; run from the scratchpad. Add one line to `context/conventions.md` pointing at it, so every implementer reads it.

(0 trivials not listed.)

### Round 2

Written by: reflector (tier: balanced). Re-checked m1, m5, m9 against LESSON-REQ-fs-002-3, 005-1, 004-2, 005-4 and grepped the tree for every old copy. 3 findings: 0 major, 3 minor. REFL-001 and REFL-003 are closed; REFL-002 is closed for Cancel only. No Packet-gap.

- REFL-001 RESOLVED: grep finds no `isWriter`, `hasAlumniProfile` or hand-written `role === "alumni"` left; `canWritePosts` has 4 cases, `mentoringDirectoryAddress` has cases incl. a round trip; MyProfilePage (part-2 file) was converted too (`MyProfilePage.tsx:44`). Pattern 33 and the Open points list are updated.
- REFL-002 RESOLVED for Cancel (`PostForm.tsx:182`, `CommentForm.tsx:131` use `busy`; pattern 32 now says trap 3 applies). Sibling gap: REFL-006.
- REFL-003 RESOLVED: `isReplyTargetGone`, `commentAddFailureText` in `lib/writeFailure.ts` with 10 cases; the 400 sits in `loadFailure.ts`.
- REFL-004, REFL-005: still open for the owner (wrap-up).

### REFL-006: Other controls still reset or replace the open edit/reply while a save runs (trap 3, siblings)

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `CommentItem.tsx:178-195` (Reply/Edit stay live), `CommentsPanel.tsx:103-110` (`setActiveState(null)` on success), `docs/frontend-patterns.md:811` |
| Category | repeated-mistake |
| Vault reference | [[knowledge/lessons/LESSON-REQ-fs-005-1-disable-until-changed-has-three-traps]] (trap 3), [[knowledge/lessons/LESSON-REQ-fs-002-3-new-helper-convert-every-sibling]] |

**What:** m5 settled Cancel only. While a comment is sent or an edit saves, the Reply and Edit buttons of other comments stay live. A click sets a new reply or edit, then the answer arrives and `setActiveState(null)` (add) or `closeEdit` (edit) wipes it, and focus jumps. Same shape as trap 3.
**Why it matters:** The lesson says "every control that resets the form"; the fix round did the one the review named, not its siblings. Pattern 32 ("the answer never lands on an edit or reply that Cancel already closed") now reads as complete but is true only for Cancel.
**Recommendation:** Clear the panel's `active` only if it still equals the one that was sent (compare ids), or make the other Reply/Edit buttons busy while a save runs. Say so in pattern 32. Low risk to the owner: no data loss, only a lost click.

### REFL-007: `toPeopleBlockState` is a pure rule with no check cases

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `frontend/src/store/peopleBlockState.ts:12`, `scripts/frontend-lib-check.ts` |
| Category | concept-drift |
| Vault reference | [[knowledge/lessons/LESSON-REQ-fs-005-4-a-layer-check-must-say-every-sentence]], [[knowledge/lessons/LESSON-REQ-fs-004-2-one-rule-one-function-in-lib]] |

**What:** The merged mapper (idle, or a list loaded for the other kind, counts as loading) lives in `store/` only because it names `PeopleState`. The library check cannot reach it, and the "never a frame of the other page's list" rule (pattern 23/33) is the one that matters.
**Recommendation:** Declare a small input shape in `lib/` (as `loadFailure.ts` does) and add 4 cases: idle, other kind, ready, error. Or write in the patterns doc that it stays uncovered. Needs-decision.

### REFL-008: Doc drift left after the fix round (for wrap-up)

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `docs/frontend-patterns.md:811`, `lesson-candidates.md` |
| Category | vault-stale |
| Vault reference | [[knowledge/lessons/LESSON-REQ-fs-005-1-disable-until-changed-has-three-traps]] |

**What:** (1) Counts: 469 matches in both places that name it; no 434 is left. The architecture ADV-004 row matches the code (closeConfirm now always clears the flag). (2) Pattern 32 and the lesson say "the dialog's Cancel is guarded", but the lesson's own "Saw it in" has no REQ-fs-006 sighting: add it at wrap-up (trap 3 on edit forms, found by review, not by implement). (3) LESSON-REQ-fs-002-3 gets its sixth sighting (REQ-fs-006: four role copies and two address copies, written down as known gaps, closed in review round 1). (4) `lesson-candidates.md` has two entries numbered CAND-043 (the dialog claim and the null-narrowing claim): renumber one before wrap-up verdicts.

(0 trivials not listed.)

### Round 3

Written by: reflector (tier: balanced). Read the four files, `CommentForm.tsx`, `useFormError` use, `writeFailure.ts`, `peopleBlockState.ts`; grepped every use of `addCommentAtom`/`saveCommentAtom`. 0 major, 4 findings (1 minor, 3 trivial). REFL-006 is RESOLVED for its scenarios; no stuck flag. No Packet-gap.

- Scenario 1 (reply A sent, reply B started): `sentFrom` differs, so no clear and no focus request; the form's reset empties only text equal to what was sent, so B's own typing survives. OK.
- Scenario 2 (edit A saving, edit B started): A's form is already unmounted; `editingRef` is false, so no `closeEdit`, no focus move; B survives. OK.
- Scenario 3: reply-target-gone clears the reply only if unchanged; blank path returns COMMENT_REQUIRED_MESSAGE. Gaps: REFL-009, REFL-010.
- Scenario 4 (Cancel): `endEdit(id)` and `handleCancelReply` still close; Cancel is `busy` during a send. OK. Scenario 5: `sending`/`busy` live in the form and are reset after the await; `deletingRef` reset after its await; no path leaves one true on a live form.
- n3: only `CommentsPanel.tsx` and `CommentItem.tsx` call the two atoms (grep also covers `pages/` and the dev page: no other caller); both check `"blank" in result`. OK. Pattern 9 (callers, `commentAddFailureText` order, `isReplyTargetGone`) and pattern 33 (`toPeopleBlockState`, `canWritePosts`, `mentoringDirectoryAddress`, `countText` all exist where named) are true to the code.
- REFL-004 and REFL-005: still open for the owner.

### REFL-009: A 404 on a comment save still pulls focus away from the edit or reply started meanwhile

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `CommentItem.tsx:117-121` (handleSave 404 branch), `CommentsPanel.tsx` (`onRemoved={requestFieldFocus}`) |
| Category | repeated-mistake |
| Vault reference | [[knowledge/lessons/LESSON-REQ-fs-005-1-disable-until-changed-has-three-traps]] (trap 3) |

**What:** The success path now checks `editingRef`, but the 404 path calls `onRemoved()` unconditionally. If the user started an edit or reply on B while A's save ran, the focus request moves focus to the bottom comment field, out of B's box. Same for a 404 on a delete (the dialog is modal, so only the save path is reachable).
**Recommendation:** Request focus only if the removed comment's edit was the active one (reuse `editingRef`). Cost is a lost caret, no data lost.

### REFL-010: A failed send shows its message under a reply started meanwhile

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `CommentsPanel.tsx` (handleAdd failure), `CommentForm.tsx:84-87` |
| Category | state-consistency |

**What:** Reply A fails (500, or 400) after the user began a reply to B in the same form: the form shows the failure text, for example "the comment you replied to is gone", above B's "Replying to" line. The reply is not wiped (good), but the words point at the wrong target.
**Recommendation:** Leave, or return the failure text only when `unchanged`. Also an edge: edit A, edit B, then edit A again before A's answer: the old save closes the new edit of A (`editingRef` is true again; `endEdit` matches by id). Narrow; note, do not fix.

### REFL-011: Pattern 32 does not mention the rule that closes trap 3 for the other buttons

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `docs/frontend-patterns.md` pattern 32 (trap 3 sentence), pattern 33 (`m14`) |
| Category | vault-stale |

**What:** Pattern 32 says Cancel is off while a save runs. It is silent on the other half of REFL-006 (Reply/Edit stay live; the panel clears `active` only if it is still the one that was sent, `activeRef` in `CommentsPanel`, `editingRef` in `CommentItem`). Pattern 33 also names "m14" with no gloss; a reader of the docs cannot look it up.
**Recommendation:** One sentence in pattern 32 pointing at `changeActive`/`endEdit`; say "the review item to move the mappers" instead of "m14". Wrap-up: add the REQ-fs-006 sighting of trap 3 to LESSON-REQ-fs-005-1 (see REFL-008).

(0 trivials not listed.)

## UI/UX findings

Written by: ui-reviewer (tier: balanced)

**Summary:** Headless Edge driven over its debugging port against a throwaway mock API and Vite config (both outside the repo; nothing sent to port 3000). I exercised Feed, Dashboard, profile Recent posts and `/dev/components` at 1280 and 360 in light and dark, a real Tab pass, the delete dialog, every load/empty/error/student state, each dashboard block failing alone, slow and double-pressed writes, 403/404 on writes, and a load-more racing a publish. No critical or major finding; 3 minor. Biggest: the Edit form's Save is enabled with no change and sends a PUT. Answers: focus rings checked, nothing wrong (3px ring on every stop, order follows the page); delete dialog checked, nothing (focus on Cancel, Esc restores focus to the Delete button, Esc ignored while deleting, double press sends one DELETE, focus lands on the hidden "Posts" h2 after delete and after a 404); student sends no `/api/alumni/me` (checked in the mock's log); one failing dashboard block leaves the other three intact; 360px has no horizontal overflow, 200% zoom (640 css px) has none; the 360-at-200% case (180 css px) overflows, below the 320px reflow floor, so not a finding.

### UI-001: Dashboard and profile post links are all named "No comments yet"

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| Route / flow | `/dashboard` Recent posts; `/directory/:id` Recent posts |
| Lens | a11y |
| Evidence | `ui-evidence/dashboard-alumni-1280-light.png`, `ui-evidence/profile-recent-posts-1280-light.png`; DOM: three `<a href="/feed">No comments yet</a>` |

**What:** each summary card's only link is the comment count text and goes to `/feed` (`PostSummaryCard.tsx:49`).
**Why it matters:** a screen-reader links list shows three identical names with no post context (WCAG 2.4.4); the link also does not open that post.
**Recommendation:** add a visually hidden suffix or `aria-label` naming the post (author and date) on that link.

### UI-002: Edit form Save is enabled with no change and sends a PUT

| Field | Value |
|---|---|
| Severity | minor (role guide rates "submit on a pristine form" major; spec C8 is silent, so your call) |
| Effort | small |
| Route / flow | `/feed` - Edit on an own post |
| Lens | interaction-state |
| Evidence | mock log after Edit then Save untouched: `PUT /api/posts/4`; `ui-evidence/feed-edit-empty-error.png` |

**What:** Save is enabled the moment Edit opens and an unchanged Save calls the API and bumps `updated_at`. Empty text is refused inline (good); double press sends one PUT (good).
**Why it matters:** a pointless write and a false "saved" signal. The sibling AccountCard already disables Save until changed (`AccountCard.tsx:162`).
**Recommendation:** in PostForm (edit mode, `PostForm.tsx:78`) and the comment edit, treat unchanged text as pristine: disable Save or close the editor without a request.

### UI-003: A refused new comment (403) shows the "can no longer be changed" wording

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| Route / flow | `/feed` - Comment form, server answers 403 |
| Lens | flow |
| Evidence | `ui-evidence/feed-comment-403.png`; text: "This comment can no longer be changed. It may have been deleted..." |

**What:** `CommentsPanel.tsx:134` sends an add failure through the edit wording (`text.ts:323`). The typed text is kept (good).
**Why it matters:** the user was adding a comment, not changing one; the message points at the wrong action.
**Recommendation:** give the add path its own 403 line ("You cannot comment here") in `text.ts`.

(2 trivials not listed: the 404-on-comment case leaves the deleted post in the list with its message; each post renders its own hidden delete dialog, so 10 posts mean 10 empty "Delete this post?" headings in the DOM.)

Checked, nothing: pending state on Publish, Comment, Save, Delete (label changes, `aria-disabled`, one request); empty, loading and error states on Feed, Dashboard and profile; load-more failure shows an alert and retry works; load-more racing a publish gives no duplicate post; admin sees Delete on all posts; student sees the read-only note on Feed and sends no write controls; dark theme and 360px match the design screens in layout; no console errors; the only failed requests were the ones I forced.

**Processes:** I started a mock API (port 3991), a Vite server (5391) and headless Edge (9333) and stopped all three; ports are free, the throwaway profile is deleted, port 3000 untouched. The scripts remain in the scratchpad only.

**UI review tier:** headless -
Feed, Dashboard, profile Recent posts, `/dev/components`; 40 screenshots in `ui-evidence/`; 0 critical / 0 major / 3 minor.

### Round 2

Written by: ui-reviewer (tier: balanced)

**Summary:** Headless Edge against a throwaway mock API (3991) and Vite (5391, own config, nothing sent to 3000). All six round 2 checks (a to f) pass; I found one new trivial. Feed, Dashboard, profile and `/dev/components` at 1280 and 360, light and dark: 16 screenshots, 13 byte-identical to round 1, no overflow, no console errors. The student view has no composer, no Write a post link, no Edit or Delete and sends no `/api/alumni/me` request. UI-002 is still open (owner's call, unchanged).

- UI-001 resolved: the accessibility tree now names the links "No comments yet , on the post by Ada Admin from 6 October 2026" and so on, all different, on Dashboard and profile; cards look the same (`ui-evidence/dashboard-alumni-1280-light-round2.png`).
- UI-003 resolved: a forced 403 on a new comment shows "You cannot comment on this post. Your comment was not sent." and keeps the typed text (`feed-comment-403-round2.png`).
- m4 delete dialog (checked): Escape while the delete runs closes the dialog; one DELETE only. A forced 500 after the close shows as a toast (`feed-delete-failure-toast-round2.png`); with the dialog still open it shows inline and no toast. With the keyboard, focus returns to that post's Delete button (`feed-delete-escape-keyboard-round2.png`); after a successful delete focus lands on the hidden Posts heading; the dialog opened again for another post, and after a failure, with one DELETE per press.
- m5 (checked): Cancel on the post edit and the comment edit does nothing during a save (both buttons `aria-disabled`, focus stays), then the result shows and focus returns to Edit (`feed-edit-cancel-during-save-round2.png`, `feed-comment-edit-cancel-during-save-round2.png`).
- m2/m3 (checked): a post that showed "1 comment" while the server held 3 changed to "3 comments" when its thread opened (`feed-thread-count-synced-round2.png`).
- Dev page (checked): `composes` page is pixel-identical to round 1 at 1280 light; 1280 dark differs by 21 pixels in one column (a caret). At 360 the page is 14px shorter at its very end (content above identical, first 35760 rows).

### UI-004: Load more racing a write can show a total one off until the next load

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| Route / flow | `/feed` - Load more in flight while publishing or deleting |
| Lens | interaction-state |
| Evidence | `ui-evidence/feed-race-total-round2.png`; text "Showing 20 of 27 posts" (publish case) and "Showing 19 of 23 posts" (delete case) |

**What:** I held the page 2 request in the mock until after the write, so the server answer already counted the write. The client then applies the write again: 26 real posts shown as 27, and 24 real as 23. No duplicate cards; Load more stays, and the next answer corrects the number ("26 of 26").
**Why it matters:** only when the server reads after the write while the answer lacks the post's id; the usual order (read first) gives the right total. Self-healing, so I rate it trivial.
**Recommendation:** none needed; if wanted, `totalAfterAnswer` (`postAtoms.ts`) could trust the answer's total when a write completed before the answer arrived.

Checked, nothing: Load more racing a publish gives no duplicate card; no console error or failed request except the forced ones.

**Processes:** I started a mock API (3991), Vite (5391) and headless Edge (9333, throwaway profile in the scratchpad) and stop all three before finishing; port 3000 untouched.

**UI review tier (round 2):** headless - Feed, Dashboard, profile, `/dev/components`, student view; 25 new `*round2*` screenshots; 0 critical / 0 major / 0 minor / 1 trivial new (UI-004).
