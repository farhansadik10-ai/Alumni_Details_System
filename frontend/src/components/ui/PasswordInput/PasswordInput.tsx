import { forwardRef, useState } from "react";
import type { InputHTMLAttributes } from "react";
import { Field } from "../Field/Field";
import type { ControlSize, FieldTextProps } from "../Field/Field";
import styles from "./PasswordInput.module.css";

const SHOW_LABEL = "Show";
const HIDE_LABEL = "Hide";
// Read by screen readers after "Show" or "Hide", so the button says what it shows.
const TOGGLE_OBJECT = " password";

// Field owns the id and the aria wiring; the Show button owns the type.
type NativeInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size" | "id" | "type" | "aria-describedby" | "aria-invalid" | "className"
>;

export type PasswordInputProps = NativeInputProps &
  FieldTextProps & {
    size?: ControlSize;
  };

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(
  { label, optionalNote, help, error, size = "md", disabled, ...inputProps },
  ref,
) {
  const [shown, setShown] = useState(false);

  return (
    <Field label={label} optionalNote={optionalNote} help={help} error={error}>
      {({ id, describedBy, invalid }) => {
        const boxClass = [
          styles.box,
          styles[size],
          invalid ? styles.invalid : "",
          disabled ? styles.disabled : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <div className={boxClass}>
            <input
              {...inputProps}
              ref={ref}
              id={id}
              type={shown ? "text" : "password"}
              disabled={disabled}
              className={styles.input}
              aria-describedby={describedBy}
              aria-invalid={invalid ? true : undefined}
            />
            <button
              type="button"
              className={styles.toggle}
              aria-pressed={shown}
              disabled={disabled}
              onClick={() => setShown((current) => !current)}
            >
              {shown ? HIDE_LABEL : SHOW_LABEL}
              <span className="visuallyHidden">{TOGGLE_OBJECT}</span>
            </button>
          </div>
        );
      }}
    </Field>
  );
});
