import { Request } from "express";
import { ValidationError } from "@alumni/businesslogic";
import type { UpdateFields, UpdateValue } from "@alumni/dal";

export const ADMIN_ROLE = "admin";
export const ALUMNI_ROLE = "alumni";
export const STUDENT_ROLE = "student";
export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 50;
/** The largest value a PostgreSQL `integer` column can hold. */
export const MAX_DB_INTEGER = 2147483647;

const FIRST_PAGE = 1;
/** The highest page whose offset is still a whole number JavaScript holds exactly. */
const MAX_PAGE = Math.floor(Number.MAX_SAFE_INTEGER / MAX_PAGE_SIZE);
const DIGITS_ONLY = /^\d+$/;
/** The space character (U+0020), the only one SQL `btrim(x)` strips. */
const SPACE = " ";

// Messages more than one controller answers with: one copy, so the wording
// cannot drift between them.
export const CREDENTIALS_REQUIRED_MESSAGE = "Email and password are required";
export const NO_FIELDS_MESSAGE = "No fields to update";

/**
 * The allowed fields a request actually sent.
 * A key is kept when it is an own property of the body and its value is not
 * `undefined`. `null` is kept, so a nullable field can be cleared.
 * A missing or non-object body gives `{}`.
 */
export function pickSent<K extends string>(
  body: unknown,
  keys: readonly K[]
): Partial<Record<K, unknown>> {
  const sent: Partial<Record<K, unknown>> = {};
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return sent;
  }

  const source = body as Record<string, unknown>;
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(source, key)) continue;
    const value = source[key];
    if (value !== undefined) sent[key] = value;
  }
  return sent;
}

export function isAdmin(req: Request): boolean {
  return req.user?.role === ADMIN_ROLE;
}

/**
 * True when `userId` is the id in the caller's token.
 * `Number(null)` and `Number("")` are 0, so those are refused before the
 * comparison instead of being read as user 0.
 */
export function isSelf(req: Request, userId: unknown): boolean {
  const callerId = toUserId(req.user?.sub);
  const otherId = toUserId(userId);
  if (callerId === undefined || otherId === undefined) return false;
  return callerId === otherId;
}

function toUserId(value: unknown): number | undefined {
  if (typeof value === "string") {
    if (value.trim() === "") return undefined;
  } else if (typeof value !== "number") {
    return undefined;
  }
  const id = Number(value);
  return Number.isNaN(id) ? undefined : id;
}

/** A string with at least one character that is not white space. */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isStringOrNull(value: unknown): boolean {
  return value === null || typeof value === "string";
}

/** A numeric string such as "2020" is not an integer here. */
export function isIntegerOrNull(value: unknown): boolean {
  return value === null || Number.isInteger(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

/** A checked field as the text a DTO takes; absent or `null` is `null`. */
export function textOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

/**
 * A string of digits only, or a number, read as a whole number that JavaScript
 * holds exactly. Everything else gives `undefined`: `null`, `""`, `"1.5"`,
 * `"-3"`, `"12abc"`, arrays and objects never reach `Number(...)`, which
 * would read several of them as 0.
 */
export function toWholeNumber(value: unknown): number | undefined {
  if (typeof value === "string") {
    if (!DIGITS_ONLY.test(value)) return undefined;
  } else if (typeof value !== "number") {
    return undefined;
  }
  const whole = Number(value);
  return Number.isSafeInteger(whole) ? whole : undefined;
}

/**
 * An id from the URL or the body: a positive whole number.
 * Throws `ValidationError("Invalid <label>")` for anything else.
 */
export function parseId(value: unknown, label = "id"): number {
  const id = toWholeNumber(value);
  // Ids are PostgreSQL `integer` columns: a larger number can match no row,
  // so it is refused here instead of being sent to the database.
  if (id === undefined || id < 1 || id > MAX_DB_INTEGER) {
    throw new ValidationError("Invalid " + label);
  }
  return id;
}

export interface Paging {
  page: number;
  limit: number;
  offset: number;
}

/**
 * `page` and `limit` from the query string (ADR-12).
 * Absent: page 1, limit `DEFAULT_PAGE_SIZE`. Sent: a string of digits, 1 or
 * more, else `ValidationError`. A limit above `MAX_PAGE_SIZE` becomes
 * `MAX_PAGE_SIZE`.
 */
export function parsePaging(query: Readonly<Record<string, unknown>>): Paging {
  const page = readCount(query, "page", MAX_PAGE) ?? FIRST_PAGE;
  const limit = readCount(query, "limit", MAX_PAGE_SIZE) ?? DEFAULT_PAGE_SIZE;
  return { page, limit, offset: (page - 1) * limit };
}

/**
 * A count of 1 or more from the query string, lowered to `max` when it is
 * above it. The cap is applied to the number as read, so a digit string too
 * long to hold exactly is still capped instead of refused.
 */
function readCount(
  query: Readonly<Record<string, unknown>>,
  key: string,
  max: number
): number | undefined {
  const sent = query[key];
  if (sent === undefined) return undefined;

  const count = typeof sent === "string" && DIGITS_ONLY.test(sent) ? Number(sent) : 0;
  if (count < 1) {
    throw new ValidationError(key + " must be a whole number of 1 or more");
  }
  return Math.min(count, max);
}

/**
 * One value from the query string, with its outer characters removed by
 * `strip`. Absent, or empty after `strip`, gives `undefined` ("not sent").
 * A repeated key (`?q=a&q=b`) or a nested one (`?q[x]=a`) arrives as an array
 * or an object and is refused.
 */
function readSingleValue(
  query: Readonly<Record<string, unknown>>,
  key: string,
  strip: (sent: string) => string
): string | undefined {
  const sent = query[key];
  if (sent === undefined) return undefined;
  if (typeof sent !== "string") {
    throw new ValidationError(key + " must be a single value");
  }
  const text = strip(sent);
  return text === "" ? undefined : text;
}

/**
 * `text` without its leading and trailing space characters (U+0020), which is
 * what SQL `btrim(x)` strips. Two index walks, so the work grows in step with
 * the length of the text, however many spaces it holds.
 */
function stripOuterSpaces(text: string): string {
  let start = 0;
  let end = text.length;
  while (start < end && text[start] === SPACE) start += 1;
  while (end > start && text[end - 1] === SPACE) end -= 1;
  return text.slice(start, end);
}

/**
 * One text value from the query string, trimmed. Absent or blank gives
 * `undefined`. A repeated or nested key is refused (see `readSingleValue`).
 */
export function queryText(
  query: Readonly<Record<string, unknown>>,
  key: string
): string | undefined {
  return readSingleValue(query, key, (sent) => sent.trim());
}

/**
 * One filter value that is compared in SQL against `btrim(column)`, such as
 * the alumni `department` and `field` filters. Absent or blank gives
 * `undefined`; an array or an object is refused, as in `queryText`.
 *
 * It differs from `queryText` in what it strips: only leading and trailing
 * space characters, because that is all `btrim` strips. `queryText` uses
 * JavaScript `trim()`, which also removes tabs and line breaks. A value stored
 * as "Eng<tab>" is offered by GET /api/alumni/filters with its tab, and
 * `trim()` would turn it into "Eng", which matches no row. Here the value the
 * filter list gave comes back unchanged.
 */
export function queryFilterValue(
  query: Readonly<Record<string, unknown>>,
  key: string
): string | undefined {
  return readSingleValue(query, key, stripOuterSpaces);
}

function isUpdateValue(value: unknown): value is UpdateValue {
  return (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

/**
 * Checks each sent field against its own rule and returns the fields as the
 * update input type, so the controller needs no cast.
 * Throws `ValidationError("<key> has the wrong type")` for the first key, in
 * the order of `rules`, whose value fails. A value that is not a string,
 * number, boolean or `null` fails whatever its rule says.
 */
export function checkFields<K extends string>(
  fields: Partial<Record<K, unknown>>,
  rules: Record<K, (value: unknown) => boolean>
): UpdateFields<K> {
  const checked: UpdateFields<K> = {};
  for (const key in rules) {
    if (!Object.prototype.hasOwnProperty.call(fields, key)) continue;
    const value = fields[key];
    if (value === undefined) continue;
    if (!rules[key](value) || !isUpdateValue(value)) {
      throw new ValidationError(key + " has the wrong type");
    }
    checked[key] = value;
  }
  return checked;
}
