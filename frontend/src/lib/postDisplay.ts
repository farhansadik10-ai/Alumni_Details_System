// How a post or a comment shows its date and its comment count (spec C9, AC10,
// AC34). One copy of each rule: the feed, the dashboard and the profile all
// use these. This file imports nothing, so the words live here (pattern 28).

export const COMMENT_COUNT_NONE_TEXT = "No comments yet";
export const COMMENT_COUNT_ONE_TEXT = "1 comment";
// Put after the number for every count other than 0 and 1: "2 comments".
export const COMMENT_COUNT_MANY_SUFFIX = "comments";

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

/** "No comments yet", "1 comment", otherwise "N comments". */
export function commentCountText(count: number): string {
  if (count === 0) {
    return COMMENT_COUNT_NONE_TEXT;
  }
  if (count === 1) {
    return COMMENT_COUNT_ONE_TEXT;
  }
  return `${count} ${COMMENT_COUNT_MANY_SUFFIX}`;
}
