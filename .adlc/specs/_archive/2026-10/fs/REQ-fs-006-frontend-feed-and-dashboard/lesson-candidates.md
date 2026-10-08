## CAND-001 [implement-task]
**Claim:** Read a post's comments at `GET /api/posts/:id/comments`, not under `/api/comments`; share the posts path constant instead of writing it twice.
**Saw it in:** `backend/src/api/routes/PostRoutes.ts:15`, `frontend/src/services/commentService.ts:8`
**Context:** The route is bound in PostRoutes to a CommentController method, so the comment service needs the posts path.

## CAND-002 [implement-task]
**Claim:** A service file nothing imports yet is still type-checked: the frontend build runs `tsc -b` over all of `src` before Vite.
**Saw it in:** `frontend/package.json:6`, `frontend/tsconfig.app.json:26`
**Context:** Tier-0 services land before the store uses them; a green build is real evidence, not tree-shaken silence.

## CAND-003 [implement-task]
**Claim:** When stubbing the db for a throwaway script, redirect every `config/db` import (and block `pg`/`dotenv` outright), not just the one in the file under test.
**Saw it in:** `backend/src/dal/query/transaction.ts` (imports `../config/db`), `backend/src/dal/query/PostQuery.ts:1`
**Context:** A loader hook keyed on PostQuery's parent missed the real pool; the first run loaded the root .env and ran two read-only SELECTs against the local DB.

## CAND-004 [implement-task]
**Claim:** Don't test "no WHERE" by searching the SQL for `WHERE`: the post read has a `WHERE` inside its comment-count subquery; search for the filter text instead.
**Saw it in:** `backend/src/dal/query/PostQuery.ts:26`
**Context:** My own check flagged the unfiltered query as filtered.

## CAND-005 [implement-task]
**Claim:** An ESM throwaway script run through tsx must be `.mts` (or sit under a `"type": "module"` package) to use top-level await.
**Saw it in:** scratchpad `main.ts` failed with "Top-level await is currently not supported with the cjs output format"
**Context:** The scratchpad has no package.json, so tsx compiled `.ts` as CommonJS.

## CAND-006 [implement-task]
**Claim:** Give config/text.ts save-failure objects the SaveFailureWords shape without importing the type; TypeScript checks them structurally at the use site.
**Saw it in:** `frontend/src/config/text.ts` (POST_SAVE_FAILURE_WORDS, COMMENT_SAVE_FAILURE_WORDS)
**Context:** text.ts must stay import-free (the Vite config reads config files), yet lib/saveFailure.ts owns the type.

## CAND-007 [implement-task]
**Claim:** saveFailureText folds 403 and 404 into one "gone" reason; a page whose 403 and 404 mean different things must check the status first.
**Saw it in:** `frontend/src/lib/saveFailure.ts:40`
**Context:** Post/comment edit and delete need "only your own" on 403 but "already deleted, removed" on 404 (AC18).

## CAND-008 [implement-task]
**Claim:** Don't call `Date.parse`/`new Date` on API dates without a shape check: V8's fallback parser reads "1" as 1 January 2001.
**Saw it in:** `frontend/src/lib/postDisplay.ts:29`
**Context:** dateText must show nothing for unreadable text (C9); `ISO_DATE_START` guards it.

## CAND-009 [implement-task]
**Claim:** In a thread fixture, "an unknown id" must be an id no comment points to; a missing parent id is not unknown to `removeWithReplies`.
**Saw it in:** `scripts/frontend-lib-check.ts` ("remove: an unknown id")
**Context:** My first fixture used 99, the gone parent of comment 6, and the case failed (correctly).

## CAND-010 [implement-task]
**Claim:** Run the out-of-repo copy of the library check from `frontend/` so `@alumni/shared` would resolve; rewrite only the `../frontend/src/` imports.
**Saw it in:** scratchpad `lib-check-fail-copy.ts`
**Context:** Type-only imports are erased by tsx today, but a value import from the shared package would fail from the scratchpad.

## CAND-011 [implement-task]
**Claim:** Write timezone-proof date cases with zone-less ISO text ("2026-10-03T09:15:00"): the spec reads it as local time.
**Saw it in:** `scripts/frontend-lib-check.ts` (date cases)
**Context:** A "Z" date near midnight gives a different local day in other zones and makes the check flaky.

## CAND-012 [implement-task]
**Claim:** A link drawn as a button must set its own `:hover` text color: base.css `a:hover` (0,1,1) beats a composed `.primary` (0,1,0).
**Saw it in:** `frontend/src/styles/base.css:43`, `frontend/src/components/ui/ButtonLink/ButtonLink.module.css`
**Context:** Without it a primary ButtonLink turns --accent-soft-text on the accent fill on hover, a contrast failure.

## CAND-013 [implement-task]
**Claim:** `npm run build` does not bundle a component nothing imports, so a broken `composes` path in its stylesheet passes; build it once from a scratch Vite lib entry outside the repo.
**Saw it in:** `frontend/src/components/ui/ButtonLink/ButtonLink.module.css`
**Context:** tsc type-checks the new .tsx files, but CSS Modules are resolved only by Vite when the file is reached.

## CAND-014 [implement-task]
**Claim:** To fake modules under tsx, hook the CommonJS resolver (`Module._resolveFilename`) too: with no `"type": "module"`, the store's imports are `require()` calls an ESM `resolve` hook never sees.
**Saw it in:** `frontend/package.json` (no "type"), scratchpad `storecheck/register.mjs`
**Context:** My first store check only had an ESM hook, so the real services and axios loaded; a socket block kept them offline. Probe `require.cache` for axios before calling any loader.

## CAND-015 [implement-task]
**Claim:** A write's "count" patch that is not idempotent (+1 comment) must also check the visit, not only `status === "ready"`: a reload can already contain the change.
**Saw it in:** `frontend/src/store/postAtoms.ts` (`currentPostsVisit`), `frontend/src/store/postActions.ts` (`startWrite`)
**Context:** Leave the feed and come back while a comment is in flight: without the visit check the count goes up twice.

## CAND-016 [implement-task]
**Claim:** Read where a comment sits (post id, 1 + replies) when the delete starts, not when it answers: the thread may close or change meanwhile.
**Saw it in:** `frontend/src/store/postActions.ts` (`locateComment`)
**Context:** ADV-003: the count must still drop for the right post after the thread was closed.

## CAND-017 [implement-task]
**Claim:** Do not put EmptyState inside a Card: it has its own dashed border and padding, so the box doubles; draw a prompt (h3, text, ButtonLink) instead.
**Saw it in:** `frontend/src/components/dashboard/YourProfileBlock/YourProfileBlock.tsx` (`Prompt`)
**Context:** The "no profile yet" and student prompts sit in a card as drawn in dashboard.html.

## CAND-018 [implement-task]
**Claim:** An `aria-labelledby` must only be set when the labelling element is rendered; a conditional label needs a conditional attribute.
**Saw it in:** `frontend/src/components/posts/PostSummaryCard/PostSummaryCard.tsx`
**Context:** A profile summary card with no readable date would otherwise point at an id that does not exist.

## CAND-019 [implement-task]
**Claim:** Per-block loading words in text.ts go unused while SkeletonGroup takes no label; decide once whether blocks announce their own loading words.
**Saw it in:** `frontend/src/config/text.ts:387` (PEOPLE_LOADING and four siblings)
**Context:** TASK-004 wrote them; TASK-008 found no place that can say them.

## CAND-020 [implement-task]
**Claim:** A 404 that makes the store remove an item also unmounts the form or dialog that would show the error; send those words to a toast.
**Saw it in:** `frontend/src/components/posts/FeedPost/FeedPost.tsx` (handleSave, handleConfirmDelete)
**Context:** The task asked for "already gone" inside the open dialog; the store's 404 removal makes that impossible.

## CAND-021 [implement-task]
**Claim:** Put the focus request in the same event as the state change that brings the target back, and focus in an effect after the commit.
**Saw it in:** `frontend/src/components/posts/CommentItem/CommentItem.tsx` (focusEditRequest)
**Context:** Edit is hidden while editing; a focus() in the save handler would hit a button not drawn yet.

## CAND-022 [implement-task]
**Claim:** The status-first write-failure mapping (403 own, 404 gone, else saveFailureText) is now written twice; a lib helper taking the words would make it one rule.
**Saw it in:** `frontend/src/components/posts/FeedPost/FeedPost.tsx` (postWriteFailureText), `CommentItem.tsx` (commentWriteFailureText)
**Context:** No task named a lib file for it, so it stayed local (pattern 28 says one rule, one function).

## CAND-023 [implement-task]
**Claim:** Start a per-section load in a child drawn only when the parent data is ready; its effect then starts and clears with that data, no status checks in the page's effect.
**Saw it in:** `frontend/src/pages/AlumniProfilePage/AlumniProfilePage.tsx` (ProfileRecentPosts)
**Context:** Moving profile A to B unmounts the block while B loads, so the cleanup clears A's posts before B's are asked for (AC28).

## CAND-025 [implement-task]
**Claim:** When a task makes one helper for a rule, list every file that tests the same status, not only the copies a note named; grep for the status constant before writing the file list.
**Saw it in:** `frontend/src/components/posts/CommentsPanel/CommentsPanel.tsx:89` and `:131`
**Context:** TASK-014 listed FeedPost and CommentItem; CommentsPanel's two 404 checks were missed, so its grep acceptance cannot pass in scope (LESSON-REQ-fs-002-3 again).

## CAND-024 [implement-task]
**Claim:** Key a page's load-and-clear effect on the session's userId (and role class), not only on mount, so a user change while the page is open clears and reloads.
**Saw it in:** `frontend/src/pages/DashboardPage/DashboardPage.tsx` (the one useEffect)
**Context:** A mount-only effect would leave the old user's role-gated block (myAlumniAtom) unloaded or stale after a token change elsewhere.

## CAND-026 [implement-task]
**Claim:** When a button changes meaning after a failure ("Load more" to "Try again"), keep one element and swap its label, so keyboard focus stays on it.
**Saw it in:** `frontend/src/pages/FeedPage/FeedPage.tsx` (the Load more button)
**Context:** Two separate buttons would unmount the focused one on failure and on retry, dropping focus to the page body.

## CAND-027 [implement-task]
**Claim:** The "alumni or admin may write" rule and the mentoring directory address are each written in several files now; give each one function in lib/ before a fifth copy appears.
**Saw it in:** `frontend/src/pages/FeedPage/FeedPage.tsx` (isWriter, MENTORING_DIRECTORY), also DashboardPage, YourProfileBlock, MyProfilePage, CountsBlock
**Context:** lib/ files were outside TASK-009's blast radius, so the page copies them; follow-up for review (LESSON-REQ-fs-002-3).

## CAND-028 [implement-task]
**Claim:** A component that calls store write actions on a press cannot be shown live on the dev page; wrap it in a capture-phase press guard (onClickCapture, onAuxClickCapture, onSubmitCapture with preventDefault + stopPropagation) so Tab still works but no press reaches it.
**Saw it in:** `frontend/src/pages/dev/ComponentsPage/ComponentsPage.tsx:1185` (NoRequests)
**Context:** FeedPost and CommentItem own their Save and Delete calls; without the guard the dev server proxies /api to whatever listens on port 3000.

## CAND-029 [implement-task]
**Claim:** Keep a list component's states (loading, error, empty, thread) in a props-only inner part, so the dev page can show them without copying its CSS.
**Saw it in:** `frontend/src/pages/dev/ComponentsPage/ComponentsPage.module.css:484` (copy of CommentsPanel's ground and lists)
**Context:** CommentsPanel reads commentsAtom, so the dev page drew its states from parts and copied five CSS rules that can now drift.

## CAND-030 [implement-task]
**Claim:** A state that lives in a component's own useState (FeedPost editing, its delete dialog) cannot be set from props, so the dev page can only draw a copy of it; expose such states as props when they must be reviewed.
**Saw it in:** `frontend/src/pages/dev/ComponentsPage/ComponentsPage.tsx:1433` (FeedPostSamples)
**Context:** CommentItem takes `editing` as a prop and shows live; FeedPost does not, so its editing state is rebuilt from PostByline + PostForm.

## CAND-031 [implement-task]
**Claim:** When a placeholder page becomes real, grep the patterns doc for its name; "being built" examples go stale silently.
**Saw it in:** `docs/frontend-patterns.md` pattern 14 "Where it lives" (named DashboardPage as being built)
**Context:** Found while writing TASK-013; the example now points at UsersPage.

## CAND-032 [review-arch]
**Claim:** Keep an atom's "right key for this page" check in the store (a selector), not in each page.
**Saw it in:** `frontend/src/pages/DashboardPage/DashboardPage.tsx:57-80` (and FeedPage.tsx:97, AlumniProfilePage.tsx:305)
**Context:** One atom per kind with a key makes every page re-write the same idle/other-key-to-loading mapping.

## CAND-033 [review-arch]
**Claim:** A role rule used by two screens goes in lib/ once, with a lib-check case, even if it is one line.
**Saw it in:** `frontend/src/pages/FeedPage/FeedPage.tsx:91` and `DashboardPage.tsx:51` (`isWriter`)
**Context:** Same ADR-02 rule copied byte for byte into two pages.

## CAND-034 [review-qual]
**Claim:** Do not copy a stylesheet into the dev page; use CSS Modules `composes` so the page cannot drift from the component.
**Saw it in:** `frontend/src/pages/dev/ComponentsPage/ComponentsPage.module.css` (.commentPanel) vs `CommentsPanel.module.css:7`
**Context:** A "change both together" comment is a drift warning, not a fix.

## CAND-035 [review-qual]
**Claim:** Export a text constant only when another file reads it; add a grep-for-readers pass at wrap-up of each UI part.
**Saw it in:** `frontend/src/config/text.ts:283,350,368,398`
**Context:** Six loading/alt constants were written for skeletons that never used them.

## CAND-036 [review-qual]
**Claim:** Plural and fallback logic that lives in config/text.ts has no lib-check case; put such rules in lib/ or add cases.
**Saw it in:** `frontend/src/config/text.ts:260,309` (postDeleteBody, commentDeleteBody, dashboardGreeting)
**Context:** The no-test-runner check only covers lib/, so text functions with branches go unchecked.

## CAND-037 [review-corr]
**Claim:** A loader that writes a server total after an await must re-apply the local adds and removes made during the call, or derive total from the held list.
**Saw it in:** `frontend/src/store/postAtoms.ts:7924-7931`
**Context:** Load more overwrote the total that a publish had just raised.

## CAND-038 [review-corr]
**Claim:** When a busy guard ignores a dialog's close request, also handle the browser closing the native dialog anyway, or the open flag and the element disagree.
**Saw it in:** `frontend/src/components/posts/FeedPost/FeedPost.tsx:6105-6111`
**Context:** closeConfirm returns early while deleting, but useModalDialog's close event can still close the element.

## CAND-039 [ui-review]
**Claim:** A link whose only text is a count ("No comments yet") needs a hidden name for its post, or a links list shows identical names.
**Saw it in:** `frontend/src/components/posts/PostSummaryCard/PostSummaryCard.tsx:49`
**Context:** Dashboard and profile Recent posts show three links with the same name, all to /feed.

## CAND-040 [ui-review]
**Claim:** Every in-place edit form needs the same "disabled until changed" rule as AccountCard; copy it when a second edit form is built.
**Saw it in:** `frontend/src/components/posts/PostForm/PostForm.tsx:78`
**Context:** Edit then Save with no change sent a PUT; AccountCard.tsx:162 already guards this.

## CAND-041 [ui-review]
**Claim:** Map each write's failure to its own wording; a shared edit message on the add path reads as the wrong action.
**Saw it in:** `frontend/src/components/posts/CommentsPanel/CommentsPanel.tsx:134`
**Context:** A 403 on adding a comment showed "This comment can no longer be changed."

## CAND-042 [ui-review]
**Claim:** When a UI check stores a theme key, the emulated colour scheme is ignored; set the app's own theme key for dark shots.
**Saw it in:** `.adlc/context/design-system.md` (theme persistence)
**Context:** My first "dark" screenshots were light because the login helper set `ua.theme=light`.

## CAND-043 [implement-task]
**Claim:** Never ignore a native `<dialog>` close request in the caller's flag; the browser closes it on a second Escape anyway, so the flag must follow and late answers go elsewhere.
**Saw it in:** `frontend/src/components/posts/FeedPost/FeedPost.tsx` (closeConfirm), `frontend/src/hooks/useModalDialog.ts` (handleClose)
**Context:** CORR-003: an early return in closeConfirm left `open` true on a closed dialog, so a delete failure went into a hidden dialog.

## CAND-044 [implement-task]
**Claim:** Button spreads its props before its own `aria-disabled`, so a caller cannot pass `aria-disabled`; use `busy` to soft-disable a secondary button.
**Saw it in:** `frontend/src/components/ui/Button/Button.tsx` (aria-disabled after `{...buttonProps}`)
**Context:** Making Cancel inert during a save (REFL-002); `busy` also sets `aria-busy` on Cancel, which is the price.

## CAND-058 [implement-task]
**Claim:** When folding a null check into a shared helper, keep the `x !== null &&` part if later JSX reads `x.field`; TypeScript narrows only on the inline check.
**Saw it in:** `frontend/src/pages/MyProfilePage/MyProfilePage.tsx:44`
**Context:** canWritePosts(role) alone broke the build at `session.userId` (TS18047), though the behaviour was the same.

## CAND-045 [implement-task]
**Claim:** To reuse a component's look on the dev page, `composes` each class from its stylesheet; its media-query rules come along with the class, so delete the copied phone rule too.
**Saw it in:** `frontend/src/pages/dev/ComponentsPage/ComponentsPage.module.css` (.commentPanel, .threads, .replies, .reply)
**Context:** QUAL-004: 35 copied lines with "change both together"; the phone indent of `.replies` lived in two media queries.

## CAND-046 [implement-task]
**Claim:** When a list total is patched locally and also reloaded, log each local change with its id and apply the ones made during the call to the answer, skipping ids the answer already holds.
**Saw it in:** `frontend/src/store/postAtoms.ts:170` (totalAfterAnswer)
**Context:** CORR-001: a late Load more answer replaced the patched total, showing "21 of 20"; a plain counter double-counts a deleted post the answer still contains.

## CAND-047 [implement-task]
**Claim:** To prove a store fix fails before it, copy the HEAD version (git show) into the scratchpad with absolute imports and point the fake-service harness at it by an env var.
**Saw it in:** scratchpad `storecheck/harness.mjs` (STORE_UNDER_TEST=old)
**Context:** No git write (stash) allowed; the copy also exposed that an unsent-on-blank guard otherwise hangs on a never-answered fake call.

## CAND-048 [review-arch]
**Claim:** A pure mapper whose output type is a component prop type has no good home: lib cannot import the store, so name where such mappers live before the second copy appears.
**Saw it in:** `frontend/src/store/peopleBlockState.ts:4`
**Context:** m1 put `toPeopleBlockState` in store/ with a type-only import up from components/ (ARCH-004).

## CAND-049 [review-arch]
**Claim:** When a config file imports a lib function, say so in its header and check that the lib file imports nothing, because only a comment keeps the cycle out.
**Saw it in:** `frontend/src/config/text.ts:4-9`, `frontend/src/lib/postDisplay.ts:7`
**Context:** ARCH-005: `loadFailure -> text -> postDisplay` is acyclic today by convention only.

## CAND-059 [review-reflect]
**Claim:** When a fix covers a lesson's trap, list every control that can change the same state during the call, not only the one the finding named.
**Saw it in:** `frontend/src/components/posts/CommentItem/CommentItem.tsx:178` (Reply/Edit live while a save runs)
**Context:** m5 made Cancel busy; other comments' Reply/Edit still replace the open edit, and the answer then clears it.

## CAND-060 [review-reflect]
**Claim:** A pure mapper that must sit in store/ for a type should get its input shape declared in lib/, or it has no check cases.
**Saw it in:** `frontend/src/store/peopleBlockState.ts:12`
**Context:** Same as LESSON-REQ-fs-005-4; the merge of the two copies (m1) moved the rule to where the check script cannot reach.

## CAND-050 [review-qual]
**Claim:** When a fix round deletes a "known gap" from docs, grep the docs for every other sentence that points at it.
**Saw it in:** `docs/frontend-patterns.md:581`
**Context:** The Open points entry on copied CSS was removed; pattern text still says "see Open points".

## CAND-051 [review-qual]
**Claim:** When a new named constant replaces a magic number, replace every copy in the same fix.
**Saw it in:** `frontend/src/store/postActions.ts:75`
**Context:** HTTP_BAD_REQUEST was added for one rule while a second file wrote 400 again.

## CAND-061 [review-corr]
**Claim:** "Skip a logged change when the answer already holds that item" only works if the answer's page can hold the item; for a later page, a write made during the call stays ambiguous.
**Saw it in:** `frontend/src/store/postAtoms.ts:170`
**Context:** CORR-004: page-1 posts never appear in a page-2 answer.

## CAND-062 [review-corr]
**Claim:** A sentinel status used by a store guard (400 for blank text) is read by later code as the server's meaning of that status; give guards their own kind.
**Saw it in:** `frontend/src/store/postActions.ts:75`, `frontend/src/lib/writeFailure.ts:50`
**Context:** CORR-005.

## CAND-052 [ui-review]
**Claim:** After a local total patch, a late Load more answer that already counts the write (but lacks its id) is patched twice: 27 shown for 26 real.
**Saw it in:** `frontend/src/store/postAtoms.ts` (totalAfterAnswer)
**Context:** UI-004; self-heals on the next load, rated trivial. Reproduce by delaying page 2 in a mock until after a publish or delete.

## CAND-053 [ui-review]
**Claim:** To get an element-level proof of "looks the same", compare new screenshots with the old ones byte for byte, then pixel by pixel in a canvas inside the headless page (no image library needed).
**Saw it in:** scratchpad `ui-review/r14.mjs` (not in repo)
**Context:** 13 of 16 round 2 shots were byte-identical to round 1; the other three differed by 21 pixels and a 14px page-end height.

## CAND-054 [implement-task]
**Claim:** When an async answer closes a shared "one active at a time" state, compare against the value it was sent from (kept in a ref) instead of setting null.
**Saw it in:** `frontend/src/components/posts/CommentsPanel/CommentsPanel.tsx` (handleAdd, endEdit)
**Context:** REFL-006: a late send or save wiped a reply or edit the user started meanwhile and moved focus.

## CAND-055 [implement-task]
**Claim:** A guard that refuses before any call returns its own result variant, never a borrowed HTTP status that callers map to server meanings.
**Saw it in:** `frontend/src/store/postActions.ts` (BLANK_TEXT)
**Context:** QUAL-009/CORR-005: the blank guard's made-up 400 read as "the comment you replied to is gone".

## CAND-056 [review-quality]
**Claim:** When a fix moves a rule (a mapping, a copy, a count), grep the docs and the file header comments for the old wording in the same round; both went stale in rounds 2 and 3.
**Saw it in:** `docs/frontend-patterns.md` (QUAL-008), `frontend/src/store/postActions.ts` header (QUAL-013)
**Context:** the code was right each time; only the prose still described the removed arrangement.

## CAND-057 [review-reflect]
**Claim:** When a fix guards the success branch of an async answer against newer user state, guard every branch that has a side effect (focus request, toast, close), not only the one the review named.
**Saw it in:** `frontend/src/components/posts/CommentItem/CommentItem.tsx` (handleSave 404 branch calls `onRemoved`)
**Context:** REFL-009: round 3 fixed ok-path close/focus; the 404 path still moves focus.

## Candidate verdicts

62 candidates considered (2026-10-08). Cross-branch dedup: `origin/redesign`, fetched about 7 hours ago, holds the same 27 earlier lessons and none from this REQ. The duplicated numbers in this file were renumbered before the verdicts: the second CAND-043 is now CAND-058, the second 048 is CAND-059, the second 049 is CAND-060, the second 050 is CAND-061 and the second 051 is CAND-062.

| Candidate | Verdict | Target / Reason |
|---|---|---|
| CAND-001 | discard | one path constant, visible in the code |
| CAND-002 | discard | one line of how the build works, already in conventions (tsc -b) |
| CAND-003 | demote-to-gotcha | ^g56 |
| CAND-004 | discard | trivial test-writing slip |
| CAND-005 | demote-to-gotcha | ^g56 |
| CAND-006 | demote-to-gotcha | ^g58 |
| CAND-007 | demote-to-gotcha | ^g58 |
| CAND-008 | demote-to-gotcha | ^g58 |
| CAND-009 | discard | fixture detail, kept in the check script |
| CAND-010 | discard | trivial |
| CAND-011 | discard | explained in the check script's comments |
| CAND-012 | demote-to-gotcha | ^g57 |
| CAND-013 | demote-to-gotcha | ^g57 |
| CAND-014 | demote-to-gotcha | ^g56 |
| CAND-015 | discard | recorded in code comments and patterns 29 to 33 |
| CAND-016 | discard | recorded in code comments and patterns 29 to 33 |
| CAND-017 | demote-to-gotcha | ^g57 |
| CAND-018 | demote-to-gotcha | ^g57 |
| CAND-019 | discard | fixed (m10): the unused words were deleted |
| CAND-020 | discard | recorded in code comments and patterns 29 to 33 |
| CAND-021 | discard | recorded in code comments and patterns 29 to 33 |
| CAND-022 | discard | added as the sixth sighting to LESSON-REQ-fs-002-3 |
| CAND-023 | discard | recorded in code comments and patterns 29 to 33 |
| CAND-024 | discard | recorded in code comments and patterns 29 to 33 |
| CAND-025 | discard | added as the sixth sighting to LESSON-REQ-fs-002-3 |
| CAND-026 | discard | recorded in code comments and patterns 29 to 33 |
| CAND-027 | discard | added as the sixth sighting to LESSON-REQ-fs-002-3 |
| CAND-028 | promote | LESSON-REQ-fs-006-5 |
| CAND-029 | promote | LESSON-REQ-fs-006-5 |
| CAND-030 | promote | LESSON-REQ-fs-006-5 |
| CAND-031 | promote | LESSON-REQ-fs-006-4 |
| CAND-032 | discard | still open as m14 (the owner's call); revisit if taken |
| CAND-033 | discard | added as the sixth sighting to LESSON-REQ-fs-002-3 |
| CAND-034 | promote | LESSON-REQ-fs-006-5 |
| CAND-035 | discard | fixed (m10) |
| CAND-036 | discard | fixed (m11) |
| CAND-037 | promote | LESSON-REQ-fs-006-3 |
| CAND-038 | promote | LESSON-REQ-fs-006-2 |
| CAND-039 | discard | fixed (m7); specific |
| CAND-040 | discard | still open as m6 (the owner's call) |
| CAND-041 | discard | fixed (m8); specific |
| CAND-042 | discard | one-off tooling note for the browser review |
| CAND-043 | promote | LESSON-REQ-fs-006-2 |
| CAND-044 | demote-to-gotcha | ^g57 |
| CAND-045 | promote | LESSON-REQ-fs-006-5 |
| CAND-046 | promote | LESSON-REQ-fs-006-3 |
| CAND-047 | demote-to-gotcha | ^g56 |
| CAND-048 | discard | still open as m14 and n6 (the owner's calls) |
| CAND-049 | demote-to-gotcha | ^g58 |
| CAND-050 | promote | LESSON-REQ-fs-006-4 |
| CAND-051 | discard | duplicate of LESSON-REQ-fs-002-3 (replace every copy in the same fix) |
| CAND-052 | promote | LESSON-REQ-fs-006-3 |
| CAND-053 | discard | one-off technique, in the review log |
| CAND-054 | promote | LESSON-REQ-fs-006-2 |
| CAND-055 | promote | LESSON-REQ-fs-006-1 |
| CAND-056 | promote | LESSON-REQ-fs-006-4 |
| CAND-057 | promote | LESSON-REQ-fs-006-2 |
| CAND-058 | discard | trivial TypeScript narrowing note |
| CAND-059 | promote | LESSON-REQ-fs-006-2 |
| CAND-060 | discard | still open as n6 (the owner's call) |
| CAND-061 | promote | LESSON-REQ-fs-006-3 |
| CAND-062 | promote | LESSON-REQ-fs-006-1 |
