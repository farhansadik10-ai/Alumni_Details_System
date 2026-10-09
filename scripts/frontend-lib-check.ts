// Checks the pure functions in frontend/src/lib/ without a browser.
// Run from the repo root:  npx tsx scripts/frontend-lib-check.ts
// Exit code 0 when every case passes, 1 when any fails.
//
// The cases are written from the spec (REQ-fs-004: AC42, AC46, AC53 and the
// TASK-003 list; REQ-fs-005: choices 13 to 17, AC2, AC5, AC7, AC15, AC17,
// AC18, AC25, AC26, TASK-015; REQ-fs-006: C3, C7, C9, AC8, AC10 to AC15,
// AC18, AC36; REQ-fs-007: the TASK-002 and TASK-003 lists), not from the code. The expected messages are typed out here
// on purpose: importing the constants would compare the code with itself.
//
// It imports only from frontend/src/lib/, the plain words of
// frontend/src/config/text.ts, and frontend/src/store/peopleBlockState.ts
// (type-only imports, so no atom or service loads). It reads no file and
// calls no API.

import type { Alumni } from "@alumni/shared";
import { readPageParam, singleParam } from "../frontend/src/lib/addressParams.ts";
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
  readDirectoryQuery,
  toListParams,
  writeDirectoryQuery,
} from "../frontend/src/lib/directoryQuery.ts";
import { directoryReturnState, readDirectorySearch } from "../frontend/src/lib/directoryReturn.ts";
import { initialsOf } from "../frontend/src/lib/initials.ts";
import { loadFailureText } from "../frontend/src/lib/loadFailure.ts";
import { mailtoHref } from "../frontend/src/lib/mailtoLink.ts";
import { lastPage, pageRange } from "../frontend/src/lib/pageRange.ts";
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

// ---- REQ-fs-007: shared address helpers (TASK-002) --------------------------

function addressOf(search: string): URLSearchParams {
  return new URLSearchParams(search);
}

check("single: one value", singleParam(addressOf("role=admin"), "role"), "admin");
check("single: absent is null", singleParam(addressOf("q=x"), "role"), null);
check("single: sent twice is null", singleParam(addressOf("role=admin&role=student"), "role"), null);
check("single: sent twice with the same value is null", singleParam(addressOf("role=admin&role=admin"), "role"), null);
check("single: empty value is the empty text", singleParam(addressOf("role="), "role"), "");
check("single: no address is null", singleParam(addressOf(""), "role"), null);
check("single: value is not trimmed", singleParam(addressOf("q=%20a%20"), "q"), " a ");

check("page param: absent is 1", readPageParam(addressOf("")), 1);
check("page param: page=1", readPageParam(addressOf("page=1")), 1);
check("page param: page=5", readPageParam(addressOf("page=5")), 5);
check("page param: page=10", readPageParam(addressOf("page=10")), 10);
check("page param: page=9999999 is kept", readPageParam(addressOf("page=9999999")), 9999999);
check("page param: page=10000000 is 1 (too big)", readPageParam(addressOf("page=10000000")), 1);
check("page param: page=0 is 1", readPageParam(addressOf("page=0")), 1);
check("page param: page=05 is 1 (leading zero)", readPageParam(addressOf("page=05")), 1);
check("page param: page=-2 is 1", readPageParam(addressOf("page=-2")), 1);
check("page param: page=+2 is 1", readPageParam(addressOf("page=%2B2")), 1);
check("page param: page=2.0 is 1", readPageParam(addressOf("page=2.0")), 1);
check("page param: page=1e3 is 1", readPageParam(addressOf("page=1e3")), 1);
check("page param: page=x is 1", readPageParam(addressOf("page=x")), 1);
check("page param: empty page is 1", readPageParam(addressOf("page=")), 1);
check("page param: trailing space is 1", readPageParam(addressOf("page=2%20")), 1);
check("page param: sent twice is 1", readPageParam(addressOf("page=2&page=2")), 1);
check("page param: other keys are ignored", readPageParam(addressOf("q=x&page=4&role=admin")), 4);

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

// ---- REQ-fs-006: feed and dashboard rules (C3, C7, C9, AC8, AC10 to AC15, AC36)
// Expected answers are typed out from the spec, not worked out with the code.

import type { Comment, Post } from "@alumni/shared";
import { commentCountText, dateText } from "../frontend/src/lib/postDisplay.ts";
import { canDeleteContent, canEditContent } from "../frontend/src/lib/contentOwner.ts";
import {
  appendComment,
  buildThreads,
  countReplies,
  removeWithReplies,
  replaceComment,
} from "../frontend/src/lib/commentThread.ts";
import { mergePosts, nextFeedPage } from "../frontend/src/lib/feedPaging.ts";
import { validateCaption, validateComment } from "../frontend/src/lib/validation.ts";

// Dates without a zone are read in local time, so these cases give the same
// answer in every time zone.
check("date: a normal date", dateText("2026-10-03T09:15:00"), "3 October 2026");
check("date: two-digit day", dateText("2026-10-13T12:00:00"), "13 October 2026");
check("date: single-digit day, no leading zero", dateText("2026-01-05T08:00:00"), "5 January 2026");
check("date: 31 December late in the day", dateText("2026-12-31T23:59:59"), "31 December 2026");
check("date: leap day 2028", dateText("2028-02-29T10:00:00"), "29 February 2028");
check("date: with milliseconds", dateText("2026-06-01T10:00:00.000"), "1 June 2026");
check("date: null", dateText(null), null);
check('date: ""', dateText(""), null);
check("date: only spaces", dateText("   "), null);
check('date: "not a date"', dateText("not a date"), null);
check('date: "1" is not read as a year', dateText("1"), null);
check("date: month 13", dateText("2026-13-01T10:00:00"), null);

check("count: 0", commentCountText(0), "No comments yet");
check("count: 1", commentCountText(1), "1 comment");
check("count: 2", commentCountText(2), "2 comments");
check("count: 1000", commentCountText(1000), "1000 comments");

const AUTHOR = { userId: 5, role: "alumni" as const, expiresAt: null };
const OTHER_ALUMNUS = { userId: 7, role: "alumni" as const, expiresAt: null };
const ADMIN = { userId: 9, role: "admin" as const, expiresAt: null };
const STUDENT = { userId: 6, role: "student" as const, expiresAt: null };
const NO_ROLE = { userId: 5, role: null, expiresAt: null };

check("edit: the author", canEditContent(AUTHOR, 5), true);
check("edit: another user", canEditContent(OTHER_ALUMNUS, 5), false);
check("edit: an admin on someone else's", canEditContent(ADMIN, 5), false);
check("edit: an admin on their own", canEditContent(ADMIN, 9), true);
check("edit: a student on someone else's", canEditContent(STUDENT, 5), false);
check("edit: a student on their own comment", canEditContent(STUDENT, 6), true);
check("edit: author with an unknown role", canEditContent(NO_ROLE, 5), true);
check("edit: no session", canEditContent(null, 5), false);
check("edit: no author on the content", canEditContent(AUTHOR, null), false);
check("delete: the author", canDeleteContent(AUTHOR, 5), true);
check("delete: another user", canDeleteContent(OTHER_ALUMNUS, 5), false);
check("delete: an admin on someone else's", canDeleteContent(ADMIN, 5), true);
check("delete: a student on someone else's", canDeleteContent(STUDENT, 5), false);
check("delete: a student on their own comment", canDeleteContent(STUDENT, 6), true);
check("delete: no session", canDeleteContent(null, 5), false);
check("delete: no author on the content", canDeleteContent(AUTHOR, null), false);
check("delete: admin, no author on the content", canDeleteContent(ADMIN, null), false);

function comment(id: number, parentId: number | null, createdAt: string | null): Comment {
  return {
    id,
    user_id: 5,
    posts_id: 1,
    parent_id: parentId,
    content: `comment ${id}`,
    created_at: createdAt,
    updated_at: createdAt,
    name: "Nadia Rahman",
    photo_url: null,
  };
}
// Threads shown as ids, so a failure is easy to read.
function threadIds(comments: Comment[]): { comment: number; replies: number[] }[] {
  return buildThreads(comments).map((thread) => ({
    comment: thread.comment.id,
    replies: thread.replies.map((reply) => reply.id),
  }));
}
function ids(comments: { id: number }[]): number[] {
  return comments.map((item) => item.id);
}

// 1 and 2 top level; 3 and 5 reply to 1; 4 replies to 3; 6's parent is gone.
const C1 = comment(1, null, "2026-10-03T10:00:00");
const C2 = comment(2, null, "2026-10-03T09:00:00");
const C3 = comment(3, 1, "2026-10-03T10:30:00");
const C4 = comment(4, 3, "2026-10-03T10:45:00");
const C5 = comment(5, 1, "2026-10-03T10:40:00");
const C6 = comment(6, 99, "2026-10-03T09:30:00");
const SHUFFLED = [C4, C1, C6, C5, C3, C2];
const IN_ORDER = [C1, C2, C3, C4, C5, C6];
const SHUFFLED_BEFORE = JSON.stringify(SHUFFLED);

check("threads: top level oldest first, replies flat oldest first, reply of a reply under its top", threadIds(SHUFFLED), [
  { comment: 2, replies: [] },
  { comment: 6, replies: [] },
  { comment: 1, replies: [3, 5, 4] },
]);
check("threads: the input list is not changed", JSON.stringify(SHUFFLED), SHUFFLED_BEFORE);
check("threads: empty list", threadIds([]), []);
check("threads: a reply whose parent is gone is top level", threadIds([comment(10, 8, "2026-10-03T10:00:00")]), [
  { comment: 10, replies: [] },
]);
check(
  "threads: same time, lower id first",
  threadIds([comment(8, null, "2026-10-03T10:00:00"), comment(7, null, "2026-10-03T10:00:00")]),
  [{ comment: 7, replies: [] }, { comment: 8, replies: [] }],
);
check(
  "threads: no date goes last",
  threadIds([comment(1, null, null), comment(2, null, "2026-10-03T10:00:00")]),
  [{ comment: 2, replies: [] }, { comment: 1, replies: [] }],
);
check(
  "threads: a parent loop does not hang and nothing is hidden",
  threadIds([comment(1, 2, "2026-10-03T10:00:00"), comment(2, 1, "2026-10-03T11:00:00")]),
  [{ comment: 1, replies: [] }, { comment: 2, replies: [] }],
);
check("threads: the full comment is kept", buildThreads([C1])[0].comment.content, "comment 1");

check("remove: a leaf", ids(removeWithReplies(IN_ORDER, 5)), [1, 2, 3, 4, 6]);
check("remove: a comment with replies and a reply of a reply", ids(removeWithReplies(IN_ORDER, 1)), [2, 6]);
check("remove: a reply that has a reply", ids(removeWithReplies(IN_ORDER, 3)), [1, 2, 5, 6]);
check("remove: a reply of a reply", ids(removeWithReplies(IN_ORDER, 4)), [1, 2, 3, 5, 6]);
check("remove: an unknown id", ids(removeWithReplies(IN_ORDER, 50)), [1, 2, 3, 4, 5, 6]);
check("remove: an id not held still takes its replies", ids(removeWithReplies(IN_ORDER, 99)), [1, 2, 3, 4, 5]);
check("remove: the input list is not changed", ids(IN_ORDER), [1, 2, 3, 4, 5, 6]);
check("replies: a comment with 3 below it", countReplies(IN_ORDER, 1), 3);
check("replies: a reply with 1 below it", countReplies(IN_ORDER, 3), 1);
check("replies: a leaf", countReplies(IN_ORDER, 5), 0);
check("replies: an unknown id", countReplies(IN_ORDER, 50), 0);

check("append: goes at the end", ids(appendComment(IN_ORDER, comment(7, 2, "2026-10-03T12:00:00"))), [1, 2, 3, 4, 5, 6, 7]);
const appendedTwice = appendComment(IN_ORDER, { ...C2, content: "again" });
check("append: an id already held is not added twice", ids(appendedTwice), [1, 2, 3, 4, 5, 6]);
check("append: an id already held takes the new copy", appendedTwice[1].content, "again");
const replaced = replaceComment(IN_ORDER, { ...C4, content: "edited" });
check("replace: the edited text", replaced[3].content, "edited");
check("replace: the order is kept", ids(replaced), [1, 2, 3, 4, 5, 6]);
check("replace: an unknown id changes nothing", ids(replaceComment(IN_ORDER, comment(50, null, null))), [1, 2, 3, 4, 5, 6]);
check("append/replace: the input list is not changed", IN_ORDER[3].content, "comment 4");

check("next page: 0 held", nextFeedPage(0, 12), 1);
check("next page: 11 held (after a delete)", nextFeedPage(11, 12), 1);
check("next page: 12 held", nextFeedPage(12, 12), 2);
check("next page: 13 held (after a create)", nextFeedPage(13, 12), 2);
check("next page: 24 held", nextFeedPage(24, 12), 3);
check("next page: limit 0", nextFeedPage(5, 0), 1);
check("next page: limit -1", nextFeedPage(5, -1), 1);

function post(id: number, createdAt: string | null, caption = `post ${id}`): Post {
  return {
    id,
    user_id: 5,
    caption,
    media_url: null,
    comment_count: 0,
    created_at: createdAt,
    updated_at: createdAt,
    name: "Nadia Rahman",
    photo_url: null,
  };
}
const P1 = post(1, "2026-10-01T10:00:00");
const P2 = post(2, "2026-10-02T10:00:00");
const P3 = post(3, "2026-10-03T10:00:00");
const merged = mergePosts([P3, P2], [post(2, "2026-10-02T10:00:00", "new"), P1]);
check("merge: no id twice, newest first", ids(merged), [3, 2, 1]);
check("merge: the incoming copy wins", merged[1].caption, "new");
check("merge: nothing held", ids(mergePosts([], [P1, P3])), [3, 1]);
check("merge: nothing incoming", ids(mergePosts([P2, P3], [])), [3, 2]);
check("merge: both empty", ids(mergePosts([], [])), []);
check("merge: out of order in, newest first out", ids(mergePosts([P1], [P3, P2])), [3, 2, 1]);
check(
  "merge: same time, higher id first",
  ids(mergePosts([post(4, "2026-10-03T10:00:00")], [post(5, "2026-10-03T10:00:00")])),
  [5, 4],
);
check("merge: no date goes last", ids(mergePosts([post(8, null)], [P1])), [1, 8]);

const CAPTION_EMPTY = "Write something before you publish.";
const COMMENT_EMPTY = "Write a comment before you send it.";
const TOO_LONG_1000 = "Use 1000 characters or fewer.";
check("caption: empty", validateCaption(""), CAPTION_EMPTY);
check("caption: only spaces", validateCaption("   "), CAPTION_EMPTY);
check("caption: only line breaks", validateCaption("\n\n"), CAPTION_EMPTY);
check("caption: 1 character", validateCaption("a"), null);
check("caption: exactly 2000", validateCaption("a".repeat(2000)), null);
check("caption: 2001", validateCaption("a".repeat(2001)), TOO_LONG_2000);
check("caption: 2000 with spaces around pass", validateCaption(`  ${"a".repeat(2000)}  `), null);
check("comment: empty", validateComment(""), COMMENT_EMPTY);
check("comment: only spaces", validateComment("   "), COMMENT_EMPTY);
check("comment: 1 character", validateComment("a"), null);
check("comment: exactly 1000", validateComment("c".repeat(1000)), null);
check("comment: 1001", validateComment("c".repeat(1001)), TOO_LONG_1000);
check("comment: 1000 emoji count as 1000", validateComment("\u{1F393}".repeat(1000)), null);

// ---- REQ-fs-006 TASK-014: a failed edit or delete (AC18) --------------------
// 403 and 404 get their own words before the save rule, which would call
// both "gone". The words are the answer names, so a case shows which was picked.

import { isGone, writeFailureText } from "../frontend/src/lib/writeFailure.ts";

const WRITE_WORDS = { forbidden: "forbidden", notFound: "notFound", save: SAVE_WORDS };
const WRITE_WORDS_CONFLICT = { ...WRITE_WORDS, save: SAVE_WORDS_CONFLICT };
check("write words: 403 is forbidden, not gone", writeFailureText({ kind: "http", status: 403 }, WRITE_WORDS), "forbidden");
check("write words: 404 is not found, not gone", writeFailureText({ kind: "http", status: 404 }, WRITE_WORDS), "notFound");
check("write words: 500", writeFailureText({ kind: "http", status: 500 }, WRITE_WORDS), "server");
check("write words: 409 without conflict words", writeFailureText({ kind: "http", status: 409 }, WRITE_WORDS), "general");
check("write words: 409 with conflict words", writeFailureText({ kind: "http", status: 409 }, WRITE_WORDS_CONFLICT), "conflict");
check("write words: no answer", writeFailureText({ kind: "network" }, WRITE_WORDS), "noAnswer");
check("write words: 400", writeFailureText({ kind: "http", status: 400 }, WRITE_WORDS), "general");
check("write words: 401", writeFailureText({ kind: "http", status: 401 }, WRITE_WORDS), "general");
check("gone: 404", isGone({ kind: "http", status: 404 }), true);
check("gone: 403", isGone({ kind: "http", status: 403 }), false);
check("gone: 410", isGone({ kind: "http", status: 410 }), false);
check("gone: 400", isGone({ kind: "http", status: 400 }), false);
check("gone: 500", isGone({ kind: "http", status: 500 }), false);
check("gone: no answer", isGone({ kind: "network" }), false);

// ---- REQ-fs-006 fix round, m1: who may write posts, the mentoring address ---
// ADR-02: alumni and admin may write posts (and have an alumni profile); a
// student, a role we do not know (null) may not. The "See all" links of the
// Feed and the Dashboard open the directory with only "open to mentoring" on.

import { canWritePosts } from "../frontend/src/lib/token.ts";
import { mentoringDirectoryAddress } from "../frontend/src/lib/directoryQuery.ts";

check("may write posts: alumni", canWritePosts("alumni"), true);
check("may write posts: admin", canWritePosts("admin"), true);
check("may write posts: student", canWritePosts("student"), false);
check("may write posts: no role", canWritePosts(null), false);
check(
  "mentoring address: directory path, only mentoring=true",
  mentoringDirectoryAddress("/directory"),
  { pathname: "/directory", search: "?mentoring=true" },
);
check(
  "mentoring address: reads back as mentoring on, nothing else set",
  readDirectoryQuery(new URLSearchParams(mentoringDirectoryAddress("/directory").search)),
  { ...DEFAULT_DIRECTORY_QUERY, mentoring: true },
);

// ---- REQ-fs-006 fix m8/m9: a failed new comment or reply ------------------
// A 400 means "the comment replied to is gone" only on a reply; 403 has its
// own words (not the edit wording). The words are the answer names.

import { commentAddFailureText, isReplyTargetGone } from "../frontend/src/lib/writeFailure.ts";

const ADD_WORDS = {
  replyTargetGone: "replyTargetGone",
  postGone: "postGone",
  forbidden: "forbidden",
  save: SAVE_WORDS,
};
check("reply gone: 400 with a parent", isReplyTargetGone({ kind: "http", status: 400 }, 7), true);
check("reply gone: 400 without a parent", isReplyTargetGone({ kind: "http", status: 400 }, null), false);
check("reply gone: 404 with a parent", isReplyTargetGone({ kind: "http", status: 404 }, 7), false);
check("reply gone: no answer with a parent", isReplyTargetGone({ kind: "network" }, 7), false);
check("add words: 400 with a parent", commentAddFailureText({ kind: "http", status: 400 }, 7, ADD_WORDS), "replyTargetGone");
check("add words: 400 without a parent", commentAddFailureText({ kind: "http", status: 400 }, null, ADD_WORDS), "general");
check("add words: 404", commentAddFailureText({ kind: "http", status: 404 }, null, ADD_WORDS), "postGone");
check("add words: 404 on a reply", commentAddFailureText({ kind: "http", status: 404 }, 7, ADD_WORDS), "postGone");
check("add words: 403", commentAddFailureText({ kind: "http", status: 403 }, null, ADD_WORDS), "forbidden");
check("add words: 403 on a reply", commentAddFailureText({ kind: "http", status: 403 }, 7, ADD_WORDS), "forbidden");
check("add words: 500", commentAddFailureText({ kind: "http", status: 500 }, 7, ADD_WORDS), "server");
check("add words: no answer", commentAddFailureText({ kind: "network" }, null, ADD_WORDS), "noAnswer");

// ---- REQ-fs-006 fix round, group D: the plural rule and the words with branches
// (QUAL-003, QUAL-006). Sentences typed from the spec and design (AC14, AC17,
// AC21, architecture "Live regions"), not worked out with the code.

import { countText } from "../frontend/src/lib/postDisplay.ts";
import {
  commentDeleteBody,
  dashboardGreeting,
  feedShowingText,
  postDeleteBody,
} from "../frontend/src/config/text.ts";

check("plural: 0 replies", countText(0, "reply", "replies"), "0 replies");
check("plural: 1 reply", countText(1, "reply", "replies"), "1 reply");
check("plural: 2 replies", countText(2, "reply", "replies"), "2 replies");
check("greeting: with a first name", dashboardGreeting("Tanvir"), "Welcome back, Tanvir");
check("greeting: name not known", dashboardGreeting(null), "Welcome back");
check("greeting: empty name", dashboardGreeting(""), "Welcome back");
check("showing: 12 of 42", feedShowingText(12, 42), "Showing 12 of 42 posts");
check("showing: 1 of 1", feedShowingText(1, 1), "Showing 1 of 1 post");
check("showing: 0 of 0", feedShowingText(0, 0), "Showing 0 of 0 posts");
check(
  "delete post: no comments",
  postDeleteBody(0),
  "The post and any comments on it will be removed for everyone. This cannot be undone.",
);
check(
  "delete post: 1 comment",
  postDeleteBody(1),
  "The post and its 1 comment will be removed for everyone. This cannot be undone.",
);
check(
  "delete post: 4 comments",
  postDeleteBody(4),
  "The post and its 4 comments will be removed for everyone. This cannot be undone.",
);
check(
  "delete comment: no replies",
  commentDeleteBody(0),
  "The comment will be removed for everyone. This cannot be undone.",
);
check(
  "delete comment: 1 reply",
  commentDeleteBody(1),
  "The comment and its 1 reply will be removed for everyone. This cannot be undone.",
);
check(
  "delete comment: 3 replies",
  commentDeleteBody(3),
  "The comment and its 3 replies will be removed for everyone. This cannot be undone.",
);
// A held count that is not a real count is read as none held: page 1.
check("next page: -5 held", nextFeedPage(-5, 12), 1);
check("next page: NaN held", nextFeedPage(Number.NaN, 12), 1);

// ---- REQ-fs-007 TASK-003: the Users address (q, role, page) ----------------
// Typed from the TASK-003 list, not from the code. A role is kept only when it
// is exactly one of the three stored words; anything else is "all roles".

import {
  DEFAULT_USERS_QUERY,
  hasUsersCriteria,
  readUsersQuery,
  toUserListParams,
  writeUsersQuery,
} from "../frontend/src/lib/usersQuery.ts";

const NO_USERS_QUERY = { q: "", role: "", page: 1 };
function readUsersText(search: string): unknown {
  return readUsersQuery(new URLSearchParams(search));
}

check("users read: the default query is nothing set", DEFAULT_USERS_QUERY, NO_USERS_QUERY);
check("users read: no address", readUsersText(""), NO_USERS_QUERY);
check("users read: every key empty", readUsersText("q=&role=&page="), NO_USERS_QUERY);
check("users read: page=0 is 1", readUsersText("page=0"), NO_USERS_QUERY);
check("users read: page=01 is 1 (leading zero)", readUsersText("page=01"), NO_USERS_QUERY);
check("users read: page=abc is 1", readUsersText("page=abc"), NO_USERS_QUERY);
check("users read: page=2", readUsersText("page=2"), { q: "", role: "", page: 2 });
check("users read: page=99999999 is 1 (too big)", readUsersText("page=99999999"), NO_USERS_QUERY);
check("users read: repeated q counts as absent", readUsersText("q=ab&q=cd"), NO_USERS_QUERY);
check("users read: role=ADMIN is all roles", readUsersText("role=ADMIN"), NO_USERS_QUERY);
check("users read: role=teacher is all roles", readUsersText("role=teacher"), NO_USERS_QUERY);
check("users read: role=admin", readUsersText("role=admin"), { q: "", role: "admin", page: 1 });
check("users read: role=student", readUsersText("role=student"), { q: "", role: "student", page: 1 });
check("users read: role=alumni", readUsersText("role=alumni"), { q: "", role: "alumni", page: 1 });
check("users read: role with a space is all roles", readUsersText("role=admin%20"), NO_USERS_QUERY);
check("users read: repeated role counts as absent", readUsersText("role=admin&role=admin"), NO_USERS_QUERY);
check("users read: q of only spaces is no search", readUsersText("q=%20%20%20"), NO_USERS_QUERY);
check("users read: q is trimmed", readUsersText("q=%20nadia%20"), { q: "nadia", role: "", page: 1 });
check(
  "users read: everything set",
  readUsersText("page=4&role=alumni&q=nadia"),
  { q: "nadia", role: "alumni", page: 4 },
);

const FULL_USERS_QUERY = { q: "nadia rahman", role: "student" as const, page: 3 };
check("users write: the defaults are an empty address", writeUsersQuery(DEFAULT_USERS_QUERY).toString(), "");
check("users write: page 1 is left out", writeUsersQuery({ q: "x", role: "", page: 1 }).toString(), "q=x");
check("users write: only a role", writeUsersQuery({ q: "", role: "admin", page: 1 }).toString(), "role=admin");
check(
  "users write: everything set, in the order q, role, page",
  writeUsersQuery(FULL_USERS_QUERY).toString(),
  "q=nadia+rahman&role=student&page=3",
);
check("users round trip: everything set", readUsersQuery(writeUsersQuery(FULL_USERS_QUERY)), FULL_USERS_QUERY);
check("users round trip: nothing set", readUsersQuery(writeUsersQuery(DEFAULT_USERS_QUERY)), NO_USERS_QUERY);
check("users round trip: only q", readUsersQuery(writeUsersQuery({ q: "a & b", role: "", page: 1 })), { q: "a & b", role: "", page: 1 });
check("users round trip: only role", readUsersQuery(writeUsersQuery({ q: "", role: "alumni", page: 1 })), { q: "", role: "alumni", page: 1 });
check("users round trip: only page", readUsersQuery(writeUsersQuery({ q: "", role: "", page: 2 })), { q: "", role: "", page: 2 });

check("users params: nothing set sends nothing", toUserListParams(DEFAULT_USERS_QUERY), {});
check("users params: everything set", toUserListParams(FULL_USERS_QUERY), { q: "nadia rahman", role: "student", page: 3 });
check("users params: page 1 is not sent", toUserListParams({ q: "", role: "admin", page: 1 }), { role: "admin" });
check("users params: no limit", "limit" in toUserListParams(FULL_USERS_QUERY), false);

check("users criteria: nothing set", hasUsersCriteria(DEFAULT_USERS_QUERY), false);
check("users criteria: only a page", hasUsersCriteria({ q: "", role: "", page: 2 }), false);
check("users criteria: search text", hasUsersCriteria({ q: "x", role: "", page: 1 }), true);
check("users criteria: a role", hasUsersCriteria({ q: "", role: "student", page: 1 }), true);

// ---- REQ-fs-007 TASK-004: words for a refused user delete ------------------
// 409 has its own words; every other answer keeps the existing write rules.

import { userDeleteFailureText } from "../frontend/src/lib/writeFailure.ts";

const USER_DELETE_WORDS = { ...WRITE_WORDS, blocked: "blocked" };
check("user delete words: 409 is blocked", userDeleteFailureText({ kind: "http", status: 409 }, USER_DELETE_WORDS), "blocked");
check(
  "user delete words: 409 is blocked even with conflict save words",
  userDeleteFailureText({ kind: "http", status: 409 }, { ...WRITE_WORDS_CONFLICT, blocked: "blocked" }),
  "blocked",
);
check("user delete words: 404 is not found", userDeleteFailureText({ kind: "http", status: 404 }, USER_DELETE_WORDS), "notFound");
check("user delete words: 403 is forbidden", userDeleteFailureText({ kind: "http", status: 403 }, USER_DELETE_WORDS), "forbidden");
check("user delete words: no answer", userDeleteFailureText({ kind: "network" }, USER_DELETE_WORDS), "noAnswer");
check("user delete words: 500", userDeleteFailureText({ kind: "http", status: 500 }, USER_DELETE_WORDS), "server");
check("user delete words: 400", userDeleteFailureText({ kind: "http", status: 400 }, USER_DELETE_WORDS), "general");

// ---- REQ-fs-007 fix round: the Users and About words (QUAL-004) ------------
// Typed from the spec (AC9, A3, TASK-008 list) and the design intent, not
// worked out with the code. The functions take a name the caller has already
// chosen (displayName gives "Name not given"); they add no fallback of their own.

import {
  aboutPurposeText,
  aboutSub,
  userDeleteBlockedText,
  userDeleteBody,
  userDeletedToast,
  userDeleteFailureWords,
  usersCount,
  usersDeleteButtonName,
} from "../frontend/src/config/text.ts";

check("users count: 0", usersCount(0), "0 users");
check("users count: 1", usersCount(1), "1 user");
check("users count: 2", usersCount(2), "2 users");
check("users count: 124", usersCount(124), "124 users");
check("users delete button: read out with the name", usersDeleteButtonName("Nadia Rahman"), "Delete Nadia Rahman");
check("users delete button: no name given", usersDeleteButtonName("Name not given"), "Delete Name not given");
check(
  "user delete body: names the person",
  userDeleteBody("Nadia Rahman"),
  "The account of Nadia Rahman will be removed for everyone. This cannot be undone.",
);
check("user deleted toast", userDeletedToast("Nadia Rahman"), "Nadia Rahman was deleted");
check(
  "user delete 409: names posts, comments and an alumni profile",
  userDeleteBlockedText("Nadia Rahman"),
  "Nadia Rahman cannot be deleted because they still have posts, comments or an alumni profile. Nothing was changed.",
);
check(
  "user delete words: blocked names the person",
  userDeleteFailureWords("Tanvir Ahmed").blocked,
  "Tanvir Ahmed cannot be deleted because they still have posts, comments or an alumni profile. Nothing was changed.",
);
check(
  "user delete words: 404 is the already-gone toast",
  userDeleteFailureWords("Tanvir Ahmed").notFound,
  "This user had already been deleted, so they were removed from the list.",
);
check("about sub: uses the app name given", aboutSub("Nordlys Alumni"), "What Nordlys Alumni is for, and who to ask.");
check(
  "about purpose: uses the app name given",
  aboutPurposeText("Nordlys Alumni"),
  "Nordlys Alumni helps graduates and students stay in touch with each other.",
);

// ---- REQ-fs-007 fix round: asRole (QUAL-003) --------------------------------
// Only the three stored words, exactly, in lower case. Anything else is null.

import { asRole } from "../frontend/src/lib/token.ts";

check("role: student", asRole("student"), "student");
check("role: alumni", asRole("alumni"), "alumni");
check("role: admin", asRole("admin"), "admin");
check("role: Admin (capital) is none", asRole("Admin"), null);
check("role: ADMIN is none", asRole("ADMIN"), null);
check("role: leading space is none", asRole(" admin"), null);
check("role: trailing space is none", asRole("admin "), null);
check("role: empty is none", asRole(""), null);
check("role: teacher is none", asRole("teacher"), null);
check("role: alumnus is none", asRole("alumnus"), null);

// ---- REQ-fs-007 fix round: toPeopleBlockState (QUAL-005, REQ-fs-006 n6) ------
// The file lives in store/ but imports types only, which tsx erases, so no atom,
// service or axios is loaded. Idle, or loaded for the other kind, is "loading"
// with no items, so a page never shows the other page's list (pattern 23).

import { toPeopleBlockState } from "../frontend/src/store/peopleBlockState.ts";

const PERSON = { id: 5, full_name: "Nadia Rahman" } as unknown as Alumni;
const PEOPLE_LOADING = { status: "loading", items: [], failure: null };
const PEOPLE_FAILURE = { kind: "http" as const, status: 500 };

check(
  "people block: idle is loading",
  toPeopleBlockState({ status: "idle", kind: null, items: [], failure: null }, "newest"),
  PEOPLE_LOADING,
);
check(
  "people block: loading for this kind",
  toPeopleBlockState({ status: "loading", kind: "mentoring", items: [], failure: null }, "mentoring"),
  PEOPLE_LOADING,
);
check(
  "people block: ready for this kind keeps the items",
  toPeopleBlockState({ status: "ready", kind: "newest", items: [PERSON], failure: null }, "newest"),
  { status: "ready", items: [PERSON], failure: null },
);
check(
  "people block: error for this kind keeps the failure",
  toPeopleBlockState({ status: "error", kind: "mentoring", items: [], failure: PEOPLE_FAILURE }, "mentoring"),
  { status: "error", items: [], failure: PEOPLE_FAILURE },
);
check(
  "people block: ready for the other kind is loading, no items",
  toPeopleBlockState({ status: "ready", kind: "mentoring", items: [PERSON], failure: null }, "newest"),
  PEOPLE_LOADING,
);
check(
  "people block: error for the other kind is loading, no failure",
  toPeopleBlockState({ status: "error", kind: "newest", items: [], failure: PEOPLE_FAILURE }, "mentoring"),
  PEOPLE_LOADING,
);

// ---- Result ---------------------------------------------------------------

console.log(`frontend-lib-check: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
