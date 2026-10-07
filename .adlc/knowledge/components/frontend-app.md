# Frontend app (`frontend/src/`)

| Field | Value |
|---|---|
| Component | `@alumni/frontend` — React 18 + Vite 5 + TypeScript, Jotai, react-router 7, axios, CSS Modules on design tokens |
| Status | current as of REQ-fs-004 (2026-10-07); log in, sign-up, shell and base components built; directory, profiles, feed, dashboard and users are "being built" pages |
| Created | 2026-10-07 |

The new frontend, rebuilt from scratch with no UI library ([[architecture/adr-07-design-direction-oak-ink-band|ADR-07]]); the Ant Design app is deleted. Four layers that depend one way: pages and components → `store/` (Jotai atoms and write-only actions) → `services/` (one axios client) → the API; `lib/` holds pure functions and may not touch the browser at import. Styles are CSS Modules reading tokens from `styles/tokens.css` ([[architecture/adr-13-frontend-structure-css-modules-on-tokens|ADR-13]]). The token and the theme choice live in `localStorage` ([[architecture/adr-14-session-and-theme-kept-in-the-browser|ADR-14]]). The patterns, one by one, with their reasons: `docs/frontend-patterns.md`.

## The pieces

| Folder | Job |
|---|---|
| `config/` | `app.ts` (`APP_NAME`, `CONTACT_EMAIL`), `storageKeys.ts`, `layout.ts` (phone query), `text.ts`; plain constants, read by `vite.config.ts` too |
| `styles/` | `tokens.css` (every token, light and dark, phone override, a block for later additions), `base.css` |
| `lib/` | `token.ts`, `validation.ts`, `returnAddress.ts`, `pageRange.ts`, `initials.ts`, `browserStorage.ts`; checked by `scripts/frontend-lib-check.ts` |
| `services/` | `apiClient.ts`, `apiError.ts`, `authService.ts`, `userService.ts` |
| `store/` | `appStore`, `sessionAtoms`, `sessionActions`, `profileAtoms`, `themeAtoms`, `toastAtoms`, `wireApi` |
| `routes/` | `paths.ts`, `RequireAuth`, `RequireAdmin`, `PublicOnly` |
| `hooks/` | `useDocumentTitle`, `useModalDialog`, `useFormError` |
| `components/ui/` | Button, Link, Field, TextInput, PasswordInput, Select, Textarea, Checkbox, RadioCards, Tag + RoleTag, Avatar, Card, Table, Pagination, Skeleton, EmptyState, ErrorState, Dialog + ConfirmDialog, Message, Toast |
| `components/shell/` | AppShell, Header, PhoneMenu, Band, Footer, SkipLink, PageLayout, ThemeSwitch, BeingBuilt, navLabels |
| `pages/` | LoginPage, SignUpPage, six "being built" pages, NotFoundPage, NoAccessPage, `dev/ComponentsPage` (development only) |

## Checks

`npm run check:frontend` runs `scripts/frontend-style-check.mjs` (10 rules) and `scripts/frontend-lib-check.ts` (108 cases); `npm run build` runs `tsc -b`. There is no test runner. Owner's manual checklist: the REQ's `manual-checklist.md` (60 steps).

## Touched by

- REQ-fs-004 — foundation, tokens and theme, base components, app shell, log in and sign-up. Parts 2 to 4 (roadmap F6 to F9) replace the six "being built" pages one file each.

## Related

- Context: [[context/design-system]], [[context/conventions]]
- Concepts: [[knowledge/concepts/frontend-session-flow]]
- ADRs: [[architecture/adr-09-white-label-app-name-from-one-constant|ADR-09]], [[architecture/adr-13-frontend-structure-css-modules-on-tokens|ADR-13]], [[architecture/adr-14-session-and-theme-kept-in-the-browser|ADR-14]]
- Gotchas: [[knowledge/gotchas#^g43|G43]] to [[knowledge/gotchas#^g50|G50]]
