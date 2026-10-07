import type { MouseEvent } from "react";
import styles from "./SkipLink.module.css";

type SkipLinkProps = {
  /** The id of the <main> of the page. It must be focusable (tabIndex -1). */
  targetId: string;
};

/**
 * "Skip to content": the first stop for the keyboard on every shell page
 * (AC36). Out of sight until it has focus.
 */
export function SkipLink({ targetId }: SkipLinkProps) {
  // Focus is moved by hand: the address keeps no "#..." part, and the link
  // works again the second time it is used on the same page.
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    const target = document.getElementById(targetId);
    if (target === null) {
      return;
    }
    event.preventDefault();
    target.focus();
  }

  return (
    <a className={styles.skip} href={`#${targetId}`} onClick={handleClick}>
      Skip to content
    </a>
  );
}
