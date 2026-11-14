import type { ReactNode } from "react";
import { Button } from "../Button/Button";
import { Dialog } from "./Dialog";

const DEFAULT_CANCEL_LABEL = "Cancel";

export type ConfirmDialogProps = {
  open: boolean;
  // Cancel, and Escape. The caller sets `open` to false.
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  // The one sentence that says what will happen.
  children: ReactNode;
  // Names the action, as the button that opened the dialog did: "Delete post".
  confirmLabel: string;
  cancelLabel?: string;
  // The action cannot be undone: the confirm button is the solid red one.
  danger?: boolean;
  // The action is running: the confirm button ignores presses.
  busy?: boolean;
};

/**
 * "Are you sure?" with two buttons, Cancel first. Focus lands on Cancel when
 * it opens, so Enter alone never confirms.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  children,
  confirmLabel,
  cancelLabel = DEFAULT_CANCEL_LABEL,
  danger = false,
  busy = false,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? "danger" : "primary"} busy={busy} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Dialog>
  );
}
