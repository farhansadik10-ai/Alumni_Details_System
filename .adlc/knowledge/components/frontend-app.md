# Frontend app (`frontend/src/`)

| Field | Value |
|---|---|
| Component | `@alumni/frontend` — React + Vite + TypeScript, Jotai, react-router, axios, CSS Modules on design tokens |
| Status | stub — being built in REQ-fs-004; `/wrapup` fills this in with what was actually built |
| Created | 2026-10-07 |

> **STATUS: needs verification** — written at the design gate of REQ-fs-004, before any code. It describes the plan.

The new frontend, rebuilt from scratch with no UI library ([[architecture/adr-07-design-direction-oak-ink-band|ADR-07]]). Four layers that depend one way: pages and components → `store/` (Jotai atoms and actions) → `services/` (one axios client) → the API; `lib/` holds pure functions. Styles are CSS Modules that read tokens from `styles/tokens.css` ([[architecture/adr-13-frontend-structure-css-modules-on-tokens|ADR-13]]). The session token and the theme choice live in `localStorage` ([[architecture/adr-14-session-and-theme-kept-in-the-browser|ADR-14]]).

The human-readable record of the patterns is `docs/frontend-patterns.md`.

## Touched by

- REQ-fs-004 — foundation, tokens and theme, base components, app shell, log in and sign-up

## Related

- Context: [[context/design-system]], [[context/conventions]]
- ADRs: [[architecture/adr-09-white-label-app-name-from-one-constant|ADR-09]], [[architecture/adr-13-frontend-structure-css-modules-on-tokens|ADR-13]], [[architecture/adr-14-session-and-theme-kept-in-the-browser|ADR-14]]
