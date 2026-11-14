# A guard that refuses before any call must return its own result kind, never a borrowed HTTP status ^L-REQ-fs-006-1

| Field | Value |
|---|---|
| ID | LESSON-REQ-fs-006-1 |
| Captured | 2026-10-08 |
| REQ | REQ-fs-006 |
| Component | `frontend/src/store/postActions.ts`, `frontend/src/lib/writeFailure.ts` |
| Tags | store, errors, frontend, guards |
| Severity | guideline (a rule to follow) |

## The lesson

When a store action refuses blank text before it calls the server, return a result of its own (`{ ok: false, blank: true }`), not a made-up `400`. Later code reads a status as the server's meaning: a made-up 400 on a reply read as "the comment you replied to is gone".

## Saw it in

- `frontend/src/store/postActions.ts` (`CommentWriteResult`, the blank branch) — first draft returned a fake 400; found in review (QUAL-009, CORR-005) and fixed in round 3.
- `frontend/src/lib/writeFailure.ts` (`isReplyTargetGone`) — the reader that would have misread it.

## Related

- Originating REQ: REQ-fs-006
- See also: [[knowledge/lessons/LESSON-REQ-fs-003-3-one-resource-one-answer-shape]]
