# ADR-13 — Frontend structure: four layers, CSS Modules on one token file, our own icons, a self-hosted font ^ADR-13

| Field | Value |
|---|---|
| Status | accepted |
| Decided | 2026-10-07 |
| Author | farhansadik10-ai (owner); drafted by Claude |
| Supersedes | (none) |
| Superseded by | (none) |
| Based on | REQ-fs-004; the owner's scope note of 2026-10-07 ("plain CSS Modules on CSS custom properties", "no UI library and no CSS framework"); [[context/design-system]] items marked "decide in the REQ that builds it" |

## Context

The frontend is rebuilt from scratch ([[architecture/adr-07-design-direction-oak-ink-band|ADR-07]]). The owner fixed the main choices: React, Vite, TypeScript, Jotai, react-router, axios, no UI library, no CSS framework, CSS Modules on CSS custom properties. [[context/conventions]] left frontend file naming "for `/architect` to propose", and [[context/design-system]] left these open: the token file, token names for everything that is not a color, the phone breakpoint, the icon set, how the font is loaded, and the layer order.

Three more REQs build screens on top of this one, so these choices are made once here.

## Considered options

### Option 1 — Four one-way layers, one token file, own icons, self-hosted font

- **Layers:** pages and components → `store/` (Jotai atoms and action atoms) → `services/` (one axios client) → the API. `lib/` holds pure functions. A component never imports from `services/`. `services/` never imports from `store/`; `store/wireApi.ts` connects them once.
- **Files:** `components/ui/<Name>/<Name>.tsx` with `<Name>.module.css`; PascalCase for components, camelCase for everything else; no barrel files.
- **Tokens:** one file, `styles/tokens.css`. Color tokens keep the README names. New names for type, spacing, shape, control sizes, layout and layers (the list is in the REQ-fs-004 design). Component stylesheets hold no color and no `px` or `em` literal; a script checks it.
- **Breakpoint:** the phone layout starts below 768px. It is the one number written in component stylesheets, because CSS variables do not work in media queries.
- **Icons:** small React components in `src/icons/`, drawn from the SVG paths in the design files.
- **Font:** the package `@fontsource-variable/hanken-grotesk`, served from our own build.

**Pros:**
- Matches every rule the owner already set.
- No request to another company's server for the font, which matters for selling in Europe.
- One place to change a value; the check script keeps it that way.

**Cons:**
- One new package.
- Every size needs a token name, which is more typing than a literal.

### Option 2 — Same, but load the font from Google Fonts and take icons from a package

**Pros:**
- No font package; a ready icon set.

**Cons:**
- Every page load calls a third party (privacy, and it fails offline).
- An icon package is a dependency for about ten icons, and its stroke width would not match the design's.

### Option 3 — Feature folders (`features/auth`, `features/directory`) instead of layers

**Pros:**
- Each screen's code sits together.

**Cons:**
- The owner's conventions name `src/store/` and `src/services/` as the homes for state and API calls.
- With one small service per resource, feature folders add nesting without removing anything.

## Decision

**We chose Option 1.** (Accepted by the owner at the REQ-fs-004 design gate, 2026-10-07.)

It follows the owner's written rules, adds one small package that replaces one being removed, and keeps design values in a single file that a script can guard.

## Consequences

| Consequence | Type |
|---|---|
| `@fontsource-variable/hanken-grotesk` is added to `frontend/package.json`; `antd`, `@ant-design/icons` and `@fontsource-variable/inter` are removed | new work |
| `scripts/frontend-style-check.mjs` must pass before a frontend REQ is reviewed | new work |
| Sizes in the pictures that are off the README scales are snapped to the nearest step (table in the REQ-fs-004 design) | trade-off |
| The 768px breakpoint is a literal repeated in stylesheets | trade-off |
| A new icon means drawing or copying an SVG path by hand | trade-off |
| [[context/design-system]] and [[context/conventions]] record these names and paths at wrap-up | follow-up |

## Open questions

- [ ] May a buyer change tokens (their own accent color)? Not decided here.

## Related

- Concepts: (none yet)
- Components: [[knowledge/components/frontend-app]]
- Gotchas: (none)
- Lessons: (none)
- ADRs: [[architecture/adr-07-design-direction-oak-ink-band|ADR-07]], [[architecture/adr-09-white-label-app-name-from-one-constant|ADR-09]], [[architecture/adr-14-session-and-theme-kept-in-the-browser|ADR-14]]
- Context: [[context/design-system]], [[context/conventions]]
- First built in: REQ-fs-004
