# An async answer may only change the state it was sent from, and every branch of the answer has to check ^L-REQ-fs-006-2

| Field | Value |
|---|---|
| ID | LESSON-REQ-fs-006-2 |
| Captured | 2026-10-08 |
| REQ | REQ-fs-006 |
| Component | `frontend/src/components/posts/` (CommentsPanel, CommentItem, FeedPost), `frontend/src/hooks/useModalDialog.ts` |
| Tags | state, async, focus, frontend, dialogs |
| Severity | trap (cost real time before) |

## The lesson

When a request answers, compare against the value it was sent from (keep it in a ref) before you clear a shared "one active at a time" state, close a form, move focus or show a message. Do it in **every** branch (ok, failure, 404), and list every control that can change the same state during the call, not only the one the review named. A guard that "ignores close while busy" must also cope with the browser closing a native `<dialog>` anyway.

## Saw it in

- `CommentsPanel.tsx` / `CommentItem.tsx` — a late send or save wiped a reply or edit the user started meanwhile and moved focus (REFL-006); fixed with `activeRef`, `changeActive`, `endEdit(id)`, `editingRef` in round 3.
- `FeedPost.tsx` / `CommentItem.tsx` `closeConfirm` — an early return left the open flag true on a closed dialog (CORR-003); fixed in round 2.
- Still open at wrap-up: the 404 branch of `CommentItem.handleSave` calls `onRemoved()` without the `editingRef` check (REFL-009).

## Related

- Originating REQ: REQ-fs-006
- See also: [[knowledge/lessons/LESSON-REQ-fs-005-1-disable-until-changed-has-three-traps]], [[knowledge/lessons/LESSON-REQ-fs-005-2-store-state-outlives-the-page]], [[knowledge/lessons/LESSON-REQ-fs-004-4-check-focus-for-real]]
