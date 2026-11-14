# REQ-fs-007 — Phone audit (AC17 to AC21)

| Field | Value |
|---|---|
| REQ | REQ-fs-007 |
| Written by | TASK-012 (task-implementer), 2026-10-09 |
| Method | Headless Chrome over its debugging port (127.0.0.1 only), a throwaway Vite dev server and a mock API in the session scratchpad (ports 5317 and 4317); port 3000 was never used |
| Evidence | `ui-evidence/` in this folder |

## How it was measured

- **Widths:** 360 x 740 and 390 x 844 as emulated screen sizes, scrollbars hidden as on a phone. **200% zoom of a 1280 window** = a 640 x 400 CSS viewport at device scale 2 (what the browser zoom does), scrollbars shown.
- **Sideways scroll:** `document.documentElement.scrollWidth` compared with its `clientWidth`. Also listed: every box that sticks out of the screen, and every box whose content is wider than the box itself.
- **Touch targets:** every button, field, select and link that is not inline text, against `--control-h` (44px).
- **Focus:** a real Tab key (sent as a key event, never `element.focus()`), up to 80 stops per screen at 360 and at 200%, both themes; each stop checked for `:focus-visible` and a drawn outline.
- **Data:** invented. A 60-character name with spaces, a 60-character word with no spaces (used as a name, a caption, a comment, a department and a job title), a 60-character email, long captions and comments, a reply to a reply, an image link that cannot load.
- **Overlap (AC20):** with a toast showing, the centre of each dialog button and each phone-menu button and link was hit-tested (`elementFromPoint`).
- Two rounds: round 1 found the problems below; round 2 re-measured all 78 after the fixes.

## Problems found and fixed

- **F1** Log in and sign-up, phone: the three theme icon buttons were 36px (`--control-h-sm`). Fix: `ThemeSwitch.module.css`, phone query, `--control-h` columns and height.
- **F2** Feed comment thread, phone: Reply, Edit and Delete (small buttons) were 36px. Fix: `Button.module.css`, phone query, `.sm` gets `min-height: var(--control-h)`. Also raises the Directory "Try again" for filter options and the dashboard post summary button on a phone.
- **F3** Every shell page: the footer About link was 20px tall. Fix: `Footer.module.css`, the link is an `inline-flex` box of `--control-h`; the footer padding went from `--space-5` to `--space-3`, so the footer is as tall as before.
- **F4** Every shell page: the header app name link was 23px tall. Fix: `Header.module.css`, `inline-flex`, `min-height: var(--control-h)`.
- **F5** Every shell page: the skip link was 38px tall when shown. Fix: `SkipLink.module.css`, `inline-flex`, `min-height: var(--control-h)`.
- **F6** Users table at 1280 (wide layout only): the role tags broke inside the word ("Alum / ni", "Stude / nt"), because `Tag` allows a break anywhere and the table shrank the column. Fix: `Tag.module.css`, the three role variants get `overflow-wrap: normal` (a role is one short word; a plain Tag still breaks anywhere).
- **F7** Users name cell: a long name pushed the avatar onto its own line. Fix: `UserNameCell.tsx` wraps avatar and name in one `span`; `UserNameCell.module.css` `.person` (flex, `min-width: 0`). Only the "You" tag drops under now.

## Looked at and left as they are

- **N1** The feed's comment panel reaches into the card padding (negative margin, by design in `FeedPost.module.css`). The check lists it as "content wider than the post box"; nothing leaves the card and nothing scrolls.
- **N2** The phone menu's "Menu" heading is visually hidden (1px box at the left edge). Not visible; not a problem.
- Inline text links (for example "Create an account", "Browse the directory", names in the dashboard lists) are 18 to 21px tall. They are text in a line or a list, which WCAG 2.5.8 leaves out; listed in `skipped.md`.
- At 1280 the small buttons stay 36px (`--control-h-sm`, as the design says). Only the phone layout was changed.

## Re-run after TASK-013 (performance), 2026-10-09

TASK-013 touched `Avatar` (every screen with an avatar), `FeedPost` and its stylesheet, `FeedPage`, `AlumniCard`, `UserNameCell` and `vite.config.ts`. Same harness, same data; plain dev server (no render counter).

- **Sideways scroll:** all 13 screens x 360, 390, 200% x light, dark again (78): scrollWidth equals the width on every one. Only N1 and N2 show, as before.
- **Feed with pictures loaded** (a 1600x400 and a 300x1200 picture, 4:3 box): 360, 390, 200%, both themes, 6 of 6 no sideways scroll; boxes 278x209, 308x231, 543x407.
- **Pictures arriving late** (built app): wide and tall move nothing (layout shift 0 at 1280 and 360). A link that fails late still takes its box away (see `performance.md`, open point).
- **Directory (TASK-007):** 7 of 7 at 1280 light and 360 dark.
- **Unchanged edit (TASK-011):** 8 of 8, light and dark.
- **Users (TASK-008):** search, role, page, delete, Escape during a slow delete, 409/404/500/network: 29 of 29 at 1280 and 30 of 30 at 360, both themes.
- **Feed with memo:** opening another thread closes the first, a new comment updates its post's count, a saved edit shows, a deleted post leaves: 8 of 8.
- **About link, real-Tab rings on 12 screens at 360 and 200%, dev page, AC20 overlap:** 35 of 35 per theme.
- **Screenshots refreshed:** `audit-feed-thread-360-*`, `feed-toast-360-*`, `audit-users-360-*`, `users-cards-360-*`, `users-table-1280-*`; added `feed-pictures-360-*` (the 4:3 letterbox).

## AC20: toast, dialog, phone menu

- Users, 360 and 1280, both themes: a slow delete answered 409 after the dialog was closed (toast showing), then Delete on another row: both dialog buttons are hit at their centre; the toast's Dismiss does not overlap the dialog (`users-dialog-toast-360-*`).
- Feed, 360: after Publish the toast does not cover Publish (`feed-toast-360-*`). Phone menu opened with a toast showing: no menu button or link is covered (`phone-menu-toast-360-*`).
- My profile, 360: Save account, where it was pressed, is not under the "Account saved" toast (`profile-toast-360-*`). If the button sits at the very bottom edge of the screen, the toast covers it until it leaves (5 s) or is dismissed: listed in `skipped.md`.

## One line per screen, width and theme (round 2, after the fixes)

"Fixes" names the findings above that touched the screen. Contrast: no colour or token value changed, so the AA contrast of both themes is as before.

| Screen | Width | Theme | Result | Fixes |
|---|---|---|---|---|
| Log in | 360px | light | ok: scrollWidth 360 = width 360 | F1 |
| Sign-up | 360px | light | ok: scrollWidth 360 = width 360 | F1 |
| Dashboard | 360px | light | ok: scrollWidth 360 = width 360 | F3 F4 F5 |
| Directory | 360px | light | ok: scrollWidth 360 = width 360 | F3 F4 F5 |
| Alumni profile (102) | 360px | light | ok: scrollWidth 360 = width 360 | F3 F4 F5 |
| Feed, comment thread open | 360px | light | ok: scrollWidth 360 = width 360 | F2 F3 F4 F5 (N1) |
| My profile (alumni) | 360px | light | ok: scrollWidth 360 = width 360 | F3 F4 F5 |
| My profile (student) | 360px | light | ok: scrollWidth 360 = width 360 | F3 F4 F5 |
| Users (admin) | 360px | light | ok: scrollWidth 360 = width 360 | F3 F4 F5 F7 |
| About | 360px | light | ok: scrollWidth 360 = width 360 | F3 F4 F5 |
| No-access (student on /users) | 360px | light | ok: scrollWidth 360 = width 360 | F3 F4 F5 |
| Not-found | 360px | light | ok: scrollWidth 360 = width 360 | F3 F4 F5 |
| Phone menu open (Dashboard) | 360px | light | ok: scrollWidth 360 = width 360 | F4 F5 (N2) |
| Log in | 360px | dark | ok: scrollWidth 360 = width 360 | F1 |
| Sign-up | 360px | dark | ok: scrollWidth 360 = width 360 | F1 |
| Dashboard | 360px | dark | ok: scrollWidth 360 = width 360 | F3 F4 F5 |
| Directory | 360px | dark | ok: scrollWidth 360 = width 360 | F3 F4 F5 |
| Alumni profile (102) | 360px | dark | ok: scrollWidth 360 = width 360 | F3 F4 F5 |
| Feed, comment thread open | 360px | dark | ok: scrollWidth 360 = width 360 | F2 F3 F4 F5 (N1) |
| My profile (alumni) | 360px | dark | ok: scrollWidth 360 = width 360 | F3 F4 F5 |
| My profile (student) | 360px | dark | ok: scrollWidth 360 = width 360 | F3 F4 F5 |
| Users (admin) | 360px | dark | ok: scrollWidth 360 = width 360 | F3 F4 F5 F7 |
| About | 360px | dark | ok: scrollWidth 360 = width 360 | F3 F4 F5 |
| No-access (student on /users) | 360px | dark | ok: scrollWidth 360 = width 360 | F3 F4 F5 |
| Not-found | 360px | dark | ok: scrollWidth 360 = width 360 | F3 F4 F5 |
| Phone menu open (Dashboard) | 360px | dark | ok: scrollWidth 360 = width 360 | F4 F5 (N2) |
| Log in | 390px | light | ok: scrollWidth 390 = width 390 | F1 |
| Sign-up | 390px | light | ok: scrollWidth 390 = width 390 | F1 |
| Dashboard | 390px | light | ok: scrollWidth 390 = width 390 | F3 F4 F5 |
| Directory | 390px | light | ok: scrollWidth 390 = width 390 | F3 F4 F5 |
| Alumni profile (102) | 390px | light | ok: scrollWidth 390 = width 390 | F3 F4 F5 |
| Feed, comment thread open | 390px | light | ok: scrollWidth 390 = width 390 | F2 F3 F4 F5 (N1) |
| My profile (alumni) | 390px | light | ok: scrollWidth 390 = width 390 | F3 F4 F5 |
| My profile (student) | 390px | light | ok: scrollWidth 390 = width 390 | F3 F4 F5 |
| Users (admin) | 390px | light | ok: scrollWidth 390 = width 390 | F3 F4 F5 F7 |
| About | 390px | light | ok: scrollWidth 390 = width 390 | F3 F4 F5 |
| No-access (student on /users) | 390px | light | ok: scrollWidth 390 = width 390 | F3 F4 F5 |
| Not-found | 390px | light | ok: scrollWidth 390 = width 390 | F3 F4 F5 |
| Phone menu open (Dashboard) | 390px | light | ok: scrollWidth 390 = width 390 | F4 F5 (N2) |
| Log in | 390px | dark | ok: scrollWidth 390 = width 390 | F1 |
| Sign-up | 390px | dark | ok: scrollWidth 390 = width 390 | F1 |
| Dashboard | 390px | dark | ok: scrollWidth 390 = width 390 | F3 F4 F5 |
| Directory | 390px | dark | ok: scrollWidth 390 = width 390 | F3 F4 F5 |
| Alumni profile (102) | 390px | dark | ok: scrollWidth 390 = width 390 | F3 F4 F5 |
| Feed, comment thread open | 390px | dark | ok: scrollWidth 390 = width 390 | F2 F3 F4 F5 (N1) |
| My profile (alumni) | 390px | dark | ok: scrollWidth 390 = width 390 | F3 F4 F5 |
| My profile (student) | 390px | dark | ok: scrollWidth 390 = width 390 | F3 F4 F5 |
| Users (admin) | 390px | dark | ok: scrollWidth 390 = width 390 | F3 F4 F5 F7 |
| About | 390px | dark | ok: scrollWidth 390 = width 390 | F3 F4 F5 |
| No-access (student on /users) | 390px | dark | ok: scrollWidth 390 = width 390 | F3 F4 F5 |
| Not-found | 390px | dark | ok: scrollWidth 390 = width 390 | F3 F4 F5 |
| Phone menu open (Dashboard) | 390px | dark | ok: scrollWidth 390 = width 390 | F4 F5 (N2) |
| Log in | 200% of 1280 | light | ok: scrollWidth 625 = width 625 | F1 |
| Sign-up | 200% of 1280 | light | ok: scrollWidth 625 = width 625 | F1 |
| Dashboard | 200% of 1280 | light | ok: scrollWidth 625 = width 625 | F3 F4 F5 |
| Directory | 200% of 1280 | light | ok: scrollWidth 625 = width 625 | F3 F4 F5 |
| Alumni profile (102) | 200% of 1280 | light | ok: scrollWidth 625 = width 625 | F3 F4 F5 |
| Feed, comment thread open | 200% of 1280 | light | ok: scrollWidth 625 = width 625 | F2 F3 F4 F5 (N1) |
| My profile (alumni) | 200% of 1280 | light | ok: scrollWidth 625 = width 625 | F3 F4 F5 |
| My profile (student) | 200% of 1280 | light | ok: scrollWidth 625 = width 625 | F3 F4 F5 |
| Users (admin) | 200% of 1280 | light | ok: scrollWidth 625 = width 625 | F3 F4 F5 F7 |
| About | 200% of 1280 | light | ok: scrollWidth 625 = width 625 | F3 F4 F5 |
| No-access (student on /users) | 200% of 1280 | light | ok: scrollWidth 640 = width 640 | F3 F4 F5 |
| Not-found | 200% of 1280 | light | ok: scrollWidth 640 = width 640 | F3 F4 F5 |
| Phone menu open (Dashboard) | 200% of 1280 | light | ok: scrollWidth 625 = width 625 | F4 F5 (N2) |
| Log in | 200% of 1280 | dark | ok: scrollWidth 625 = width 625 | F1 |
| Sign-up | 200% of 1280 | dark | ok: scrollWidth 625 = width 625 | F1 |
| Dashboard | 200% of 1280 | dark | ok: scrollWidth 625 = width 625 | F3 F4 F5 |
| Directory | 200% of 1280 | dark | ok: scrollWidth 625 = width 625 | F3 F4 F5 |
| Alumni profile (102) | 200% of 1280 | dark | ok: scrollWidth 625 = width 625 | F3 F4 F5 |
| Feed, comment thread open | 200% of 1280 | dark | ok: scrollWidth 625 = width 625 | F2 F3 F4 F5 (N1) |
| My profile (alumni) | 200% of 1280 | dark | ok: scrollWidth 625 = width 625 | F3 F4 F5 |
| My profile (student) | 200% of 1280 | dark | ok: scrollWidth 625 = width 625 | F3 F4 F5 |
| Users (admin) | 200% of 1280 | dark | ok: scrollWidth 625 = width 625 | F3 F4 F5 F7 |
| About | 200% of 1280 | dark | ok: scrollWidth 625 = width 625 | F3 F4 F5 |
| No-access (student on /users) | 200% of 1280 | dark | ok: scrollWidth 640 = width 640 | F3 F4 F5 |
| Not-found | 200% of 1280 | dark | ok: scrollWidth 640 = width 640 | F3 F4 F5 |
| Phone menu open (Dashboard) | 200% of 1280 | dark | ok: scrollWidth 625 = width 625 | F4 F5 (N2) |
