import { useId } from "react";
import type { ReactNode } from "react";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle";
import { Card } from "../../ui/Card/Card";
import { Band } from "../Band/Band";
import styles from "./PageLayout.module.css";

export type PageLayoutProps = {
  /** The page heading. Also the browser tab title. */
  heading: string;
  sub?: string;
  /** The page content. The first child overlaps the band. */
  children: ReactNode;
};

/**
 * The frame of every page inside the shell: the band, then one content
 * column whose first child is pulled up over the band (AC34).
 */
export function PageLayout({ heading, sub, children }: PageLayoutProps) {
  useDocumentTitle(heading);

  return (
    <>
      <Band heading={heading} sub={sub} />
      <div className={styles.content}>{children}</div>
    </>
  );
}

export type PageNoteProps = {
  /** The statement, as the heading of the card. */
  title: string;
  /** One quieter line under it. */
  text?: string;
  /** What the page adds under the words: a link or a button. */
  children?: ReactNode;
};

/**
 * A card that says one thing about the page: "This page is being built",
 * "You do not have access to this page". Used as a child of PageLayout.
 */
export function PageNote({ title, text, children }: PageNoteProps) {
  const titleId = useId();

  return (
    <Card as="section" aria-labelledby={titleId}>
      <div className={styles.note}>
        <h2 id={titleId} className={styles.noteTitle}>
          {title}
        </h2>
        {text ? <p className={styles.noteText}>{text}</p> : null}
        {children ? <div className={styles.noteExtra}>{children}</div> : null}
      </div>
    </Card>
  );
}
