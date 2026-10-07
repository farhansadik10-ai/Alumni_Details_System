# TASK-010 — Components page (development only)

| Field | Value |
|---|---|
| REQ | REQ-fs-004 |
| Tier | 5 |
| Status | complete |
| Repo | alumni-details-system |
| Depends on | TASK-008 |
| Blocks | TASK-011 |

## Goal

In development, `/dev/components` shows every base component and state so each can be compared with `system.html` and `system-dark.html`; the production build does not contain it.

## Files to touch

| Path | Action |
|---|---|
| `frontend/src/pages/dev/ComponentsPage/ComponentsPage.tsx + ComponentsPage.module.css` | create |
| `frontend/src/App.tsx` | edit (register the route only when `import.meta.env.DEV`) |

## Approach

- One page, outside the guards, with `ThemeSwitch` at the top and sections in the order of `system.html`: Color (a swatch per color token with its name), Type, Space and shape, Buttons (every variant × default, disabled, busy; the three sizes), Form controls (TextInput default, with help, with error, disabled; PasswordInput; Select; Textarea; Checkbox plain and boxed; RadioCards), Tags and avatars (every Tag variant; Avatar in three sizes, with initials, with a working photo link and with a broken one), Dialog (a button that opens a `ConfirmDialog`) and Pagination (page 2 of 3, and page 6 of 25), Cards, Table (three sample rows with Avatar, RoleTag and a quiet danger Delete button), Messages and states (error, success, a button that shows a toast, Skeleton, EmptyState, ErrorState).
- Sample names and emails come from the design pictures (`example.com` addresses). No API call.
- In `App.tsx`: `const ComponentsPage = import.meta.env.DEV ? lazy(() => import(...)) : null;` and register the route only when it is not `null`, so the production bundle drops the file.

## Acceptance

- [ ] AC31: the page shows every component and state of AC17 to AC30
- [ ] After `npm run build`, no file in `frontend/dist/assets` contains a string that exists only in the components page (pick one unique heading and search for it); record the command and its result
- [ ] AC57: the page has no sideways scroll at 360px
- [ ] `node scripts/frontend-style-check.mjs` exits 0 and `npm run build` exits 0

## Notes

- **Rules for every task of this REQ.** Never read or print any `.env` file. Never run `psql` or anything that changes the database. Never run `git push` or any git command that writes. Touch nothing under `backend/`, `shared/` or `db/`. Delete no file that this task's table does not list. Add no package that this task does not name. If the task cannot be done inside these rules, stop and write why in the implementation notes.
- Read `architecture.md` in this REQ folder first (layout, token names, the size-snapping table). Read `docs/design/README.md` and the screen files this task names. Do not copy inline styles from the screens; read the tokens.
- Compiler rules: `import type` for types, no enums, no unused locals or parameters. No barrel `index.ts` files for components.
- The color swatches must read the tokens through classes in the module stylesheet (`background: var(--ground)`), so the page itself passes the style check. No inline `style` with a color.
- Only this task edits `App.tsx` in tier 5. TASK-009 does not touch it: the routes already point at the page files.
- This page is where the review compares components with the pictures; lay it out plainly.

### Implementation notes (task-implementer, 2026-10-07)

**Built.** `pages/dev/ComponentsPage/ComponentsPage.tsx` + `.module.css`; one edit in `App.tsx` (the lazy import behind `import.meta.env.DEV`, and the route, outside the guards, with its own `Suspense` because it is not under `PublicOnly` or the shell). No token added to `tokens.css`. No other file changed.

**Checks.** `node scripts/frontend-style-check.mjs` exit 0 (no findings); `npm run build` exit 0 (the first run failed on TASK-009's half-written `LoginPage.tsx`; it passed on the retry, nothing of theirs was touched).

**Left out of the production build (AC31).** After the build, from the repo root:
`grep -rlF "Compare each section with" frontend/dist | wc -l` gives **0**; the same search on `frontend/src` gives **1** (so the string is right). Same result, 0 in dist and 1 in src, for `Danger soft text`, `no-such-photo` and `Show a toast`. No file in `frontend/dist/assets` has "component" in its name.

**How it was looked at.** Headless Chrome over the debugging port with real Tab, Enter and Escape keys, against a Vite dev server on port 5310 started with a temporary config that sent `/api` to a port where nothing listens. The network log of every run: 0 requests to `/api`, one host only (`127.0.0.1:5310`). No console error or warning. Port 3000 was never asked for anything. The server, Chrome, the temporary config, its cache folder, the driver script, the browser profile and all screenshots are gone.

**Seen.**
- Light and dark at 1440px and 360px, plus 768px and 640px (640px is what 200% zoom on a 1280px window gives): every section renders, one `<h1>`, tab title "Components · University Alumni". No sideways scroll and no element past the page edge at 1440, 768, 640, 360 and 345px (AC57).
- Avatars: the three with a working link show the picture; the three with a broken link show initials (after they scroll into view: the image is `loading="lazy"`).
- **Tab, pressed for real, 1440px light and 360px dark: 68 stops, every one with the 3px `--focus` ring at 2px** (`:focus-visible` true). That includes what earlier tasks could not prove: Button (all variants and sizes, and the busy ones, which stay focusable), Link, Checkbox, the radio, the table's Delete buttons, Pagination's Previous / Next and page numbers, Select, Textarea, the Show button, both theme switches. Disabled controls are skipped. The radio group is one stop. Pictures of the ring on a link, a checkbox, a radio, a page number and a table Delete showed it whole in both themes: the table's `overflow: hidden` does not cut it.
- Dialog by keyboard: Enter on "Delete post" opens it, focus on Cancel; Tab goes Cancel, Delete post, the browser's own UI, Cancel; Escape closes it and focus is back on the opener. Confirm closes it and shows a toast. 440px wide and centered at 1440px; full width minus the gutters with stacked buttons at 360px.
- Toast: two at once; both gone after 5.6 seconds.
- Pagination: starts "1 2* 3" and "1 … 5 6* 7 … 25"; Enter on page 3 disables Next, Enter on page 1 of 25 disables Previous and gives "1* 2 … 25".
- Theme: Enter on Dark sets `data-theme="dark"` and stores it; the whole page follows.

**Not seen.** Hover (no real mouse), a screen reader, Firefox, Safari, a real phone, the production build in a browser.

**Choices the task left open.**
- The Color section shows all 27 color tokens with the token name, not a hex value: the value changes with the theme, and a hex in the page would fail the style check. `system.html` draws 16.
- Buttons grid columns are Default, Disabled, Busy. The picture's Hover and Focus columns cannot be held still on a live page: hover with the mouse, press Tab.
- Added beyond the list, because AC29 and AC30 ask for them: a Links row, and all eight icons in their three sizes. Also `fullWidth` on a button, the `lg` input, error and disabled looks of PasswordInput, Select and Textarea, a disabled Checkbox, EmptyState with no button, and the Card with 32px padding.
- Both sample photo links point at the dev server itself (`/favicon.svg`, and a path that is not a picture), so the page asks no outside host for anything.
- The table's Delete buttons carry `aria-label="Delete <name>"` and open the same confirm dialog.
- Sizes snapped (architecture table): page padding 56 to 48 (phone: the gutter), section top padding and gaps 20 to 24, swatch height 56 to 48, shape boxes 72 to 64, label gaps 6 to 8. The page does not cap its width at 1200px, to match the 1440px pictures.

**Differences from the pictures, in the components (not changed here; for the review to decide).**
1. `Table`, phone: a long email breaks inside a word ("nadia.rahman@example.c / om") because the value column is two thirds of a 360px card and uses `overflow-wrap: anywhere`. Nothing is cut off. A wider value column or a stacked label would avoid it.
2. `Pagination`, 360px: the row wraps. "Previous 1 2 3" on one line and "Next" alone on the next; with 25 pages the numbers split over two lines. It works and nothing overflows; it is not drawn at this width in the pictures.
3. `Pagination` shows "Page 2 of 3" after the buttons; `system.html` does not draw it (AC24 asks for it).
4. `Tag` Student: `--sunken` with a 1px `--line` border everywhere; the picture draws it plain `--sunken` in "Tags" and outlined only in the sunken table row (TASK-006 chose this on purpose).
5. `Table`: the picture gives the second row a `--sunken` fill (it shows a hovered row); the page shows none until the pointer is on a row.
6. `Select` is a real `<select>`, the picture a button; `ThemeSwitch` text buttons have no icon beside the word, the picture's have one; avatar text 13 / 16px for 12 / 15px; card padding 24px for 20px. All four are in the architecture's size-snapping table or the README.
7. Loading box: the picture's is `1.5px --line`. `Skeleton` has no box of its own, so the page draws that border itself.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-004-frontend-foundation-shell-auth/architecture]]
- Lessons checked: —
