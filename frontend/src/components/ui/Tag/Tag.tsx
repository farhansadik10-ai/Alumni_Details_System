import type { ReactNode } from "react";
import styles from "./Tag.module.css";

export type TagVariant = "plain" | "mentoring" | "role-student" | "role-alumni" | "role-admin";

const VARIANT_CLASS: Record<TagVariant, string> = {
  plain: styles.plain,
  mentoring: styles.mentoring,
  "role-student": styles.roleStudent,
  "role-alumni": styles.roleAlumni,
  "role-admin": styles.roleAdmin,
};

export type TagProps = {
  variant?: TagVariant;
  // Always words: a tag never says something by its color alone.
  children: ReactNode;
};

export function Tag({ variant = "plain", children }: TagProps) {
  return <span className={`${styles.tag} ${VARIANT_CLASS[variant]}`}>{children}</span>;
}
