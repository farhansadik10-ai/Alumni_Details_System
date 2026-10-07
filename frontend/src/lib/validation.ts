// Field validators for the forms. Each takes the text as typed and returns
// the message to show under the field, or null when the value is fine.

export const EMAIL_REQUIRED_MESSAGE = "Enter your email.";
export const EMAIL_INVALID_MESSAGE = "Enter a valid email, like name@example.com.";
export const PASSWORD_REQUIRED_MESSAGE = "Enter your password.";
export const NAME_REQUIRED_MESSAGE = "Enter your full name.";
export const PASSWORD_TOO_SHORT_MESSAGE = "Use at least 8 characters.";
export const PHOTO_LINK_INVALID_MESSAGE = "Enter a link that starts with https://";

export const MIN_PASSWORD_LENGTH = 8;

// The same length as the "User" email column (varchar(100)).
export const MAX_EMAIL_LENGTH = 100;

// Shown when a request failed in a way the user cannot fix by editing a field.
export const GENERAL_ERROR_MESSAGE = "Something went wrong. Try again.";

// Something, an @, something, a dot, something; no spaces and one @ only.
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WEB_LINK_START = /^https?:\/\//i;

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

/** Judged after trimming. */
export function validateName(value: string): string | null {
  return value.trim() === "" ? NAME_REQUIRED_MESSAGE : null;
}

/** Sign-up: counts the characters as typed, spaces included. Never trimmed. */
export function validateNewPassword(value: string): string | null {
  return Array.from(value).length < MIN_PASSWORD_LENGTH
    ? PASSWORD_TOO_SHORT_MESSAGE
    : null;
}

/** Empty is fine (no photo). Anything else must be a web link. */
export function validatePhotoLink(value: string): string | null {
  const link = value.trim();
  if (link === "") {
    return null;
  }
  return isWebLink(link) ? null : PHOTO_LINK_INVALID_MESSAGE;
}
