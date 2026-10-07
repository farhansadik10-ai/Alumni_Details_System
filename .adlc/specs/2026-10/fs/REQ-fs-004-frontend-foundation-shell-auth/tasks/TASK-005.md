# TASK-005 — Button, Link and form controls

| Field | Value |
|---|---|
| REQ | REQ-fs-004 |
| Tier | 2 |
| Status | pending |
| Repo | alumni-details-system |
| Depends on | TASK-002 |
| Blocks | TASK-006, TASK-007, TASK-008 |

## Goal

Button, Link, Field, TextInput, PasswordInput, Select, Textarea, Checkbox and RadioCards exist, match the design system pictures and are fully usable by keyboard and screen reader.

## Files to touch

| Path | Action |
|---|---|
| `frontend/src/components/ui/Button/Button.tsx + Button.module.css` | create |
| `frontend/src/components/ui/Link/Link.tsx + Link.module.css` | create |
| `frontend/src/components/ui/Field/Field.tsx + Field.module.css` | create |
| `frontend/src/components/ui/TextInput/TextInput.tsx + TextInput.module.css` | create |
| `frontend/src/components/ui/PasswordInput/PasswordInput.tsx + PasswordInput.module.css` | create |
| `frontend/src/components/ui/Select/Select.tsx + Select.module.css` | create |
| `frontend/src/components/ui/Textarea/Textarea.tsx + Textarea.module.css` | create |
| `frontend/src/components/ui/Checkbox/Checkbox.tsx + Checkbox.module.css` | create |
| `frontend/src/components/ui/RadioCards/RadioCards.tsx + RadioCards.module.css` | create |

## Approach

- **Button** (`system.html`, "Buttons"). A real `<button>`, default `type="button"`. `variant`: `primary` (`--accent`, `--on-accent`, 1.5px `--accent-edge`, weight 700, hover `--accent-hover`), `secondary` (`--surface`, 1.5px `--edge`, weight 600, hover `--sunken`), `quiet` (transparent, no visible border, weight 600, hover `--sunken`), `danger` (solid `--danger`, `--on-danger`, hover `--danger-hover`). `tone="danger"` on `quiet` gives the red text button (text `--danger`, hover text `--danger-hover`). `size`: `md` 44px, `sm` 36px, `lg` 48px. Disabled: `--line` background and `--muted` text for solid variants, as drawn. `busy`: `aria-busy="true"`, `aria-disabled="true"`, presses ignored, shows `busyLabel` when given; it keeps its normal colors. `fullWidth`. Forward `ref` and the native button props.
- **Link.** Wraps react-router's `Link` for in-app addresses (`to`) and renders a plain `<a>` when given `href` (for `mailto:`). `--text`, underlined, hover `--accent-soft-text`. A `strong` prop gives weight 700 (the "Create an account" link).
- **Field.** Lays out label, control, then help or error. Props: `label`, `optionalNote` (the muted "(optional)"), `help`, `error`, and a render child that receives `{ id, describedBy, invalid }`. Ids from `useId`. The error is a `<p>` with its own id, `--danger`, weight 600, Caption size; when an error is shown it replaces the help text, and `aria-describedby` points at whichever is shown. Label: Small, weight 600.
- **TextInput, Textarea, Select.** Each composes `Field` and forwards `ref` to the native element. 1.5px `--edge` border, `--surface`, `--radius`; error state: border `--danger`, `aria-invalid="true"`; disabled: `--sunken` background, `--muted` text, `--line` border. `size`: `md` (44px) or `lg` (48px). Text is Body size (16px). `Select` is a real `<select>` with `appearance: none` and `ChevronDownIcon` placed at the right; it takes `options: { value: string; label: string }[]` and an optional `placeholder` option. `Textarea` is resizable vertically.
- **PasswordInput.** A field whose input and a "Show" / "Hide" `<button type="button" aria-pressed>` sit inside one bordered box, as in `login.html`. The focus ring shows on the element that has focus. Same `error`, `help`, `size` props as `TextInput`.
- **Checkbox.** A real `<input type="checkbox">` inside its `<label>`, size `--check-size`, `accent-color: var(--action)`, min row height `--control-h`. `boxed` puts it in an `--accent-soft` box with a 1.5px `--edge` border (the mentoring one).
- **RadioCards.** A `<fieldset>` with a `<legend>` (styled like a field label) and one real `<input type="radio">` per option inside a bordered `<label>` card, two equal columns, as in `signup.html`. The chosen card has `--accent-soft` background; text stays `--text`. Props: `legend`, `name`, `options`, `value`, `onChange`. Arrow keys work because the radios share a `name`.

## Acceptance

- [ ] AC17, AC18, AC19, AC29, AC60: each as written in the spec
- [ ] AC58: every control shows the global focus ring when reached with Tab; no stylesheet here removes the outline
- [ ] A label click focuses or toggles its control for every control here
- [ ] `node scripts/frontend-style-check.mjs` exits 0 and `npm run build` exits 0

## Notes

- **Rules for every task of this REQ.** Never read or print any `.env` file. Never run `psql` or anything that changes the database. Never run `git push` or any git command that writes. Touch nothing under `backend/`, `shared/` or `db/`. Delete no file that this task's table does not list. Add no package that this task does not name. If the task cannot be done inside these rules, stop and write why in the implementation notes.
- Read `architecture.md` in this REQ folder first (layout, token names, the size-snapping table). Read `docs/design/README.md` and the screen files this task names. Do not copy inline styles from the screens; read the tokens.
- Compiler rules: `import type` for types, no enums, no unused locals or parameters. No barrel `index.ts` files for components.
- Use the tokens of architecture.md; follow its size-snapping table where a picture shows 15px or an off-scale padding.
- `--accent` is never text and never the only border on a light surface (design-system.md, Color rules).
- The chosen RadioCards card and the checkbox must not rely on color alone: the native control's own mark is the signal.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-004-frontend-foundation-shell-auth/architecture]]
- Lessons checked: —
