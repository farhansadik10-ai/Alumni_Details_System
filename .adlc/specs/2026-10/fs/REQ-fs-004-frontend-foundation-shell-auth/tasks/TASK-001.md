# TASK-001 — Remove the legacy app, change packages, scaffold an app that builds

| Field | Value |
|---|---|
| REQ | REQ-fs-004 |
| Tier | 0 |
| Status | pending |
| Repo | alumni-details-system |
| Depends on | — |
| Blocks | TASK-002, TASK-003 |

## Goal

The legacy Ant Design code is gone, the packages are changed, and a minimal new app builds and shows one line of text.

## Files to touch

| Path | Action |
|---|---|
| `frontend/src/** (the 57 legacy files listed in architecture.md, "Legacy files")` | delete |
| `frontend/public/icons.svg` | delete |
| `frontend/public/favicon.svg` | replace |
| `frontend/package.json` | edit |
| `package-lock.json` | changed by `npm install` |
| `frontend/index.html` | edit |
| `frontend/vite.config.ts` | edit |
| `frontend/src/config/app.ts` | create |
| `frontend/src/config/storageKeys.ts` | create |
| `frontend/src/main.tsx` | create |
| `frontend/src/App.tsx` | create |
| `frontend/src/vite-env.d.ts` | create (only if CSS Module imports do not type-check without it) |

## Approach

- **Delete** exactly the files in architecture.md "Legacy files". The owner approved that list at the design gate. Check with `git ls-files frontend/src` before and after: after the delete nothing legacy is left. Empty folders go too.
- **Packages.** In `frontend/package.json` remove `antd`, `@ant-design/icons`, `@fontsource-variable/inter`; add `@fontsource-variable/hanken-grotesk`. First run `npm view @fontsource-variable/hanken-grotesk version` to prove the name. Then `npm install` from the repo root. If either fails, stop and report; do not switch to a font service.
- **`config/app.ts`:** `export const APP_NAME = "University Alumni";` and `export const CONTACT_EMAIL = "alumni-office@example.com";` with a one-line comment each (ADR-09; the email is a placeholder the owner will replace). **`config/storageKeys.ts`:** `TOKEN_STORAGE_KEY = "ua.token"`, `THEME_STORAGE_KEY = "ua.theme"`, `REMEMBERED_EMAIL_STORAGE_KEY = "ua.rememberedEmail"`. Both files hold plain constants only: no DOM, no imports.
- **`vite.config.ts`:** keep the `/api` proxy as it is. Add a small plugin with a `transformIndexHtml` hook that replaces `%APP_NAME%` and `%THEME_STORAGE_KEY%` in `index.html` with the two constants, imported from `./src/config/app.ts` and `./src/config/storageKeys.ts`.
- **`index.html`:** `<title>%APP_NAME%</title>`; keep `lang="en"`, the viewport tag and the favicon link. Leave a marked comment in `<head>` where TASK-004 puts the theme script. Do not write the script here.
- **`favicon.svg`:** today it is the Vite logo. Replace it with a plain mark: a 32×32 square in `#161616` with a `#C8922A` bar (the band and its accent bar). It is a static file outside `src`, so the two hex values are allowed here and nowhere else.
- **`main.tsx` / `App.tsx`:** the smallest app that mounts: `StrictMode`, and an `App` that renders the app name in a `<p>`. Later tasks replace both.

## Acceptance

- [ ] AC1 (part): `git grep -n "antd\|ant-design\|fontsource-variable/inter" -- frontend` finds nothing, and the three packages are not in `frontend/package.json`
- [ ] AC2: `git status` shows every file of the "Legacy files" list as deleted, and no other deletion
- [ ] AC8 (part): the built `frontend/dist/index.html` has `<title>University Alumni</title>`, and the text is in `frontend/src` only in `config/app.ts`
- [ ] `npm run build` exits 0 from the repo root
- [ ] `git status` shows nothing changed under `backend/`, `shared/`, `db/`

## Notes

- **Rules for every task of this REQ.** Never read or print any `.env` file. Never run `psql` or anything that changes the database. Never run `git push` or any git command that writes. Touch nothing under `backend/`, `shared/` or `db/`. Delete no file that this task's table does not list. Add no package that this task does not name. If the task cannot be done inside these rules, stop and write why in the implementation notes.
- Read `architecture.md` in this REQ folder first (layout, token names, the size-snapping table). Read `docs/design/README.md` and the screen files this task names. Do not copy inline styles from the screens; read the tokens.
- Compiler rules: `import type` for types, no enums, no unused locals or parameters. No barrel `index.ts` files for components.
- If importing `src/config/*.ts` from `vite.config.ts` breaks `tsc -b` for the node project, use the fallback in architecture.md "Risks" and say so in the notes.
- `npm install` may rewrite many lines of `package-lock.json`; that is expected.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-004-frontend-foundation-shell-auth/architecture]]
- Lessons checked: —
