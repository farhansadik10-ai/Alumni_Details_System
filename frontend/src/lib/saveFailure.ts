// The card-level message of a failed save, for both My profile cards. The
// rule is here once; the words come from the caller, so each card can say
// its own thing.

import {
  HTTP_CONFLICT,
  HTTP_FIRST_SERVER_ERROR,
  HTTP_FORBIDDEN,
  HTTP_NOT_FOUND,
} from "./loadFailure";
import type { CallFailure } from "./loadFailure";

/** Why a save failed, as far as the user needs to know. */
export type SaveFailureReason = "noAnswer" | "server" | "gone" | "conflict" | "general";

/**
 * The words for each reason. `conflict` is only for a card that can meet a
 * 409 it explains itself (the alumni profile create); without it a 409 gets
 * the general words.
 */
export interface SaveFailureWords {
  noAnswer: string;
  server: string;
  gone: string;
  conflict?: string;
  general: string;
}

/**
 * No answer → "noAnswer"; 500 and up → "server"; 403 or 404 → "gone" (the
 * thing can no longer be saved); 409 → "conflict"; anything else → "general".
 */
export function saveFailureReason(failure: CallFailure): SaveFailureReason {
  if (failure.kind === "network") {
    return "noAnswer";
  }
  if (failure.status >= HTTP_FIRST_SERVER_ERROR) {
    return "server";
  }
  if (failure.status === HTTP_FORBIDDEN || failure.status === HTTP_NOT_FOUND) {
    return "gone";
  }
  if (failure.status === HTTP_CONFLICT) {
    return "conflict";
  }
  return "general";
}

/** The message to show in the card that failed. */
export function saveFailureText(failure: CallFailure, words: SaveFailureWords): string {
  const reason = saveFailureReason(failure);
  if (reason === "conflict") {
    return words.conflict ?? words.general;
  }
  return words[reason];
}
