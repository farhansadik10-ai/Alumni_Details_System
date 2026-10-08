// Field validators for the forms. Each takes the text as typed and returns
// the message to show under the field, or null when the value is fine.

export const EMAIL_REQUIRED_MESSAGE = "Enter your email.";
export const EMAIL_INVALID_MESSAGE = "Enter a valid email, like name@example.com.";
export const PASSWORD_REQUIRED_MESSAGE = "Enter your password.";
export const NAME_REQUIRED_MESSAGE = "Enter your full name.";
export const PASSWORD_TOO_SHORT_MESSAGE = "Use at least 8 characters.";
export const WEB_LINK_INVALID_MESSAGE = "Enter a link that starts with https://";
export const PHOTO_LINK_INVALID_MESSAGE = WEB_LINK_INVALID_MESSAGE;
export const GRADUATION_YEAR_FORMAT_MESSAGE = "Enter a year with four digits, like 2019.";

export const MIN_PASSWORD_LENGTH = 8;

// The same length as the "User" email column (varchar(100)).
export const MAX_EMAIL_LENGTH = 100;

// The size of the varchar(100) columns: "User".name, department,
// current_company, job_title and experience. field follows them (spec choice 15).
export const MAX_TEXT_LENGTH = 100;
export const MAX_BIO_LENGTH = 2000;
export const MAX_LINK_LENGTH = 500;
export const MIN_GRADUATION_YEAR = 1950;
// A student in the last years may already list the year they finish.
export const GRADUATION_YEARS_AHEAD = 6;

/** Shown when a value is longer than the limit; it names the limit (ADV-008). */
export function tooLongMessage(max: number): string {
  return `Use ${max} characters or fewer.`;
}

/** Shown when a four-digit year is outside the allowed years. */
export function graduationYearRangeMessage(firstYear: number, lastYear: number): string {
  return `Enter a year from ${firstYear} to ${lastYear}.`;
}

// Shown when a request failed in a way the user cannot fix by editing a field.
export const GENERAL_ERROR_MESSAGE = "Something went wrong. Try again.";

// Something, an @, something, a dot, something; no spaces and one @ only.
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WEB_LINK_START = /^https?:\/\//i;
// ASCII digits only: in JavaScript \d never matches other scripts' digits.
const FOUR_DIGITS = /^\d{4}$/;

/** Counts characters, not UTF-16 units, so an emoji counts as one. */
function characterCount(value: string): number {
  return Array.from(value).length;
}

/** True when the text starts with http:// or https://. */
export function isWebLink(value: string): boolean {
  return WEB_LINK_START.test(value);
}

/** Judged after trimming. The letter case is left alone. */
export function validateEmail(value: string): string | null {
  const email = value.trim();
  if (email === "") {
    return EMAIL_REQUIRED_MESSAGE;
  }
  return EMAIL_SHAPE.test(email) ? null : EMAIL_INVALID_MESSAGE;
}

/** Log in: any password that is not empty. Never trimmed. */
export function validateLoginPassword(value: string): string | null {
  return value === "" ? PASSWORD_REQUIRED_MESSAGE : null;
}

/** Judged after trimming: 1 to 100 characters. */
export function validateName(value: string): string | null {
  const name = value.trim();
  if (name === "") {
    return NAME_REQUIRED_MESSAGE;
  }
  return validateOptionalText(name, MAX_TEXT_LENGTH);
}

/** Sign-up: counts the characters as typed, spaces included. Never trimmed. */
export function validateNewPassword(value: string): string | null {
  return Array.from(value).length < MIN_PASSWORD_LENGTH
    ? PASSWORD_TOO_SHORT_MESSAGE
    : null;
}

/** Empty is fine (no photo). Anything else must be a web link of at most 500 characters. */
export function validatePhotoLink(value: string): string | null {
  return validateOptionalWebLink(value);
}

/** Empty is fine. Anything else must be a web link of at most 500 characters. */
export function validateLinkedInLink(value: string): string | null {
  return validateOptionalWebLink(value);
}

/** Judged after trimming. Empty is fine; otherwise at most `max` characters. */
export function validateOptionalText(value: string, max: number): string | null {
  return characterCount(value.trim()) > max ? tooLongMessage(max) : null;
}

/**
 * Judged after trimming. Empty is fine (the year is optional). Otherwise
 * exactly four digits, from 1950 to thisYear + 6.
 */
export function validateGraduationYear(value: string, thisYear: number): string | null {
  const year = value.trim();
  if (year === "") {
    return null;
  }
  if (!FOUR_DIGITS.test(year)) {
    return GRADUATION_YEAR_FORMAT_MESSAGE;
  }
  const lastYear = thisYear + GRADUATION_YEARS_AHEAD;
  const number = Number(year);
  return number < MIN_GRADUATION_YEAR || number > lastYear
    ? graduationYearRangeMessage(MIN_GRADUATION_YEAR, lastYear)
    : null;
}

/** Shared by the photo and LinkedIn links: one rule, one function. */
function validateOptionalWebLink(value: string): string | null {
  const link = value.trim();
  if (link === "") {
    return null;
  }
  if (!isWebLink(link)) {
    return WEB_LINK_INVALID_MESSAGE;
  }
  return validateOptionalText(link, MAX_LINK_LENGTH);
}
