import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";
import { Field } from "../Field/Field";
import type { FieldTextProps } from "../Field/Field";
import styles from "./Textarea.module.css";

const DEFAULT_ROWS = 3;

// Field owns the id and the aria wiring, so a caller cannot pass its own.
type NativeTextareaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "id" | "aria-describedby" | "aria-invalid" | "className"
>;

export type TextareaProps = NativeTextareaProps & FieldTextProps;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, optionalNote, help, error, rows = DEFAULT_ROWS, ...textareaProps },
  ref,
) {
  return (
    <Field label={label} optionalNote={optionalNote} help={help} error={error}>
      {({ id, describedBy, invalid }) => (
        <textarea
          {...textareaProps}
          ref={ref}
          id={id}
          rows={rows}
          className={styles.textarea}
          aria-describedby={describedBy}
          aria-invalid={invalid ? true : undefined}
        />
      )}
    </Field>
  );
});
