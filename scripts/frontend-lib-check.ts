// Checks the pure functions in frontend/src/lib/ without a browser.
// Run from the repo root:  npx tsx scripts/frontend-lib-check.ts
// Exit code 0 when every case passes, 1 when any fails.
//
// The cases are written from the spec (REQ-fs-004: AC42, AC46, AC53 and the
// TASK-003 list), not from the code. The expected messages are typed out here
// on purpose: importing the constants would compare the code with itself.
//
// It imports only from frontend/src/lib/. It reads no file and calls no API.

import { initialsOf } from "../frontend/src/lib/initials.ts";
import { pageRange } from "../frontend/src/lib/pageRange.ts";
import { readReturnAddress } from "../frontend/src/lib/returnAddress.ts";
import { isAdmin, isExpired, isLiveSession, readToken } from "../frontend/src/lib/token.ts";
import {
  validateEmail,
  validateLoginPassword,
  validateName,
  validateNewPassword,
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

// ---- Result ---------------------------------------------------------------

console.log(`frontend-lib-check: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
