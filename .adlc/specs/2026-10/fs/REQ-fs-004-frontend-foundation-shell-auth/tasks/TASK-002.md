# TASK-002 — Tokens, base styles, font, icons, the style check

| Field | Value |
|---|---|
| REQ | REQ-fs-004 |
| Tier | 1 |
| Status | complete |
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

- [x] AC9: each of the 27 tokens has the README's light and dark value (compare by script or by eye, row by row, and say which in the notes)
- [x] AC10: every token named in architecture.md exists
- [x] AC12: the built CSS contains a `@font-face` for Hanken Grotesk and no `fonts.googleapis.com`
- [x] The style check can fail: put a temporary `color: #fff` in a throwaway `*.module.css`, see exit 1 with the file and line, remove it, see exit 0. Record both runs in the notes ([[knowledge/lessons/LESSON-REQ-fs-003-4]])
- [x] `node scripts/frontend-style-check.mjs` exits 0 and `npm run build` exits 0

## Notes

- **Rules for every task of this REQ.** Never read or print any `.env` file. Never run `psql` or anything that changes the database. Never run `git push` or any git command that writes. Touch nothing under `backend/`, `shared/` or `db/`. Delete no file that this task's table does not list. Add no package that this task does not name. If the task cannot be done inside these rules, stop and write why in the implementation notes.
- Read `architecture.md` in this REQ folder first (layout, token names, the size-snapping table). Read `docs/design/README.md` and the screen files this task names. Do not copy inline styles from the screens; read the tokens.
- Compiler rules: `import type` for types, no enums, no unused locals or parameters. No barrel `index.ts` files for components.
- `0` without a unit is allowed. Percentages, `fr`, `ch`, `vh`, `vw` and unitless numbers are allowed.
- If a later size is needed that has no token, the task that needs it appends it to the `/* Added by later tasks */` block with a comment.

### Implementation notes (2026-10-07)

**What was built.** `styles/tokens.css` (four blocks plus the empty "Added by later tasks" block), `styles/base.css`, three imports in `main.tsx`, eight icons on one shared frame, and `scripts/frontend-style-check.mjs`.

**Checks run.**

- AC9, by script (a throwaway script outside the repo): it read the 27 rows of README section 2 and the two color blocks of `tokens.css` and compared them. 27 rows, 27 light, 27 dark, 0 differences. `color-scheme` is set in both blocks.
- AC10, by the same script: all 53 token names in the architecture table exist, and the eight `--leading-*` names.
- AC12: the built CSS has 4 `@font-face` rules for "Hanken Grotesk Variable" (weight 100 to 900, so 400, 500, 600 and 700 are covered) and 3 font files in `frontend/dist/assets`. No file in `frontend/dist` holds `fonts.googleapis.com`.
- The style check can fail. Run 1, clean tree: exit 0. Run 2, a throwaway `frontend/src/components/zzProbe/Probe.module.css` with `color: #fff`: exit 1, `FAIL [a] frontend/src/components/zzProbe/Probe.module.css:2  hex color #fff`. Run 3, a wider probe (one stylesheet, one `.tsx`): exit 1 with 25 findings, at least one for each of the eight rules (a 6, b 4, c 3, d 3, e 2, f 2, g 1, h 4), and no finding on the lines that must stay clean (`color-mix(... transparent)`, `white-space`, `100%`, `50vh`, the breakpoint line, a comment that names `#fff`, `<button onClick>`, `onClick` inside a `{...}` value). Run 4, probe deleted: exit 0.
- `node scripts/frontend-style-check.mjs` exits 0 (29 files) and `npm run build` exits 0, both run again after TASK-003 added its files. No build failure came from TASK-003.

**Things that differ from the task text. The owner should see these.**

1. **One extra token, `--hidden-size: 1px`.** The `.visuallyHidden` helper needs a 1px box, and the px rule covers `base.css`. The token sits in block 3 with a comment. It is not in the architecture list.
2. **One extra file, `icons/IconBase.tsx`.** It holds the shared `<svg>` frame and the `IconSize` / `IconProps` types, so the eight icons do not repeat them. It matches the task row `icons/*.tsx`. It is not a barrel file: each icon is still imported by its own path.
3. **`size` is optional and defaults to `md`** (18px, the size most pictures use).
4. **Stroke caps and joins are round on every icon.** Some pictures leave the join unset; with 2px lines the difference is not visible.

**How the check reads the rules (where the task left a choice).**

- Rule a also catches `hsla(`, `hwb(`, `lab(`, `lch(`, `oklab(`, `oklch(`. A named color is caught in a CSS value, and in a `.tsx` only when it is given to a color property or attribute (`color: "red"`, `fill="black"`); plain words in text are not checked. `transparent`, `currentColor` and `inherit` are allowed.
- Rule d counts `import type` too. A page that needs a type from `services/` (for example `ApiFailure`) will fail; the store should hand the type on. If the owner would rather allow type-only imports, it is a one-line change in `checkImports`.
- Rule e reads the two values from `config/app.ts`. If it cannot read them, the check exits 1 instead of passing.
- Comments are skipped for every rule except e.
- Known limits: `"#feed"` or `"#123"` in a string reads as a hex color; `frontend/index.html` is outside `frontend/src` and is not read; `text-shadow` and `drop-shadow(` are not in rule h (the task lists `box-shadow` only).

**Follow-ups, not done here.** Add `text-shadow` and `filter: drop-shadow` to rule h if the owner wants "no shadows" checked in full. There is no token for transition time; the first task that animates something adds one to the "Added by later tasks" block.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-004-frontend-foundation-shell-auth/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-003-4]]
