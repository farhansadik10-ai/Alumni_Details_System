# TASK-007 — Dialog, Message, Toast

| Field | Value |
|---|---|
| REQ | REQ-fs-004 |
| Tier | 3 |
| Status | pending |
| Repo | alumni-details-system |
| Depends on | TASK-005 |
| Blocks | TASK-008, TASK-010 |

## Goal

Dialog, Message and Toast exist, match `system.html`, and behave correctly for keyboard and screen reader users.

## Files to touch

| Path | Action |
|---|---|
| `frontend/src/components/ui/Dialog/Dialog.tsx + Dialog.module.css` | create |
| `frontend/src/components/ui/Message/Message.tsx + Message.module.css` | create |
| `frontend/src/components/ui/Toast/ToastViewport.tsx + ToastViewport.module.css` | create |
| `frontend/src/store/toastAtoms.ts` | create |

## Approach

- **Dialog.** Built on the native `<dialog>`. Props: `open`, `onClose`, `title`, `children` (the one sentence), `actions` (the two buttons). An effect calls `showModal()` when `open` turns true and `close()` when it turns false; the element's `close` and `cancel` events call `onClose`, so Escape works. `aria-labelledby` points at the heading (H3 size, weight 700). Centered card: `--surface`, 1.5px `--edge`, `--radius`, 24px padding, max width `--dialog-max`, and never wider than the screen minus the gutter. `::backdrop` is `color-mix(in srgb, var(--band) 60%, transparent)`. Buttons right-aligned, stacked full width on phone. A `ConfirmDialog` component in the same folder takes `confirmLabel`, `cancelLabel`, `danger`, `onConfirm`, `busy` and puts Cancel first, the action second.
- **Message.** `tone`: `error` (`--danger-soft` background, `--danger-soft-text`, 1.5px `--danger` border, `AlertIcon`, `role="alert"`) or `success` (`--success-soft`, `--success-soft-text`, 1.5px `--success` border, `CheckIcon`, `role="status"`). Weight 600. `tabIndex={-1}` and a forwarded `ref` so a form can move focus to it.
- **Toast.** `toastAtoms.ts`: `toastsAtom` (a list of `{ id, text }`), `showToastAtom` (write-only; adds one, keeps at most 3), `dismissToastAtom`. `ToastViewport`: fixed at the bottom right (bottom, full width minus gutters on phone), `z-index: var(--z-toast)`, a `role="status"` `aria-live="polite"` region that is always in the page so new toasts are announced. Each toast: `--action` background, `--on-action` text, 1.5px `--edge` border, the text, and a Dismiss `<button aria-label="Dismiss">` with `CloseIcon`. It leaves after 5 seconds; the timer pauses while the toast is hovered or holds focus. No enter or leave animation.

## Acceptance

- [ ] AC25: opening moves focus into the dialog; Tab stays inside; Escape closes it; focus returns to the button that opened it; it is exposed as a dialog with its title as the name
- [ ] AC26, AC27: each as written in the spec
- [ ] AC61: no shadow, no gradient, no animation in these three
- [ ] `node scripts/frontend-style-check.mjs` exits 0 and `npm run build` exits 0

## Notes

- **Rules for every task of this REQ.** Never read or print any `.env` file. Never run `psql` or anything that changes the database. Never run `git push` or any git command that writes. Touch nothing under `backend/`, `shared/` or `db/`. Delete no file that this task's table does not list. Add no package that this task does not name. If the task cannot be done inside these rules, stop and write why in the implementation notes.
- Read `architecture.md` in this REQ folder first (layout, token names, the size-snapping table). Read `docs/design/README.md` and the screen files this task names. Do not copy inline styles from the screens; read the tokens.
- Compiler rules: `import type` for types, no enums, no unused locals or parameters. No barrel `index.ts` files for components.
- `showModal()` throws if the dialog is already open; guard with `dialog.open`.
- If React's types complain about `onCancel` / `onClose` on `<dialog>`, add the listeners in the effect with `addEventListener`.
- The 5-second time and the limit of 3 are named constants in `toastAtoms.ts`, not literals in the component.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-004-frontend-foundation-shell-auth/architecture]]
- Lessons checked: —
