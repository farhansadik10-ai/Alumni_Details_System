# TASK-004 — Theme: boot script, theme store, ThemeSwitch

| Field | Value |
|---|---|
| REQ | REQ-fs-004 |
| Tier | 2 |
| Status | complete |
| Repo | alumni-details-system |
| Depends on | TASK-002 |
| Blocks | TASK-008 |

## Goal

The theme choice (light, dark, system) is saved, applied before the first paint, follows the system setting live, and can be changed with the ThemeSwitch.

## Files to touch

| Path | Action |
|---|---|
| `frontend/index.html` | edit (the boot script) |
| `frontend/src/store/themeAtoms.ts` | create |
| `frontend/src/components/shell/ThemeSwitch/ThemeSwitch.tsx` | create |
| `frontend/src/components/shell/ThemeSwitch/ThemeSwitch.module.css` | create |
| `frontend/src/App.tsx` | edit (show the ThemeSwitch on the placeholder page so it can be tried) |

## Approach

- **Boot script.** A classic inline `<script>` in `<head>`, before any stylesheet or module script, wrapped in a function and a `try`/`catch`: read `localStorage["%THEME_STORAGE_KEY%"]`; if it is `"light"` or `"dark"` use it; otherwise ask `matchMedia("(prefers-color-scheme: dark)")`; set `document.documentElement.dataset.theme`. On any error use the system answer, and if that fails too, `light`.
- **`themeAtoms.ts`.** `ThemeChoice = "light" | "dark" | "system"`. `themeChoiceAtom` starts from storage (anything else than the three values counts as `system`); its setter writes the key (`system` is stored as `"system"`), and applies the theme. `applyTheme(choice)` sets `data-theme` to the resolved `light` or `dark`. One `matchMedia` change listener, added once, re-applies while the choice is `system`. A `storage` listener copies a change from another tab.
- **`ThemeSwitch`.** Props: `variant: "icons" | "text"`. A group (`role="group"`, `aria-label="Theme"`) of three real `<button type="button">`: Light, Dark, System. `icons`: `SunIcon`, `MoonIcon`, `MonitorIcon`, each with `aria-label` "Light theme" / "Dark theme" / "System theme", height `--control-h-sm`, square. `text`: the words, height `--control-h-lg`, three equal columns. The chosen button has `aria-pressed="true"`, `--action` background and `--on-action` text; the others `--surface` and `--text`. One 1.5px `--edge` border around the group and between the buttons, as in `login.html` and `phone-menu.html`.

## Acceptance

- [ ] AC13: with nothing saved the page follows the system setting; changing the system setting changes the page without a reload
- [ ] AC14: the choice is still there after a reload
- [ ] AC15: with `dark` saved, the built `index.html` sets `data-theme="dark"` from the head script before the app's module script runs (read the built file to confirm the order, and that the key in it is `ua.theme`)
- [ ] AC16: `ThemeSwitch.module.css` has no `[data-theme` selector
- [ ] `node scripts/frontend-style-check.mjs` exits 0 and `npm run build` exits 0

## Notes

- **Rules for every task of this REQ.** Never read or print any `.env` file. Never run `psql` or anything that changes the database. Never run `git push` or any git command that writes. Touch nothing under `backend/`, `shared/` or `db/`. Delete no file that this task's table does not list. Add no package that this task does not name. If the task cannot be done inside these rules, stop and write why in the implementation notes.
- Read `architecture.md` in this REQ folder first (layout, token names, the size-snapping table). Read `docs/design/README.md` and the screen files this task names. Do not copy inline styles from the screens; read the tokens.
- Compiler rules: `import type` for types, no enums, no unused locals or parameters. No barrel `index.ts` files for components.
- The script in `index.html` is the one place the storage is read outside `lib/browserStorage.ts`; it cannot import anything.
- The theme store does not depend on TASK-003. If `lib/browserStorage.ts` does not exist yet when this task runs, create it exactly as TASK-003 describes (three functions) and note it; TASK-003 then keeps that file.
- The focus ring comes from `base.css`. Make sure the pressed button's ring is not clipped by the group's border (`position: relative` and `z-index: 1` on focus is fine; that number is unitless and allowed).

### Implementation notes (TASK-004, 2026-10-07)

- **Where the listeners are added.** The task's file table does not list `main.tsx`, so `themeAtoms.ts` adds its two listeners (system setting, other tabs) itself, once, when the module is first loaded. Every page has a ThemeSwitch, which imports the module. If TASK-008 ever builds a page with no ThemeSwitch in its bundle, that page keeps the theme the head script set but does not follow a live system change until the module loads; importing `store/themeAtoms` from `main.tsx` would close that.
- **Other tabs.** A change from another tab is taken into memory and applied, never written back (same reason as the token, CAND-014). A cleared storage counts as `system`.
- **Storage refused.** The choice still applies and lives in memory for the visit.
- **Hover.** The pictures show no hover for an unpressed theme button. Built as `--sunken`, the same quiet hover the system picture uses for table rows. The pressed button does not change on hover. For the review to confirm.
- **Text size.** The pictures use 15px for the word buttons; built as 14px (Small), per the size-snapping table. Pressed is weight 700, others 600, as drawn.
- **Group size.** Each icon button is 36px square including the 1.5px divider on its left, as in the pictures (the divider sits inside the button). The group is 36px plus its own border.
- **No new token** was needed; `tokens.css` is untouched.
- **Checks.** `npm run build` exit 0; `node scripts/frontend-style-check.mjs` exit 0 (32 files, no findings). Built `frontend/dist/index.html`: the theme script comes before the module script and the stylesheet link, and the key in it is `ua.theme`. `ThemeSwitch.module.css` has no `[data-theme` selector.
- **Not seen in a browser.** A scratch script (not shipped) ran the built head script and the theme store against fake `window`, `document` and `localStorage`: 29 cases passed (nothing saved, each saved value, junk, storage refused, `matchMedia` refused, live system change, other tab, cleared storage). The look of the switch, the focus ring and AC13 to AC15 in a real browser are still for the review phase and the owner's checklist.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-004-frontend-foundation-shell-auth/architecture]]
- Lessons checked: —
