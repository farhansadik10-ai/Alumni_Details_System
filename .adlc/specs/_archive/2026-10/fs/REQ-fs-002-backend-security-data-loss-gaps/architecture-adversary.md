# Architecture adversary — REQ-fs-002-backend-security-data-loss-gaps

Written by: architecture-adversary (tier: balanced), dispatched sub-agent.

| Field | Value |
|---|---|
| Generated | 2026-10-06 |
| Trigger | sensitive-surface, large-blast-radius |
| Verdict | found problems |

## Summary

Checked 28 ACs, 7 tasks, 19 blast-radius files against the live controllers, Query classes, routes and `db/schema.md`. 4 findings: 0 critical, 0 major, 4 minor. The plan is sound on layering, SQL safety, hash removal and the owner checks. The biggest gap: the user-update 403-before-404 order contradicts AC17 as written.
Dispatch questions: planned-as-zero ACs: checked, nothing (all of AC1-AC28 map to a task). Files outside the radius: checked, nothing (`AuthRoutes.ts` only calls `login`, which TASK-003 covers). Rollback: checked, nothing (no schema change; a code revert undoes it).

## Findings

### ADV-001: Non-admin PUT on a missing user id gets 403, but AC17 says 404

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | high |
| Lens | contradiction |
| Where | `architecture.md` section 4 ("403 comes first" for users); spec AC13, AC17; `TASK-003.md` |

**What:** AC17 lists the users route among those where a missing `:id` returns 404. The design checks self-or-admin first with no row read, so a non-admin calling `PUT /api/users/999` (no such user) gets 403, and only an admin gets 404.
**Why it matters:** The owner's checklist step for AC17 (users) fails if run as a student. Spec and design disagree and the design picks silently.
**Why it holds up:** Refutation tried: "403 for anyone else" in AC13 covers it. But AC17 says 404 for no-match with no caller exception, and TASK-003 lists "AC17 (users)" as satisfied. A 403-first order is defensible (it avoids revealing which ids exist), but then it is a spec exception.
**Recommendation:** Say in `architecture.md` section 4 and TASK-003 that for users a non-admin gets 403 on any id other than their own, and word AC17 (users) as "admin gets 404". Or read the row first. Either is fine; write the choice down.

### ADV-002: Manual checklist needs an admin account that the API can no longer create

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | medium |
| Lens | omission |
| Where | `TASK-007.md` Approach ("say what to create first (two alumni users, one student, one admin)") |

**What:** After AC12, `POST /api/users` cannot create an admin. TASK-007 does not say how the owner gets one. Nearly half the checks need it: AC13, AC14, AC16, AC22 and AC15 (admin gets 403).
**Why it matters:** The owner stalls mid-checklist, or "fixes" it by editing the role in the database by hand with no guidance.
**Why it holds up:** Refutation tried: the owner may already have an admin row. The packet never says so, and the checklist is the written contract.
**Recommendation:** TASK-007 should tell the owner to confirm an existing admin or promote one with a one-line manual SQL update the owner runs (`UPDATE "User" SET role='admin' WHERE id=...`, run by the owner, not Claude), and to log in again to get a fresh token (the role is baked into the token).

### ADV-003: `pickSent` checks that a key is present, not that its value has the right type

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | medium |
| Lens | omission |
| Where | `architecture.md` section 1; `TASK-002.md`, `TASK-003`-`005` |

**What:** Only `email` and `password` get a value check (non-empty string). Every other picked field goes straight to `pg`. `PUT /api/posts/:id {"caption": {"x":1}}` stores the JSON text of the object in a `text` column without error. `graduation_year: "abc"` or `:id` = `abc` fails inside Postgres and comes back as 400 with the raw database message. An `:id` that is not an integer on `PUT /users/:id` as admin gives 400, not the 404 AC17 asks for.
**Why it matters:** Silent junk stored in profile fields (the same "garbage in" class this REQ closes for partial updates) and database text in error bodies.
**Why it holds up:** Refutation tried: there is no SQL-injection path since values are bound, and the spec only asks for email/password validation (AC6). So this is not a spec violation, just a hole next to it.
**Recommendation:** Add to `pickSent` callers a per-field type rule: text fields must be string or null, `graduation_year` integer or null, else 400. Add a `Number.isInteger(id)` guard that returns 404. Or record it as accepted risk in Risks.

### ADV-004: A stolen one-hour token can take over an account permanently

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | medium |
| Lens | failure-mode |
| Where | `architecture.md` Risks table (only the admin case is listed); `TASK-003` `updateUser` |

**What:** Self-update lets the token holder change `email` and `password` with no current-password check. With a leaked token (shared machine, XSS), the attacker sets a new password and email, and the 1-hour limit stops mattering. Only the admin-over-user case is named in Risks.
**Why it matters:** The token lifetime is listed as out of scope on the assumption that it limits damage; this route undoes that limit.
**Why it holds up:** Refutation tried: nothing in the spec asks for re-authentication, and legacy behaviour was worse (anyone could edit anyone). So it is not a regression, only an unrecorded risk.
**Recommendation:** Add a Risks row "self password/email change needs no current password; accepted, follow-up REQ" so the owner decides knowingly at the gate.

## Coverage

- **Lenses run:** omission, failure-mode, hidden-coupling, rollback, contradiction, testability.
- **Lenses skipped:** ux-consistency (no UI surface; frontend untouched), cross-repo (single repo).
- **Acceptance-criteria coverage:** AC1-AC16 checked, AC17 checked (ADV-001), AC18-AC28 checked. Verified `redesign` branch exists for TASK-007's diff checks, and `PUT /users/:id/login` has no caller in `frontend/src`.
