# TASK-014 — Docs, build size after, final checks

| Field | Value |
|---|---|
| REQ | REQ-fs-007 |
| Tier | 6 |
| Status | pending |
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

- [ ] Every path written in the new sections exists.
- [ ] The roadmap rows match the real state.
- [ ] All four checks exit 0 and the grep prints nothing.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-007-frontend-users-about-polish-perf/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-006-4-a-fix-that-moves-a-rule-leaves-old-prose-behind|L-REQ-fs-006-4]]
