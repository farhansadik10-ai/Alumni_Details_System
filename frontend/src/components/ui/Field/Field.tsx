import { useId } from "react";
import type { ReactNode } from "react";
import styles from "./Field.module.css";

// What Field hands to the control it wraps. Spread these on the native element.
export type FieldControlProps = {
  id: string;
  describedBy: string | undefined;
  invalid: boolean;
};

// The heights a text control comes in: 44px, or 48px on log in and sign-up.
export type ControlSize = "md" | "lg";

// The props every labelled control shares (TextInput, PasswordInput, Select, Textarea).
export type FieldTextProps = {
  label: ReactNode;
  // Muted text after the label, for example "(optional)".
  optionalNote?: string;
  help?: ReactNode;
  // A message in words. When set, it replaces the help text and marks the control invalid.
  error?: string | null;
};

type FieldProps = FieldTextProps & {
  children: (control: FieldControlProps) => ReactNode;
};

// Label above, the control, then help or error text below. The label and the
// text below are tied to the control by id, so a screen reader reads them.
export function Field({ label, optionalNote, help, error, children }: FieldProps) {
  const id = useId();
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;

  const hasError = typeof error === "string" && error !== "";
  const hasHelp = !hasError && help !== undefined && help !== null && help !== "";
  const describedBy = hasError ? errorId : hasHelp ? helpId : undefined;

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
        {optionalNote ? <span className={styles.optionalNote}> {optionalNote}</span> : null}
      </label>
      {children({ id, describedBy, invalid: hasError })}
      {hasError ? (
        <p className={styles.error} id={errorId}>
          {error}
        </p>
      ) : null}
      {hasHelp ? (
        <p className={styles.help} id={helpId}>
          {help}
        </p>
      ) : null}
    </div>
  );
}
