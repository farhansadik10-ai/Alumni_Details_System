# Frontend app (`frontend/src/`)

| Field | Value |
|---|---|
| Component | `@alumni/frontend` — React 18 + Vite 5 + TypeScript, Jotai, react-router 7, axios, CSS Modules on design tokens |
| Status | current as of REQ-fs-005 (2026-10-08); log in, sign-up, shell, base components, the alumni directory, the alumni profile and My profile are built; the feed, dashboard and users pages are "being built" |
| Created | 2026-10-07 |

The new frontend, rebuilt from scratch with no UI library ([[architecture/adr-07-design-direction-oak-ink-band|ADR-07]]); the Ant Design app is deleted. Four layers that depend one way: pages and components → `store/` (Jotai atoms and write-only actions) → `services/` (one axios client) → the API; `lib/` holds pure functions and may not touch the browser at import. Styles are CSS Modules reading tokens from `styles/tokens.css` ([[architecture/adr-13-frontend-structure-css-modules-on-tokens|ADR-13]]). The token and the theme choice live in `localStorage` ([[architecture/adr-14-session-and-theme-kept-in-the-browser|ADR-14]]). The patterns, one by one, with their reasons: `docs/frontend-patterns.md`.

## The pieces

| Folder | Job |
|---|---|
| `config/` | `app.ts` (`APP_NAME`, `CONTACT_EMAIL`), `storageKeys.ts`, `layout.ts` (phone query), `text.ts`; plain constants, read by `vite.config.ts` too |
| `styles/` | `tokens.css` (every token, light and dark, phone override, a block for later additions), `base.css` |
| `lib/` | `token.ts`, `validation.ts`, `returnAddress.ts`, `pageRange.ts`, `initials.ts`, `browserStorage.ts`; from part 2: `alumniForm.ts`, `alumniDisplay.ts` (`presentText`), `directoryQuery.ts`, `directoryReturn.ts`, `profileId.ts`, `mailtoLink.ts`, `loadFailure.ts`, `saveFailure.ts`; checked by `scripts/frontend-lib-check.ts` |
| `services/` | `apiClient.ts`, `apiError.ts` (`isCancelled`), `authService.ts`, `userService.ts`, `alumniService.ts` |
| `store/` | `appStore`, `sessionAtoms`, `sessionActions`, `profileAtoms`, `themeAtoms`, `toastAtoms`, `wireApi`; from part 2: `latestRequest`, `alumniAtoms` (directory list, filter options, one viewed profile, my profile; clear-on-close actions), `alumniActions` (save profile, save account) |
| `routes/` | `paths.ts`, `RequireAuth`, `RequireAdmin`, `PublicOnly` |
| `hooks/` | `useDocumentTitle`, `useModalDialog`, `useFormError` |
| `components/ui/` | Button, Link (takes router `state`), Field, TextInput, PasswordInput, Select, Textarea, Checkbox, RadioCards, Tag + RoleTag, Avatar (size `xl`), Card, Table, Pagination, Skeleton, EmptyState, ErrorState, Dialog + ConfirmDialog, Message, Toast |
| `components/shell/` | AppShell, Header, PhoneMenu, Band, ProfileBand (+ `ProfileBandAction`), Footer, SkipLink, PageLayout (optional `band` slot), ThemeSwitch, BeingBuilt, navLabels |
| `components/alumni/` | AlumniCard + AlumniCardSkeleton, DirectoryFilters (`showClear`, `searchRef`, phone panel in CSS only) |
| `components/profile/` | AccountCard (`primary` prop), AlumniProfileCard (creates or edits; stays mounted) |
| `pages/` | LoginPage, SignUpPage, DirectoryPage, AlumniProfilePage, MyProfilePage, three "being built" pages (dashboard, feed, users), NotFoundPage, NoAccessPage, `dev/ComponentsPage` (development only) |

## Checks

`npm run check:frontend` runs `scripts/frontend-style-check.mjs` (11 rules, a to k) and `scripts/frontend-lib-check.ts` (333 cases); `npm run build` runs `tsc -b`. There is no test runner. Owner's manual checklists: each REQ's `manual-checklist.md` (REQ-fs-004: 60 steps; REQ-fs-005 in its own folder).

## Touched by

- REQ-fs-004 — foundation, tokens and theme, base components, app shell, log in and sign-up.
- REQ-fs-005 — the alumni directory, the alumni profile and My profile (roadmap F6, F7); the shared parts above marked "from part 2". Parts 3 and 4 (feed, dashboard, users) replace the three "being built" pages one file each.

## Related

- Context: [[context/design-system]], [[context/conventions]]
- Concepts: [[knowledge/concepts/frontend-session-flow]], [[knowledge/concepts/latest-request-wins]], [[knowledge/concepts/address-as-state]]
- ADRs: [[architecture/adr-09-white-label-app-name-from-one-constant|ADR-09]], [[architecture/adr-13-frontend-structure-css-modules-on-tokens|ADR-13]], [[architecture/adr-14-session-and-theme-kept-in-the-browser|ADR-14]]
- Gotchas: [[knowledge/gotchas#^g43|G43]] to [[knowledge/gotchas#^g55|G55]]
