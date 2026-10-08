# TASK-014 — Components page, patterns doc, checks and browser review

| Field | Value |
|---|---|
| REQ | REQ-fs-005 |
| Tier | 4 |
| Status | complete |
| Repo | alumni-details-system |
| Depends on | TASK-008, TASK-009, TASK-012, TASK-013, TASK-015 |
| Blocks | none |

## Goal

The new pieces are on the components page, the patterns are written down, all checks pass, and the three pages have been driven in a browser against a mock API (AC40 to AC44, AC48 to AC52).

## Files to touch

| Path | Action |
|---|---|
| `frontend/src/pages/dev/ComponentsPage/ComponentsPage.tsx` | edit |
| `docs/frontend-patterns.md` | edit |
| `.adlc/specs/2026-10/fs/REQ-fs-005-frontend-directory-and-profiles/manual-checklist.md` | create |
| `.adlc/specs/2026-10/fs/REQ-fs-005-frontend-directory-and-profiles/check-notes.md` | create |

## Approach

- ComponentsPage: sections for `AlumniCard` (with and without optional parts, mentoring), `AlumniCardSkeleton`, `DirectoryFilters` and `ProfileBand`, in the states they have (pattern 22).
- `frontend-patterns.md`: new numbered sections 23 onward, written from the working code with real paths: a list loaded into atoms with the latest-request helper; filters and page kept in the address; a load-then-edit form that creates or edits; the person band; the profile address helper and the "came from the directory" state. Each has What it is / Where it lives / Why we chose it / what we did not choose. Add them to "Contents"; update "Checks to run" if a check changed. Check that every path written exists.
- Checks, from the repo root: `npm run build`, `npm run check:frontend`, `git grep -n --untracked "antd" -- frontend/src frontend/package.json` (prints nothing), and `ls frontend/dist/assets` (a file per page). Record the output in `check-notes.md`, with the "can it fail" run of the library check.
- Browser review: first find out what listens on port 3000 (L-REQ-fs-004-5). Run a throwaway mock API from the session scratchpad (never committed; no database, no `.env`) and point the Vite proxy at it. Drive the cases listed in the architecture's Test strategy at 360, 768 and 1280px in both themes with a real Tab key; save screenshots under `ui-evidence/` in this REQ's folder. Any bug found is a note for the review phase, not fixed silently here.
- `manual-checklist.md`: what the owner runs against the real backend and with a screen reader (AC51), each step one line and checkable.

## Acceptance

- [x] All four commands exit 0 / print nothing as written; the output is in `check-notes.md`
- [x] The browser review covers every state in AC9 to AC12, AC18, AC24, AC30, AC31 and the focus checks of AC8, AC13 and AC42
- [x] The patterns doc has the new sections and every path in them exists
- [x] The mock script is not in the repo (`git status` shows no file for it)

## Notes

Rules for every task of this REQ: see TASK-001. The mock must never be pointed at a real database; if port 3000 is taken by something that is not the mock, stop and ask (L-REQ-fs-004-5).

Implementation notes (TASK-014, 2026-10-08):

- **Components page.** New sections after Cards: Alumni cards (every part with mentoring, some parts, nothing and no name, long text, a photo, the skeleton in a SkeletonGroup), Directory search and filters (a working sample with its own state; criteria set with a value not among the options; options loading; options failed), Profile band (every part, loading, the My profile look, nothing optional with a long name and a broken photo). Only existing classes of `ComponentsPage.module.css` are used; that file is not in this task's list.
- **Patterns doc.** Sections 23 to 28, added to Contents. Stale lines in older sections fixed: 6 (store files), 8 (alumniService), 9 (`isCancelled`, the two word rules), 12 (the helper now exists), 14 (My profile is built; where Log out lives), 16 (282 cases). "Checks to run" gained the out-of-repo failing copy, the note that `scripts/` is not type-checked, and the mock-API rule. "Open points" gained the part 2 focus gaps. A script checked that every path in the file exists.
- **Checks.** All pass; output in `check-notes.md` section 1. The "can it fail" run used a scratchpad copy with rewritten imports, so no repo file was made or deleted.
- **Browser review.** No Playwright or Puppeteer is installed. Headless Chrome (already on the machine, own profile folder in the scratchpad) was driven through the DevTools protocol with Node's built-in WebSocket. The first tab stopped taking input events; a fresh tab (`/json/new`) fixed it. Port 3000 (real backend, PID 23144) was never contacted. Mock, Vite and Chrome were stopped by PID after the review; scratch files left in place.
- **Found, not fixed:** five items in `check-notes.md` section 3 (Back after a search skips the plain directory; focus after Back; Try again focus on My profile; the "(optional)" marks; one unreproduced extra list call).
- 200% zoom was not tried in the browser (narrow widths stand in for it); it is on `manual-checklist.md`.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-005-frontend-directory-and-profiles/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-004-4-check-focus-for-real|L-REQ-fs-004-4]], [[knowledge/lessons/LESSON-REQ-fs-004-5-find-out-what-listens-on-the-api-port|L-REQ-fs-004-5]], [[knowledge/lessons/LESSON-REQ-fs-004-6-a-check-that-reads-only-tracked-files|L-REQ-fs-004-6]]; gotcha G50
