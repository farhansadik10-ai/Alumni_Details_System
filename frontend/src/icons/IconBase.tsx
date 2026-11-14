import type { ReactNode } from "react";
import styles from "./Icon.module.css";

export type IconSize = "sm" | "md" | "lg";

export type IconProps = {
  size?: IconSize;
};

type IconBaseProps = IconProps & {
  children: ReactNode;
};

// The shared <svg> frame of every icon: line icon, 2px stroke, takes the text color.
// Always decorative; the control around it carries the name.
export function IconBase({ size = "md", children }: IconBaseProps) {
  return (
    <svg
      className={`${styles.icon} ${styles[size]}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}
