# TASK-011 — Stats endpoint, top to bottom

| Field | Value |
|---|---|
| REQ | REQ-fs-003 |
| Tier | 2 |
| Status | pending |
| Repo | alumni-details-system |
| Depends on | TASK-004 |
| Blocks | TASK-012 |

## Goal

`GET /api/stats` answers `{ alumni, students, posts, mentoring }` for any logged-in user, through all four layers.

## Files to touch

| Path | Action |
|---|---|
| `backend/src/dal/query/StatsQuery.ts` | create |
| `backend/src/dal/index.ts` | edit (one export line) |
| `backend/src/businessLogic/src/StatsManager.ts` | create |
| `backend/src/businessLogic/index.ts` | edit (one export line) |
| `backend/src/api/controllers/StatsController.ts` | create |
| `backend/src/api/routes/StatsRoutes.ts` | create |
| `backend/src/api/app.ts` | edit (one import, one mount) |

## Approach

- **StatsQuery.** `getCounts(): Promise<{ alumni: number; students: number; posts: number; mentoring: number }>`, one statement:
  ```sql
  SELECT
    (SELECT COUNT(*)::int FROM alumni) AS alumni,
    (SELECT COUNT(*)::int FROM "User" WHERE role = $1) AS students,
    (SELECT COUNT(*)::int FROM posts) AS posts,
    (SELECT COUNT(*)::int FROM alumni WHERE mentorship_available = true) AS mentoring
  ```
  `$1` is a named constant `STUDENT_ROLE = "student"`.
- **StatsManager.** `getCounts()` pass-through.
- **StatsController.** Class with `getStats(req, res)`: 200 with the object.
- **StatsRoutes.** `router.get("/", authMiddleware, handler(stats, "getStats"))`.
- **app.ts.** `app.use("/api/stats", statsRoutes)` beside the other mounts, above `notFoundHandler`.

## Acceptance

- [ ] AC26 holds by reading the code; the four keys are exactly `alumni`, `students`, `posts`, `mentoring`
- [ ] Every name in the SQL is in `db/schema.md`; `"User"` is double-quoted
- [ ] The mount sits before the 404 handler and the error middleware
- [ ] `npx tsc --noEmit -p backend/src/dal` and `-p backend/src/businessLogic` pass; no error in the API files of this task

## Notes

- This task runs beside TASK-008 to TASK-010; it shares no file with them. It edits `app.ts` after TASK-004 did.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-003-finish-backend-api/architecture]]
- Lessons checked: LESSON-REQ-fs-001-1
