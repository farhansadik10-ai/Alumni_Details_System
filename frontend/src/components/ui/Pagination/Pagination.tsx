import { Button } from "../Button/Button";
import styles from "./Pagination.module.css";

// Up to this many pages, every page number is shown.
const MAX_PAGES_SHOWN_IN_FULL = 7;
const GAP_TEXT = "…";

export type PageRangeItem = number | "gap";

/**
 * The page numbers to show. Up to 7 pages: all of them. More: the first, the
 * last, the current page and its two neighbours, with "gap" where pages are
 * left out. A gap never stands for one page only; that page is shown instead.
 *
 *   pageRange(1, 3)   -> [1, 2, 3]
 *   pageRange(1, 25)  -> [1, 2, "gap", 25]
 *   pageRange(4, 25)  -> [1, 2, 3, 4, 5, "gap", 25]
 *   pageRange(12, 25) -> [1, "gap", 11, 12, 13, "gap", 25]
 *
 * A page outside 1..pageCount is treated as the nearest page inside.
 * Fewer than 1 page gives [].
 */
export function pageRange(page: number, pageCount: number): PageRangeItem[] {
  const last = Number.isFinite(pageCount) ? Math.floor(pageCount) : 0;
  if (last < 1) {
    return [];
  }
  const current = clampPage(page, last);

  if (last <= MAX_PAGES_SHOWN_IN_FULL) {
    return Array.from({ length: last }, (_, index) => index + 1);
  }

  const shown = [1, current - 1, current, current + 1, last].filter(
    (value, index, all) => value >= 1 && value <= last && all.indexOf(value) === index,
  );

  const items: PageRangeItem[] = [];
  let previous = 0;
  for (const value of shown) {
    const leftOut = value - previous - 1;
    if (leftOut === 1) {
      items.push(value - 1);
    } else if (leftOut > 1) {
      items.push("gap");
    }
    items.push(value);
    previous = value;
  }
  return items;
}

function clampPage(page: number, last: number): number {
  if (!Number.isFinite(page)) {
    return 1;
  }
  return Math.min(Math.max(Math.floor(page), 1), last);
}

export type PaginationProps = {
  // Counted from 1.
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
};

export function Pagination({ page, pageCount, onChange }: PaginationProps) {
  const items = pageRange(page, pageCount);
  // One page or none: there is nowhere to go, so nothing is shown.
  if (items.length <= 1) {
    return null;
  }
  const last = Math.floor(pageCount);
  const current = clampPage(page, last);

  return (
    <nav className={styles.nav} aria-label="Pages">
      <ul className={styles.list}>
        <li>
          <Button disabled={current === 1} onClick={() => onChange(current - 1)}>
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
          <Button disabled={current === last} onClick={() => onChange(current + 1)}>
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
