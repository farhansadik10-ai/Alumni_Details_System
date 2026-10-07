import { forwardRef } from "react";
import type { ButtonHTMLAttributes, MouseEvent } from "react";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "quiet" | "danger";
export type ButtonSize = "md" | "sm" | "lg";

export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
  variant?: ButtonVariant;
  // The red text button ("Delete" in a table). Only read when variant is "quiet".
  tone?: "danger";
  size?: ButtonSize;
  // The action is running: presses are ignored, and the button stays focusable.
  busy?: boolean;
  // Shown in place of the children while busy, for example "Saving".
  busyLabel?: string;
  fullWidth?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "secondary",
    tone,
    size = "md",
    busy = false,
    busyLabel,
    fullWidth = false,
    type = "button",
    onClick,
    children,
    ...buttonProps
  },
  ref,
) {
  const className = [
    styles.button,
    styles[variant],
    styles[size],
    variant === "quiet" && tone === "danger" ? styles.toneDanger : "",
    fullWidth ? styles.fullWidth : "",
  ]
    .filter(Boolean)
    .join(" ");

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (busy) {
      // Also stops a second submit: a submit button, and Enter in a field of
      // its form, both reach the form through this click.
      event.preventDefault();
      return;
    }
    onClick?.(event);
  }

  return (
    <button
      {...buttonProps}
      ref={ref}
      type={type}
      className={className}
      aria-busy={busy ? true : undefined}
      aria-disabled={busy ? true : undefined}
      onClick={handleClick}
    >
      {busy && busyLabel ? busyLabel : children}
    </button>
  );
});
