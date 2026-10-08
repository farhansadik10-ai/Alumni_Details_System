import { Link as RouterLink } from "react-router-dom";
import type { ReactNode } from "react";
import type { To } from "react-router-dom";
import type { ButtonSize } from "../Button/Button";
import styles from "./ButtonLink.module.css";

export type ButtonLinkVariant = "primary" | "secondary";

export type ButtonLinkProps = {
  // An address inside the app. The router changes the page without a reload.
  to: To;
  variant?: ButtonLinkVariant;
  size?: ButtonSize;
  children: ReactNode;
};

/**
 * A link that looks like a button, for an action that goes to another page
 * ("Write a post", "Edit my profile"). It is a real <a>, so it opens in a new
 * tab and a screen reader calls it a link. The look is Button's, taken with
 * "composes"; nothing is copied.
 */
export function ButtonLink({ to, variant = "secondary", size = "md", children }: ButtonLinkProps) {
  const className = `${styles.link} ${styles[variant]} ${styles[size]}`;

  return (
    <RouterLink className={className} to={to}>
      {children}
    </RouterLink>
  );
}
