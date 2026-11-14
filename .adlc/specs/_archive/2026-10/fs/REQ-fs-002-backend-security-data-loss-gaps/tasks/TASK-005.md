# TASK-005 — Alumni: user_id from token, owner-or-admin partial update

| Field | Value |
|---|---|
| REQ | REQ-fs-002 |
| Tier | 1 |
| Status | complete |
| Repo | alumni-details-system |
| Depends on | TASK-001, TASK-002 |
| Blocks | TASK-007 |

## Goal

A new alumni profile belongs to the caller; only its owner or an admin can edit a profile, and an edit changes only the fields that were sent.

## Files to touch

| Path | Action |
|---|---|
| `backend/src/dal/query/AlumniQuery.ts` | edit |
| `backend/src/api/controllers/AlumniController.ts` | edit |
| `backend/src/api/routes/AlumniRoutes.ts` | edit — comment on the `PUT` line only |

## Approach

- **AlumniQuery.updateAlumni.** `buildUpdateSet(alumni, ["department","graduation_year","current_company","job_title","experience","bio","linkedin_url"])`, then `updated_at = NOW() WHERE id = $n RETURNING *`. When nothing was sent, run no `UPDATE` and return the row with `SELECT * FROM alumni WHERE id = $1` (alumni columns only, the same shape the update returns — G25).
- **AlumniController.**
  - `createAlumni`: pass `req.user.sub` as `user_id`; stop reading `user_id` from the body.
  - `updateAlumni`: `existing = await alumniManager.findAlumniById(id)`; none gives 404 `{ error: "Alumni profile not found" }`; not `isSelf(req, existing.user_id)` and not `isAdmin(req)` gives 403 `{ error: "Not authorized to update this profile" }`. `fields = pickSent(req.body, [the seven keys])`; empty gives 400 `{ error: "No fields to update" }`. `graduation_year` must be an integer or `null`, the other six a string or `null`; otherwise 400 `{ error: "<field> has the wrong type" }`. Update with `fields` (never `req.body`); no row gives 404.

## Acceptance

- [ ] AC5, AC6, AC7 hold for `PUT /api/alumni/:id` by reading the code
- [ ] AC14, AC17 (alumni): a student or another alumni gets 403; an admin succeeds; a missing id gets 404
- [ ] AC23: `createAlumni` does not read `user_id` from `req.body`
- [ ] `req.body` is not passed whole to any Manager call in this file
- [ ] The three alumni reads and their SQL are unchanged
- [ ] Every column name in the new SQL is in the `alumni` table of `db/schema.md`
- [ ] `npm run build` exits 0

## Notes

- `AlumniManager.ts` needs no change.
- A profile whose `user_id` is NULL has no owner: only an admin can edit it.
- Gotchas: G02, G19, G25.

### Implementation notes (2026-10-06)

- Built as written; no deviation. `npm run build` exits 0. Nothing was run against the database, so the new SQL is unproven until the owner's manual check (TASK-007).
- SQL produced for `{ bio: null, graduation_year: 2020 }`: `UPDATE alumni SET graduation_year = $1, bio = $2, updated_at = NOW() WHERE id = $3 RETURNING *`. Column order follows the fixed list in `AlumniQuery.ts`, not the body. Empty input runs `SELECT * FROM alumni WHERE id = $1` only.
- The seven-name list is written twice: `UPDATABLE_FIELDS` in the controller and `UPDATABLE_COLUMNS` in the Query. This is on purpose (the Query must not trust a list handed in from above), but the two must be kept in step by hand.
- `fields as Partial<AlumniDTO>` is the one cast. It runs after the type checks. `AlumniDTO` does not declare `null` for its nullable fields, so the cast also hides that `null` is now a legal value.
- Order of answers in `updateAlumni`: 404 (no row), 403 (not owner, not admin), 400 (nothing sent / wrong type), then the write; a write that returns no row is 404.
- The owner check reads the row through the joined read `findAlumniById`; only `existing.user_id` is used.

### Follow-ups spotted, not done

- An admin who calls `POST /api/alumni` now creates a profile under the admin's own id and cannot create one for another user. This is what ADR-03 and AC23 say, but the route still lets `admin` in.
- Nothing stops one user creating two profiles (no check in code, no unique index on `alumni.user_id`). A unique index is a schema change and needs the owner.
- `GET /api/alumni/:id` and `GET /api/alumni/email/:email` still answer 200 with an empty body for an unknown id or email.
- A non-numeric `:id` reaches PostgreSQL and comes back as 400 with the raw database message (accepted in the architecture's Risks).
- `createAlumni` does not type-check its body fields; only the update does.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-002-backend-security-data-loss-gaps/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-001-1]], [[knowledge/lessons/LESSON-REQ-fs-001-3]]
