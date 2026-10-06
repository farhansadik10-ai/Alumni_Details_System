# ADR-07 — Design direction is "Oak, ink band", with light, dark and system themes ^ADR-07

| Field | Value |
|---|---|
| Status | accepted |
| Decided | 2026-10-06 |
| Author | farhansadik10-ai (owner) |
| Supersedes | (none) |
| Superseded by | (none) |
| Based on | `docs/design/README.md` (approved by the owner on 2026-10-06), sections 1 to 5 and 10; the owner's answers of 2026-10-06 (the three directions, UI library, contrast check) |

## Context

The frontend is being rebuilt from scratch. The owner asked for a Scandinavian design with light, dark and system themes ([[context/conventions]], Frontend). Until now there was no approved look: no colors, no font, no page layout.

Three directions were drawn on the same screen. The question was which one the new frontend follows, and whether it is built on a ready-made UI library.

## Considered options

### Option A — "Fjord"

Cool blue-grey.

### Option B — "Academy"

Classic serif, formal.

### Option C — "Oak"

Warm paper, ink, ochre accent. Drawn in two variants:

- **Ink band:** the full-width band behind the page heading is near-black ("ink").
- **Ochre band:** the band is the ochre accent color.

Why A and B were not chosen is not written down.

## Decision

**We chose Option C, "Oak", in the ink band variant.**

The owner chose C, then chose the ink band over the ochre band because the light theme looked too plain without it.

What the direction fixes:

- A flat, calm style: strong type, no shadows, no gradients, 2px corners.
- Every main page has a header, a full-width ink band with the page heading, and a first card that overlaps the band.
- Font: Hanken Grotesk.
- Themes: light, dark and system. Default is system. The choice is saved in the browser. The token set is switched with a `data-theme` attribute on the root element, and `color-scheme` is set too.
- **UI library: none.** We build our own components on the tokens. Ant Design (`antd`) is legacy and is removed screen by screen; no new `antd` imports.

The rules are in `docs/design/README.md`; the vault copy is [[context/design-system]]. The pictures are in `docs/design/screens/`.

Contrast was checked by the owner (2026-10-06): every text pair passes WCAG AA in both themes, and borders and the focus ring pass 3:1. One limit follows from it: `--accent` on `--surface` in light is 2.76:1, so `--accent` is never used as text or as the only border on a light surface. The figures are in [[context/design-system]].

## Consequences

| Consequence | Type |
|---|---|
| All colors come from the tokens in [[context/design-system]]; no hex value in a component | new work |
| Every main page uses the header, band and overlapping first card | new work |
| A theme switch in the header (three icon buttons) and in the phone menu (three text buttons) | new work |
| Hanken Grotesk (400, 500, 600, 700) must be loaded | new work |
| Every component in [[context/design-system]] is built in the repo; nothing comes from a UI library | new work |
| A review finding if a new file imports `antd` | new work |
| `antd` stays installed until the last legacy screen is replaced, then it is removed | follow-up |
| `--accent` is never text and never the only border on a light surface | trade-off |
| No shadows and no gradients, so depth comes only from borders and the band | trade-off |
| Screens without a dark or phone picture are built from the rules, not from a picture | trade-off |

## Open questions

- [ ] Where do the tokens live in the code (file and format)? Decide in the REQ that builds it.
- [ ] How is the font loaded: self-hosted or from a font service? Decide in the REQ that builds it.
- [ ] How and under which key is the theme choice saved in the browser? Decide in the REQ that builds it.
- [ ] At which width does the layout switch to the phone layout? The README gives 360px as the smallest width and draws the phone at 390px, but no breakpoint. Decide in the REQ that builds it.

## Related

- Concepts: (none)
- Components: (none yet — the frontend is being rebuilt)
- Gotchas: (none)
- Lessons: (none)
- ADRs: [[architecture/adr-08-mentoring-and-field-stay-two-new-alumni-columns|ADR-08]], [[architecture/adr-09-white-label-app-name-from-one-constant|ADR-09]], [[architecture/adr-10-about-page-last-privacy-and-password-reset-later|ADR-10]]
- Context: [[context/design-system]]
