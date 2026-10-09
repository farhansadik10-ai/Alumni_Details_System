# Before carrying an old review item forward, re-read the code and the wrap-up log; and do a carried item in the next REQ that touches the same file ^L-REQ-fs-007-2

| Field | Value |
|---|---|
| ID | LESSON-REQ-fs-007-2 |
| Captured | 2026-10-09 |
| REQ | REQ-fs-007 |
| Component | `verification.md` files, `skipped.md` |
| Tags | review, process, vault |
| Severity | guideline (a rule to follow) |

## The lesson

An archived `verification.md` freezes at the review gate. Fixes made at wrap-up are not marked back in it, so a list of "still open" items copied from it is partly wrong. Read the code and the wrap-up line in `hot.md` for each item first. And an item that is skipped REQ after REQ ("no check cases for `toPeopleBlockState`") should be done in the next REQ that already edits the same file: it took one task agent a few minutes here, after two REQs of "needs the atoms".

## Saw it in

- REQ-fs-004 `verification.md` n3: the MyProfilePage half was fixed, the `layout.ts` half was not. TASK-011 caught this by reading the code.
- `toPeopleBlockState` (REQ-fs-006 n6) was skipped again in this REQ's first `skipped.md`, although the REQ added 67 library-check cases beside it. A type-only import made it checkable (G59).

## Related

- Originating REQ: REQ-fs-007
- See also: [[knowledge/lessons/LESSON-REQ-fs-006-4-a-fix-that-moves-a-rule-leaves-old-prose-behind]]
