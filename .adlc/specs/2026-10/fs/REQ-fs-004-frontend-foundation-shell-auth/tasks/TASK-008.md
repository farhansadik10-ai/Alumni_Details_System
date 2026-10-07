# TASK-008 — App shell, routes and guards, being-built pages

| Field | Value |
|---|---|
| REQ | REQ-fs-004 |
| Tier | 4 |
| Status | pending |
| Repo | alumni-details-system |
| Depends on | TASK-003, TASK-004, TASK-005, TASK-006, TASK-007 |
| Blocks | TASK-009, TASK-010 |

## Goal

A logged-in user sees the shell (header, band, footer, phone menu) on every page, each unbuilt page says it is being built, and the guards send each kind of visitor to the right place.

## Files to touch

| Path | Action |
|---|---|
| `frontend/src/routes/paths.ts` | create |
| `frontend/src/routes/RequireAuth.tsx` | create |
| `frontend/src/routes/RequireAdmin.tsx` | create |
| `frontend/src/routes/PublicOnly.tsx` | create |
| `frontend/src/hooks/useDocumentTitle.ts` | create |
| `frontend/src/components/shell/AppShell/AppShell.tsx + AppShell.module.css` | create |
| `frontend/src/components/shell/Header/Header.tsx + Header.module.css` | create |
| `frontend/src/components/shell/PhoneMenu/PhoneMenu.tsx + PhoneMenu.module.css` | create |
| `frontend/src/components/shell/Band/Band.tsx + Band.module.css` | create |
| `frontend/src/components/shell/Footer/Footer.tsx + Footer.module.css` | create |
| `frontend/src/components/shell/SkipLink/SkipLink.tsx + SkipLink.module.css` | create |
| `frontend/src/components/shell/PageLayout/PageLayout.tsx + PageLayout.module.css` | create |
| `frontend/src/components/shell/BeingBuilt/BeingBuilt.tsx + BeingBuilt.module.css` | create |
| `frontend/src/pages/DashboardPage/DashboardPage.tsx` | create |
| `frontend/src/pages/DirectoryPage/DirectoryPage.tsx` | create |
| `frontend/src/pages/AlumniProfilePage/AlumniProfilePage.tsx` | create |
| `frontend/src/pages/FeedPage/FeedPage.tsx` | create |
| `frontend/src/pages/MyProfilePage/MyProfilePage.tsx` | create |
| `frontend/src/pages/UsersPage/UsersPage.tsx` | create |
| `frontend/src/pages/NotFoundPage/NotFoundPage.tsx` | create |
| `frontend/src/pages/NoAccessPage/NoAccessPage.tsx` | create |
| `frontend/src/pages/LoginPage/LoginPage.tsx` | create (a stub that TASK-009 replaces) |
| `frontend/src/pages/SignUpPage/SignUpPage.tsx` | create (a stub that TASK-009 replaces) |
| `frontend/src/App.tsx` | rewrite (the route table) |
| `frontend/src/main.tsx` | edit only if needed |

## Approach

- **`paths.ts`.** One `PATHS` object: `login: "/login"`, `signup: "/signup"`, `home: "/"`, `dashboard`, `directory`, `alumniProfile: "/directory/:id"`, `feed`, `myProfile: "/profile"`, `users`, `devComponents: "/dev/components"`. No address string anywhere else.
- **Guards** (layout routes that render `<Outlet />`). `RequireAuth`: no session, or an expired one (check `isExpired(session, Date.now())` on each render) → `<Navigate to={PATHS.login} replace state={...} />`, where the state is `{ from: location }` unless the auth notice is `loggedOut`, in which case it is empty. When the reason was an expired token that is still stored, also dispatch `endSessionAtom` in an effect (never during render). `PublicOnly` is the **only** code that navigates after a log in: a live session → `<Navigate replace>` to `location.state.from` when it is there, else to `PATHS.dashboard`. Read `from` defensively: router state is `unknown`. `RequireAdmin`: session role is not `admin` → render `NoAccessPage` (inside the shell; no admin request is made).
- **`App.tsx`.** `BrowserRouter`. Pages are `React.lazy` imports. Tree: `PublicOnly` → `/login`, `/signup`; `RequireAuth` → `AppShell` → index (`Navigate` to dashboard), dashboard, directory, directory/:id, feed, profile, `RequireAdmin` → users, `*` → NotFound. `/dev/components` is added by TASK-010. `AppShell` wraps its `<Outlet />` in one `Suspense` whose fallback is a `PageLayout` with skeletons, so the header stays while a page loads; the public routes have their own plain `Suspense`. `ToastViewport` is mounted once at the top.
- **`AppShell`.** `SkipLink` ("Skip to content", first in tab order, visible only on focus, jumps to `<main id>`), `Header`, `<main tabIndex={-1}>` with the outlet, `Footer`. It dispatches `loadProfileAtom` when the session's user id changes. On a change of `location.pathname` (not on first load) it moves focus to the page's `<h1>` (give the Band heading `tabIndex={-1}`).
- **`Header`** (`directory.html` lines 17 to 36, with the README's corrections). Height `--header-h`, `--surface`, 1.5px `--edge` bottom border, content `--content-max` wide with `--gutter` padding. Left: the app name (`APP_NAME`, a link to the dashboard, 18px, weight 700) and `<nav aria-label="Main">` with `NavLink`s Dashboard, Directory, Feed, plus Users when the session role is `admin`. A link is `--muted`, weight 500; the current one (`aria-current="page"`) is `--text`, weight 700, with a `--nav-marker` high `--accent` line at the bottom edge (drawn with a pseudo-element or border, not a shadow). Right: `ThemeSwitch variant="icons"` and a link to My profile holding `Avatar size="sm"` and the name. Profile `loading`: a skeleton in place of avatar and name. Profile `error` or no name: a plain avatar and the words "My profile". Below 768px: only the app name and a 44px menu button (`MenuIcon`, `aria-label="Open menu"`, `aria-expanded`).
- **`PhoneMenu`** (`phone-menu.html`). A native `<dialog>` opened with `showModal()`, styled to fill the screen on `--surface`, with an accessible name ("Menu"). Top row like the phone header with a close button (`CloseIcon`, `aria-label="Close menu"`). Large links (24px, weight 600; the current one weight 700 with an `--accent` bar on the left edge, drawn with a border or pseudo-element): Dashboard, Directory, Feed, Users (admin only), My profile. Then "Theme" with `ThemeSwitch variant="text"`. At the bottom, on `--ground` with a 1.5px `--edge` top border: `Avatar size="md"`, name, email in `--muted`, and a secondary `lg` "Log out" button that dispatches `logOutAtom`. Choosing a link, Escape and the close button all close it; it also closes when the route changes or the window grows past the breakpoint. The menu scrolls inside itself when the screen is short.
- **`Band`.** Props `heading`, `sub`. Full-width `--band` with a 1.5px `--edge` bottom border; inside the content width: the accent bar (`--bar-w` × `--bar-h`, `--accent`, `aria-hidden`), `<h1>` in `--band-text` with the band type tokens, sub text in `--band-muted` (18px, max width `--measure`). Bottom padding leaves room for the overlap. **`PageLayout`**: `Band` plus a content column whose first child is pulled up by `--band-overlap`; it calls `useDocumentTitle(heading)`.
- **`Footer`.** 1px `--line` top border; the app name in `--muted`, Small. No About link (ADR-10).
- **`useDocumentTitle(title)`.** Sets `document.title` to `` `${title} · ${APP_NAME}` ``.
- **Pages.** `BeingBuilt` (a shell component) takes `heading`, `sub` and optional `children`, and renders `PageLayout` with a `Card` that says "This page is being built" and one muted line ("It arrives in a later update."). Each of the six routes has its own thin page file that renders `BeingBuilt` with its words and is its own `React.lazy` import, so the build has one file per page and parts 2 to 4 replace one file each. Headings and sub texts: Dashboard / "Your starting point."; Alumni directory / "Find graduates by name, company or job title, and see who is open to mentoring."; Alumni profile / "One graduate's public profile."; Feed / "News and questions from the community."; My profile / "Your account and your alumni profile."; Users / "Everyone with an account." The My profile one also shows a secondary "Log out" button (AC43). `NotFoundPage`: heading "Page not found", a card with one line and a link to the Dashboard. `NoAccessPage`: heading "Users", a card with "You do not have access to this page" and a link to the Dashboard.
- **Log out navigation.** Nothing navigates by hand. After `logOutAtom` the token is gone and the notice is `loggedOut`, so `RequireAuth` sends the user to `/login` with no return address.

## Acceptance

- [ ] AC6: after a build, `frontend/dist/assets` has a separate JavaScript file for each of the eight page files, and the entry file does not contain the text "This page is being built" (record the listing and the search)
- [ ] AC37, two cases by hand: logged out, open `/feed`, log in (or set a token) → `/feed`; log out from `/profile`, log in again → Dashboard
- [ ] AC32 to AC43: each as written in the spec
- [ ] AC62: each shell page sets its tab title and has exactly one `<h1>`
- [ ] Keyboard pass at 1280px and at 360px: Skip link first; every header control reachable; the phone menu traps focus and returns it to the menu button on close
- [ ] `node scripts/frontend-style-check.mjs` exits 0 and `npm run build` exits 0

## Notes

- **Rules for every task of this REQ.** Never read or print any `.env` file. Never run `psql` or anything that changes the database. Never run `git push` or any git command that writes. Touch nothing under `backend/`, `shared/` or `db/`. Delete no file that this task's table does not list. Add no package that this task does not name. If the task cannot be done inside these rules, stop and write why in the implementation notes.
- Read `architecture.md` in this REQ folder first (layout, token names, the size-snapping table). Read `docs/design/README.md` and the screen files this task names. Do not copy inline styles from the screens; read the tokens.
- Compiler rules: `import type` for types, no enums, no unused locals or parameters. No barrel `index.ts` files for components.
- No real backend may be available. To see the shell, put a hand-made token in `localStorage` under `ua.token` (three base64url parts; payload `{"sub":1,"role":"admin","exp":<a time in the future>}`). The profile call will then fail, which is exactly the AC41 error path. Say in the notes what was and was not seen in a browser.
- The design draws the nav marker and the phone menu marker with `box-shadow: inset`. The rule is "no shadows", so draw the same line another way.
- `--accent` is used here as a marker beside dark text on a light surface, never as text and never as the only border.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-004-frontend-foundation-shell-auth/architecture]]
- Lessons checked: —
