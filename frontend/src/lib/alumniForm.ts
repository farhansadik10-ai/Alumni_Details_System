// The rules of the "Alumni profile" form on My profile: the values as typed,
// how a saved profile fills the form, how the form is judged, and the body
// that a save sends.

import type { Alumni, CreateAlumniDTO } from "@alumni/shared";
import { presentText, sameText } from "./alumniDisplay";
import {
  MAX_BIO_LENGTH,
  MAX_TEXT_LENGTH,
  validateGraduationYear,
  validateLinkedInLink,
  validateOptionalText,
} from "./validation";

/** The form as typed: every field is text, except the mentoring checkbox. */
export interface AlumniFormValues {
  department: string;
  graduationYear: string;
  field: string;
  company: string;
  jobTitle: string;
  experience: string;
  linkedinUrl: string;
  bio: string;
  mentoring: boolean;
}

export type AlumniFormField = keyof AlumniFormValues;

/** One message per field that has an error; a field with no error is absent. */
export type AlumniFormErrors = Partial<Record<AlumniFormField, string>>;

/** Every key the API accepts, always sent, so an emptied field is cleared (AC25). */
export type AlumniFormBody = Required<CreateAlumniDTO>;

// The order of the fields on the screen (AC23): the first one with an error
// gets keyboard focus.
const FIELD_ORDER: readonly AlumniFormField[] = [
  "department",
  "graduationYear",
  "field",
  "company",
  "jobTitle",
  "experience",
  "linkedinUrl",
  "bio",
  "mentoring",
];

export const EMPTY_ALUMNI_FORM: AlumniFormValues = {
  department: "",
  graduationYear: "",
  field: "",
  company: "",
  jobTitle: "",
  experience: "",
  linkedinUrl: "",
  bio: "",
  mentoring: false,
};

/** The form for a saved profile; null (no profile yet) gives the empty form. */
export function alumniToForm(alumni: Alumni | null): AlumniFormValues {
  if (alumni === null) {
    return { ...EMPTY_ALUMNI_FORM };
  }
  return {
    department: alumni.department ?? "",
    graduationYear: alumni.graduation_year === null ? "" : String(alumni.graduation_year),
    field: alumni.field ?? "",
    company: alumni.current_company ?? "",
    jobTitle: alumni.job_title ?? "",
    experience: alumni.experience ?? "",
    linkedinUrl: alumni.linkedin_url ?? "",
    bio: alumni.bio ?? "",
    mentoring: alumni.mentorship_available,
  };
}

/** Judges the whole form. Every field is optional; an empty map means it can be sent. */
export function validateAlumniForm(values: AlumniFormValues, thisYear: number): AlumniFormErrors {
  const errors: AlumniFormErrors = {};
  const note = (field: AlumniFormField, message: string | null): void => {
    if (message !== null) {
      errors[field] = message;
    }
  };
  note("department", validateOptionalText(values.department, MAX_TEXT_LENGTH));
  note("graduationYear", validateGraduationYear(values.graduationYear, thisYear));
  note("field", validateOptionalText(values.field, MAX_TEXT_LENGTH));
  note("company", validateOptionalText(values.company, MAX_TEXT_LENGTH));
  note("jobTitle", validateOptionalText(values.jobTitle, MAX_TEXT_LENGTH));
  note("experience", validateOptionalText(values.experience, MAX_TEXT_LENGTH));
  note("linkedinUrl", validateLinkedInLink(values.linkedinUrl));
  note("bio", validateOptionalText(values.bio, MAX_BIO_LENGTH));
  return errors;
}

/** The first field with an error, in screen order, or null when there is none. */
export function firstInvalidField(errors: AlumniFormErrors): AlumniFormField | null {
  return FIELD_ORDER.find((field) => errors[field] !== undefined) ?? null;
}

/**
 * The body of a save. Text is trimmed and an empty field becomes null; the
 * year becomes a number. user_id is never sent: the server takes the user
 * from the login token.
 */
export function alumniFormToBody(values: AlumniFormValues): AlumniFormBody {
  return {
    department: presentText(values.department),
    graduation_year: yearOrNull(values.graduationYear),
    current_company: presentText(values.company),
    job_title: presentText(values.jobTitle),
    experience: presentText(values.experience),
    bio: presentText(values.bio),
    linkedin_url: presentText(values.linkedinUrl),
    mentorship_available: values.mentoring,
    field: presentText(values.field),
  };
}

/**
 * True when the two forms would save the same profile: text is compared
 * after trimming, the checkbox as it is. Discard changes stays off while the
 * form is the same as the saved one (UI-001); Save too, once a profile
 * exists (see canSaveAlumniForm).
 */
export function sameAlumniForm(a: AlumniFormValues, b: AlumniFormValues): boolean {
  return (
    a.mentoring === b.mentoring &&
    FIELD_ORDER.every((field) => field === "mentoring" || sameText(a[field], b[field]))
  );
}

/**
 * True when "Save profile" is on. With no profile yet (`isNew`) there is
 * always something to save, even an empty form: the save creates the profile
 * (AC24). With a saved profile, Save is on only when a value differs from it
 * (UI-001, R2-001). Discard changes follows sameAlumniForm alone.
 */
export function canSaveAlumniForm(
  isNew: boolean,
  values: AlumniFormValues,
  saved: AlumniFormValues,
): boolean {
  return isNew || !sameAlumniForm(values, saved);
}

/** A whole number, or null when empty. The form is judged before this runs. */
function yearOrNull(value: string): number | null {
  const text = value.trim();
  const year = Number(text);
  return text === "" || !Number.isInteger(year) ? null : year;
}
