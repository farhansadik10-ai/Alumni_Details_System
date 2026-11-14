// The "came from the directory" router state (AC17). The card link saves the
// directory's query string; "Back to directory" reads it to return to the same
// filters and page. Router state survives a reload and can be anything, so it
// is never trusted (L-REQ-fs-004-1).

/** The router state the directory card link sets. */
export interface DirectoryReturnState {
  directorySearch: string;
}

// Longer than any address the directory writes for real search text.
const MAX_SEARCH_LENGTH = 500;

/** The state for a card link, from the directory's current query string. */
export function directoryReturnState(search: string): DirectoryReturnState {
  return { directorySearch: search };
}

/**
 * The saved query string, or "" (the plain directory). Accepted only when it
 * is text that is empty or starts with "?", has no "#" and no line break, and
 * is at most 500 characters long.
 */
export function readDirectorySearch(state: unknown): string {
  if (typeof state !== "object" || state === null) {
    return "";
  }
  const search: unknown = (state as { directorySearch?: unknown }).directorySearch;
  if (
    typeof search !== "string" ||
    search.length > MAX_SEARCH_LENGTH ||
    (search !== "" && !search.startsWith("?")) ||
    /[#\r\n]/.test(search)
  ) {
    return "";
  }
  return search;
}
