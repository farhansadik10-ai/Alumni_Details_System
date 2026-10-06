import { Request, Response, NextFunction } from "express";
import { AppError, NotFoundError } from "@alumni/businesslogic";
import { classifyDbError, type DbErrorKind } from "@alumni/dal";

const STATUS_BAD_REQUEST = 400;
const STATUS_CONFLICT = 409;
const STATUS_INTERNAL = 500;
const CLIENT_ERROR_MIN = 400;
const CLIENT_ERROR_MAX = 499;

/** The `type` body-parser puts on the error for a body that is not valid JSON. */
const JSON_PARSE_FAILED = "entity.parse.failed";

const ROUTE_NOT_FOUND = "Route not found";
const BODY_NOT_JSON = "Request body is not valid JSON";
const REQUEST_UNREADABLE = "Request could not be read";
const INVALID_VALUE = "Invalid value in request";
const DATA_CONFLICT = "Request conflicts with existing data";
const INTERNAL_ERROR = "Internal server error";

const DB_ANSWERS: Record<DbErrorKind, { status: number; message: string }> = {
  bad_value: { status: STATUS_BAD_REQUEST, message: INVALID_VALUE },
  not_null: { status: STATUS_BAD_REQUEST, message: INVALID_VALUE },
  unique: { status: STATUS_CONFLICT, message: DATA_CONFLICT },
  foreign_key: { status: STATUS_CONFLICT, message: DATA_CONFLICT },
};

/** Mounted on `/api` after every route: a URL no route answered. */
export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  next(new NotFoundError(ROUTE_NOT_FOUND));
}

/**
 * The one place that turns an error into an HTTP answer (ADR-11).
 * Every answer is `{ error }`. Only an `AppError` sends its own message; every
 * other branch sends a fixed text, so no database or library text reaches the
 * client. Express knows this is an error middleware by its four parameters.
 */
export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof AppError) {
    res.status(err.status).json({ error: err.message });
    return;
  }

  const requestFault = readRequestFault(err);
  if (requestFault !== undefined) {
    res.status(requestFault.status).json({ error: requestFault.message });
    return;
  }

  const dbError = classifyDbError(err);
  if (dbError !== undefined) {
    logDbError(err);
    const answer = DB_ANSWERS[dbError.kind];
    res.status(answer.status).json({ error: answer.message });
    return;
  }

  console.error(err);
  res.status(STATUS_INTERNAL).json({ error: INTERNAL_ERROR });
}

/**
 * Logs a PostgreSQL error without its `detail`: on a constraint failure the
 * detail holds the failing row or key, which for "User" includes the password
 * hash and the email. The message names only the constraint or column.
 */
function logDbError(err: unknown): void {
  const { code, message, constraint, table, column } = err as Record<string, unknown>;
  console.error("Database error", { code, message, constraint, table, column });
}

/**
 * A request Express itself refused before any route ran: a body that is not
 * valid JSON, a body that is too large, a URL that cannot be decoded. These
 * carry a 4xx `status`. A PostgreSQL error has no `status`, so it is not
 * caught here.
 */
function readRequestFault(err: unknown): { status: number; message: string } | undefined {
  if (typeof err !== "object" || err === null) {
    return undefined;
  }

  const { type, status } = err as { type?: unknown; status?: unknown };
  if (type === JSON_PARSE_FAILED) {
    return { status: STATUS_BAD_REQUEST, message: BODY_NOT_JSON };
  }
  if (
    typeof status === "number" &&
    Number.isInteger(status) &&
    status >= CLIENT_ERROR_MIN &&
    status <= CLIENT_ERROR_MAX
  ) {
    return { status, message: REQUEST_UNREADABLE };
  }
  return undefined;
}
