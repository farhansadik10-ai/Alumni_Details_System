import { useEffect, useId, useLayoutEffect, useRef } from "react";
import type { ReactNode } from "react";
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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const textId = useId();

  // The listeners below are added once, so they read the newest props here.
  const latest = useRef({ open, onClose });
  useEffect(() => {
    latest.current = { open, onClose };
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) {
      return;
    }
    // showModal() throws on a dialog that is already open.
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) {
      return;
    }

    // Escape. The caller owns `open`, so the browser's own close is held back.
    function handleCancel(event: Event) {
      event.preventDefault();
      latest.current.onClose();
    }

    // The browser closed it anyway (a second Escape in a row is not held
    // back). Not our own close(): by then `open` is already false.
    function handleClose() {
      if (latest.current.open) {
        latest.current.onClose();
      }
    }

    dialog.addEventListener("cancel", handleCancel);
    dialog.addEventListener("close", handleClose);
    return () => {
      dialog.removeEventListener("cancel", handleCancel);
      dialog.removeEventListener("close", handleClose);
    };
  }, []);

  // Removed from the page while open: close first, while the element is still
  // in the page, so focus goes back to the opener. A layout effect, because a
  // plain effect cleans up after the element is gone.
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    return () => {
      if (dialog !== null && dialog.open) {
        dialog.close();
      }
    };
  }, []);

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
