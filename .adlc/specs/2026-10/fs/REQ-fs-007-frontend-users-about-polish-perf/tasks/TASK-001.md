# TASK-001 — Build size before

| Field | Value |
|---|---|
| REQ | REQ-fs-007 |
| Tier | 0 |
| Status | pending |
| Repo | alumni-details-system |
| Depends on | none |
| Blocks | TASK-002, TASK-004, TASK-005, TASK-011 (every task that changes code), TASK-014 |

## Goal

The size of the frontend build on this branch, before any change of this REQ, is on record.

## Files to touch

| Path | Action |
|---|---|
| `.adlc/specs/2026-10/fs/REQ-fs-007-frontend-users-about-polish-perf/build-size.md` | create |

## Approach

- Run `npm run build --workspace=@alumni/frontend` (the whole `npm run build` also builds the API and is not needed for sizes). It writes `frontend/dist`, which git ignores.
- With `ls -l` and `gzip -c <file> | wc -c`, list for every file in `frontend/dist/assets` and for `frontend/dist/index.html`: raw bytes and gzip bytes. Show totals for JS, CSS and fonts, and the entry script and entry stylesheet on their own lines. List each page file.
- Write one table "Before" in `build-size.md`. Leave an empty "After" table for TASK-014.

## Acceptance

- [x] `build-size.md` has the Before table: entry script, entry stylesheet, every page file, the fonts and the totals, raw and gzip.
- [x] No source file was changed (`git status` shows only the vault file).

## Notes

Do this first, before any other task changes the code.

Done 2026-10-08 at commit `4a957152`, tree clean before the build. Build passed (Vite, 2.6 s).
Gzip measured with `gzip -c` (GNU gzip 1.14, level 6) in Git Bash. Vite's own gzip kB and `gzip -9`
both differ by a few hundred bytes on the entry script, so TASK-014 must use the same command.
`favicon.svg` (203 B, copied from `public/`) is left out of the totals. The entry script is
288,075 B raw / 98,078 B gzip, 79% of all JS raw. Fonts: three woff2 subsets, 63,612 B raw.
No database, `.env` or backend import was involved; nothing for the manual checklist.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-007-frontend-users-about-polish-perf/architecture]]
- Session rules: never read `.env`; no `git push`; nothing that reaches or changes the database; no file deleted outside `.adlc/`; no script imports from `backend/` or loads `pg` or `dotenv`.
