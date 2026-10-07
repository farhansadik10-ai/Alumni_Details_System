# TASK-010 — Components page (development only)

| Field | Value |
|---|---|
| REQ | REQ-fs-004 |
| Tier | 5 |
| Status | pending |
| Repo | alumni-details-system |
| Depends on | TASK-008 |
| Blocks | TASK-011 |

## Goal

In development, `/dev/components` shows every base component and state so each can be compared with `system.html` and `system-dark.html`; the production build does not contain it.

## Files to touch

| Path | Action |
|---|---|
| `frontend/src/pages/dev/ComponentsPage/ComponentsPage.tsx + ComponentsPage.module.css` | create |
| `frontend/src/App.tsx` | edit (register the route only when `import.meta.env.DEV`) |

## Approach

- One page, outside the guards, with `ThemeSwitch` at the top and sections in the order of `system.html`: Color (a swatch per color token with its name), Type, Space and shape, Buttons (every variant × default, disabled, busy; the three sizes), Form controls (TextInput default, with help, with error, disabled; PasswordInput; Select; Textarea; Checkbox plain and boxed; RadioCards), Tags and avatars (every Tag variant; Avatar in three sizes, with initials, with a working photo link and with a broken one), Dialog (a button that opens a `ConfirmDialog`) and Pagination (page 2 of 3, and page 6 of 25), Cards, Table (three sample rows with Avatar, RoleTag and a quiet danger Delete button), Messages and states (error, success, a button that shows a toast, Skeleton, EmptyState, ErrorState).
- Sample names and emails come from the design pictures (`example.com` addresses). No API call.
- In `App.tsx`: `const ComponentsPage = import.meta.env.DEV ? lazy(() => import(...)) : null;` and register the route only when it is not `null`, so the production bundle drops the file.

## Acceptance

- [ ] AC31: the page shows every component and state of AC17 to AC30
- [ ] After `npm run build`, no file in `frontend/dist/assets` contains a string that exists only in the components page (pick one unique heading and search for it); record the command and its result
- [ ] AC57: the page has no sideways scroll at 360px
- [ ] `node scripts/frontend-style-check.mjs` exits 0 and `npm run build` exits 0

## Notes

- **Rules for every task of this REQ.** Never read or print any `.env` file. Never run `psql` or anything that changes the database. Never run `git push` or any git command that writes. Touch nothing under `backend/`, `shared/` or `db/`. Delete no file that this task's table does not list. Add no package that this task does not name. If the task cannot be done inside these rules, stop and write why in the implementation notes.
- Read `architecture.md` in this REQ folder first (layout, token names, the size-snapping table). Read `docs/design/README.md` and the screen files this task names. Do not copy inline styles from the screens; read the tokens.
- Compiler rules: `import type` for types, no enums, no unused locals or parameters. No barrel `index.ts` files for components.
- The color swatches must read the tokens through classes in the module stylesheet (`background: var(--ground)`), so the page itself passes the style check. No inline `style` with a color.
- Only this task edits `App.tsx` in tier 5. TASK-009 does not touch it: the routes already point at the page files.
- This page is where the review compares components with the pictures; lay it out plainly.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-004-frontend-foundation-shell-auth/architecture]]
- Lessons checked: —
