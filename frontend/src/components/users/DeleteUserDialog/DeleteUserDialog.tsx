import {
  CANCEL_LABEL,
  DELETING_LABEL,
  USER_DELETE_CONFIRM,
  USER_DELETE_TITLE,
  userDeleteBody,
} from "../../../config/text";
import { ConfirmDialog } from "../../ui/Dialog/ConfirmDialog";
import { Message } from "../../ui/Message/Message";
import styles from "./DeleteUserDialog.module.css";

export type DeleteUserDialogProps = {
  open: boolean;
  // The person's shown name (already through displayName).
  name: string;
  // The delete is running: the confirm button ignores presses and says "Deleting".
  busy: boolean;
  // A failure that answered while the dialog was open, or null.
  errorText: string | null;
  // Cancel and Escape, also while busy (the browser closes the dialog on a
  // second Escape anyway). The page sets `open` to false.
  onClose: () => void;
  onConfirm: () => void;
};

/**
 * "Delete this user?" (AC6, AC8). Props only, so the dev page can show every
 * state without a request; the page owns the delete and its answer.
 */
export function DeleteUserDialog({
  open,
  name,
  busy,
  errorText,
  onClose,
  onConfirm,
}: DeleteUserDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title={USER_DELETE_TITLE}
      confirmLabel={busy ? DELETING_LABEL : USER_DELETE_CONFIRM}
      cancelLabel={CANCEL_LABEL}
      danger
      busy={busy}
    >
      <div className={styles.body}>
        <p className={styles.text}>{userDeleteBody(name)}</p>
        {errorText !== null ? <Message tone="error">{errorText}</Message> : null}
      </div>
    </ConfirmDialog>
  );
}
