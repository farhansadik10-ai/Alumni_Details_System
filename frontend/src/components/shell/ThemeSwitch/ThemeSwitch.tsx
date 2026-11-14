import { useAtom } from "jotai";
import type { ComponentType } from "react";
import type { IconProps } from "../../../icons/IconBase";
import { MonitorIcon } from "../../../icons/MonitorIcon";
import { MoonIcon } from "../../../icons/MoonIcon";
import { SunIcon } from "../../../icons/SunIcon";
import { themeChoiceAtom } from "../../../store/themeAtoms";
import type { ThemeChoice } from "../../../store/themeAtoms";
import styles from "./ThemeSwitch.module.css";

type ThemeSwitchProps = {
  /** icons: three square icon buttons (header, log in, sign-up). text: three word buttons (phone menu). */
  variant: "icons" | "text";
};

type ThemeOption = {
  choice: ThemeChoice;
  word: string;
  name: string;
  Icon: ComponentType<IconProps>;
};

const GROUP_NAME = "Theme";

const OPTIONS: readonly ThemeOption[] = [
  { choice: "light", word: "Light", name: "Light theme", Icon: SunIcon },
  { choice: "dark", word: "Dark", name: "Dark theme", Icon: MoonIcon },
  { choice: "system", word: "System", name: "System theme", Icon: MonitorIcon },
];

export function ThemeSwitch({ variant }: ThemeSwitchProps) {
  const [choice, setChoice] = useAtom(themeChoiceAtom);

  return (
    <div
      role="group"
      aria-label={GROUP_NAME}
      className={`${styles.group} ${styles[variant]}`}
    >
      {OPTIONS.map(({ choice: option, word, name, Icon }) => (
        <button
          key={option}
          type="button"
          className={styles.button}
          aria-label={variant === "icons" ? name : undefined}
          aria-pressed={choice === option}
          onClick={() => setChoice(option)}
        >
          {variant === "icons" ? <Icon /> : word}
        </button>
      ))}
    </div>
  );
}
