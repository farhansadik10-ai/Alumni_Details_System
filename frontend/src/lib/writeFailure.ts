// The message of a failed edit or delete of something in the feed (a post or
// a comment). The status is checked first: saveFailureText gives 403 and 404
// the same "gone" words, and here the user needs to know which (AC18). The
// rule is here once; the words come from the caller (LESSON-REQ-fs-002-3).

import { HTTP_BAD_REQUEST, HTTP_FORBIDDEN, HTTP_NOT_FOUND } from "./loadFailure";
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

/** The words for a failed new comment or reply. */
export interface CommentAddFailureWords {
  // 400 on a reply: the comment replied to was removed meanwhile.
  replyTargetGone: string;
  // 404: the post itself is gone.
  postGone: string;
  // 403: this user may not comment.
  forbidden: string;
  save: SaveFailureWords;
}

/**
 * A reply (parentId given) answered 400: the API's answer when the comment
 * replied to no longer exists (ADV-005). A 400 on a new top-level comment is
 * not this.
 */
export function isReplyTargetGone(failure: CallFailure, parentId: number | null): boolean {
  return parentId !== null && failure.kind === "http" && failure.status === HTTP_BAD_REQUEST;
}

/**
 * 400 on a reply → replyTargetGone; 404 → postGone; 403 → forbidden;
 * anything else → saveFailureText.
 */
export function commentAddFailureText(
  failure: CallFailure,
  parentId: number | null,
  words: CommentAddFailureWords,
): string {
  if (isReplyTargetGone(failure, parentId)) {
    return words.replyTargetGone;
  }
  if (isGone(failure)) {
    return words.postGone;
  }
  if (failure.kind === "http" && failure.status === HTTP_FORBIDDEN) {
    return words.forbidden;
  }
  return saveFailureText(failure, words.save);
}
