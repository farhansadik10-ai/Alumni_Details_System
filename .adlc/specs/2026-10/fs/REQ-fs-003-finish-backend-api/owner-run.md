# REQ-fs-003 — the owner's database run

Kept as its own page so the review phase copies it into `verification.md` unchanged.

## Owner's run against the real database (2026-10-07)

Run by the repo owner, not by Claude. Recorded from the owner's report.

| Round | Owner's own script | `scripts/api-check.mjs` |
|---|---|---|
| 1 | 71 passed, 4 failed, one cause: `POST /api/comments` with `{ posts_id, content }` answered 400 `Invalid post_id` | 89 passed, 0 failed, 11 skipped (no admin account set) |
| 2, after the fix | 91 of 91 passed, 14 of them admin checks | run with the admin account: 0 failed |

Fix between the rounds: comment create reads `posts_id` (the column's name) and needs non-empty content.

The 14 admin checks in the owner's script covered: list and search users; role filter; an admin updates another user; an admin cannot edit another user's post; an admin deletes another user's comment and post; 409 on deleting a user who has content; 200 on deleting a user who has none; 404 for an unknown user. These are the admin paths that REQ-fs-002 left untested.

