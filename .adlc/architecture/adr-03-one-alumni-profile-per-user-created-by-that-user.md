# ADR-03 — One alumni profile per user, created only by that user ^ADR-03

| Field | Value |
|---|---|
| Status | accepted |
| Decided | 2026-10-02 |
| Author | farhansadik10-ai (owner) |
| Supersedes | (none) |
| Superseded by | (none) |
| Based on | Q4 of the retired AI-DLC plan (`AIdlc/plan.md`, deleted 2026-10-05; in git history) |

## Context

An alumni profile is a row in `alumni` that points to a user through `user_id`. `POST /api/alumni` is open to the alumni and admin roles and takes `user_id` from the request body.

The question was whether a user creates only their own profile, or an admin can create one for any user (which needs a user picker), and whether a user can have more than one profile.

The database does not answer it: `alumni.user_id` has no UNIQUE constraint (`db/schema.md`), so nothing stops two profiles for one user.

## Considered options

### Option 1 — A user creates only their own profile, one per user

No user picker. `user_id` is always the logged-in user.

**Pros:**
- The simplest screen and the simplest rule.
- A profile is always written by the person it describes.

**Cons:**
- An admin cannot set up a profile on someone's behalf.

### Option 2 — An admin can create a profile for any user

**Pros:**
- An admin can enter profiles in bulk.

**Cons:**
- Needs a user picker and a rule for who may edit the result.

## Decision

**We chose Option 1.**

A user creates only their own alumni profile, one per user; there is no user picker.

## Consequences

| Consequence | Type |
|---|---|
| "One per user" is not enforced by the database. The backend or the UI must check it (for example, hide "add my profile" when the user already has one) | new work |
| `user_id` on create should come from the logged-in user, not the request body | new work |
| Adding a UNIQUE constraint on `alumni.user_id` would enforce it properly, but that is a schema change and needs the owner's approval | follow-up |
| An admin cannot create a profile for someone else | trade-off |

## Open questions

- [ ] Should `alumni.user_id` get a UNIQUE constraint? Not decided; no schema change without the owner's approval.
- [ ] The admin role may call `POST /api/alumni`. Does an admin create an alumni profile for themself, or should the route be alumni-only?

## Related

- Concepts: (none)
- Components: `backend/src/api/controllers/AlumniController.ts`, `backend/src/dal/query/AlumniQuery.ts`
- Gotchas: [[knowledge/gotchas#^g01|G01]], [[knowledge/gotchas#^g19|G19]]
- Lessons: (none)
- ADRs: (none)

## Update 2026-10-07 (REQ-fs-003)

The backend now enforces one profile per user: `AlumniQuery.createAlumni` takes a per-user database lock, checks, then inserts, and a second `POST /api/alumni` answers 409. `user_id` comes from the token. Both open questions stay open: no UNIQUE constraint was added (profiles duplicated before this date remain, [[knowledge/gotchas#^g37|G37]]), and an admin still creates a profile only for themself.
