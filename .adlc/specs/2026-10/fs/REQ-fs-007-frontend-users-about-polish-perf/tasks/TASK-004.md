# TASK-004 — Words for a refused user delete

| Field | Value |
|---|---|
| REQ | REQ-fs-007 |
| Tier | 0 |
| Status | pending |
| Repo | alumni-details-system |
| Depends on | TASK-001 |
| Blocks | TASK-008 |

## Goal

One pure function chooses the words for a failed user delete: 409 gets its own, everything else goes through the existing rules.

## Files to touch

| Path | Action |
|---|---|
| `frontend/src/lib/writeFailure.ts` | edit: add `UserDeleteFailureWords` and `userDeleteFailureText` |
| `scripts/frontend-lib-check.ts` | edit: cases |

## Approach

- `userDeleteFailureText(failure, words)`: if the failure is an http 409, return `words.blocked`; otherwise return `writeFailureText(failure, words)`. `words` extends `WriteFailureWords` with `blocked`. Use the 409 constant from `loadFailure.ts` (it already owns 403, 404, 409 and 500).
- The words are written by the caller (TASK-005 adds them to `config/text.ts`); this function holds none.
- Cases: 409 gives blocked; 404 gives the existing gone words; 403 the existing forbidden words; network the existing network text; 500 the existing server text.

## Acceptance

- [ ] The library check passes with the five cases.
- [ ] `git grep -n "409" -- frontend/src` shows no new bare `409` outside `loadFailure.ts`.

## Notes

- Done 2026-10-09. `UserDeleteFailureWords extends WriteFailureWords { blocked }` and `userDeleteFailureText` in `lib/writeFailure.ts`; 409 is read through `HTTP_CONFLICT` from `loadFailure.ts`.
- Shapes line up with TASK-005: `userDeleteFailureWords(name)` in `config/text.ts` returns `{ blocked, forbidden, notFound, save: { noAnswer, server, gone, general } }`. Proven with a scratchpad `tsc --strict` file assigning that return value to `UserDeleteFailureWords` (exit 0). No `conflict` save words, which is fine: 409 never reaches `saveFailureText` here.
- Seven cases in `scripts/frontend-lib-check.ts` (the five asked, plus 409 with conflict save words still giving `blocked`, plus 400 → general). 536 passed. A copy outside the repo with the 409 answer changed failed (1 failed, exit 1).
- Build first failed on `store/sessionActions.ts` (`resetUsersAtom`, TASK-006 mid-edit); passed on re-run.
- Acceptance 2: no new bare `409`. Pre-existing bare `EMAIL_TAKEN_STATUS = 409` in `pages/SignUpPage/SignUpPage.tsx:53` is a follow-up, not touched.
- Slip: a stray empty `frontend/src/__shape_scratch.ts` was created by my command and removed in the same command; never seen by any build. Nothing else was deleted.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-007-frontend-users-about-polish-perf/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-002-3-new-helper-convert-every-sibling|L-REQ-fs-002-3]]
