// Reading single values out of the address, shared by the pages that keep
// their state there (the Directory and Users).

// A whole number from 1 to 9999999, without a leading zero.
const PAGE_PATTERN = /^[1-9][0-9]{0,6}$/;

/** The address key of the page number, shared by every list query. */
export const PAGE_KEY = "page";

/** The one value of a key, or null when it is absent or sent more than once. */
export function singleParam(params: URLSearchParams, key: string): string | null {
  const values = params.getAll(key);
  return values.length === 1 ? values[0] : null;
}

/** The page in the address: a whole number from 1 to 9999999, else 1. */
export function readPageParam(params: URLSearchParams): number {
  const page = singleParam(params, PAGE_KEY);
  return page !== null && PAGE_PATTERN.test(page) ? Number(page) : 1;
}
