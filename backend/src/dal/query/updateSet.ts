export interface UpdateSet {
  assignments: string[];
  values: unknown[];
}

/**
 * Builds the `SET` part of a partial UPDATE from the fields that were sent.
 *
 * Column names come only from `columns`, the caller's own fixed list. The keys
 * of `data` are never read as names, so a key that is not in `columns` cannot
 * reach the SQL text. Values are returned separately, to be bound as parameters.
 *
 * `undefined` means "not sent" and is skipped. `null` is a value and is kept.
 *
 * The caller adds `updated_at = NOW()`, `WHERE` and `RETURNING`, and binds the
 * id as parameter number `values.length + 1`.
 */
export function buildUpdateSet(
  data: Record<string, unknown>,
  columns: readonly string[],
): UpdateSet {
  const assignments: string[] = [];
  const values: unknown[] = [];

  for (const column of columns) {
    const value = data[column];
    if (value === undefined) {
      continue;
    }
    values.push(value);
    assignments.push(`${column} = $${values.length}`);
  }

  return { assignments, values };
}
