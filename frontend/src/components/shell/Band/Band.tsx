import styles from "./Band.module.css";

export type BandProps = {
  /** The page heading: the one <h1> of the page. */
  heading: string;
  /** One line under the heading. */
  sub?: string;
};

/**
 * The dark band under the header: accent bar, page heading, one line of sub
 * text (AC34). The heading can take focus from a script, because the shell
 * moves focus to it when the page changes.
 */
export function Band({ heading, sub }: BandProps) {
  return (
    <div className={styles.band}>
      <div className={styles.inner}>
        <div className={styles.bar} aria-hidden="true" />
        <h1 className={styles.heading} tabIndex={-1}>
          {heading}
        </h1>
        {sub ? <p className={styles.sub}>{sub}</p> : null}
      </div>
    </div>
  );
}
