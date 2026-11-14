# ADR-09 — The app is white-label; its name "University Alumni" is text from one constant ^ADR-09

| Field | Value |
|---|---|
| Status | accepted |
| Decided | 2026-10-06 |
| Author | farhansadik10-ai (owner) |
| Supersedes | (none) |
| Superseded by | (none) |
| Based on | `docs/design/README.md` (approved by the owner on 2026-10-06), sections 1 and 4; the owner's answer of 2026-10-06 on the wording |

## Context

The app is white-label: it is not branded for one university and has no logo ([[context/project-overview]]). The owner's convention already said the app name is "text from one constant" ([[context/conventions]], Frontend), but the name itself was not chosen.

The name appears in the header, the footer, the phone header and the log in screen.

The question was what the app is called and where that name is kept.

## Considered options

### Option 1 — "University Alumni", text from one constant

Every place that shows the name reads the same constant. No component contains the text.

**Pros:**
- Changing the name for another buyer is one edit.
- The name cannot drift between screens.

**Cons:**
- One more thing to wire up before the first screen.

### Option 2 — Write the name in each component

**Pros:**
- Nothing to set up.

**Cons:**
- Renaming means finding every copy.
- Breaks the white-label rule.

## Decision

**We chose Option 1.**

The app name is "University Alumni". It is text from one constant and is never hard-coded in components. There is no university logo.

"One constant" means a single exported constant in one config file. The README's "one config value" means the same thing (confirmed by the owner, 2026-10-06); the vault uses the wording of the root `CLAUDE.md`, "one constant".

The same config file also holds one contact email for the alumni office (owner, 2026-10-06). The log-in page and the About page read it ([[architecture/adr-10-about-page-last-privacy-and-password-reset-later|ADR-10]]).

## Consequences

| Consequence | Type |
|---|---|
| One exported constant in one config file holds the name; header, footer, phone header and log in read it | new work |
| A review finding if the text "University Alumni" appears in a component | new work |
| No logo anywhere; the name is text | trade-off |

## Open questions

- [ ] Which config file holds the constant (its path in `frontend/src`)? Decide in the REQ that builds it.
- [ ] Does the browser tab title (`index.html`) use the same constant? Decide in the REQ that builds it.
- [ ] The value of the contact email. Decide in the REQ that builds it.

## Related

- Concepts: (none)
- Components: (none yet — the frontend is being rebuilt)
- Gotchas: (none)
- Lessons: (none)
- ADRs: [[architecture/adr-07-design-direction-oak-ink-band|ADR-07]]
- Context: [[context/design-system]]
