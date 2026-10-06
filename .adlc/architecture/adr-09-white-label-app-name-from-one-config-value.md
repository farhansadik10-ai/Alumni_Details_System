# ADR-09 — The app is white-label; its name "University Alumni" comes from one config value ^ADR-09

| Field | Value |
|---|---|
| Status | accepted |
| Decided | 2026-10-06 |
| Author | farhansadik10-ai (owner) |
| Supersedes | (none) |
| Superseded by | (none) |
| Based on | `docs/design/README.md` (approved by the owner on 2026-10-06), sections 1 and 4 |

## Context

The app is white-label: it is not branded for one university and has no logo ([[context/project-overview]]). The owner's convention already said the app name is "text from one constant" ([[context/conventions]], Frontend), but the name itself was not chosen.

The name appears in the header, the footer, the phone header and the log in screen.

The question was what the app is called and where that name is kept.

## Considered options

### Option 1 — "University Alumni", read from one config value

Every place that shows the name reads the same value. No component contains the text.

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

The app name is "University Alumni". It comes from one config value and is never hard-coded in components. There is no university logo; the name is shown as text.

"One config value" here and "one constant" in [[context/conventions]] mean the same thing: a single place in the code that holds the name.

## Consequences

| Consequence | Type |
|---|---|
| One config value holds the name; header, footer, phone header and log in read it | new work |
| A review finding if the text "University Alumni" appears in a component | new work |
| No logo anywhere; the name is text | trade-off |

## Open questions

- [ ] Where does the value live: a constants file in `frontend/src`, or a build-time setting?
- [ ] Does the browser tab title (`index.html`) use the same value?

## Related

- Concepts: (none)
- Components: (none yet — the frontend is being rebuilt)
- Gotchas: (none)
- Lessons: (none)
- ADRs: [[architecture/adr-07-design-direction-oak-ink-band|ADR-07]]
- Context: [[context/design-system]]
