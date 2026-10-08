// Words the app shows or reads out in more than one place, and every word of
// the directory, alumni profile and My profile pages (grouped by page below).
// Plain values only: no imports, no DOM (the Vite config reads config files).
// A function is used only for a word with a hole in it (a name, a count, a year).

// The loading message, for the screen and for a screen reader.
export const LOADING_TEXT = "Loading";

// ----- Shared words: alumni details on cards, profiles and forms -----------

export const NOT_GIVEN = "Not given";
export const NAME_NOT_GIVEN = "Name not given";
// Joins a job title and a company: "Software Engineer at Nordlys Systems".
export const JOB_LINE_JOINER = " at ";
export const CLASS_OF_PREFIX = "Class of";
export const OPEN_TO_MENTORING = "Open to mentoring";
export const RETRY_LABEL = "Try again";

// ----- Failure words: one pair for every load that can fail (pattern 9) -----

// No answer came: server down, no connection, or an answer that made no sense.
export const FAILURE_NO_ANSWER_TEXT =
  "We could not reach the server. Check your connection and try again.";
// The server answered with an error status. Its own text is never shown.
export const FAILURE_SERVER_TEXT =
  "Something went wrong on our side. Try again in a moment.";

// ----- Directory (/directory) ----------------------------------------------

export const DIRECTORY_HEADING = "Alumni directory";
export const DIRECTORY_SUB =
  "Find graduates by name, company or job title, and see who is open to mentoring.";

export const DIRECTORY_SEARCH_LABEL = "Search";
export const DIRECTORY_SEARCH_PLACEHOLDER = "Name, company or job title";
export const DIRECTORY_SEARCH_BUTTON = "Search";
export const DIRECTORY_DEPARTMENT_LABEL = "Department";
export const DIRECTORY_YEAR_LABEL = "Graduation year";
export const DIRECTORY_FIELD_LABEL = "Field";
export const DIRECTORY_MENTORING_LABEL = "Only show alumni open to mentoring";
export const DIRECTORY_ALL_DEPARTMENTS = "All departments";
export const DIRECTORY_ANY_YEAR = "Any year";
export const DIRECTORY_ANY_FIELD = "Any field";
export const DIRECTORY_CLEAR_BUTTON = "Clear search and filters";

// The phone "Filters" button: "Filters", or "Filters (2)" when two are active.
export const DIRECTORY_FILTERS_BUTTON = "Filters";
export function directoryFiltersButton(activeCount: number): string {
  return activeCount > 0
    ? `${DIRECTORY_FILTERS_BUTTON} (${activeCount})`
    : DIRECTORY_FILTERS_BUTTON;
}

// The card link. Seen as "View profile"; read out with the person's name.
export const DIRECTORY_VIEW_PROFILE = "View profile";
export function directoryViewProfileName(name: string): string {
  return `${DIRECTORY_VIEW_PROFILE} of ${name}`;
}

// The count line (a polite live region): "86 alumni", "1 alumnus".
export function directoryCount(total: number): string {
  return total === 1 ? "1 alumnus" : `${total} alumni`;
}
export const DIRECTORY_COUNT_LOADING = "Loading alumni";
export const DIRECTORY_COUNT_NONE = "No alumni found";
export const DIRECTORY_COUNT_FAILED = "Could not load alumni";

// Empty result, with search or filters set.
export const DIRECTORY_EMPTY_MATCH_HEADING = "No alumni match your search";
export const DIRECTORY_EMPTY_MATCH_TEXT =
  "Try a different name, or clear the search and filters.";
// Empty result, with nothing set: the directory itself is empty.
export const DIRECTORY_EMPTY_NONE_HEADING = "No alumni yet";
export const DIRECTORY_EMPTY_NONE_TEXT =
  "No alumni have joined yet. Check back later.";

// The list failed. The text is FAILURE_NO_ANSWER_TEXT or FAILURE_SERVER_TEXT.
export const DIRECTORY_ERROR_HEADING = "The directory could not be loaded";

// The filter options failed. The list still works.
export const DIRECTORY_FILTERS_ERROR_TEXT =
  "The filter options could not be loaded. You can still search.";

// ----- Alumni profile (/directory/:id) -------------------------------------

// The band heading and tab title before the profile has loaded.
export const PROFILE_HEADING = "Alumni profile";
export const PROFILE_BACK_LINK = "Back to directory";

// The contact links.
export function profileEmailLink(firstName: string): string {
  return `Email ${firstName}`;
}
export const PROFILE_LINKEDIN_LINK = "LinkedIn profile";
// Hidden on screen, read out after a link that opens a new tab.
export const OPENS_IN_NEW_TAB = "(opens in a new tab)";

export const PROFILE_ABOUT_HEADING = "About";
export const PROFILE_DETAILS_HEADING = "Details";

// The rows of the Details card.
export const PROFILE_DEPARTMENT_LABEL = "Department";
export const PROFILE_YEAR_LABEL = "Graduation year";
export const PROFILE_FIELD_LABEL = "Field";
export const PROFILE_COMPANY_LABEL = "Company";
export const PROFILE_JOB_TITLE_LABEL = "Job title";
export const PROFILE_EXPERIENCE_LABEL = "Experience";
export const PROFILE_EMAIL_LABEL = "Email";
export const PROFILE_MENTORING_LABEL = "Mentoring";
export const PROFILE_MENTORING_YES = "Open to students";
export const PROFILE_MENTORING_NO = "Not at the moment";

// No such profile: an id that is not a whole number, or a 404.
export const PROFILE_NOT_FOUND_HEADING = "This profile does not exist";
export const PROFILE_NOT_FOUND_TEXT =
  "The link may be wrong, or the profile was removed.";
export const PROFILE_NOT_FOUND_LINK = "Go to the directory";

// Any other failure. The text is FAILURE_NO_ANSWER_TEXT or FAILURE_SERVER_TEXT.
export const PROFILE_ERROR_HEADING = "This profile could not be loaded";

// ----- My profile (/profile) -----------------------------------------------

export const MY_PROFILE_HEADING = "My profile";
// The band sub line: "Tanvir Ahmed, tanvir.ahmed@example.com", only the parts that exist.
export function myProfileSub(name: string | null, email: string | null): string {
  return [name, email].filter((part) => part !== null && part !== "").join(", ");
}
export const MY_PROFILE_PUBLIC_LINK = "See my public profile";
export const OPTIONAL_MARK = "(optional)";

// The Alumni profile card.
export const ALUMNI_CARD_HEADING = "Alumni profile";
export const ALUMNI_CARD_INTRO = "This is what other people see in the directory.";
export const ALUMNI_DEPARTMENT_LABEL = "Department";
export const ALUMNI_YEAR_LABEL = "Graduation year";
export const ALUMNI_COMPANY_LABEL = "Current company";
export const ALUMNI_JOB_TITLE_LABEL = "Job title";
export const ALUMNI_FIELD_LABEL = "Field";
export const ALUMNI_EXPERIENCE_LABEL = "Experience";
export const ALUMNI_LINKEDIN_LABEL = "LinkedIn link";
export const ALUMNI_BIO_LABEL = "Bio";
export const ALUMNI_MENTORING_LABEL = "I am open to mentoring students";
export const ALUMNI_SAVE_BUTTON = "Save profile";
export const ALUMNI_DISCARD_BUTTON = "Discard changes";
export const ALUMNI_SAVED_TOAST = "Profile saved";
export const ALUMNI_LOAD_ERROR_HEADING = "Your alumni profile could not be loaded";

// The Account card.
export const ACCOUNT_CARD_HEADING = "Account";
export const ACCOUNT_ROLE_LABEL = "Role";
export const ACCOUNT_NAME_LABEL = "Full name";
export const ACCOUNT_EMAIL_LABEL = "Email";
export const ACCOUNT_EMAIL_HELP = "Ask an admin to change your email.";
export const ACCOUNT_PHOTO_LABEL = "Photo link";
export const ACCOUNT_PHOTO_PLACEHOLDER = "https://";
export const ACCOUNT_PHOTO_HELP = "Without a photo, your initials are shown.";
export const ACCOUNT_SAVE_BUTTON = "Save account";
export const ACCOUNT_LOG_OUT_BUTTON = "Log out";
export const ACCOUNT_SAVED_TOAST = "Account saved";
export const ACCOUNT_LOAD_ERROR_HEADING = "Your account could not be loaded";
// 403 or 404 on saving the Account card: the account, not a profile, is gone.
export const ACCOUNT_SAVE_FAILED_GONE =
  "Your account can no longer be saved. It may have been removed, or you may no longer have access.";

// A failed save, shown in the card that failed. What the user typed is kept.
export const SAVE_FAILED_NO_ANSWER =
  "Your changes were not saved. We could not reach the server. Check your connection and try again.";
export const SAVE_FAILED_SERVER =
  "Your changes were not saved. Something went wrong on our side. Try again.";
// 409 on create: the profile already existed and has been loaded into the form.
export const SAVE_FAILED_CONFLICT =
  "You already had a profile, so we loaded it. Check the details and save again.";
// 403 or 404 on edit. Its button reloads the profile.
export const SAVE_FAILED_GONE =
  "This profile can no longer be saved. It may have been removed, or you may no longer have access.";
export const SAVE_FAILED_GONE_RETRY = RETRY_LABEL;
