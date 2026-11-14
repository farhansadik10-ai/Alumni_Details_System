import jwt from "jsonwebtoken";
import { UnauthorizedError } from "@alumni/businesslogic";

const TOKEN_LIFETIME = "1h";
const BAD_TOKEN_MESSAGE = "Invalid or expired token";
const MISSING_SECRET_MESSAGE = "JWT_SECRET is not set";

export interface TokenPayload {
  sub: number;
  role: string;
}

/**
 * Read on every call, never when this file loads: the root `.env` is loaded
 * as a side effect of importing the DAL, so a read at load time would depend
 * on import order.
 *
 * A missing secret is a server fault. It throws a plain `Error`, which the
 * error middleware answers with 500, never with 401.
 */
function readSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(MISSING_SECRET_MESSAGE);
  }
  return secret;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign({ sub: payload.sub, role: payload.role }, readSecret(), {
    expiresIn: TOKEN_LIFETIME,
  });
}

/**
 * The payload of a valid token, or `UnauthorizedError`.
 * Only `jsonwebtoken`'s own errors (bad signature, malformed, expired) and a
 * payload of the wrong shape become 401; anything else is rethrown as it is.
 */
export function verifyToken(token: string): TokenPayload {
  const secret = readSecret();

  let decoded: unknown;
  try {
    decoded = jwt.verify(token, secret);
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError(BAD_TOKEN_MESSAGE);
    }
    throw err;
  }

  if (typeof decoded !== "object" || decoded === null) {
    throw new UnauthorizedError(BAD_TOKEN_MESSAGE);
  }
  const { sub, role } = decoded as { sub?: unknown; role?: unknown };
  if (typeof sub !== "number" || typeof role !== "string") {
    throw new UnauthorizedError(BAD_TOKEN_MESSAGE);
  }
  return { sub, role };
}
