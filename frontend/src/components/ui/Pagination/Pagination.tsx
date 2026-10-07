import { useEffect, useRef } from "react";
import { clampPage, pageRange } from "../../../lib/pageRange";
import { Button } from "../Button/Button";
import styles from "./Pagination.module.css";

const GAP_TEXT = "…";

export type PaginationProps = {
  // Counted from 1.
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
};

export function Pagination({ page, pageCount, onChange }: PaginationProps) {
  const navRef = useRef<HTMLElement>(null);
  const keepFocus = useRef(false);

  // Next or Previous that reaches the last or first page turns itself
  // disabled, and focus would fall to the page body. Once the new page is
  // shown, focus goes to the current page number instead.
  useEffect(() => {
    if (keepFocus.current) {
      keepFocus.current = false;
      navRef.current?.querySelector<HTMLElement>('[aria-current="page"]')?.focus();
    }
  }, [page]);

  const items = pageRange(page, pageCount);
  // One page or none: there is nowhere to go, so nothing is shown.
  if (items.length <= 1) {
    return null;
  }
  const last = Math.floor(pageCount);
  const current = clampPage(page, last);

  return (
    <nav ref={navRef} className={styles.nav} aria-label="Pages">
      <ul className={styles.list}>
        <li>
          <Button
            disabled={current === 1}
            onClick={() => {
              keepFocus.current = current - 1 === 1;
              onChange(current - 1);
            }}
          >
            Previous
          </Button>
        </li>
        {items.map((item, index) =>
          item === "gap" ? (
            // A gap sits right after page 1 or right before the last page.
            <li key={index === 1 ? "gap-start" : "gap-end"} className={styles.gap} aria-hidden="true">
              {GAP_TEXT}
            </li>
          ) : (
            <li key={item}>
              <button
                type="button"
                className={styles.page}
                aria-label={`Page ${item}`}
                aria-current={item === current ? "page" : undefined}
                onClick={item === current ? undefined : () => onChange(item)}
              >
                {item}
              </button>
            </li>
          ),
        )}
        <li>
          <Button
            disabled={current === last}
            onClick={() => {
              keepFocus.current = current + 1 === last;
              onChange(current + 1);
            }}
          >
            Next
          </Button>
        </li>
      </ul>
      <p className={styles.status}>
        Page {current} of {last}
      </p>
    </nav>
  );
}
