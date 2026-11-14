# When a fix moves or removes a rule, grep the docs and the header comments for the old wording in the same round ^L-REQ-fs-006-4

| Field | Value |
|---|---|
| ID | LESSON-REQ-fs-006-4 |
| Captured | 2026-10-08 |
| REQ | REQ-fs-006 |
| Component | `docs/frontend-patterns.md`, file header comments |
| Tags | docs, review, process, comments |
| Severity | guideline (a rule to follow) |

## The lesson

The code was right each time; the prose still described the removed arrangement. After any fix that moves a mapping, deletes a "known gap" or turns a placeholder page into a real one, grep the patterns doc, the vault pages and the header comments of the files you touched for the old wording, in that round, not the next review.

## Saw it in

- `docs/frontend-patterns.md` pattern 22 still said "copied ... see Open points" after the Open points entry was deleted (QUAL-008); pattern 14 still named the Dashboard as "being built" (found while writing TASK-013).
- `frontend/src/store/postActions.ts` header still said the page maps a 400 after the mapping moved to `lib/writeFailure.ts` (QUAL-013, open trivial).

## Related

- Originating REQ: REQ-fs-006
- See also: [[knowledge/lessons/LESSON-REQ-fs-004-7-delete-a-module-close-its-mentions]]
