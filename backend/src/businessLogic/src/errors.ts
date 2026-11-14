const STATUS_BAD_REQUEST = 400;
const STATUS_UNAUTHORIZED = 401;
const STATUS_FORBIDDEN = 403;
const STATUS_NOT_FOUND = 404;
const STATUS_CONFLICT = 409;

/**
 * An error that carries the HTTP status the error middleware answers with (ADR-11).
 * Throw one of the subclasses; the middleware reads `status` and `message`.
 */
export class AppError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(STATUS_BAD_REQUEST, message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string) {
    super(STATUS_UNAUTHORIZED, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string) {
    super(STATUS_FORBIDDEN, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(STATUS_NOT_FOUND, message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(STATUS_CONFLICT, message);
  }
}
