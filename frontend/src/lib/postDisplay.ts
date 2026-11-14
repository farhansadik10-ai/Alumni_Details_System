// How a post or a comment shows its date and its comment count (spec C9, AC10,
// AC34). One copy of each rule: the feed, the dashboard and the profile all
// use these. This file imports nothing, so the words live here (pattern 28).

export const COMMENT_COUNT_NONE_TEXT = "No comments yet";
// The word after the number: "1 comment", "2 comments" (through countText).
export const COMMENT_COUNT_ONE_WORD = "comment";
export const COMMENT_COUNT_MANY_WORD = "comments";

// Fixed English names, the same in every browser (never toLocaleDateString).
const MONTH_NAMES: readonly string[] = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// The API sends ISO dates ("2026-10-03T09:15:00.000Z"). Anything that does not
// start with a year, a month and a day is unreadable here, so the browser's
// loose parser never turns "1" into the year 2001.
const ISO_DATE_START = /^\d{4}-\d{2}-\d{2}/;

/**
 * The moment a created_at text names, in milliseconds since 1970, or null
 * when there is no date or it cannot be read. The one parser of these dates:
 * dateText, the thread order and the feed order all use it.
 */
export function createdTime(iso: string | null): number | null {
  if (iso === null || !ISO_DATE_START.test(iso)) {
    return null;
  }
  const time = Date.parse(iso);
  return Number.isNaN(time) ? null : time;
}

/** "3 October 2026" in the viewer's local time zone, or null when there is no readable date. */
export function dateText(iso: string | null): string | null {
  const time = createdTime(iso);
  if (time === null) {
    return null;
  }
  const date = new Date(time);
  return `${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * A count and its word: "1 reply" for exactly one, otherwise "N replies".
 * The one plural rule of the post and comment words; config/text.ts uses it
 * for the delete dialogs and the feed's status line.
 */
export function countText(count: number, one: string, many: string): string {
  return count === 1 ? `1 ${one}` : `${count} ${many}`;
}

/** "No comments yet", "1 comment", otherwise "N comments". */
export function commentCountText(count: number): string {
  if (count === 0) {
    return COMMENT_COUNT_NONE_TEXT;
  }
  return countText(count, COMMENT_COUNT_ONE_WORD, COMMENT_COUNT_MANY_WORD);
}
