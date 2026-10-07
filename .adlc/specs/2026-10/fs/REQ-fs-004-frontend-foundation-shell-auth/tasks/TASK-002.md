# TASK-002 — Tokens, base styles, font, icons, the style check

| Field | Value |
|---|---|
| REQ | REQ-fs-004 |
| Tier | 1 |
| Status | pending |
| Repo | alumni-details-system |
| Depends on | TASK-001 |
| Blocks | TASK-004, TASK-005 |

## Goal

Every design token exists as a CSS variable for light and dark, the base styles and font are loaded, the icons exist, and a script can prove that components hold no hard-coded values.

## Files to touch

| Path | Action |
|---|---|
| `frontend/src/styles/tokens.css` | create |
| `frontend/src/styles/base.css` | create |
| `frontend/src/main.tsx` | edit (import the font and the two stylesheets) |
| `frontend/src/icons/*.tsx, frontend/src/icons/Icon.module.css` | create |
| `scripts/frontend-style-check.mjs` | create |

## Approach

- **`tokens.css`.** Block 1, `:root, [data-theme="light"]`: `color-scheme: light` and the 27 color tokens with the exact light values of `docs/design/README.md` section 2. Block 2, `[data-theme="dark"]`: `color-scheme: dark` and the 27 dark values. Copy the values from the README table row by row; do not type them from memory. Block 3, `:root`: every non-color token in architecture.md "Tokens and styles", with the values given there. Block 4, `@media (max-width: 767.98px) { :root { ... } }`: the phone values of `--header-h`, `--gutter`, `--text-band`, `--leading-band`, `--tracking-band`, `--band-overlap`. End the file with an empty block headed `/* Added by later tasks */`.
- **`base.css`.** `box-sizing: border-box` everywhere; `body` with no margin, `--ground` background, `--text` color, `--font-family`, Body size and line height; headings reset to no margin; `button, input, select, textarea { font: inherit; color: inherit; }`; `a` in `--text` with hover `--accent-soft-text`; **one** global rule `:focus-visible { outline: var(--focus-width) solid var(--focus); outline-offset: var(--focus-offset); }`; `@media (prefers-reduced-motion: reduce)` that removes every transition and animation; a `.visuallyHidden` helper class.
- **Font.** `import "@fontsource-variable/hanken-grotesk";` in `main.tsx`. `--font-family: 'Hanken Grotesk Variable', 'Hanken Grotesk', 'Segoe UI', Helvetica, sans-serif`.
- **Icons.** One component per icon, each `({ size })` where size is `"sm" | "md" | "lg"` mapped to `--icon-sm/md/lg` through a class in one shared `Icon.module.css`: `SunIcon`, `MoonIcon`, `MonitorIcon` (paths in `login.html`), `MenuIcon`, `CloseIcon` (`phone-directory.html`, `phone-menu.html`), `ChevronDownIcon`, `CheckIcon`, `AlertIcon` (`system.html`). `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `strokeWidth="2"`, round caps, `aria-hidden="true"`. The README says 2px stroke; the pictures draw some at 1.8 and 2.2, so use 2.
- **`scripts/frontend-style-check.mjs`** (plain Node, no packages). Walk `frontend/src`. Fail with file and line for: (a) a color literal (`#` hex, `rgb(`, `rgba(`, `hsl(`, or a CSS named color as a property value) in any file except `styles/tokens.css`; (b) a number with `px`, `em` or `rem` in a `*.module.css` or in `styles/base.css`, except the exact line `@media (max-width: 767.98px)`; (c) an import of `antd`, `@ant-design` or `@fontsource-variable/inter` anywhere; (d) an import of `axios` or of `services/` from a file under `components/`, `pages/`, `routes/`, `hooks/` or `icons/`; (e) the value of `APP_NAME` or `CONTACT_EMAIL` anywhere except `config/app.ts`; (f) `onClick` on a `<div` or `<span` in a `.tsx`; (g) `dangerouslySetInnerHTML`; (h) `box-shadow`, `gradient(` or `outline: none` / `outline: 0` in any stylesheet. Exit 1 on any finding, 0 otherwise, and print a count per rule.

## Acceptance

- [ ] AC9: each of the 27 tokens has the README's light and dark value (compare by script or by eye, row by row, and say which in the notes)
- [ ] AC10: every token named in architecture.md exists
- [ ] AC12: the built CSS contains a `@font-face` for Hanken Grotesk and no `fonts.googleapis.com`
- [ ] The style check can fail: put a temporary `color: #fff` in a throwaway `*.module.css`, see exit 1 with the file and line, remove it, see exit 0. Record both runs in the notes ([[knowledge/lessons/LESSON-REQ-fs-003-4]])
- [ ] `node scripts/frontend-style-check.mjs` exits 0 and `npm run build` exits 0

## Notes

- **Rules for every task of this REQ.** Never read or print any `.env` file. Never run `psql` or anything that changes the database. Never run `git push` or any git command that writes. Touch nothing under `backend/`, `shared/` or `db/`. Delete no file that this task's table does not list. Add no package that this task does not name. If the task cannot be done inside these rules, stop and write why in the implementation notes.
- Read `architecture.md` in this REQ folder first (layout, token names, the size-snapping table). Read `docs/design/README.md` and the screen files this task names. Do not copy inline styles from the screens; read the tokens.
- Compiler rules: `import type` for types, no enums, no unused locals or parameters. No barrel `index.ts` files for components.
- `0` without a unit is allowed. Percentages, `fr`, `ch`, `vh`, `vw` and unitless numbers are allowed.
- If a later size is needed that has no token, the task that needs it appends it to the `/* Added by later tasks */` block with a comment.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-004-frontend-foundation-shell-auth/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-003-4]]
