import { forwardRef } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import styles from "./Checkbox.module.css";

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size" | "className"> & {
  label: ReactNode;
  // Puts the row in a soft accent box (the mentoring checkbox).
  boxed?: boolean;
};

// A real checkbox inside its own <label>, so no id is needed to tie them.
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, boxed = false, disabled, ...inputProps },
  ref,
) {
  const className = [styles.row, boxed ? styles.boxed : "", disabled ? styles.disabled : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <label className={className}>
      <input {...inputProps} ref={ref} type="checkbox" disabled={disabled} className={styles.input} />
      <span>{label}</span>
    </label>
  );
});
