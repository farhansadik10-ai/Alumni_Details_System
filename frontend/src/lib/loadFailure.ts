// The line of a load error state (pattern 9): the server answered with an
// error, or no answer came. One rule for every page and card that loads.

import { FAILURE_NO_ANSWER_TEXT, FAILURE_SERVER_TEXT } from "../config/text";

/**
 * A failed call, as far as the words need to know. The same shape as the
 * services' ApiFailure, written here so lib/ does not import services/.
 */
export type LoadFailure = { kind: "network" } | { kind: "http"; status: number };

/**
 * Any status from the server → the server words; no answer, or no failure
 * kept (null) → the no-answer words.
 */
export function loadFailureText(failure: LoadFailure | null): string {
  return failure?.kind === "http" ? FAILURE_SERVER_TEXT : FAILURE_NO_ANSWER_TEXT;
}
