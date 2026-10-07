/** Which slice of a list to read. */
export interface PageRequest {
  limit: number;
  offset: number;
}

/** One page of rows, plus how many rows match in all. */
export interface PageRows<T> {
  rows: T[];
  total: number;
}

/**
 * Turns search text into a "contains" pattern for `LIKE` / `ILIKE`: `%`, `_`
 * and the backslash are escaped with a backslash, so they match themselves,
 * and the result is wrapped in `%...%`. Bind the result as a parameter.
 *
 * Write the SQL as plain `ILIKE $n`, with NO `ESCAPE` clause. Backslash is
 * already PostgreSQL's default escape character for `LIKE`. An `ESCAPE` clause
 * holding a backslash, typed inside a JavaScript template string, loses the
 * backslash and breaks the statement.
 */
export function likePattern(text: string): string {
  const escaped = text.replace(/[\\%_]/g, "\\$&");
  return `%${escaped}%`;
}
