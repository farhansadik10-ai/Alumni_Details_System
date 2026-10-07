# TASK-013 — Leftovers from part 1

| Field | Value |
|---|---|
| REQ | REQ-fs-005 |
| Tier | 0 |
| Status | pending |
| Repo | alumni-details-system |
| Depends on | none |
| Blocks | TASK-014 |

## Goal

The Vite template README, the stale "legacy frontend" comments and the empty Comments section are fixed (AC45, AC46, AC47).

## Files to touch

| Path | Action |
|---|---|
| `frontend/README.md` | replace |
| `shared/types/user.types.ts` | edit (comments only) |
| `shared/index.ts` | edit (one comment only) |
| `.adlc/context/conventions.md` | edit (the Comments section) |

## Approach

- `frontend/README.md`: what the frontend is (one sentence, no app name), how to run it from the repo root (`npm run dev`, `npm run dev:frontend`, `npm run build`, `npm run check:frontend`), a short folder map of `frontend/src` (config, lib, services, store, hooks, routes, icons, styles, components/ui, components/shell, components/auth, components/alumni, components/profile, pages), and a link to `docs/frontend-patterns.md`. It does not mention what a `.env` holds (AC45). Do not open any `.env` file to write it.
- `shared/types/user.types.ts`: replace the two "Kept as it is for the legacy frontend…" comments with what is true now (the legacy app is gone; `User` and `CreateUserDTO` carry `password` and stay out of `index.ts`; new code uses `PublicUser`, `SignUpUserDTO`, `UpdateUserDTO`). No type, field or export changes. `shared/index.ts` has the same stale claim ("the legacy frontend reaches them by file path"): the same one-line fix (L-REQ-fs-004-7, close every mention). Do not regenerate the compiled `.js`/`.d.ts` files (G38); note in the implementation notes whether their comment copies are now older.
- `conventions.md` Comments: replace the two template prompts with a short drafted rule from how the code is written today (a comment explains why or points to a spec item, gotcha or lesson; it does not repeat the code; no commented-out code; a TODO names a REQ or gotcha). Mark the section `STATUS: needs verification` until the owner confirms.

## Acceptance

- [ ] No Vite template text in `frontend/README.md`; every folder named in it exists
- [ ] `git diff` of `shared/` shows comment lines only
- [ ] The Comments section has no template prompt left and carries the status banner
- [ ] `npm run build` exits 0

## Notes

Rules for every task of this REQ: see TASK-001 (this task is the only one allowed to edit comments under `shared/`).

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-005-frontend-directory-and-profiles/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-004-7-delete-a-module-close-its-mentions|L-REQ-fs-004-7]]; gotcha G38
