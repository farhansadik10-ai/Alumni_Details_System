// The message of a failed edit or delete of something in the feed (a post or
// a comment). The status is checked first: saveFailureText gives 403 and 404
// the same "gone" words, and here the user needs to know which (AC18). The
// rule is here once; the words come from the caller (LESSON-REQ-fs-002-3).

import { HTTP_FORBIDDEN, HTTP_NOT_FOUND } from "./loadFailure";
import type { CallFailure } from "./loadFailure";
import { saveFailureText } from "./saveFailure";
import type { SaveFailureWords } from "./saveFailure";

/** The words for each answer: 403, 404, and the save words for the rest. */
export interface WriteFailureWords {
  forbidden: string;
  notFound: string;
  save: SaveFailureWords;
}

/** The thing is no longer there: the server answered 404. */
export function isGone(failure: CallFailure): boolean {
  return failure.kind === "http" && failure.status === HTTP_NOT_FOUND;
}

/** 403 → forbidden; 404 → notFound; anything else → saveFailureText. */
export function writeFailureText(failure: CallFailure, words: WriteFailureWords): string {
  if (failure.kind === "http" && failure.status === HTTP_FORBIDDEN) {
    return words.forbidden;
  }
  if (isGone(failure)) {
    return words.notFound;
  }
  return saveFailureText(failure, words.save);
}
