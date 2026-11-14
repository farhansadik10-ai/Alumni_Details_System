import type { ReactNode } from "react";
import styles from "./RadioCards.module.css";

export type RadioCardOption<Value extends string> = {
  value: Value;
  label: string;
};

export type RadioCardsProps<Value extends string> = {
  legend: ReactNode;
  // Shared by the radios: it makes them one group, so the arrow keys move between them.
  name: string;
  options: RadioCardOption<Value>[];
  value: Value;
  onChange: (value: Value) => void;
};

// One choice out of a few, each option a bordered card with a real radio in it.
export function RadioCards<Value extends string>({
  legend,
  name,
  options,
  value,
  onChange,
}: RadioCardsProps<Value>) {
  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.cards}>
        {options.map((option) => {
          const chosen = option.value === value;
          return (
            <label key={option.value} className={chosen ? `${styles.card} ${styles.chosen}` : styles.card}>
              <input
                type="radio"
                className={styles.input}
                name={name}
                value={option.value}
                checked={chosen}
                onChange={() => onChange(option.value)}
              />
              <span className={styles.text}>{option.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
