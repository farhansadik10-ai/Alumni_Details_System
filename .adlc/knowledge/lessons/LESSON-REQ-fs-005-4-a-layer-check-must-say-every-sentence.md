# A layer check must encode every sentence of the layer rule, and a rule moved into lib/ brings its cases ^L-REQ-fs-005-4

| Field | Value |
|---|---|
| ID | LESSON-REQ-fs-005-4 |
| Captured | 2026-10-08 |
| REQ | REQ-fs-005 |
| Component | `scripts/frontend-style-check.mjs`, `frontend/src/lib/` |
| Tags | layers, checks, lib, frontend |
| Severity | guideline (a rule to follow) |

## The lesson

When you add a check for a layer rule, write down every sentence of the rule in the patterns doc and ban every import it forbids, not only the one that was broken last. Rule k (`lib/` may not import React, the router, `services/` or `store/`) left out `jotai`, `axios`, `hooks/`, `components/` and `pages/`, and nothing checks `services/` importing `store/`. And when a pure rule has to live outside `lib/` only because it needs a store type, declare its own input shape in `lib/` instead (as `loadFailure.ts` does); a rule outside `lib/` has no library-check cases.

## Saw it in

- `scripts/frontend-style-check.mjs:51-53,339-348` — rule k, added in the review fix round for ARCH-001; the reviewers still found a partial list (round 2, ARCH-001 partly).
- `frontend/src/components/profile/saveFailureText.ts` (removed) — a pure status-to-reason rule outside `lib/`, with no cases (review Q-1), moved to `lib/saveFailure.ts` with 12 cases.

## Related

- Originating REQ: REQ-fs-005
- See also: [[knowledge/lessons/LESSON-REQ-fs-004-2-one-rule-one-function-in-lib]], [[knowledge/lessons/LESSON-REQ-fs-004-6-a-check-that-reads-only-tracked-files]]
