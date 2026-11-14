# TASK-007 — Dialog, Message, Toast

| Field | Value |
|---|---|
| REQ | REQ-fs-004 |
| Tier | 3 |
| Status | complete |
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

### Implementation notes (2026-10-07)

**Built.** `Dialog/Dialog.tsx`, `Dialog/ConfirmDialog.tsx`, `Dialog/Dialog.module.css`; `Message/Message.tsx` + css; `Toast/ToastViewport.tsx` + css; `store/toastAtoms.ts`. One token appended to `tokens.css`: `--toast-max: var(--form-max)`.

**Decisions a reviewer may question.**

- **The caller owns `open`.** On Escape the dialog calls `preventDefault()` on `cancel` and then `onClose`; it closes when the caller sets `open` to false. Chrome does not hold back a second Escape in a row, so the `close` event also calls `onClose`, but only while `open` is still true (our own `close()` fires the same event). If a caller ignores `onClose`, the dialog and `open` can disagree after that second Escape.
- **`aria-describedby`** points at the sentence, so a screen reader reads it on open. Not in the task text; added.
- **The title is an `<h2>`** drawn at H3 size. The page behind a modal is inert, so the dialog is its own small document.
- **Focus lands on Cancel** (the first button), so Enter alone never deletes.
- **ConfirmDialog while `busy`:** only the confirm button ignores presses. Cancel and Escape still call `onClose`; the caller decides whether to close while the action runs.
- **Removed from the page while open:** a layout-effect cleanup calls `close()` first, so focus still goes back to the opener.
- **Toast live region:** `role="status"` has `aria-atomic="true"` by default, which would re-read every toast on screen when one is added. The region sets `aria-atomic="false"` and `aria-relevant="additions"`.
- **Toast timer really pauses:** the time left is kept; hover or focus does not start the 5 seconds over.
- **Deviation, focus ring.** The README says the ring is `--focus` everywhere. The toast's Dismiss button sets `outline-color: var(--on-action)`: its ring is drawn on the `--action` background, where `--focus` is about 1.8:1 in the dark theme. Width and offset are unchanged. To undo: delete the `.dismiss:focus-visible` rule in `ToastViewport.module.css`.
- **After Dismiss by keyboard** the button is gone and focus falls to the page body. Nothing better to move it to; left as is.
- **No hover look on Dismiss:** there is no token for "hover on `--action`".
- **Sizes snapped** per the architecture table: text 15px to 16px; message padding 12/14 to 12/16; gaps of 10 to 8 (message) and 12 (dialog buttons); toast padding 6 to 8.
- **Not done:** no click-on-backdrop to close, no scroll lock of the page behind. Neither is asked for.

**How it was checked.** `npm run build` exit 0; `node scripts/frontend-style-check.mjs` exit 0 (the check accepts `transparent`). A temporary page outside `src/` (deleted) rendered the three components in Chrome, driven with real key presses over the debugging port, light at 1280px and dark at 360px:

- Enter on the opener: dialog open, focus on Cancel. Tab and Shift+Tab: Cancel, Delete post, the browser's own UI, back to Cancel; never the page. Escape: closed, `onClose` once, focus on the opener. Same after the browser's own `close()`, the Cancel button, and unmounting while open.
- Name "Delete this post?"; 440px wide and centered at 1280px; 328px (360 minus two 16px gutters) with stacked full-width buttons at 360px. Closed dialog is `display: none`. No shadow, animation or transition.
- Message: roles `alert` / `status`, token colors in both themes, takes focus through its ref.
- Toast: four shown, three kept; empty viewport is 0px tall; 32px from the corner at 1280px, full width minus gutters at 360px. A hovered and a focused toast outlive 6 seconds while the third leaves at 5; after the hover ends that toast leaves when its remaining 3 seconds are up. Tab reaches Dismiss; Enter removes the toast.

**Not checked:** a real screen reader (the roles and the live region are in place; the announcement itself needs NVDA or VoiceOver), Firefox and Safari.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-004-frontend-foundation-shell-auth/architecture]]
- Lessons checked: —
