import { forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";
import { ChevronDownIcon } from "../../../icons/ChevronDownIcon";
import { Field } from "../Field/Field";
import type { ControlSize, FieldTextProps } from "../Field/Field";
import styles from "./Select.module.css";

export type SelectOption = {
  value: string;
  label: string;
};

// The value of the placeholder option: "nothing chosen".
const NO_CHOICE = "";

// Field owns the id and the aria wiring, so a caller cannot pass its own.
type NativeSelectProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "size" | "id" | "aria-describedby" | "aria-invalid" | "className" | "children" | "multiple"
>;

export type SelectProps = NativeSelectProps &
  FieldTextProps & {
    options: SelectOption[];
    // Shown as the first option, with an empty value. It can be chosen again,
    // so it also serves a filter ("All departments").
    placeholder?: string;
    size?: ControlSize;
  };

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, optionalNote, help, error, options, placeholder, size = "md", ...selectProps },
  ref,
) {
  return (
    <Field label={label} optionalNote={optionalNote} help={help} error={error}>
      {({ id, describedBy, invalid }) => (
        <div className={styles.box}>
          <select
            {...selectProps}
            ref={ref}
            id={id}
            className={`${styles.select} ${styles[size]}`}
            aria-describedby={describedBy}
            aria-invalid={invalid ? true : undefined}
          >
            {placeholder !== undefined ? <option value={NO_CHOICE}>{placeholder}</option> : null}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className={styles.chevron}>
            <ChevronDownIcon size="sm" />
          </span>
        </div>
      )}
    </Field>
  );
});
