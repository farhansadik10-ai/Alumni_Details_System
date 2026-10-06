# ADR-10 — The About page is built last; the Privacy page and password reset are later work ^ADR-10

| Field | Value |
|---|---|
| Status | accepted |
| Decided | 2026-10-06 |
| Author | farhansadik10-ai (owner) |
| Supersedes | (none) |
| Superseded by | (none) |
| Based on | `docs/design/README.md` (approved by the owner on 2026-10-06), sections 1, 4 and 9 |

## Context

The approved design covers log in, sign-up, dashboard, feed, directory, profile, users and My profile. Three things are not designed: an About page, a Privacy page, and password reset.

The footer on every page already has an "About" link.

The question was whether these three are part of the redesign, and in what order.

## Considered options

### Option 1 — About last; Privacy and password reset later

Build the designed screens first. Build the About page at the end of the redesign. Leave the Privacy page and password reset for later work, outside the redesign.

**Pros:**
- The redesign builds only what has an approved picture.
- Password reset needs backend work (email sending, reset tokens) that does not exist; it does not hold up the screens.

**Cons:**
- The footer's "About" link has nowhere to go until the page exists.
- A user who forgets their password has no way back in by themselves.
- The app cannot be sold in Europe until the Privacy page exists.

### Option 2 — Design and build all three now

**Pros:**
- Nothing missing at launch.

**Cons:**
- Three more designs to approve before building starts.
- New backend work for password reset inside a frontend redesign.

## Decision

**We chose Option 1.**

- **About page:** planned, built last in the redesign.
- **Privacy page:** later work. Needed before selling in Europe.
- **Password reset:** later work.

None of the three has a design yet. Each needs one, approved by the owner, before it is built.

## Consequences

| Consequence | Type |
|---|---|
| The About page is the last screen of the redesign and needs a design first | follow-up |
| The log in screen has no "forgot password" link | trade-off |
| No Privacy page in the redesign; it blocks selling in Europe | trade-off |
| Privacy page and password reset each need their own request later | follow-up |

## Open questions

- [ ] What does the footer's "About" link do until the About page is built?
- [ ] What goes on the About page?
- [ ] Until password reset exists, how does a user who forgot their password get back in?

## Related

- Concepts: (none)
- Components: (none yet — the frontend is being rebuilt)
- Gotchas: (none)
- Lessons: (none)
- ADRs: [[architecture/adr-07-design-direction-oak-ink-band|ADR-07]]
- Context: [[context/design-system]]
