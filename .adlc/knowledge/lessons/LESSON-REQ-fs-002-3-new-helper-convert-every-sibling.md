# When a change adds a shared helper, convert every existing inline copy in the same change ^L-REQ-fs-002-3

| Field | Value |
|---|---|
| ID | LESSON-REQ-fs-002-3 |
| Captured | 2026-10-06 |
| REQ | REQ-fs-002 |
| Component | `backend/src/api/controllers/`, `backend/src/dal/query/` |
| Tags | api, controllers, auth, helpers, scope |
| Severity | guideline (a rule to follow) |
| Supersedes | — |

## The lesson

When a change adds a shared helper or removes a bad pattern, grep for every other place that does the same thing by hand and settle each one in that change: convert it, or write down why it stays. A task note that says "leave this one alone" still leaves two ways of doing the same check side by side, and reviewers will find it.

## Saw it in

- `backend/src/api/controllers/PostController.ts` (`deletePost`, `findPostById`) — kept an inline `===` owner check and a load-all-posts lookup beside the new `isSelf` / `isAdmin` and `postManager.findPostById`; four reviewers flagged it (finding m2); fixed in the fix round.
- `backend/src/dal/query/PostQuery.ts`, `CommentQuery.ts` — the row `console.log` was removed from `UserQuery` and left in the two siblings (finding m1). Same pattern as [[knowledge/lessons/LESSON-REQ-fs-001-4]], second time.
- **Again in REQ-fs-003 (2026-10-07).** `backend/src/api/controllers/AlumniController.ts`, `PostController.ts` — `textOrNull` and a digits-only parse were written twice beside the new `requestHelpers.ts` (review findings m4). The fix round then added `queryFilterValue` as a near copy of `queryText` (finding n4). Second and third sighting: search the controllers for a local copy before closing any task that adds a helper.
- **Again in REQ-fs-004 (2026-10-07), the fourth sighting.** `ui/Dialog/Dialog.tsx` and `shell/PhoneMenu/PhoneMenu.tsx` shared about 60 copied lines (finding M1); `LoginPage` and `SignUpPage` each wrote the same error text and email length (m6); "is the session live" was written in three places (m9). The implementers had written all three down as "known duplication" instead of fixing them. Review round 1 flagged them, round 1 fixes converted them, and round 2 found no copy left (a grep for each).
- **Again in REQ-fs-005 (2026-10-08), the fifth sighting, in the frontend.** "Trimmed text or null" was written six times (`lib/alumniDisplay.ts` `presentText`, `alumniForm.ts`, `alumniActions.ts`, `sessionActions.ts`, `Header.tsx`, `PhoneMenu.tsx`; reflector REFL-001); the load-failure and save-failure rules were written three ways and the failure shape and the 404 number twice more (`services/apiError.ts`, `store/alumniAtoms.ts:87`; ARCH-003, REFL-010); the two profile cards fixed "keep what was typed during a save" and the focus hand-off in two different ways (CORR-005, REFL-008); `AlumniProfileCard.module.css` copied three of four blocks from the Account card and `composes` covered only one (Q-2, ARCH-009). Review round 1 and 2 flagged each; the cleanup task (TASK-015) and the fix rounds converted most. The rule held again: when a change adds a shared piece, grep for every hand-written twin the same day.
- **Again in REQ-fs-006 (2026-10-08), the sixth sighting, and the first time the implement phase wrote the gap down.** `isWriter` (who may write posts) was written four times, the mentoring directory address twice, `toPeopleState` twice, the 403/404 words mapping three times and a plural rule twice. The implementers listed them as "known gaps" because the `lib/` files were outside their task's file list; review found them all (QUAL-002, ARCH-001, REFL-001) and they were fixed in a round (`canWritePosts`, `mentoringDirectoryAddress`, `toPeopleBlockState`, `lib/writeFailure.ts`, `countText`). The owner approved the extra file (`TASK-014`) within one question. Lesson inside the lesson: when a copy is about to be written because the shared file is out of scope, ask for the file at once; "follow-up for review" only moves the cost.
