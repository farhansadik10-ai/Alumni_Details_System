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

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-007-frontend-users-about-polish-perf/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-002-3-new-helper-convert-every-sibling|L-REQ-fs-002-3]]
