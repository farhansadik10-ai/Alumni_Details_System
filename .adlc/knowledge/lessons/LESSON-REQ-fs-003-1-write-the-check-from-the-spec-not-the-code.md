# Write the API check from the spec and the schema, not from the code ^L-REQ-fs-003-1

| Field | Value |
|---|---|
| ID | LESSON-REQ-fs-003-1 |
| Captured | 2026-10-07 |
| REQ | REQ-fs-003 |
| Component | `scripts/api-check.mjs`, `backend/src/api/controllers/` |
| Tags | testing, api, check-script, contract |
| Severity | trap (cost real time before) |
| Supersedes | — |

## The lesson

Write each HTTP check from the spec and `db/schema.md`: the field names a client would send, the status the spec promises. Do not copy request bodies or expected answers out of the controller. A check written from the code agrees with the code's mistake and passes.

## Saw it in

- `scripts/api-check.mjs` (first version) — sent `post_id` on every comment because the controller read `post_id`. It passed 89 of 89. The owner's own script sent the schema's name, `posts_id`, and failed 4 checks (REQ-fs-003 implement gate, round 1).
- `backend/src/api/controllers/CommentController.ts` (`createComment`) — the body key was changed to `posts_id` after that run; gotcha G13 had named the mismatch since 2026-10-02.
