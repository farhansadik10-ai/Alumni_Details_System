import { Request } from "express";

export const ADMIN_ROLE = "admin";

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

/**
 * The first key in `fields` whose value fails `check`, or `undefined` when
 * every value passes. Lets a controller answer 400 "<key> has the wrong type".
 */
export function findWrongType(
  fields: Readonly<Record<string, unknown>>,
  check: (value: unknown) => boolean
): string | undefined {
  return Object.keys(fields).find((key) => !check(fields[key]));
}
