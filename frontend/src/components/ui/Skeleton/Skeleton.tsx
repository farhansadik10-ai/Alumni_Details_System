import type { ReactNode } from "react";
import { LOADING_TEXT } from "../../../config/text";
import styles from "./Skeleton.module.css";

export type SkeletonShape = "line" | "title" | "avatar-sm" | "avatar-md" | "block";

const SHAPE_CLASS: Record<SkeletonShape, string> = {
  line: styles.line,
  title: styles.title,
  "avatar-sm": styles.avatarSm,
  "avatar-md": styles.avatarMd,
  block: styles.block,
};

export type SkeletonProps = {
  shape?: SkeletonShape;
};

/** One still block. Put it inside a SkeletonGroup, which tells a screen reader. */
export function Skeleton({ shape = "line" }: SkeletonProps) {
  return <span className={`${styles.skeleton} ${SHAPE_CLASS[shape]}`} aria-hidden="true" />;
}

export type SkeletonGroupProps = {
  // "stack": blocks under each other. "row": side by side, like an avatar and its lines.
  layout?: "stack" | "row";
  children: ReactNode;
};

/** The loading state of a list, a card or a block: busy, with the word "Loading". */
export function SkeletonGroup({ layout = "stack", children }: SkeletonGroupProps) {
  return (
    <div className={`${styles.group} ${styles[layout]}`} aria-busy="true">
      <span className="visuallyHidden">{LOADING_TEXT}</span>
      {children}
    </div>
  );
}

/** A column of blocks inside a "row" group. It says nothing itself. */
export function SkeletonStack({ children }: { children: ReactNode }) {
  return <div className={`${styles.group} ${styles.stack}`}>{children}</div>;
}
