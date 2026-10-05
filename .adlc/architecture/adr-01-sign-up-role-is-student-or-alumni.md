# ADR-01 — Sign-up role is student or alumni; admin is never selectable ^ADR-01

| Field | Value |
|---|---|
| Status | accepted |
| Decided | 2026-10-02 |
| Author | farhansadik10-ai (owner) |
| Supersedes | (none) |
| Superseded by | (none) |
| Based on | Q2 of the retired AI-DLC plan (`AIdlc/plan.md`, deleted 2026-10-05; in git history) |

## Context

Sign-up is a public endpoint, `POST /api/users`. It stores whatever `role` the request body contains, so today anyone can register as an admin ([[knowledge/gotchas#^g14|G14]]).

The app has three roles: student, alumni, admin. The question was who chooses a new user's role.

## Considered options

### Option 1 — The user picks student or alumni

The sign-up form offers two roles. Admin is never offered.

**Pros:**
- A new alumni can use alumni features straight away, with no admin step.

**Cons:**
- Nobody checks that a person who picks "alumni" really is one.

### Option 2 — Everyone signs up as student; an admin promotes them

**Pros:**
- Alumni status is checked by a person.

**Cons:**
- Needs a promotion screen and endpoint that do not exist.
- New alumni wait for an admin.

### Option 3 — Something else

Left open in the question; nothing was proposed.

## Decision

**We chose Option 1.**

The user picks student or alumni, and admin is never selectable. It needs no new admin workflow. The owner marked it "for now": it may change to Option 2 if the owner's supervisor decides so.

## Consequences

| Consequence | Type |
|---|---|
| The sign-up form offers student and alumni only | new work |
| The backend must reject or ignore `role: "admin"` at sign-up; the form alone does not enforce this ([[knowledge/gotchas#^g14|G14]]) | new work |
| Alumni status is self-declared and unchecked | trade-off |
| How the first admin account is created is not decided | follow-up |

## Open questions

- [ ] Will the supervisor ask for Option 2 (admin promotes)? If so, this ADR is superseded.
- [ ] How is an admin account created?

## Related

- Concepts: (none)
- Components: `backend/src/api/controllers/UserController.ts` (`createUser`)
- Gotchas: [[knowledge/gotchas#^g14|G14]]
- Lessons: (none)
- ADRs: (none)
