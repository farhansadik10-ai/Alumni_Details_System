# TASK-014 — Docs, build size after, final checks

| Field | Value |
|---|---|
| REQ | REQ-fs-007 |
| Tier | 6 |
| Status | done |
| Repo | alumni-details-system |
| Depends on | TASK-001, TASK-013 |
| Blocks | none |

## Goal

The docs describe what was built, the build size after is on record, and all checks pass (spec AC22, AC31, AC35).

## Files to touch

| Path | Action |
|---|---|
| `docs/frontend-patterns.md` | edit: new sections 34 to 37 (an admin list and its delete; the shared list-address hook; the About page and the footer link; the phone audit and performance rules), "Contents", "Checks to run" (case count, the font-preload check), "Open points", "How to add to this file" |
| `docs/roadmap.md` | edit: F9, F10 and F11 become Done (REQ-fs-007) when they are |
| `.adlc/specs/2026-10/fs/REQ-fs-007-frontend-users-about-polish-perf/build-size.md` | edit: After table and the difference |

## Approach

- Write each pattern after the code works, from the code: What it is, Where it lives (real paths, each checked to exist), Why we chose it, and what was not chosen. Also update patterns 1, 13, 18, 23, 24 and 28 where this REQ changed them (for example `lastPage`'s new home, the hook that now holds pattern 24's rules).
- Repeat TASK-001's measurement and fill the After table; write the difference per file and in total.
- Run `npm run build`, `node scripts/frontend-style-check.mjs`, `npx tsx scripts/frontend-lib-check.ts` and the `antd` grep, and paste the results in the task notes.
- The root `CLAUDE.md` line and `.adlc/context/project-overview.md` are updated at wrap-up (AC32), not here.

## Acceptance

- [x] Every path written in the new sections exists.
- [x] The roadmap rows match the real state.
- [x] All four checks exit 0 and the grep prints nothing.

## Notes

Written by: task-implementer (tier: deep), 2026-10-09.

- **Docs:** `docs/frontend-patterns.md` has new sections 34 (admin list and delete), 35 (`useListAddress`), 36 (About and footer link, `ROLE_WORDS`, shared `usersColumns`), 37 (phone and performance rules, how to run the audit with a mock API). Updated: Contents; patterns 1, 6 to 9, 12 to 14, 16, 18, 22 to 24, 28 and 32; "How to add" (new rule 7, from L-REQ-fs-006-4); Checks to run (536 cases, the font-preload check, the build-size method); Open points (part 4). The old line 629 no longer lists `lastPage` under `directoryQuery.ts`.
- **Every path checked:** a script took every backtick path starting `frontend/`, `scripts/`, `docs/` or `.adlc/` from the file and tested it exists: none missing.
- **Old wording grep (L-REQ-fs-006-4):** `lastPage`, "being built", `BeingBuilt`, `469`, "part 4", F10/F11 in `docs/`, `frontend/src`, `scripts/`. All doc hits fixed. Two code comments out of my blast radius, listed in Open points instead: `PageLayout.tsx:47` still uses "This page is being built" as its example, and `useListAddress.ts:30` says rule d keeps `hooks/` out of `store/` (rule d checks only `axios` and `services/`). `BeingBuilt.tsx` has no importer now; deleting it is a code change, left for later.
- **Roadmap:** F9, F10, F11 Done (REQ-fs-007); Last and Later rows unchanged.
- **Build size:** After table, shared chunks, fonts, totals and a Difference table in `build-size.md`. Total +8,091 gzip (+3.8%); entry script +1,213 gzip (+1.2%). Vite renamed some shared chunks (for example `saveFailure-qy1Ih9V_.css` became `Textarea-qy1Ih9V_.css`, same hash), so the difference is given by group as well as by file.
- **Checks, 2026-10-09:**
  - `npm run build` (root: api then frontend): exit 0, `✓ built in 2.11s`, same hashes as the workspace build.
  - `node scripts/frontend-style-check.mjs`: 200 files, rules a to k all 0, `PASS: no findings`, exit 0.
  - `npx tsx scripts/frontend-lib-check.ts`: `536 passed, 0 failed`, exit 0.
  - `git grep -n --untracked "antd" -- frontend/src frontend/package.json`: printed nothing (exit 1 = no match).
  - `grep -rlF "Compare each section with" frontend/dist`: printed nothing.
  - Font preload: `grep -c 'rel="preload"' frontend/dist/index.html` = 1; the file name in `index.html` and in `assets/index-D_ODS2_Q.css` is the same, `hanken-grotesk-latin-wght-normal-CaVRRdDk.woff2`.
- No `.env` read, no database, no backend import, no git write. Scratch files only in the session scratchpad.
- Not edited (wrap-up, AC32): root `CLAUDE.md`, `.adlc/context/project-overview.md`.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-007-frontend-users-about-polish-perf/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-006-4-a-fix-that-moves-a-rule-leaves-old-prose-behind|L-REQ-fs-006-4]]
