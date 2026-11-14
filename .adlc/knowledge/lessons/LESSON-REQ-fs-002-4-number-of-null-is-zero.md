# Refuse null and empty values before turning an id into a number ^L-REQ-fs-002-4

| Field | Value |
|---|---|
| ID | LESSON-REQ-fs-002-4 |
| Captured | 2026-10-06 |
| REQ | REQ-fs-002 |
| Component | `backend/src/api/utils/requestHelpers.ts` |
| Tags | api, auth, owner-check, javascript |
| Severity | trap (cost real time before) |
| Supersedes | — |

## The lesson

Before comparing two ids with `Number(a) === Number(b)`, refuse `null`, `undefined`, `""`, booleans, arrays and objects. `Number(null)`, `Number("")` and `Number([])` are all `0`, not `NaN`, so a row with no owner would match user 0 and an owner check would pass.

## Saw it in

- `backend/src/api/utils/requestHelpers.ts` (`isSelf`, `toUserId`) — accepts only a number or a non-blank string; an alumni profile whose `user_id` is NULL therefore has no owner and only an admin can edit it.
