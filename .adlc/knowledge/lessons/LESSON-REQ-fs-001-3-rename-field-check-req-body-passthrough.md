# After renaming a DTO field, check every place a request body is passed straight through ^L-REQ-fs-001-3

| Field | Value |
|---|---|
| ID | LESSON-REQ-fs-001-3 |
| Captured | 2026-10-05 |
| REQ | REQ-fs-001 |
| Component | `backend/src/api/controllers/` |
| Tags | api, controllers, dto, rename |
| Severity | guideline (a rule to follow) |
| Supersedes | — |

## The lesson

When a DTO field is renamed, grep the controllers for `req.body` handed on whole. The compiler cannot see a stale key there: the old name is silently dropped and the column is written as NULL.

## Saw it in

- `backend/src/api/controllers/AlumniController.ts` (`updateAlumni`) — passes `req.body` as `Partial<AlumniDTO>`; a client still sending `graduation_yr` gets a 200 and loses the year.
