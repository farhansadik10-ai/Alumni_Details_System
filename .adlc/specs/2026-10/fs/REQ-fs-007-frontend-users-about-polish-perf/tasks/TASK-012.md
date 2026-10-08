# TASK-012 — Phone audit and fixes

| Field | Value |
|---|---|
| REQ | REQ-fs-007 |
| Tier | 4 |
| Status | pending |
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

- [ ] `phone-audit.md` lists every screen at both widths and both themes with "ok" or the fix.
- [ ] No horizontal scroll on any screen at 360px, 390px or 200% zoom.
- [ ] Screenshots of the Users page (table and cards), the delete dialog with the 409 message, About, and the phone menu are in `ui-evidence/` in both themes.
- [ ] `npm run build`, the style check and the library check exit 0.
- [ ] Anything not fixed is in `skipped.md` with a reason.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-007-frontend-users-about-polish-perf/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-004-4-check-focus-for-real|L-REQ-fs-004-4]], [[knowledge/lessons/LESSON-REQ-fs-004-5-find-out-what-listens-on-the-api-port|L-REQ-fs-004-5]], [[knowledge/gotchas#^g46|G46]], [[knowledge/gotchas#^g50|G50]], [[knowledge/gotchas#^g56|G56]]
