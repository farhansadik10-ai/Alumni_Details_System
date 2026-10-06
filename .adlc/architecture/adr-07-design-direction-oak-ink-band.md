# ADR-07 — Design direction is "Oak, ink band", with light, dark and system themes ^ADR-07

| Field | Value |
|---|---|
| Status | accepted |
| Decided | 2026-10-06 |
| Author | farhansadik10-ai (owner) |
| Supersedes | (none) |
| Superseded by | (none) |
| Based on | `docs/design/README.md` (approved by the owner on 2026-10-06), sections 1 to 5 and 10 |

## Context

The frontend is being rebuilt from scratch. The owner asked for a Scandinavian design with light, dark and system themes ([[context/conventions]], Frontend). Until now there was no approved look: no colors, no font, no page layout.

The question was which visual direction the new frontend follows.

## Considered options

### Option 1 — "Oak, ink band"

A flat, calm style: strong type, no shadows, no gradients, 2px corners. A warm off-white ground with near-black text and borders ("ink"), and one oak-gold accent. Every main page has a header, a full-width dark band with the page heading, and a first card that overlaps the band. Font: Hanken Grotesk. Three themes: light, dark, system; system is the default.

**Pros:**
- Matches the Scandinavian brief: neutral palette, few accents, clean type.
- One accent and one page pattern keep every screen consistent.
- Light and dark share one set of token names, so components do not branch on the theme.

**Cons:**
- Needs a web font that is not on the user's machine.
- A ready-made UI library has to be restyled to match, or left out.

### Option 2 — Other directions

The README records only the approved direction. Which other directions were looked at is not written down.

## Decision

**We chose Option 1.**

The owner approved "Oak, ink band" on 2026-10-06. The rules are in `docs/design/README.md`; the vault copy is [[context/design-system]]. The pictures are in `docs/design/screens/`.

Themes: light, dark and system. Default is system. The choice is saved in the browser. The token set is switched with a `data-theme` attribute on the root element, and `color-scheme` is set too.

## Consequences

| Consequence | Type |
|---|---|
| All colors come from the tokens in [[context/design-system]]; no hex value in a component | new work |
| Every main page uses the header, band and overlapping first card | new work |
| A theme switch in the header (three icon buttons) and in the phone menu (three text buttons) | new work |
| Hanken Grotesk (400, 500, 600, 700) must be loaded | new work |
| The UI library chosen at the architect gate must be able to take these tokens, or the components are built in the repo | follow-up |
| No shadows and no gradients, so depth comes only from borders and the band | trade-off |
| Screens without a dark or phone picture are built from the rules, not from a picture | trade-off |

## Open questions

- [ ] Where do the tokens live in the code (file and format)?
- [ ] How is the font loaded: self-hosted or from a font service?
- [ ] How and under which key is the theme choice saved in the browser?
- [ ] At which width does the layout switch to the phone layout? The README gives 360px as the smallest width and draws the phone at 390px, but no breakpoint.
- [ ] Which UI library, if any? Decided at the architect gate.

## Related

- Concepts: (none)
- Components: (none yet — the frontend is being rebuilt)
- Gotchas: (none)
- Lessons: (none)
- ADRs: [[architecture/adr-08-mentoring-and-field-stay-two-new-alumni-columns|ADR-08]], [[architecture/adr-09-white-label-app-name-from-one-config-value|ADR-09]], [[architecture/adr-10-about-page-last-privacy-and-password-reset-later|ADR-10]]
- Context: [[context/design-system]]
