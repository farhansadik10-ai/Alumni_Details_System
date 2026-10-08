// The lines a card, the profile page and the profile band show for one person
// (AC2, AC15). A value that is missing or only spaces is left out, never shown
// as blank or "null".

import {
  CLASS_OF_PREFIX,
  JOB_LINE_JOINER,
  NAME_NOT_GIVEN,
  NOT_GIVEN,
} from "../config/text";

/**
 * The trimmed text, or null when there is none. The one copy of this rule:
 * tags, band lines, Details rows, the header name and the bodies the forms
 * send all use it (AC2, AC36). A field left out (undefined) counts as none.
 */
export function presentText(text: string | null | undefined): string | null {
  if (text === null || text === undefined) {
    return null;
  }
  const trimmed = text.trim();
  return trimmed === "" ? null : trimmed;
}

/**
 * True when two typed values would be sent the same: spaces around the text
 * do not count, and empty is the same as only spaces.
 */
export function sameText(a: string, b: string): boolean {
  return presentText(a) === presentText(b);
}

/** The name to show, or "Name not given". */
export function displayName(name: string | null): string {
  return presentText(name) ?? NAME_NOT_GIVEN;
}

/** "Title at Company", only the part that exists, or null when neither does. */
export function jobLine(title: string | null, company: string | null): string | null {
  const shownTitle = presentText(title);
  const shownCompany = presentText(company);
  if (shownTitle !== null && shownCompany !== null) {
    return `${shownTitle}${JOB_LINE_JOINER}${shownCompany}`;
  }
  return shownTitle ?? shownCompany;
}

/** "Class of 2019", or null when there is no year. */
export function classLabel(year: number | null): string | null {
  return year === null ? null : `${CLASS_OF_PREFIX} ${year}`;
}

/** The text of a Details row, or "Not given". */
export function orNotGiven(text: string | null): string {
  return presentText(text) ?? NOT_GIVEN;
}

/** The first word of the name, for "Email Nadia"; null when there is no name. */
export function firstName(name: string | null): string | null {
  const shown = presentText(name);
  return shown === null ? null : shown.split(/\s+/)[0];
}
