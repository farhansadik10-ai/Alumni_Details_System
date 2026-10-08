# Frontend app (`frontend/src/`)

| Field | Value |
|---|---|
| Component | `@alumni/frontend` — React 18 + Vite 5 + TypeScript, Jotai, react-router 7, axios, CSS Modules on design tokens |
| Status | current as of REQ-fs-006 (2026-10-08); log in, sign-up, shell, base components, the alumni directory, the alumni profile, My profile, the feed and the dashboard are built; the users page is "being built" |
| Created | 2026-10-07 |

The new frontend, rebuilt from scratch with no UI library ([[architecture/adr-07-design-direction-oak-ink-band|ADR-07]]); the Ant Design app is deleted. Four layers that depend one way: pages and components → `store/` (Jotai atoms and write-only actions) → `services/` (one axios client) → the API; `lib/` holds pure functions and may not touch the browser at import. Styles are CSS Modules reading tokens from `styles/tokens.css` ([[architecture/adr-13-frontend-structure-css-modules-on-tokens|ADR-13]]). The token and the theme choice live in `localStorage` ([[architecture/adr-14-session-and-theme-kept-in-the-browser|ADR-14]]). The patterns, one by one, with their reasons: `docs/frontend-patterns.md`.

## The pieces

| Folder | Job |
|---|---|
| `config/` | `app.ts` (`APP_NAME`, `CONTACT_EMAIL`), `storageKeys.ts`, `layout.ts` (phone query), `text.ts`; plain constants, read by `vite.config.ts` too |
| `styles/` | `tokens.css` (every token, light and dark, phone override, a block for later additions), `base.css` |
| `lib/` | `token.ts`, `validation.ts`, `returnAddress.ts`, `pageRange.ts`, `initials.ts`, `browserStorage.ts`; from part 2: `alumniForm.ts`, `alumniDisplay.ts` (`presentText`), `directoryQuery.ts`, `directoryReturn.ts`, `profileId.ts`, `mailtoLink.ts`, `loadFailure.ts`, `saveFailure.ts`; from part 3: `postDisplay.ts` (`dateText`, `commentCountText`, `countText`), `contentOwner.ts`, `commentThread.ts`, `feedPaging.ts`, `writeFailure.ts`, plus `canWritePosts` in `token.ts` and `mentoringDirectoryAddress` in `directoryQuery.ts`; checked by `scripts/frontend-lib-check.ts` |
| `services/` | `apiClient.ts`, `apiError.ts` (`isCancelled`), `authService.ts`, `userService.ts`, `alumniService.ts`; from part 3: `postService.ts`, `commentService.ts`, `statsService.ts` |
| `store/` | `appStore`, `sessionAtoms`, `sessionActions`, `profileAtoms`, `themeAtoms`, `toastAtoms`, `wireApi`; from part 2: `latestRequest`, `alumniAtoms` (directory list, filter options, one viewed profile, my profile; clear-on-close actions), `alumniActions` (save profile, save account); from part 3: `postAtoms` (feed, one open comment thread, recent posts, people lists, stats), `postActions` (publish, save, delete a post; add, save, delete a comment), `peopleBlockState` |
| `routes/` | `paths.ts`, `RequireAuth`, `RequireAdmin`, `PublicOnly` |
| `hooks/` | `useDocumentTitle`, `useModalDialog`, `useFormError` |
| `components/ui/` | Button, ButtonLink (part 3), Link (takes router `state`), Field, TextInput, PasswordInput, Select, Textarea, Checkbox, RadioCards, Tag + RoleTag, Avatar (size `xl`), Card, Table, Pagination, Skeleton, EmptyState (optional link action), ErrorState, Dialog + ConfirmDialog, Message, Toast |
| `components/shell/` | AppShell, Header, PhoneMenu, Band, ProfileBand (+ `ProfileBandAction`), Footer, SkipLink, PageLayout (optional `band` slot), ThemeSwitch, BeingBuilt, navLabels |
| `components/alumni/` | AlumniCard + AlumniCardSkeleton, DirectoryFilters (`showClear`, `searchRef`, phone panel in CSS only) |
| `components/posts/` | PostByline, PostText, PostForm, CommentForm, FeedPost, CommentsPanel, CommentItem, PostSummaryCard (part 3) |
| `components/dashboard/` | CountsBlock, RecentPostsBlock, YourProfileBlock (part 3); `components/alumni/PeopleBlock` is shared by the Feed and the Dashboard |
| `components/profile/` | AccountCard (`primary` prop), AlumniProfileCard (creates or edits; stays mounted) |
| `pages/` | LoginPage, SignUpPage, DirectoryPage, AlumniProfilePage, MyProfilePage, FeedPage, DashboardPage, one "being built" page (users), NotFoundPage, NoAccessPage, `dev/ComponentsPage` (development only) |

## Checks

`npm run check:frontend` runs `scripts/frontend-style-check.mjs` (11 rules, a to k) and `scripts/frontend-lib-check.ts` (469 cases after part 3); `npm run build` runs `tsc -b`. There is no test runner. Owner's manual checklists: each REQ's `manual-checklist.md` (REQ-fs-004: 60 steps; REQ-fs-005 in its own folder).

## Touched by

- REQ-fs-004 — foundation, tokens and theme, base components, app shell, log in and sign-up.
- REQ-fs-005 — the alumni directory, the alumni profile and My profile (roadmap F6, F7); the shared parts above marked "from part 2". Part 3 is REQ-fs-006.
- REQ-fs-006 — the feed and the dashboard (roadmap F8 and the Dashboard half of F9) and the Recent posts block on the alumni profile; the parts marked "from part 3". The users page (admin) is the last "being built" page.

## Related

- Context: [[context/design-system]], [[context/conventions]]
- Concepts: [[knowledge/concepts/frontend-session-flow]], [[knowledge/concepts/latest-request-wins]], [[knowledge/concepts/address-as-state]], [[knowledge/concepts/aligned-load-more]]
- ADRs: [[architecture/adr-09-white-label-app-name-from-one-constant|ADR-09]], [[architecture/adr-13-frontend-structure-css-modules-on-tokens|ADR-13]], [[architecture/adr-14-session-and-theme-kept-in-the-browser|ADR-14]]
- Gotchas: [[knowledge/gotchas#^g43|G43]] to [[knowledge/gotchas#^g58|G58]]
