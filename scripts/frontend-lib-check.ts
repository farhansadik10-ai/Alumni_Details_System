// Checks the pure functions in frontend/src/lib/ without a browser.
// Run from the repo root:  npx tsx scripts/frontend-lib-check.ts
// Exit code 0 when every case passes, 1 when any fails.
//
// The cases are written from the spec (REQ-fs-004: AC42, AC46, AC53 and the
// TASK-003 list; REQ-fs-005: choices 13 to 17, AC2, AC5, AC7, AC15, AC17,
// AC18, AC25, AC26, TASK-015), not from the code. The expected messages are typed out here
// on purpose: importing the constants would compare the code with itself.
//
// It imports only from frontend/src/lib/. It reads no file and calls no API.

import type { Alumni } from "@alumni/shared";
import {
  alumniFormToBody,
  alumniToForm,
  EMPTY_ALUMNI_FORM,
  firstInvalidField,
  validateAlumniForm,
} from "../frontend/src/lib/alumniForm.ts";
import {
  classLabel,
  displayName,
  firstName,
  jobLine,
  orNotGiven,
  presentText,
} from "../frontend/src/lib/alumniDisplay.ts";
import {
  activeFilterCount,
  DEFAULT_DIRECTORY_QUERY,
  hasCriteria,
  lastPage,
  readDirectoryQuery,
  toListParams,
  writeDirectoryQuery,
} from "../frontend/src/lib/directoryQuery.ts";
import { directoryReturnState, readDirectorySearch } from "../frontend/src/lib/directoryReturn.ts";
import { initialsOf } from "../frontend/src/lib/initials.ts";
import { loadFailureText } from "../frontend/src/lib/loadFailure.ts";
import { mailtoHref } from "../frontend/src/lib/mailtoLink.ts";
import { pageRange } from "../frontend/src/lib/pageRange.ts";
import { readProfileId } from "../frontend/src/lib/profileId.ts";
import { readReturnAddress } from "../frontend/src/lib/returnAddress.ts";
import { isAdmin, isExpired, isLiveSession, readToken } from "../frontend/src/lib/token.ts";
import {
  validateEmail,
  validateGraduationYear,
  validateLinkedInLink,
  validateLoginPassword,
  validateName,
  validateNewPassword,
  validateOptionalText,
  validatePhotoLink,
} from "../frontend/src/lib/validation.ts";

let passed = 0;
let failed = 0;

function check(name: string, got: unknown, want: unknown): void {
  const gotText = JSON.stringify(got);
  const wantText = JSON.stringify(want);
  if (gotText === wantText) {
    passed += 1;
    return;
  }
  failed += 1;
  console.log(`FAIL  ${name}\n      got  ${gotText}\n      want ${wantText}`);
}

// ---- Validators -----------------------------------------------------------

const EMAIL_EMPTY = "Enter your email.";
const EMAIL_SHAPE = "Enter a valid email, like name@example.com.";
const PASSWORD_EMPTY = "Enter your password.";
const NAME_EMPTY = "Enter your full name.";
const PASSWORD_SHORT = "Use at least 8 characters.";
const PHOTO_LINK = "Enter a link that starts with https://";

check("email: empty", validateEmail(""), EMAIL_EMPTY);
check("email: only spaces", validateEmail("   "), EMAIL_EMPTY);
check("email: a@b.co passes", validateEmail("a@b.co"), null);
check("email: spaces around a good one pass", validateEmail("  a@b.co  "), null);
check("email: capital letters pass", validateEmail("Nadia.Rahman@Example.com"), null);
check("email: a@b has no dot part", validateEmail("a@b"), EMAIL_SHAPE);
check("email: @b.co has no name", validateEmail("@b.co"), EMAIL_SHAPE);
check("email: a b@c.de has a space", validateEmail("a b@c.de"), EMAIL_SHAPE);
check("email: no @ at all", validateEmail("nadia.example.com"), EMAIL_SHAPE);
check("email: two @", validateEmail("a@b@c.de"), EMAIL_SHAPE);
check("email: ends with a dot", validateEmail("a@b."), EMAIL_SHAPE);

check("login password: empty", validateLoginPassword(""), PASSWORD_EMPTY);
check("login password: one letter passes", validateLoginPassword("x"), null);
check("login password: one space passes (never trimmed)", validateLoginPassword(" "), null);

check("name: empty", validateName(""), NAME_EMPTY);
check("name: only spaces", validateName("    "), NAME_EMPTY);
check("name: spaces around it pass", validateName("  Nadia Rahman  "), null);
check("name: non-ASCII letters pass", validateName("Åsa Öberg"), null);

check("new password: empty", validateNewPassword(""), PASSWORD_SHORT);
check("new password: 7 characters", validateNewPassword("abcdefg"), PASSWORD_SHORT);
check("new password: 8 characters pass", validateNewPassword("abcdefgh"), null);
check("new password: 8 spaces pass (no trim)", validateNewPassword("        "), null);
check("new password: 7 letters and a space pass", validateNewPassword("abcdefg "), null);
check("new password: 20 characters pass", validateNewPassword("abcdefghijklmnopqrst"), null);

check("photo link: empty is fine", validatePhotoLink(""), null);
check("photo link: https passes", validatePhotoLink("https://x.y/z.png"), null);
check("photo link: http passes", validatePhotoLink("http://x.y/z.png"), null);
check("photo link: ftp", validatePhotoLink("ftp://x"), PHOTO_LINK);
check("photo link: javascript", validatePhotoLink("javascript:alert(1)"), PHOTO_LINK);
check("photo link: www without https", validatePhotoLink("www.x.com"), PHOTO_LINK);
check("photo link: https later in the text", validatePhotoLink("x https://x.y/z.png"), PHOTO_LINK);
check(
  "photo link: javascript with https inside",
  validatePhotoLink("javascript:alert('https://x.y')"),
  PHOTO_LINK,
);
check("photo link: data link", validatePhotoLink("data:image/png;base64,AAAA"), PHOTO_LINK);

// ---- REQ-fs-005: My profile rules (spec choices 13 to 17, AC25, AC26) -------

// A fixed "this year", so the cases do not change with the calendar.
const THIS_YEAR = 2026;
const YEAR_SHAPE = "Enter a year with four digits, like 2019.";
const YEAR_RANGE = "Enter a year from 1950 to 2032.";
const TOO_LONG_100 = "Use 100 characters or fewer.";
const TOO_LONG_2000 = "Use 2000 characters or fewer.";
const TOO_LONG_500 = "Use 500 characters or fewer.";
const WEB_LINK = "Enter a link that starts with https://";

// "https://x.y/" is 12 characters; the padding makes exactly 500 and 501.
const LINK_500 = `https://x.y/${"a".repeat(488)}`;
const LINK_501 = `https://x.y/${"a".repeat(489)}`;
// An emoji is two UTF-16 units but one character.
const EMOJI_100 = "\u{1F393}".repeat(100);

check("year: empty is fine (optional)", validateGraduationYear("", THIS_YEAR), null);
check("year: only spaces is fine", validateGraduationYear("   ", THIS_YEAR), null);
check("year: 1949 is too early", validateGraduationYear("1949", THIS_YEAR), YEAR_RANGE);
check("year: 1950 passes", validateGraduationYear("1950", THIS_YEAR), null);
check("year: this year passes", validateGraduationYear("2026", THIS_YEAR), null);
check("year: this year + 6 passes", validateGraduationYear("2032", THIS_YEAR), null);
check("year: this year + 7 is too late", validateGraduationYear("2033", THIS_YEAR), YEAR_RANGE);
check("year: abc", validateGraduationYear("abc", THIS_YEAR), YEAR_SHAPE);
check("year: 20199 has five digits", validateGraduationYear("20199", THIS_YEAR), YEAR_SHAPE);
check("year: 199 has three digits", validateGraduationYear("199", THIS_YEAR), YEAR_SHAPE);
check("year: ' 2019 ' is trimmed and passes", validateGraduationYear(" 2019 ", THIS_YEAR), null);
check("year: 2019.0 is not four digits", validateGraduationYear("2019.0", THIS_YEAR), YEAR_SHAPE);
check("year: -2019", validateGraduationYear("-2019", THIS_YEAR), YEAR_SHAPE);
check("year: Arabic-Indic digits are not accepted", validateGraduationYear("٢٠١٩", THIS_YEAR), YEAR_SHAPE);

check("text: empty is fine", validateOptionalText("", 100), null);
check("text: 100 characters pass", validateOptionalText("a".repeat(100), 100), null);
check("text: 101 characters", validateOptionalText("a".repeat(101), 100), TOO_LONG_100);
check("text: 100 characters with spaces around pass", validateOptionalText(`  ${"a".repeat(100)}  `, 100), null);
check("text: 100 emoji count as 100", validateOptionalText(EMOJI_100, 100), null);
check("text: 101 emoji", validateOptionalText(`${EMOJI_100}\u{1F393}`, 100), TOO_LONG_100);
check("bio: 2000 characters pass", validateOptionalText("b".repeat(2000), 2000), null);
check("bio: 2001 characters", validateOptionalText("b".repeat(2001), 2000), TOO_LONG_2000);

check("linkedin: the test link really is 500 long", LINK_500.length, 500);
check("linkedin: empty is fine", validateLinkedInLink(""), null);
check("linkedin: ftp://x", validateLinkedInLink("ftp://x"), WEB_LINK);
check("linkedin: https://x.y passes", validateLinkedInLink("https://x.y"), null);
check("linkedin: http passes", validateLinkedInLink("http://linkedin.com/in/x"), null);
check("linkedin: www without https", validateLinkedInLink("www.linkedin.com/in/x"), WEB_LINK);
check("linkedin: javascript", validateLinkedInLink("javascript:alert(1)"), WEB_LINK);
check("linkedin: 500 characters pass", validateLinkedInLink(LINK_500), null);
check("linkedin: 501 characters", validateLinkedInLink(LINK_501), TOO_LONG_500);
check("photo link: 500 characters pass", validatePhotoLink(LINK_500), null);
check("photo link: 501 characters", validatePhotoLink(LINK_501), TOO_LONG_500);

check("name: 100 characters pass", validateName("n".repeat(100)), null);
check("name: 101 characters", validateName("n".repeat(101)), TOO_LONG_100);
check("name: 100 characters with spaces around pass", validateName(`   ${"n".repeat(100)}   `), null);

// The whole alumni form.
const NINE_KEYS = [
  "bio",
  "current_company",
  "department",
  "experience",
  "field",
  "graduation_year",
  "job_title",
  "linkedin_url",
  "mentorship_available",
];
const ALL_NULL_BODY = {
  department: null,
  graduation_year: null,
  current_company: null,
  job_title: null,
  experience: null,
  bio: null,
  linkedin_url: null,
  mentorship_available: false,
  field: null,
};

const emptyBody = alumniFormToBody(EMPTY_ALUMNI_FORM);
check("form body: empty form has the nine keys", Object.keys(emptyBody).sort(), NINE_KEYS);
check("form body: empty form is all null and false", emptyBody, ALL_NULL_BODY);
check("form body: no user_id", "user_id" in emptyBody, false);
check(
  "form body: only spaces become null",
  alumniFormToBody({ ...EMPTY_ALUMNI_FORM, company: "   ", bio: "  ", graduationYear: "  " }),
  ALL_NULL_BODY,
);

const typed = {
  department: "  Computer Science ",
  graduationYear: " 2019 ",
  field: "Software",
  company: " Acme ",
  jobTitle: "Engineer",
  experience: "5 years",
  linkedinUrl: " https://linkedin.com/in/nadia ",
  bio: "  Hello.  ",
  mentoring: true,
};
check("form body: text trimmed, year a number", alumniFormToBody(typed), {
  department: "Computer Science",
  graduation_year: 2019,
  current_company: "Acme",
  job_title: "Engineer",
  experience: "5 years",
  bio: "Hello.",
  linkedin_url: "https://linkedin.com/in/nadia",
  mentorship_available: true,
  field: "Software",
});
check("form body: a cleared company is sent as null (AC25)", alumniFormToBody({ ...typed, company: "" }).current_company, null);

const savedProfile: Alumni = {
  id: 4,
  user_id: 12,
  graduation_year: 2019,
  department: "Computer Science",
  current_company: null,
  job_title: "Engineer",
  experience: null,
  bio: "Hello.",
  linkedin_url: "https://linkedin.com/in/nadia",
  mentorship_available: true,
  field: null,
  updated_at: "2026-10-01T10:00:00.000Z",
  name: "Nadia Rahman",
  email: "nadia@example.com",
  photo_url: null,
};
check("form: no profile gives the empty form", alumniToForm(null), {
  department: "",
  graduationYear: "",
  field: "",
  company: "",
  jobTitle: "",
  experience: "",
  linkedinUrl: "",
  bio: "",
  mentoring: false,
});
check("form: a saved profile fills the form, null becomes empty", alumniToForm(savedProfile), {
  department: "Computer Science",
  graduationYear: "2019",
  field: "",
  company: "",
  jobTitle: "Engineer",
  experience: "",
  linkedinUrl: "https://linkedin.com/in/nadia",
  bio: "Hello.",
  mentoring: true,
});
check("form: profile to form to body round trip", alumniFormToBody(alumniToForm(savedProfile)), {
  department: "Computer Science",
  graduation_year: 2019,
  current_company: null,
  job_title: "Engineer",
  experience: null,
  bio: "Hello.",
  linkedin_url: "https://linkedin.com/in/nadia",
  mentorship_available: true,
  field: null,
});
check("form: no year on the profile stays empty", alumniToForm({ ...savedProfile, graduation_year: null }).graduationYear, "");

check("form errors: an empty form is accepted (choice 16)", validateAlumniForm(EMPTY_ALUMNI_FORM, THIS_YEAR), {});
check("form errors: the filled form is accepted", validateAlumniForm(typed, THIS_YEAR), {});
const badForm = {
  ...EMPTY_ALUMNI_FORM,
  bio: "b".repeat(2001),
  linkedinUrl: "ftp://x",
  company: "c".repeat(101),
  graduationYear: "1949",
};
const badErrors = validateAlumniForm(badForm, THIS_YEAR);
check("form errors: one message per bad field", badErrors, {
  graduationYear: YEAR_RANGE,
  company: TOO_LONG_100,
  linkedinUrl: WEB_LINK,
  bio: TOO_LONG_2000,
});
check("form errors: first bad field in screen order", firstInvalidField(badErrors), "graduationYear");
check("form errors: field over 100", validateAlumniForm({ ...EMPTY_ALUMNI_FORM, field: "f".repeat(101) }, THIS_YEAR), { field: TOO_LONG_100 });
check("form errors: department over 100", validateAlumniForm({ ...EMPTY_ALUMNI_FORM, department: "d".repeat(101) }, THIS_YEAR), { department: TOO_LONG_100 });
check("form errors: job title over 100", validateAlumniForm({ ...EMPTY_ALUMNI_FORM, jobTitle: "j".repeat(101) }, THIS_YEAR), { jobTitle: TOO_LONG_100 });
check("form errors: experience over 100", validateAlumniForm({ ...EMPTY_ALUMNI_FORM, experience: "e".repeat(101) }, THIS_YEAR), { experience: TOO_LONG_100 });
check("first invalid: none", firstInvalidField({}), null);
check("first invalid: only bio", firstInvalidField({ bio: TOO_LONG_2000 }), "bio");
check("first invalid: department wins over bio", firstInvalidField({ bio: TOO_LONG_2000, department: TOO_LONG_100 }), "department");
check("first invalid: field before company", firstInvalidField({ company: TOO_LONG_100, field: TOO_LONG_100 }), "field");

// ---- Token reader ---------------------------------------------------------

function base64Url(text: string): string {
  return Buffer.from(text, "utf8").toString("base64url");
}

const HEADER = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
const SIGNATURE = "not-checked-by-the-frontend";

function tokenWith(payload: unknown): string {
  return `${HEADER}.${base64Url(JSON.stringify(payload))}.${SIGNATURE}`;
}

const EXP_SECONDS = 2_000_000_000;
const EXP_MS = 2_000_000_000_000;

const valid = readToken(tokenWith({ sub: 12, role: "alumni", iat: 1, exp: EXP_SECONDS }));
check("token: valid", valid, { userId: 12, role: "alumni", expiresAt: EXP_MS });
check("token: student role", readToken(tokenWith({ sub: 1, role: "student", exp: EXP_SECONDS }))?.role, "student");
check("token: admin role", readToken(tokenWith({ sub: 1, role: "admin", exp: EXP_SECONDS }))?.role, "admin");
if (valid !== null) {
  check("token: not expired one ms before", isExpired(valid, EXP_MS - 1), false);
  check("token: expired at the expiry moment", isExpired(valid, EXP_MS), true);
  check("token: expired after", isExpired(valid, EXP_MS + 1), true);
}

const old = readToken(tokenWith({ sub: 12, role: "student", exp: 1000 }));
check("token: an expired token is still read", old, { userId: 12, role: "student", expiresAt: 1_000_000 });
if (old !== null) {
  check("token: expired token is expired now", isExpired(old, Date.now()), true);
}

const noExp = readToken(tokenWith({ sub: 12, role: "admin" }));
check("token: no exp", noExp, { userId: 12, role: "admin", expiresAt: null });
if (noExp !== null) {
  check("token: no exp never expires here", isExpired(noExp, Date.now()), false);
}

check(
  'token: role "" is logged in with no role (G42)',
  readToken(tokenWith({ sub: 12, role: "", exp: EXP_SECONDS })),
  { userId: 12, role: null, expiresAt: EXP_MS },
);
check(
  'token: role "teacher" is logged in with no role',
  readToken(tokenWith({ sub: 12, role: "teacher", exp: EXP_SECONDS })),
  { userId: 12, role: null, expiresAt: EXP_MS },
);
check(
  'token: role "Admin" is not admin',
  readToken(tokenWith({ sub: 12, role: "Admin", exp: EXP_SECONDS }))?.role,
  null,
);
check(
  "token: no role at all",
  readToken(tokenWith({ sub: 12, exp: EXP_SECONDS })),
  { userId: 12, role: null, expiresAt: EXP_MS },
);

check('token: sub "12" is refused', readToken(tokenWith({ sub: "12", role: "admin", exp: EXP_SECONDS })), null);
check("token: sub 1.5 is refused", readToken(tokenWith({ sub: 1.5, role: "admin", exp: EXP_SECONDS })), null);
check("token: no sub is refused", readToken(tokenWith({ role: "admin", exp: EXP_SECONDS })), null);
check("token: sub null is refused", readToken(tokenWith({ sub: null, role: "admin" })), null);
check('token: exp "soon" is refused', readToken(tokenWith({ sub: 12, role: "admin", exp: "soon" })), null);

const goodPayload = base64Url(JSON.stringify({ sub: 12, role: "admin", exp: EXP_SECONDS }));
check("token: two parts", readToken(`${HEADER}.${goodPayload}`), null);
check("token: four parts", readToken(`${HEADER}.${goodPayload}.${SIGNATURE}.x`), null);
check("token: empty text", readToken(""), null);
check("token: plain word", readToken("hello"), null);
check("token: payload is not base64", readToken(`${HEADER}.!!!not base64!!!.${SIGNATURE}`), null);
check("token: payload is not JSON", readToken(`${HEADER}.${base64Url("hello")}.${SIGNATURE}`), null);
check("token: payload is a list", readToken(tokenWith([12])), null);
check("token: payload is null", readToken(tokenWith(null)), null);
check("token: payload is a number", readToken(tokenWith(12)), null);
check("token: empty payload part", readToken(`${HEADER}..${SIGNATURE}`), null);

// Non-ASCII letters make bytes above 127 and, here, the base64url letters
// "-" or "_" that plain base64 does not have.
const nonAsciiToken = tokenWith({ sub: 7, role: "alumni", name: "Åsa Öberg-Nyström ÿÿÿ ???>>>", exp: EXP_SECONDS });
check("token: the test token really uses - or _", /[-_]/.test(nonAsciiToken.split(".")[1]), true);
check(
  "token: non-ASCII name in the payload",
  readToken(nonAsciiToken),
  { userId: 7, role: "alumni", expiresAt: EXP_MS },
);

// ---- Initials -------------------------------------------------------------

check('initials: "Nadia Rahman"', initialsOf("Nadia Rahman"), "NR");
check('initials: "  nadia  "', initialsOf("  nadia  "), "N");
check('initials: "Anna Maria Berg"', initialsOf("Anna Maria Berg"), "AB");
check('initials: ""', initialsOf(""), "");
check("initials: null", initialsOf(null), "");
check("initials: only spaces", initialsOf("   "), "");
check("initials: lower case, many spaces", initialsOf("nadia    rahman"), "NR");
check("initials: non-ASCII first letter", initialsOf("åsa öberg"), "ÅÖ");

// ---- Live session and admin ---------------------------------------------

const liveSession = { userId: 1, role: "admin" as const, expiresAt: 5000 };
check("live: before the expiry", isLiveSession(liveSession, 4999), true);
check("live: at the expiry moment", isLiveSession(liveSession, 5000), false);
check("live: after the expiry", isLiveSession(liveSession, 9000), false);
check("live: no expiry", isLiveSession({ userId: 1, role: null, expiresAt: null }, 9e15), true);
check("live: no session", isLiveSession(null, 0), false);
check("admin: role admin", isAdmin({ userId: 1, role: "admin", expiresAt: null }), true);
check("admin: role alumni", isAdmin({ userId: 1, role: "alumni", expiresAt: null }), false);
check("admin: role student", isAdmin({ userId: 1, role: "student", expiresAt: null }), false);
check("admin: unknown role (null)", isAdmin({ userId: 1, role: null, expiresAt: null }), false);
check("admin: no session", isAdmin(null), false);

// ---- Return address ------------------------------------------------------

check("return: normal address", readReturnAddress({ from: { pathname: "/feed", search: "?x=1", hash: "#a" } }), { pathname: "/feed", search: "?x=1", hash: "#a" });
check("return: pathname only", readReturnAddress({ from: { pathname: "/feed" } }), { pathname: "/feed", search: "", hash: "" });
check("return: // is refused", readReturnAddress({ from: { pathname: "//x" } }), null);
check("return: slash-backslash is refused", readReturnAddress({ from: { pathname: "/\\x" } }), null);
check("return: no pathname", readReturnAddress({ from: { search: "?x=1" } }), null);
check("return: pathname not text", readReturnAddress({ from: { pathname: 5 } }), null);
check("return: pathname without a leading /", readReturnAddress({ from: { pathname: "feed" } }), null);
check("return: full URL is refused", readReturnAddress({ from: { pathname: "https://evil.example/" } }), null);
check("return: state is null", readReturnAddress(null), null);
check("return: state is a string", readReturnAddress("/feed"), null);
check("return: state without from", readReturnAddress({}), null);
check("return: from is a string", readReturnAddress({ from: "/feed" }), null);
check("return: from is null", readReturnAddress({ from: null }), null);
check("return: search not text", readReturnAddress({ from: { pathname: "/feed", search: 3, hash: "#a" } }), { pathname: "/feed", search: "", hash: "#a" });
check("return: hash not text", readReturnAddress({ from: { pathname: "/feed", search: "?x=1", hash: {} } }), { pathname: "/feed", search: "?x=1", hash: "" });

// ---- Page range -----------------------------------------------------------

check("pageRange(1, 3)", pageRange(1, 3), [1, 2, 3]);
check("pageRange(1, 25)", pageRange(1, 25), [1, 2, "gap", 25]);
check("pageRange(4, 25)", pageRange(4, 25), [1, 2, 3, 4, 5, "gap", 25]);
check("pageRange(12, 25)", pageRange(12, 25), [1, "gap", 11, 12, 13, "gap", 25]);
check("pageRange: 7 pages are all shown", pageRange(4, 7), [1, 2, 3, 4, 5, 6, 7]);
check("pageRange: 0 pages", pageRange(1, 0), []);
check("pageRange: negative pages", pageRange(1, -3), []);
check("pageRange: NaN pages", pageRange(1, NaN), []);
check("pageRange: NaN page counts as 1", pageRange(NaN, 25), [1, 2, "gap", 25]);
check("pageRange: page above the last counts as the last", pageRange(99, 25), [1, "gap", 24, 25]);
check("pageRange: page below 1 counts as 1", pageRange(-5, 25), [1, 2, "gap", 25]);

// ---- REQ-fs-005: directory address (AC5, AC7, ADV-004) ---------------------

// Typed out here, not taken from the code. Key order matters: the check
// compares JSON text.
const NO_QUERY = {
  q: "",
  department: "",
  graduationYear: null as number | null,
  field: "",
  mentoring: false,
  page: 1,
};
function queryWith(over: Partial<typeof NO_QUERY>): typeof NO_QUERY {
  return { ...NO_QUERY, ...over };
}
function readText(search: string): unknown {
  return readDirectoryQuery(new URLSearchParams(search));
}

check("dir read: the default query is nothing set", DEFAULT_DIRECTORY_QUERY, NO_QUERY);
check("dir read: no address", readText(""), NO_QUERY);
check("dir read: every key empty", readText("q=&department=&graduation_year=&field=&mentoring=&page="), NO_QUERY);
check("dir read: page=2", readText("page=2").page, 2);
check("dir read: page=0 is 1", readText("page=0").page, 1);
check("dir read: page=-1 is 1", readText("page=-1").page, 1);
check("dir read: page=abc is 1", readText("page=abc").page, 1);
check("dir read: page=1.5 is 1", readText("page=1.5").page, 1);
check("dir read: page=007 is 1 (leading zero)", readText("page=007").page, 1);
check("dir read: page=9999999 is kept", readText("page=9999999").page, 9999999);
check("dir read: page=99999999 is 1 (too big)", readText("page=99999999").page, 1);
check("dir read: page with spaces is 1", readText("page=%202").page, 1);
check("dir read: mentoring=true", readText("mentoring=true").mentoring, true);
check("dir read: mentoring=yes is ignored", readText("mentoring=yes").mentoring, false);
check("dir read: mentoring=TRUE is ignored", readText("mentoring=TRUE").mentoring, false);
check("dir read: mentoring= is ignored", readText("mentoring=").mentoring, false);
check("dir read: graduation_year=2019", readText("graduation_year=2019").graduationYear, 2019);
check("dir read: graduation_year=abc is ignored", readText("graduation_year=abc").graduationYear, null);
check("dir read: graduation_year=20199 is ignored", readText("graduation_year=20199").graduationYear, null);
check("dir read: graduation_year=201 is ignored", readText("graduation_year=201").graduationYear, null);
check("dir read: repeated q counts as absent", readText("q=ab&q=cd").q, "");
check("dir read: repeated page counts as absent", readText("page=2&page=3").page, 1);
check("dir read: repeated department counts as absent", readText("department=CS&department=EE").department, "");
check("dir read: q is trimmed", readText("q=%20%20nadia%20").q, "nadia");
check("dir read: q tabs are trimmed too", readText("q=%09nadia%0A").q, "nadia");
check("dir read: q of only spaces is no search", readText("q=%20%20%20").q, "");
check("dir read: a long q is kept (any length)", readText(`q=${"a".repeat(300)}`).q, "a".repeat(300));
check("dir read: department loses outer spaces", readText("department=%20Computer%20Science%20").department, "Computer Science");
check("dir read: department keeps a tab (btrim strips spaces only)", readText("department=%09CS%20").department, "\tCS");
check("dir read: field keeps a trailing tab", readText("field=%20AI%09").field, "AI\t");
check("dir read: a long field is kept", readText(`field=${"f".repeat(300)}`).field, "f".repeat(300));
check(
  "dir read: everything set",
  readText("q=nadia&department=CS&graduation_year=2019&field=AI&mentoring=true&page=3"),
  { q: "nadia", department: "CS", graduationYear: 2019, field: "AI", mentoring: true, page: 3 },
);

const FULL_QUERY = { q: "nadia rahman", department: "Computer Science", graduationYear: 2019, field: "AI & ML", mentoring: true, page: 3 };
check("dir write: nothing set is an empty address", writeDirectoryQuery(NO_QUERY).toString(), "");
check("dir write: page 1 is left out", writeDirectoryQuery(queryWith({ q: "x", page: 1 })).toString(), "q=x");
check("dir write: page 2 is written", writeDirectoryQuery(queryWith({ page: 2 })).toString(), "page=2");
check("dir write: mentoring off is left out", writeDirectoryQuery(queryWith({ field: "AI" })).toString(), "field=AI");
check(
  "dir write: everything set, in a fixed order",
  writeDirectoryQuery(FULL_QUERY).toString(),
  "q=nadia+rahman&department=Computer+Science&graduation_year=2019&field=AI+%26+ML&mentoring=true&page=3",
);
check(
  "dir write: the same query gives the same text",
  writeDirectoryQuery({ ...FULL_QUERY }).toString(),
  writeDirectoryQuery(FULL_QUERY).toString(),
);
check("dir round trip: everything set", readDirectoryQuery(writeDirectoryQuery(FULL_QUERY)), FULL_QUERY);
check("dir round trip: nothing set", readDirectoryQuery(writeDirectoryQuery(NO_QUERY)), NO_QUERY);
check("dir round trip: department with a tab", readDirectoryQuery(writeDirectoryQuery(queryWith({ department: "\tCS" }))), queryWith({ department: "\tCS" }));
check("dir round trip: page 2 only", readDirectoryQuery(writeDirectoryQuery(queryWith({ page: 2 }))), queryWith({ page: 2 }));

check("dir params: nothing set sends nothing", toListParams(NO_QUERY), {});
check("dir params: everything set", toListParams(FULL_QUERY), {
  q: "nadia rahman",
  department: "Computer Science",
  graduation_year: 2019,
  field: "AI & ML",
  mentoring: "true",
  page: 3,
});
check("dir params: page 1 is not sent", toListParams(queryWith({ q: "x" })), { q: "x" });
check("dir params: no limit", "limit" in toListParams(FULL_QUERY), false);

check("dir filters: none", activeFilterCount(NO_QUERY), 0);
check("dir filters: search text is not a filter", activeFilterCount(queryWith({ q: "x", page: 4 })), 0);
check("dir filters: department and mentoring", activeFilterCount(queryWith({ department: "CS", mentoring: true })), 2);
check("dir filters: all four", activeFilterCount(FULL_QUERY), 4);
check("dir criteria: nothing set", hasCriteria(NO_QUERY), false);
check("dir criteria: only a page", hasCriteria(queryWith({ page: 2 })), false);
check("dir criteria: search text", hasCriteria(queryWith({ q: "x" })), true);
check("dir criteria: one filter", hasCriteria(queryWith({ graduationYear: 2019 })), true);

check("lastPage(0, 12)", lastPage(0, 12), 1);
check("lastPage(12, 12)", lastPage(12, 12), 1);
check("lastPage(13, 12)", lastPage(13, 12), 2);
check("lastPage(86, 12)", lastPage(86, 12), 8);
check("lastPage: page size 0", lastPage(13, 0), 1);

// ---- REQ-fs-005: display lines (AC2, AC15) ----------------------------------

check("name: shown trimmed", displayName("  Nadia Rahman "), "Nadia Rahman");
check("name: null", displayName(null), "Name not given");
check("name: only spaces", displayName("   "), "Name not given");
check("job line: both", jobLine("Software Engineer", "Nordlys Systems"), "Software Engineer at Nordlys Systems");
check("job line: both, with spaces", jobLine(" Engineer ", " Acme "), "Engineer at Acme");
check("job line: title only", jobLine("Engineer", null), "Engineer");
check("job line: company only", jobLine(null, "Acme"), "Acme");
check("job line: company is only spaces", jobLine("Engineer", "   "), "Engineer");
check("job line: neither", jobLine(null, null), null);
check("job line: both only spaces", jobLine(" ", ""), null);
check("class: 2019", classLabel(2019), "Class of 2019");
check("class: no year", classLabel(null), null);
check("not given: text", orNotGiven(" Acme "), "Acme");
check("not given: null", orNotGiven(null), "Not given");
check("not given: only spaces", orNotGiven("  "), "Not given");
check("first name: two words", firstName("Nadia Rahman"), "Nadia");
check("first name: spaces around", firstName("   Åsa   Öberg "), "Åsa");
check("first name: one word", firstName("Nadia"), "Nadia");
check("first name: null", firstName(null), null);
check("first name: only spaces", firstName("   "), null);

// ---- REQ-fs-005: back to the directory (AC17, L-REQ-fs-004-1) ---------------

check("dir return: the link state", directoryReturnState("?q=x&page=2"), { directorySearch: "?q=x&page=2" });
check("dir return: a saved search", readDirectorySearch({ directorySearch: "?q=x&page=2" }), "?q=x&page=2");
check("dir return: an empty search", readDirectorySearch({ directorySearch: "" }), "");
check("dir return: own state round trip", readDirectorySearch(directoryReturnState("?field=AI")), "?field=AI");
check("dir return: no state (fresh tab)", readDirectorySearch(null), "");
check("dir return: state is undefined", readDirectorySearch(undefined), "");
check("dir return: state is a number", readDirectorySearch(42), "");
check("dir return: state is a string", readDirectorySearch("?q=x"), "");
check("dir return: no directorySearch", readDirectorySearch({ from: "/feed" }), "");
check("dir return: directorySearch not text", readDirectorySearch({ directorySearch: 5 }), "");
check("dir return: //evil", readDirectorySearch({ directorySearch: "//evil" }), "");
check("dir return: a full URL", readDirectorySearch({ directorySearch: "https://evil.example/" }), "");
check("dir return: a hash", readDirectorySearch({ directorySearch: "?a#b" }), "");
check("dir return: a line break", readDirectorySearch({ directorySearch: "?a\nb" }), "");
check("dir return: 500 characters pass", readDirectorySearch({ directorySearch: `?${"a".repeat(499)}` }), `?${"a".repeat(499)}`);
check("dir return: 501 characters", readDirectorySearch({ directorySearch: `?${"a".repeat(500)}` }), "");
check("dir return: 600 characters", readDirectorySearch({ directorySearch: `?${"a".repeat(599)}` }), "");

// ---- REQ-fs-005: shared rules moved into lib/ (TASK-015, AC18, AC36) --------

check("present: null", presentText(null), null);
check('present: ""', presentText(""), null);
check("present: only spaces", presentText("  "), null);
check('present: " a " is trimmed', presentText(" a "), "a");

// A whole number from 1 to 2147483647 (the server's integer id), ASCII digits only.
check('profile id: "7"', readProfileId("7"), 7);
check('profile id: "0"', readProfileId("0"), null);
check('profile id: "abc"', readProfileId("abc"), null);
check('profile id: "1.5"', readProfileId("1.5"), null);
check('profile id: "-3"', readProfileId("-3"), null);
check("profile id: 2147483647 is the largest", readProfileId("2147483647"), 2147483647);
check("profile id: 2147483648 is too big", readProfileId("2147483648"), null);
check("profile id: 23 digits", readProfileId("12345678901234567890123"), null);
check("profile id: Arabic-Indic digits (٤٢, 42)", readProfileId("٤٢"), null);
check("profile id: empty", readProfileId(""), null);
check("profile id: no id at all", readProfileId(undefined), null);

const LOAD_NO_ANSWER = "We could not reach the server. Check your connection and try again.";
const LOAD_SERVER = "Something went wrong on our side. Try again in a moment.";
check("load words: no answer", loadFailureText({ kind: "network" }), LOAD_NO_ANSWER);
check("load words: no failure kept", loadFailureText(null), LOAD_NO_ANSWER);
check("load words: 500", loadFailureText({ kind: "http", status: 500 }), LOAD_SERVER);
check("load words: 503", loadFailureText({ kind: "http", status: 503 }), LOAD_SERVER);
check("load words: 404 gets the server words, as the pages did", loadFailureText({ kind: "http", status: 404 }), LOAD_SERVER);

// ---- REQ-fs-005 fix round 1: the email link (CORR-001) ----------------------
// Only a plain address becomes a mailto: link; anything that could add a
// copy-to address, a subject or a body is shown as text (null here).

check("mailto: a@b.co", mailtoHref("a@b.co"), "mailto:a@b.co");
check("mailto: spaces around are trimmed", mailtoHref("  a@b.co  "), "mailto:a@b.co");
check("mailto: dots, plus and hyphen", mailtoHref("nadia.rahman+alumni@uni-x.example.se"), "mailto:nadia.rahman%2Balumni@uni-x.example.se");
check("mailto: ?cc= is not a link", mailtoHref("a@b.co?cc=x@y.z"), null);
check("mailto: &body= is not a link", mailtoHref("a@b.co&body=x"), null);
check("mailto: # is not a link", mailtoHref("a@b.co#x"), null);
check("mailto: % is not a link", mailtoHref("a%40b@c.co"), null);
check("mailto: comma (two addresses) is not a link", mailtoHref("a@b.co,c@d.co"), null);
check("mailto: semicolon is not a link", mailtoHref("a@b.co;c@d.co"), null);
check("mailto: a space inside is not a link", mailtoHref("a b@c.co"), null);
check("mailto: a line break is not a link", mailtoHref("a@b.co\nbcc:x@y.z"), null);
check("mailto: two @ is not a link", mailtoHref("a@b@c.co"), null);
check("mailto: no dot in the domain", mailtoHref("a@b"), null);
check("mailto: no @", mailtoHref("ab.co"), null);
check("mailto: empty", mailtoHref(""), null);
check("mailto: only spaces", mailtoHref("   "), null);
check("mailto: null", mailtoHref(null), null);
check("mailto: javascript: is not a link", mailtoHref("javascript:alert(1)//@b.co"), null);
check("mailto: 100 characters pass", mailtoHref(`${"a".repeat(94)}@b.com`), `mailto:${"a".repeat(94)}@b.com`);
check("mailto: 101 characters", mailtoHref(`${"a".repeat(95)}@b.com`), null);

// ---- REQ-fs-005 fix round 1, batch C: save words, unchanged forms (UI-001, Q-1, REFL-001)

// Imports are hoisted, so this block keeps its own: the other blocks stay untouched.
import { sameAlumniForm } from "../frontend/src/lib/alumniForm.ts";
import { sameText } from "../frontend/src/lib/alumniDisplay.ts";
import { saveFailureReason, saveFailureText } from "../frontend/src/lib/saveFailure.ts";

// The words are the reason names, so a case shows which reason was picked.
const SAVE_WORDS = { noAnswer: "noAnswer", server: "server", gone: "gone", general: "general" };
const SAVE_WORDS_CONFLICT = { ...SAVE_WORDS, conflict: "conflict" };
check("save words: no answer", saveFailureText({ kind: "network" }, SAVE_WORDS), "noAnswer");
check("save words: 400", saveFailureText({ kind: "http", status: 400 }, SAVE_WORDS), "general");
check("save words: 403", saveFailureText({ kind: "http", status: 403 }, SAVE_WORDS), "gone");
check("save words: 404", saveFailureText({ kind: "http", status: 404 }, SAVE_WORDS), "gone");
check("save words: 409 with conflict words", saveFailureText({ kind: "http", status: 409 }, SAVE_WORDS_CONFLICT), "conflict");
check("save words: 409 without conflict words", saveFailureText({ kind: "http", status: 409 }, SAVE_WORDS), "general");
check("save words: 418 (unknown)", saveFailureText({ kind: "http", status: 418 }, SAVE_WORDS), "general");
check("save words: 499", saveFailureText({ kind: "http", status: 499 }, SAVE_WORDS), "general");
check("save words: 500", saveFailureText({ kind: "http", status: 500 }, SAVE_WORDS), "server");
check("save words: 503", saveFailureText({ kind: "http", status: 503 }, SAVE_WORDS), "server");
check("save reason: 404 is gone (shows the reload)", saveFailureReason({ kind: "http", status: 404 }), "gone");
check("save reason: no answer", saveFailureReason({ kind: "network" }), "noAnswer");

check("present: undefined (field left out)", presentText(undefined), null);
check('same text: " a " and "a"', sameText(" a ", "a"), true);
check('same text: "" and only spaces', sameText("", "   "), true);
check('same text: "a" and "b"', sameText("a", "b"), false);
check("same text: letter case counts", sameText("A", "a"), false);

const SAVED_FORM = { ...EMPTY_ALUMNI_FORM, department: "CSE", graduationYear: "2019", bio: "Hi" };
check("same form: empty and empty", sameAlumniForm(EMPTY_ALUMNI_FORM, { ...EMPTY_ALUMNI_FORM }), true);
check("same form: untouched saved form", sameAlumniForm(SAVED_FORM, { ...SAVED_FORM }), true);
check("same form: only spaces added", sameAlumniForm({ ...SAVED_FORM, department: " CSE ", graduationYear: "2019 " }, SAVED_FORM), true);
check("same form: one field changed", sameAlumniForm({ ...SAVED_FORM, bio: "Hello" }, SAVED_FORM), false);
check("same form: a field emptied", sameAlumniForm({ ...SAVED_FORM, department: "" }, SAVED_FORM), false);
check("same form: mentoring ticked", sameAlumniForm({ ...SAVED_FORM, mentoring: true }, SAVED_FORM), false);
check('same form: year "abc" against empty', sameAlumniForm({ ...EMPTY_ALUMNI_FORM, graduationYear: "abc" }, EMPTY_ALUMNI_FORM), false);

// ---- REQ-fs-005 fix round 2, batch F: when Save profile is on (AC24, R2-001)

import { canSaveAlumniForm } from "../frontend/src/lib/alumniForm.ts";

// With no profile yet the saved form is the empty one (alumniToForm(null)).
const NO_PROFILE_FORM = alumniToForm(null);
check("can save: new profile, empty form", canSaveAlumniForm(true, { ...EMPTY_ALUMNI_FORM }, NO_PROFILE_FORM), true);
check("can save: new profile, typed form", canSaveAlumniForm(true, { ...EMPTY_ALUMNI_FORM, company: "Acme" }, NO_PROFILE_FORM), true);
check("can save: saved profile, same form", canSaveAlumniForm(false, { ...SAVED_FORM }, SAVED_FORM), false);
check("can save: saved profile, changed form", canSaveAlumniForm(false, { ...SAVED_FORM, bio: "Hello" }, SAVED_FORM), true);
check("can save: saved profile, only spaces added", canSaveAlumniForm(false, { ...SAVED_FORM, department: " CSE ", bio: "Hi  " }, SAVED_FORM), false);
// After the first create the store holds the profile: no longer new, and
// the form equals what was saved (an empty create included).
const createdForm = alumniToForm(savedProfile);
check("can save: after the first create", canSaveAlumniForm(false, { ...createdForm }, createdForm), false);
check("can save: after an empty first create", canSaveAlumniForm(false, { ...EMPTY_ALUMNI_FORM }, NO_PROFILE_FORM), false);

// ---- Result ---------------------------------------------------------------

console.log(`frontend-lib-check: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
