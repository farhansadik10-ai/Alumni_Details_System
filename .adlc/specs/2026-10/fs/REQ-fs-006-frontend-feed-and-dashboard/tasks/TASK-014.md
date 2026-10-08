# TASK-014 — One rule for a failed write: `lib/writeFailure.ts`

| Field | Value |
|---|---|
| REQ | REQ-fs-006 |
| Tier | 3 (added during implement, owner agreed 2026-10-08) |
| Status | done (one acceptance item open: CommentsPanel, see Notes) |
| Repo | alumni-details-system |
| Depends on | TASK-007 |
| Blocks | TASK-009 |

## Goal

The rule "check 403, then 404, then use the general save-failure words" exists once in `lib/`, and `FeedPost`, `CommentItem` and the coming `FeedPage` all use it (LESSON-REQ-fs-002-3).

## Files to touch

| Path | Action |
|---|---|
| `frontend/src/lib/writeFailure.ts` | create |
| `frontend/src/components/posts/FeedPost/FeedPost.tsx` | edit: use it, delete the local copy |
| `frontend/src/components/posts/CommentItem/CommentItem.tsx` | edit: use it, delete the local copy |
| `scripts/frontend-lib-check.ts` | edit: cases |

## Approach

- Read the two existing copies first (the 403/404 mapping and the "is it a 404" test in each file) and make one function that covers both: given a `CallFailure` and an object of words (`forbidden`, `notFound`, plus a `SaveFailureWords` for everything else), return the text; and one `isGone(failure)` for the 404 test. Import `CallFailure` and the status numbers from `lib/loadFailure.ts` and `saveFailureText` from `lib/saveFailure.ts`; `lib/` imports no React, router, services or store (style rule k).
- Replace both local copies; behaviour must not change. Keep the words in `config/text.ts`.
- Cases in `scripts/frontend-lib-check.ts`, expected answers typed from the spec (G55): 403, 404, 500, 409, network, a 400; `isGone` true only for 404. Prove once that a case can fail with a copy outside the repo.

## Acceptance

- [x] `npm run build`, `node scripts/frontend-style-check.mjs`, `npx tsx scripts/frontend-lib-check.ts` exit 0.
- [ ] `grep -rn "HTTP_FORBIDDEN\|HTTP_NOT_FOUND" frontend/src/components` prints nothing. **Not met:** three lines remain, all in `CommentsPanel.tsx` (not in this task's files; see Notes).
- [x] No browser, dev server, mock, network or backend import is used.

## Notes

### Implementation notes (2026-10-08, task-implementer)

- **Checks:** `npm run build` exit 0; `node scripts/frontend-style-check.mjs` PASS (rule k clean); `npx tsx scripts/frontend-lib-check.ts` 434 passed, 0 failed (14 new cases).
- **API:** `writeFailureText(failure, { forbidden, notFound, save: SaveFailureWords })` and `isGone(failure)` (true only for a 404). The words objects (`POST_WRITE_FAILURE_WORDS`, `COMMENT_WRITE_FAILURE_WORDS`) are module constants in each component, built from the existing `config/text.ts` words; `config/text.ts` was not edited (not in the file list).
- **Behaviour unchanged:** same order (403, 404, then `saveFailureText`), same words, same 404 test at the same three call sites per file.
- **Proof it can fail:** a copy of `writeFailure.ts` with the 403 test broken, run from the scratchpad against the "403 is forbidden" case: 1 failed, exit 1. Copy deleted.
- **Gap (surfaced, not edited):** `CommentsPanel.tsx` has `HTTP_NOT_FOUND` at lines 24, 89 (thread load 404 = post gone) and 131 (add-comment 404). Both are `isGone` checks; converting them is a three-line change (import `isGone`, use it twice; line 89 becomes `status === "error" && failure !== null && isGone(failure)`). The file is outside this task's list, so the grep acceptance is left open for the owner to allow. `store/postActions.ts:72` has a fourth private copy of the 404 test (store may import lib/); also left alone.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-006-frontend-feed-and-dashboard/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-002-3-new-helper-convert-every-sibling]]
