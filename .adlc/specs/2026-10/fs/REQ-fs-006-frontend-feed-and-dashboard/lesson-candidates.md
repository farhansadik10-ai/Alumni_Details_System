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
