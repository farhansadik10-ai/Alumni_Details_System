# TASK-008 — App shell, routes and guards, being-built pages

| Field | Value |
|---|---|
| REQ | REQ-fs-004 |
| Tier | 4 |
| Status | complete |
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

### Implementation notes (task-implementer, 2026-10-07)

**Checks.** `npm run build` exit 0; `node scripts/frontend-style-check.mjs` exit 0 (105 files, no findings); `npx tsx scripts/frontend-lib-check.ts` 72 passed, exit 0. No token was added to `tokens.css`.

**AC6, the listing.** `frontend/dist/assets` after the build: `LoginPage-*.js`, `SignUpPage-*.js`, `DashboardPage-*.js`, `DirectoryPage-*.js`, `AlumniProfilePage-*.js`, `FeedPage-*.js`, `MyProfilePage-*.js`, `UsersPage-*.js`, `NotFoundPage-*.js`, `NoAccessPage-*.js` (ten page files, each 0.16 to 0.34 kB), plus two shared pieces, `BeingBuilt-*.js` and `Link-*.js`, and the entry `index-*.js` (265 kB). `grep -c "This page is being built"` on the entry file gives 0; the text is only in `BeingBuilt-*.js`.

**How it was looked at.** Headless Chrome, driven over the debugging port with real Tab, Enter and Escape keys, against the Vite dev server. Something was already listening on port 3000 when this task started (a Node process that answers `/api/health`; this task did not start it and did not touch it). So that no request of this look could reach it, the dev server ran with a temporary config that sent `/api` to a port where nothing listens. A second pass answered `GET /api/users/1` inside the browser to show the loading and the ready header. The temporary config, the driver scripts, the screenshots and the browser profile are deleted; the dev server and Chrome are stopped. A "session appears" was made the way another tab makes one: the hand-made token written to `localStorage` plus a `storage` event.

**Seen in the browser** (1280px light and dark, 800px, 360px; no console error or warning in either pass):

- AC37, case 1: logged out, `/feed?x=1` → `/login` with `state.from` = `/feed?x=1`; a session appears → `/feed?x=1`.
- AC37, case 2, and AC43: Log out on `/profile` → one `PUT /api/users/1/logout` (it failed, nothing listens) → `/login`, router state `null`, token gone; next session → `/dashboard`. Same from the phone menu's Log out.
- AC38: `/login` and `/signup` while logged in → `/dashboard`. `/` → `/dashboard`.
- AC39: a student at `/users` sees the heading "Users" and "You do not have access to this page" inside the shell; the only request is `GET /api/users/1` (the header's own); no Users link in the header or the menu. An admin sees the Users link and the being-built page.
- AC40, AC62: each of the six pages, Page not found and the no-access page has exactly one `<h1>` and its own tab title ("Feed · University Alumni").
- AC32, AC34, AC35, measured: header 72px (60px phone); band heading 60px (36px phone); accent bar 72×8 on both; card overlaps the band by 56px (52px phone); the current link is weight 700 with a 4px `--accent` line drawn by `::after`, `box-shadow: none`; footer holds the app name and no link.
- AC41: while the call waits, a skeleton in the header and in the menu; when it answers, initials and the name; when it fails or the user has no name, a plain avatar and "My profile". One profile request per load. A very long name is cut with "…" in the header and wraps in the menu; no sideways scroll.
- AC42: a token already expired at load → `/login`, token removed. A token that runs out while the page is open: the next click on a header link → `/login`, token removed, `state.from` = the page that was asked for. An unreadable token written by another tab → `/login`, token removed.
- AC36 and the keyboard pass, 1280px: Tab order is Skip to content, app name, Dashboard, Directory, Feed, Users, the three theme buttons, My profile. Enter on the skip link puts focus on `<main>`; the address keeps no `#`.
- A new page moves focus to its `<h1>` (by click and by Enter on a link); not on first load.
- AC33 and the keyboard pass, 360px: Tab order is Skip to content, app name, Open menu. Enter opens the menu: a modal dialog named "Menu", 360×740, focus on Close menu. Tab goes through the five links, Light, Dark, System, Log out, the browser's own UI, and back to Close menu; never the page behind. Escape and the close button close it and focus returns to the menu button (`aria-expanded` back to false). Choosing a link closes it and focus lands on the new heading; choosing the current page closes it; widening the window to 1024px closes it. On a 420px-high screen the menu scrolls inside itself. No sideways scroll at 360px or 800px.

**Only reasoned about, not seen.**

- A real log in, and the words "Your session has ended. Log in again." (the log-in page is a stub until TASK-009; the notice atom is set by `endSessionAtom`, which the three expiry cases above reached).
- The production build in a browser (the dev server was used), Firefox, Safari, a real screen reader, a real mouse, a touch screen.
- 200% zoom as such. At 1280px it is the same layout as a 640px window, which is the phone layout seen at 360px.
- A slow network between two pages. The router wraps a navigation in a React transition (checked in `react-router` 7.18.3), so the old page stays until the new file has arrived and the skeleton page shows only on first load.

**Choices the task text left open.** Say so if any should change.

1. **`BeingBuilt.module.css` was not created.** The task lists it, but Page not found and the no-access page need the same card (a statement, a line, a link), and their rows in the file table have no stylesheet. So the card is one small component, `PageNote`, in `PageLayout.tsx` with its styles in `PageLayout.module.css`; `BeingBuilt` is `PageLayout` + `PageNote` and has nothing of its own to style.
2. **`ANY_OTHER_PATH = "*"`** sits in `paths.ts` beside `PATHS`, so the route table holds no address text at all.
3. **`RequireAuth` also ends a stored token that cannot be read**, not only an expired one (the architecture lists both as a dead session). **`PublicOnly` also checks expiry**, or an expired session would bounce between the two guards for one render.
4. **`PublicOnly` accepts a return address only when it is a path inside the app** (starts with one `/`); anything else goes to the Dashboard.
5. **Pages are default exports** (`React.lazy` wants one); components stay named exports. `NoAccessPage` is loaded lazily by `RequireAdmin`.
6. **`ToastViewport` comes after the routes in the document**, not before: otherwise a toast's Dismiss button would be the first Tab stop, ahead of the skip link. It is fixed to the corner, so nothing moves on screen.
7. **The skip link moves focus by script** (`preventDefault`, then `focus()` on `<main>`): the address keeps no `#main-content`, and the link works a second time on the same page.
8. **Focus does not move when the user arrives from `/`**, which only sends them on to the Dashboard; that is a first load, not a page change. After a log in the shell is new too, so focus is on the page body and the first Tab is the skip link.
9. **Two focus rings are drawn inside the edge** (`outline-offset` minus the ring width): `<main>` and the phone menu links. Both are as wide as the screen, so an outside ring would be cut off at the sides. Width and color are untouched. The band heading is as wide as its words (`align-self: flex-start`) so its ring hugs them.
10. **Phone menu marker is 8px (`--bar-h`)**, drawn 6px; the table snaps 6 to 8 and the band's bar is the same thickness. The header marker is `--nav-marker`, 4px.
11. **Phone menu, profile failed:** the avatar row is left out and Log out stays. A user with no name shows a plain avatar and the email.
12. **The header is not sticky**, as in the pictures. `--z-header` is used only by the skip link.
13. **"Directory" stays marked as current on `/directory/:id`** (the router's default for a link whose address starts the current one).
14. **The header link's name for a screen reader** is "Tanvir Ahmed, My profile" (the last two words are hidden text), and "My profile Loading" while it loads.
15. **`PhoneMenu` gets `links` and `profile` from `Header`**, so the list of main links is written once. The visible word "Theme" in the menu is hidden from screen readers because the switch already names itself "Theme".
16. **Loading a page for the first time** shows a `PageLayout` with the heading "Loading", so the tab title is "Loading · University Alumni" for that moment.
17. **Profile load** runs whenever there is a session and the profile is `idle` (the session actions reset it to `idle` on every change of user). The status is read from the store inside the effect, so development's double effect run sends one request, not two.
18. **Sizes snapped** (architecture table): band top padding 56 → 48 (phone 28 → 24), bottom is the overlap plus the same; band gaps 14 and 10 → 12; phone band sub text 16px; app name to nav gap 40 → 48; nav link padding 14 → 12; user link gap 10 → 8; footer padding 20 → 24; page bottom padding 72 → 64 (phone 24).

**Follow-ups, not done here.**

- `PhoneMenu.tsx` repeats about 40 lines of `ui/Dialog/Dialog.tsx` (open / close, Escape, the browser's own close, close before unmount). A shared hook such as `hooks/useModalDialog.ts` would hold them once; it is a file no task names and it means editing TASK-007's Dialog, so it was left.
- Log out waits for the server before the session is cleared (TASK-003's follow-up: no timeout on the API client). Until then the button shows as busy.
- Something is listening on port 3000 on this machine. Anyone who runs `npm run dev:frontend` with a hand-made token will send its requests there.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-004-frontend-foundation-shell-auth/architecture]]
- Lessons checked: —
