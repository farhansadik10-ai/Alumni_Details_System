import { useId } from "react";
import type { ReactNode } from "react";
import { useModalDialog } from "../../../hooks/useModalDialog";
import styles from "./Dialog.module.css";

export type DialogProps = {
  open: boolean;
  // Asked for by Escape (and by the caller's own Cancel button). The caller
  // answers by setting `open` to false; the dialog does not close on its own.
  onClose: () => void;
  title: string;
  // The one sentence under the heading.
  children: ReactNode;
  // The buttons, in reading order: Cancel first, the action second.
  actions: ReactNode;
};

/**
 * A centered card over the page, on the native <dialog> opened with
 * showModal(). The browser then moves focus inside, keeps Tab inside, makes
 * the page behind inert, and gives focus back to the opener on close.
 */
export function Dialog({ open, onClose, title, children, actions }: DialogProps) {
  const dialogRef = useModalDialog({ open, onClose });
  const titleId = useId();
  const textId = useId();

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={titleId}
      aria-describedby={textId}
    >
      <h2 id={titleId} className={styles.title}>
        {title}
      </h2>
      <div id={textId} className={styles.text}>
        {children}
      </div>
      <div className={styles.actions}>{actions}</div>
    </dialog>
  );
}
