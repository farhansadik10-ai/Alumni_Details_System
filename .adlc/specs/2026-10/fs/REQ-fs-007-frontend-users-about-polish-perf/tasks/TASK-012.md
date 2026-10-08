# TASK-012 — Phone audit and fixes

| Field | Value |
|---|---|
| REQ | REQ-fs-007 |
| Tier | 4 |
| Status | done |
| Repo | alumni-details-system |
| Depends on | TASK-008, TASK-009, TASK-010, TASK-011 |
| Blocks | TASK-013 |

## Goal

Every screen works at 360px and 390px, and at 200% zoom, in both themes, with no sideways scroll and no overlap; what is wrong is fixed or listed (spec AC17 to AC21).

## Files to touch

| Path | Action |
|---|---|
| `*.module.css` and a few `.tsx` files under `frontend/src/` | edit: only what the audit finds |
| `.adlc/specs/2026-10/fs/REQ-fs-007-frontend-users-about-polish-perf/phone-audit.md` | create: one line per page per problem, with the fix or the reason it was left |
| `.adlc/specs/2026-10/fs/REQ-fs-007-frontend-users-about-polish-perf/ui-evidence/` | create: screenshots |
| scratchpad folder (outside the repo) | create: the mock API script and a throwaway Vite config |

## Approach

- Method as in REQ-fs-006 ("Checks to run" in `docs/frontend-patterns.md`, G50, G56): the installed Chrome in headless mode (`C:/Program Files/Google/Chrome/Application/chrome.exe`) or the Claude-in-Chrome tools if present; a mock API script in the scratchpad that imports nothing from `backend/`, loads no `pg` or `dotenv` and reads no `.env`; a throwaway Vite config whose `/api` proxy points at it. First find out what listens on port 3000 and never use it; pick another port.
- Screens: log in, sign-up, Dashboard, Directory, one Alumni profile, Feed with an open comment thread, My profile (alumni and student), Users (admin), About, no-access, not-found, the open phone menu. Also: a dialog open, a toast showing, and 60-character names, emails, captions, comments and a 60-character word with no spaces.
- Measure for each: `document.documentElement.scrollWidth <= innerWidth` at 360 and 390; the same at 200% zoom of a 1280 window; touch targets under the control-height token; focus ring visible by a real Tab; toast, dialog and menu not covering each other's buttons.
- Fix with tokens and shared components only (no color literal, no `px`, no new media query; style check rules a, b, h, j). Use the patterns the code already uses: `min-width: 0`, `overflow-wrap: anywhere`, `flex-wrap`.
- Also repeat the TASK-007 Directory scenarios and the TASK-011 no-request scenarios here.

## Acceptance

- [x] `phone-audit.md` lists every screen at both widths and both themes with "ok" or the fix.
- [x] No horizontal scroll on any screen at 360px, 390px or 200% zoom.
- [x] Screenshots of the Users page (table and cards), the delete dialog with the 409 message, About, and the phone menu are in `ui-evidence/` in both themes.
- [x] `npm run build`, the style check and the library check exit 0.
- [x] Anything not fixed is in `skipped.md` with a reason.

## Notes

Written by: task-implementer (tier: deep), 2026-10-09.

- **Harness (all in the session scratchpad, folder `t012/`, nothing in the repo):** `mock-api.mjs` (Node `http` only, bound to 127.0.0.1:4317, invented data, switches for delete answers 200/409/404/500/network/slow, per-route failures and delays, a request log); `vite.config.mjs` (root `frontend/`, `envDir` an empty scratch folder, `cacheDir` in scratch, proxy `/api` to 4317, port 5317); headless Chrome on 127.0.0.1:9317 with its own profile and `--host-resolver-rules` mapping every host but 127.0.0.1 to "not found". Port 3000 (a node.exe, pid 23828) was found first and never used. All three were stopped at the end.
- **Audit:** 13 screens x 360, 390, 200% x light, dark = 78 measurements, twice. No sideways scroll in either round. Seven problems fixed (F1 to F7 in `phone-audit.md`), all touch targets or wrapping; no colour, no `px`, only the phone media query.
- **Scenarios run, all pass:** Users (TASK-008) 29 at 1280 and 30 at 360, each in both themes; Directory (TASK-007) 7 of 7 at 1280 light and 360 dark; Feed (TASK-011) 8 of 8; About link on 6 pages, Enter moves focus to the About heading (TASK-010); real-Tab ring on every stop of 12 screens at 360 and 200% in both themes; dev page Users section: 13 buttons pressed, 0 requests (TASK-009); AC20 overlap checks.
- **No bug found in TASK-007 or TASK-008 code.** One scenario first failed because my setup was wrong: the "refill an emptied page 1" case works from the page's own total, so it is shown by deleting all 12 rows of page 1 while a 13th exists (passes), not by adding a user behind the page's back.
- **Shared component changes, said plainly:** `Button` small size and `ThemeSwitch` icons are 44px on a phone only (36px on wide screens is unchanged); the role `Tag` variants no longer break inside the word; the footer link, header name and skip link are 44px boxes. `UserNameCell.tsx` got one wrapper `span` (markup only).
- **Headless traps met (G50):** many full-page screenshots in one tab, plus tabs left open by crashed runs (they share localStorage and react to the token), made later key presses miss; a fresh tab per pass and closing stray tabs fixed it. Git Bash rewrites an argument like `/feed` into a Windows path; `MSYS_NO_PATHCONV=1` stops it.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-007-frontend-users-about-polish-perf/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-004-4-check-focus-for-real|L-REQ-fs-004-4]], [[knowledge/lessons/LESSON-REQ-fs-004-5-find-out-what-listens-on-the-api-port|L-REQ-fs-004-5]], [[knowledge/gotchas#^g46|G46]], [[knowledge/gotchas#^g50|G50]], [[knowledge/gotchas#^g56|G56]]
