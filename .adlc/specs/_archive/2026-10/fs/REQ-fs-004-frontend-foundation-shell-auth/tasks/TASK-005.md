# TASK-005 — Button, Link and form controls

| Field | Value |
|---|---|
| REQ | REQ-fs-004 |
| Tier | 2 |
| Status | complete |
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

### Implementation notes (2026-10-07)

**Checks.** `node scripts/frontend-style-check.mjs` exit 0; `npm run build` exit 0. Nothing imports these components yet, so the build type-checks them but does not bundle them. To see them, a throwaway page outside `frontend/src` rendered all nine in a dev server; headless Chrome took a light and a dark screenshot and ran a scripted probe. The page, the server and the screenshots are gone.

**What the probe showed.** Button heights 44 / 36 / 48. A busy button: `aria-disabled="true"`, no `disabled`, its `onClick` not called, and as a submit button inside a form it did not submit. A label click focused every enabled TextInput, Select, PasswordInput and Textarea; a click on the Checkbox row toggled it; a click on a radio card chose it. `aria-describedby` pointed at the error when there was one, else at the help text, else was absent. Show / Hide switched the input type and `aria-pressed`.

**Not proven by machine.** The focus ring on Button, Link, Checkbox and radio when reached with Tab: a scripted `focus()` does not count as keyboard focus for those elements, so the probe saw the ring only on text controls. No stylesheet here touches `outline`, so the global rule applies; the browser review should press Tab once.

**Choices the task left open.**
- `Button` default `variant` is `secondary`, so a primary button is always asked for by name (one per view).
- Button sizes use `min-height`, not `height`, so a label that wraps at 200% zoom is not cut. Text: Small on `md`, Caption on `sm` (as drawn, 13px), Body on `lg` (as on log in).
- Disabled `secondary`: `--line` border, `--muted` text; disabled `quiet`: `--muted` text. Both as drawn in `system.html`.
- `Field`, and so every text control, does not accept `id`, `aria-describedby`, `aria-invalid` or `className` from the caller: Field owns that wiring. A page reaches a control through `ref`.
- `optionalNote` is the text itself (`"(optional)"`), not a flag.
- `Select`'s `placeholder` is a first option with an empty value that can be chosen again, so it also serves a filter ("All departments"). A required select must check for `""` in its validator.
- `ControlSize` (`md` | `lg`) lives in `Field.tsx`. The shared box of a text control is `.control` in `Field.module.css`, taken with `composes` by TextInput, Select and Textarea. PasswordInput draws its own box, because there the border belongs to the wrapper.
- `Link` takes `to` or `href`, never both, and passes no other anchor props (no `target`). Add them when a screen needs one.
- `RadioCards` is generic over the value (`RadioCards<"student" | "alumni">`), so `onChange` gives the union back.
- A disabled Checkbox goes `--muted`; the boxed one also goes `--sunken` with a `--line` border, like a disabled input. Not drawn; follows the disabled input.

**Sizes snapped (architecture.md table).** Gaps of 6px and 10px are 8px. Paddings of 14px and 20px are 12px and 24px (quiet button 12px, small quiet 8px). Textarea padding 10px 12px is 8px 12px. 15px text in the checkbox row and the radio cards is Body (16px). The radio is drawn 18px; it is built at `--check-size` (20px) so it matches the checkbox and no new token is needed. No token was added to `tokens.css`.

**One thing for the owner or the reviewer to decide.** The task asks for a "Show" / "Hide" button that also carries `aria-pressed`. It is built that way, with hidden text so a screen reader hears "Show password" / "Hide password". A button whose name and pressed state both change is read as "Hide password, pressed", which some screen-reader users find unclear. The usual fix is to keep one of the two: drop `aria-pressed`, or keep the name fixed. Change in `PasswordInput.tsx` (one line) if wanted.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-004-frontend-foundation-shell-auth/architecture]]
- Lessons checked: —
