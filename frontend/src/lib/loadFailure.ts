// The line of a load error state (pattern 9): the server answered with an
// error, or no answer came. One rule for every page and card that loads.
// This file also owns the shape of a failed call and the status numbers the
// rules read, so they are written once (lib/saveFailure.ts uses them too).

import { FAILURE_NO_ANSWER_TEXT, FAILURE_SERVER_TEXT } from "../config/text";

/**
 * A failed call, as far as the words need to know. The same shape as the
 * services' ApiFailure, written here so lib/ does not import services/.
 */
export type CallFailure = { kind: "network" } | { kind: "http"; status: number };

export const HTTP_BAD_REQUEST = 400;
export const HTTP_FORBIDDEN = 403;
export const HTTP_NOT_FOUND = 404;
export const HTTP_CONFLICT = 409;
/** 500 and every status above it is the server's own fault. */
export const HTTP_FIRST_SERVER_ERROR = 500;

/**
 * Any status from the server → the server words; no answer, or no failure
 * kept (null) → the no-answer words.
 */
export function loadFailureText(failure: CallFailure | null): string {
  return failure?.kind === "http" ? FAILURE_SERVER_TEXT : FAILURE_NO_ANSWER_TEXT;
}
