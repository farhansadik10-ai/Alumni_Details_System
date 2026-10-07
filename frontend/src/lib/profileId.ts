// The id in a profile address (/directory/:id). Read before any request: a
// value the server would refuse is "not found" at once, with no request (AC18).

// The largest id the server accepts (a PostgreSQL integer, like the server's
// parseId). A bigger one is refused, like a non-number.
const MAX_ID = 2147483647;
// ASCII digits only: no sign, no dot, no spaces, no other scripts' digits.
const DIGITS_ONLY = /^\d+$/;

/** The id of the address, or null when it is not a whole number from 1 to MAX_ID. */
export function readProfileId(raw: string | undefined): number | null {
  if (raw === undefined || !DIGITS_ONLY.test(raw)) {
    return null;
  }
  const id = Number(raw);
  return id >= 1 && id <= MAX_ID ? id : null;
}
