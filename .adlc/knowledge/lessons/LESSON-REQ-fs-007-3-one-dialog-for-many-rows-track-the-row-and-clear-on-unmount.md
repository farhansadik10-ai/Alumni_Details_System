# One dialog for many rows: track which row is open, keep busy per row, and clear the open flag when the page unmounts ^L-REQ-fs-007-3

| Field | Value |
|---|---|
| ID | LESSON-REQ-fs-007-3 |
| Captured | 2026-10-09 |
| REQ | REQ-fs-007 |
| Component | `frontend/src/pages/UsersPage/UsersPage.tsx`, `DeleteUserDialog` |
| Tags | dialog, async, state, frontend |
| Severity | trap (cost real time before) |

## The lesson

`FeedPost` can use a single "dialog open" boolean because each post owns its dialog. A page with one dialog for many rows needs the open row's id, and a busy set per row, so a late answer for row X never closes or writes into row Y's dialog. A ref that records "the dialog is open" must also be cleared in an unmount effect: after leaving the page, a late failure would otherwise take the "dialog is open" branch, put its message on a dead page and show no toast.

## Saw it in

- `UsersPage.tsx`: `confirmOpenRef` and the per-user busy set (TASK-008); the unmount case was found in review (CORR-001) and fixed with one effect.
- The rule it extends: Cancel and Escape always close the dialog, also while a delete runs, and a late failure becomes a toast (ADV-001 of the architecture stress-test; `FeedPost.closeConfirm`).

## Related

- Originating REQ: REQ-fs-007
- See also: [[knowledge/lessons/LESSON-REQ-fs-006-2-an-async-answer-may-only-change-its-own-state]], [[knowledge/lessons/LESSON-REQ-fs-005-1-disable-until-changed-has-three-traps]]
