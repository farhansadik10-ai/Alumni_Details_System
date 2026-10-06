# ADR-10 — The About page is built last; the Privacy page and password reset are later work ^ADR-10

| Field | Value |
|---|---|
| Status | accepted |
| Decided | 2026-10-06 |
| Author | farhansadik10-ai (owner) |
| Supersedes | (none) |
| Superseded by | (none) |
| Based on | `docs/design/README.md` (approved by the owner on 2026-10-06), sections 1, 4 and 9; the owner's answers of 2026-10-06 (footer link, About content, forgotten password) |

## Context

The approved design covers log in, sign-up, dashboard, feed, directory, profile, users and My profile. Three things are not designed: an About page, a Privacy page, and password reset.

The README draws an "About" link in the footer of every page.

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
- **Password reset:** reset by email is a later REQ.

None of the three has a design yet. Each needs one, approved by the owner, before it is built.

Until they exist (owner, 2026-10-06):

- **Footer "About" link:** not rendered until the About page exists. The About REQ adds the link. No dead links. This overrides the footer drawn in the README and the screens until then.
- **About page content:** what the system is, who can join, how to contact the alumni office, and the app version. The contact is one email, a constant in the same config file as the app name ([[architecture/adr-09-white-label-app-name-from-one-constant|ADR-09]]).
- **Forgotten password:** the log-in page shows one line: "Forgot your password? Contact the alumni office." with the contact email.

## Consequences

| Consequence | Type |
|---|---|
| The About page is the last screen of the redesign and needs a design first | follow-up |
| The footer is built without the "About" link; the About REQ adds it | new work |
| One contact email constant in the app-name config file; the log-in page reads it | new work |
| The log-in page gets one line of text that is not in `login.html` | new work |
| A user who forgets their password depends on the alumni office until reset by email exists | trade-off |
| No Privacy page in the redesign; it blocks selling in Europe | trade-off |
| Privacy page and password reset each need their own REQ later | follow-up |

## Open questions

- [ ] The About page layout. Decide in the REQ that builds it.
- [ ] Where the app version on the About page comes from. Decide in the REQ that builds it.
- [ ] How the alumni office resets a password for a user today. Decide in the REQ that builds it.

## Related

- Concepts: (none)
- Components: (none yet — the frontend is being rebuilt)
- Gotchas: (none)
- Lessons: (none)
- ADRs: [[architecture/adr-07-design-direction-oak-ink-band|ADR-07]]
- Context: [[context/design-system]]
