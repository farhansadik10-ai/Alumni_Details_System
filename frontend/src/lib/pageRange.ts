// Which page numbers a pager shows.

// Up to this many pages, every page number is shown.
const MAX_PAGES_SHOWN_IN_FULL = 7;

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

/** The nearest page inside 1..last. A page that is not a number counts as 1. */
export function clampPage(page: number, last: number): number {
  if (!Number.isFinite(page)) {
    return 1;
  }
  return Math.min(Math.max(Math.floor(page), 1), last);
}

/** The last page number; at least 1, also for an empty list or a bad page size. */
export function lastPage(total: number, limit: number): number {
  if (!Number.isFinite(total) || !Number.isFinite(limit) || limit <= 0) {
    return 1;
  }
  return Math.max(1, Math.ceil(total / limit));
}
