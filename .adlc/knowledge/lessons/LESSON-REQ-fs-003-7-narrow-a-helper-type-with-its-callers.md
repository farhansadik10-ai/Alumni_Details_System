# Plan a tighter helper signature in the same task as its callers ^L-REQ-fs-003-7

| Field | Value |
|---|---|
| ID | LESSON-REQ-fs-003-7 |
| Captured | 2026-10-07 |
| REQ | REQ-fs-003 |
| Component | `backend/src/dal/query/updateSet.ts`; task planning |
| Tags | planning, tasks, types, dal |
| Severity | guideline (a rule to follow) |
| Supersedes | — |

## The lesson

When a task plan narrows a shared helper's parameter type, put that edit in the task that converts the callers, or in a later stage. A stage that may not touch the callers cannot both make the change and keep the type-check green.

## Saw it in

- `backend/src/dal/query/updateSet.ts` (`buildUpdateSet`) — TASK-002 asked for the tighter parameter, "no Query file edited" and a passing `tsc`; all three could not hold. The one-line edit was moved to the last task.
