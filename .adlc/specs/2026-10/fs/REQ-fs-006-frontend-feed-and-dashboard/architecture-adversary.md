# REQ-fs-006 — Stress-test of the design

| Field | Value |
|---|---|
| Run | 2026-10-08, full pass (large blast radius, UI surface, SQL change) |
| By | architecture-adversary (report returned in chat; this file records it and how each finding was handled) |
| Result | 0 critical, 2 major, 3 minor |

| ID | Severity | Finding (short) | Handling |
|---|---|---|---|
| ADV-001 | major | "Load more" skips a post (and keeps a ghost) when **another user** deletes a post meanwhile; the aligned-page rule only covers this browser's own writes | **Accepted + documented.** Architecture Approach and Risks reworded; spec AC3 reworded to "none skipped by your own changes"; manual checklist item added. A real fix needs two requests per press and still leaves the ghost. Needs the owner's confirmation at the gate. |
| ADV-002 | major | The count query has no `p` alias, so the shared `WHERE p.user_id` would be a 500 at run time that the build cannot see | **Fixed.** TASK-001 requires `FROM posts p` in the count query and checks the printed SQL; a real call is on the owner's checklist (TASK-013). |
| ADV-003 | minor | A write that finds the list not ready is silently dropped; the comment count goes stale when the thread is closed; a late load can bring back a deleted post | **Fixed.** TASK-005: count adjusted whenever the feed is ready, `removedIds` remembered for the visit, composer only when the feed is ready (TASK-009). |
| ADV-004 | major | Focus after a delete: `focus()` runs while the dialog is still open and the opener is gone; the "Posts" heading could be unmounted; Cancel/Escape mid-delete hides a failure | **Fixed.** TASK-007 and TASK-009: focus request through state and an effect after the commit; heading outside the list branch; the dialog ignores close while busy; a late failure becomes a toast. |
| ADV-005 | minor | A reply to a comment someone deleted gives a 400; opening comments of a deleted post gives a 404 forever; two tasks append to `text.ts` | **Fixed.** TASK-005 and TASK-007 map the 400 and 404; the architecture notes that tasks append to `text.ts` one at a time. |

Checked with nothing found: the reuse table against the real components, the role matrix against `PostRoutes.ts`, `CommentRoutes.ts` and `StatsRoutes.ts`, and the three `resetAlumniAtom` call sites in `sessionActions.ts` (lines 53, 60 and 175). `parseId` refuses `""`, `abc`, `0`, `-1` and arrays; `"007"` is read as 7, which is harmless.
