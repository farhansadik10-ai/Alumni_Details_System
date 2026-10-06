// The one place that knows PostgreSQL error codes (SQLSTATE values).
// Codes are five characters; the first two name the class.
const UNIQUE_VIOLATION = "23505";
const FOREIGN_KEY_VIOLATION = "23503";
const NOT_NULL_VIOLATION = "23502";
const INTEGRITY_CLASS = "23"; // any other broken constraint, e.g. a CHECK
const DATA_CLASS = "22"; // a value the column cannot hold: too long, not a number, ...
const SQLSTATE_LENGTH = 5;

export type DbErrorKind = "unique" | "foreign_key" | "not_null" | "bad_value";

export interface DbErrorInfo {
  kind: DbErrorKind;
  constraint?: string;
}

/**
 * Names the kind of a PostgreSQL error, or returns `undefined` when `err` is
 * not one this layer knows.
 *
 * Reads only `code` and `constraint`. The error's message and detail hold
 * table names and row values, so they are never read, returned or logged here.
 */
export function classifyDbError(err: unknown): DbErrorInfo | undefined {
  if (typeof err !== "object" || err === null) {
    return undefined;
  }

  const { code, constraint } = err as { code?: unknown; constraint?: unknown };
  if (typeof code !== "string" || code.length !== SQLSTATE_LENGTH) {
    return undefined;
  }

  const kind = kindOf(code);
  if (kind === undefined) {
    return undefined;
  }

  return typeof constraint === "string" ? { kind, constraint } : { kind };
}

function kindOf(code: string): DbErrorKind | undefined {
  if (code === UNIQUE_VIOLATION) {
    return "unique";
  }
  if (code === FOREIGN_KEY_VIOLATION) {
    return "foreign_key";
  }
  if (code === NOT_NULL_VIOLATION) {
    return "not_null";
  }
  if (code.startsWith(INTEGRITY_CLASS) || code.startsWith(DATA_CLASS)) {
    return "bad_value";
  }
  return undefined;
}
