// The "mailto:" link of a stored email. The server takes any text as an
// email, so a stored value can carry "?cc=" or "&body=" and turn the link
// into a mail draft its owner wrote (CORR-001). Only a plain address becomes
// a link; anything else is shown as text by the page.

import { MAX_EMAIL_LENGTH, validateEmail } from "./validation";

// A plain address: letters, digits and . _ + - before the @; a domain of
// letters, digits and hyphens with at least one dot. No ? & # % , ; : / or
// spaces, so nothing can add a header or a second address to the link.
const PLAIN_ADDRESS = /^[A-Za-z0-9._+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/;

/**
 * The href for an email link, or null when the email is not a plain address
 * (then the page shows it as text). The address is trimmed and encoded.
 */
export function mailtoHref(email: string | null | undefined): string | null {
  if (email === null || email === undefined) {
    return null;
  }
  const address = email.trim();
  if (
    address.length > MAX_EMAIL_LENGTH ||
    validateEmail(address) !== null ||
    !PLAIN_ADDRESS.test(address)
  ) {
    return null;
  }
  const at = address.indexOf("@");
  const local = address.slice(0, at);
  const domain = address.slice(at + 1);
  return `mailto:${encodeURIComponent(local)}@${encodeURIComponent(domain)}`;
}
