# TASK-011 — `docs/frontend-patterns.md`, manual checklist, final checks

| Field | Value |
|---|---|
| REQ | REQ-fs-004 |
| Tier | 6 |
| Status | pending |
| Repo | alumni-details-system |
| Depends on | TASK-009, TASK-010 |
| Blocks | — |

## Goal

The patterns used are written down where the next three parts will extend them, the owner has a checklist for what a build cannot prove, and every machine check passes on the final code.

## Files to touch

| Path | Action |
|---|---|
| `docs/frontend-patterns.md` | create |
| `.adlc/specs/2026-10/fs/REQ-fs-004-frontend-foundation-shell-auth/manual-checklist.md` | create |
| `.adlc/specs/2026-10/fs/REQ-fs-004-frontend-foundation-shell-auth/check-notes.md` | create |

## Approach

- **`docs/frontend-patterns.md`.** Plain language. A short intro, then one section per pattern with the same three parts: **What it is**, **Where it lives** (real file paths, checked to exist), **Why we chose it** (and what we did not choose). Write it from the code as built, not from the plan. Patterns to cover, at least: one-way layers; design tokens as CSS variables with two theme blocks; CSS Modules with no literals, guarded by a script; theme applied before paint by a boot script; one config file for the app name and contact email, written into `index.html` at build time; one Jotai store readable outside React; actions as write-only atoms that return a result; one API client with injected `getToken` / `onUnauthorized`; one failure shape (`ApiFailure`) and screens choosing their own words; route guards as layout routes; pages loaded on demand; `Field` wiring for label, help and error; validators as pure functions; native `<dialog>` for the dialog and the phone menu; responsive table by `data-label`; toast list in the store with one live region; icons as components; the being-built page. End with "How to add to this file" for parts 2 to 4, and a short "Checks to run" list.
- **`manual-checklist.md`** for the owner, against the real backend (`npm run dev`). Numbered steps, each with what to do and what must be seen, written from the spec (AC65): sign up as Student; sign up as Graduate and confirm the saved role is `alumni` (by what the network tab sends and what the app shows, not by a database command); sign up with a taken email; each validation message on both forms; log in; wrong password; server stopped; remember my email on and off; theme: each choice, reload, system setting change, no flash on reload in dark; header on desktop; phone menu at 360px; keyboard-only pass of both forms and the shell; open `/users` as a non-admin; open an unknown address; log out from the phone menu and from My profile; expired session, three ways, each must show "Your session has ended. Log in again.": a 401 from the server, a click on a nav link after the token ran out, and a reload with an expired token stored; after the first two, logging in returns to the page; logged out, open `/feed`, log in → Feed; log out from My profile, log in → Dashboard, not My profile; log in as a second user after the first one's session ended and see only the second user's name; two tabs: log out in one; reload on `/login` on the deployed site (Apache fallback); 200% zoom at 1280px. Include at least one step that would fail if the code were wrong in a likely way (for example: a password with a space at the end must log in only when typed with the space).
- **Final checks**, each run on the final code and recorded in `check-notes.md` with the command and its real output: `npm run build`; `node scripts/frontend-style-check.mjs`; `npx tsx scripts/frontend-lib-check.ts`; `git grep -n "antd" -- frontend/src frontend/package.json` (nothing); the per-page files in `frontend/dist/assets`; the components-page text missing from the build; `git status --short` showing nothing under `backend/`, `shared/`, `db/`; a table of all 65 spec criteria, each with what proves it: a machine check here, the browser review, or a numbered checklist step.

## Acceptance

- [ ] AC63, AC65: each as written in the spec
- [ ] Every path named in `docs/frontend-patterns.md` exists (check with a short script or `ls`, and record it)
- [ ] AC1, AC7, AC11: the three commands exit 0 on the final code, with output pasted in `check-notes.md`
- [ ] `check-notes.md` names every acceptance criterion that was not proven here and says who proves it

## Notes

- **Rules for every task of this REQ.** Never read or print any `.env` file. Never run `psql` or anything that changes the database. Never run `git push` or any git command that writes. Touch nothing under `backend/`, `shared/` or `db/`. Delete no file that this task's table does not list. Add no package that this task does not name. If the task cannot be done inside these rules, stop and write why in the implementation notes.
- Read `architecture.md` in this REQ folder first (layout, token names, the size-snapping table). Read `docs/design/README.md` and the screen files this task names. Do not copy inline styles from the screens; read the tokens.
- Compiler rules: `import type` for types, no enums, no unused locals or parameters. No barrel `index.ts` files for components.
- `docs/roadmap.md`, the root `CLAUDE.md` and the vault context pages are updated at wrap-up (AC64), not in this task.
- Report a failing check as failing. Do not edit a check to make it pass.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-004-frontend-foundation-shell-auth/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-003-1]], [[knowledge/lessons/LESSON-REQ-fs-003-4]]
