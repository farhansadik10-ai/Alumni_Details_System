import type { ReactNode } from "react";
import styles from "./Card.module.css";

export type CardProps = {
  // "section" and "article" need a heading inside, or an aria-labelledby.
  as?: "div" | "section" | "article";
  // md is 24px, lg is 32px.
  padding?: "md" | "lg";
  "aria-labelledby"?: string;
  children: ReactNode;
};

export function Card({
  as: Element = "div",
  padding = "md",
  "aria-labelledby": labelledBy,
  children,
}: CardProps) {
  return (
    <Element className={`${styles.card} ${styles[padding]}`} aria-labelledby={labelledBy}>
      {children}
    </Element>
  );
}
