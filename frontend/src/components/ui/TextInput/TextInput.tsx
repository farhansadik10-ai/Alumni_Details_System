import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { Field } from "../Field/Field";
import type { ControlSize, FieldTextProps } from "../Field/Field";
import styles from "./TextInput.module.css";

// Field owns the id and the aria wiring, so a caller cannot pass its own.
type NativeInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size" | "id" | "aria-describedby" | "aria-invalid" | "className"
>;

export type TextInputProps = NativeInputProps &
  FieldTextProps & {
    size?: ControlSize;
  };

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { label, optionalNote, help, error, size = "md", type = "text", ...inputProps },
  ref,
) {
  return (
    <Field label={label} optionalNote={optionalNote} help={help} error={error}>
      {({ id, describedBy, invalid }) => (
        <input
          {...inputProps}
          ref={ref}
          id={id}
          type={type}
          className={`${styles.input} ${styles[size]}`}
          aria-describedby={describedBy}
          aria-invalid={invalid ? true : undefined}
        />
      )}
    </Field>
  );
});
