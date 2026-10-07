import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useRef, useState } from "react";
import { CloseIcon } from "../../../icons/CloseIcon";
import { TOAST_DURATION_MS, dismissToastAtom, toastsAtom } from "../../../store/toastAtoms";
import type { Toast } from "../../../store/toastAtoms";
import styles from "./ToastViewport.module.css";

const DISMISS_NAME = "Dismiss";

type ToastItemProps = {
  toast: Toast;
  onDismiss: (id: number) => void;
};

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const paused = hovered || focused;

  // The time still to wait. A pause keeps what is left; it does not start over.
  const remainingMs = useRef(TOAST_DURATION_MS);

  useEffect(() => {
    if (paused) {
      return;
    }
    const startedAt = Date.now();
    const timer = window.setTimeout(() => onDismiss(toast.id), remainingMs.current);
    return () => {
      window.clearTimeout(timer);
      remainingMs.current = Math.max(0, remainingMs.current - (Date.now() - startedAt));
    };
  }, [paused, toast.id, onDismiss]);

  return (
    <div
      className={styles.toast}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      <span className={styles.text}>{toast.text}</span>
      <button
        type="button"
        className={styles.dismiss}
        aria-label={DISMISS_NAME}
        onClick={() => onDismiss(toast.id)}
      >
        <CloseIcon />
      </button>
    </div>
  );
}

/**
 * Shows the toasts of toastAtoms.ts in the bottom corner. Mounted once, for
 * the whole app. The region is in the page even with no toast in it: a screen
 * reader only says what is added to a live region that was already there.
 */
export function ToastViewport() {
  const toasts = useAtomValue(toastsAtom);
  const dismiss = useSetAtom(dismissToastAtom);

  return (
    // aria-atomic="false": only the new toast is read, not the whole list again.
    <div
      role="status"
      aria-live="polite"
      aria-atomic="false"
      aria-relevant="additions"
      className={styles.viewport}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
      ))}
    </div>
  );
}
