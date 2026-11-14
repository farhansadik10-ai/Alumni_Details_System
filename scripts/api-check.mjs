// API check for REQ-fs-003. Sends real HTTP requests to a running API and
// prints PASS / FAIL / SKIP per check.
//
// IT WRITES TEST ROWS to whatever database that API uses. Run it yourself,
// on a quiet database. How to run: see api-check.md in the REQ-fs-003 folder.
//
// Settings come from environment variables only. This script reads no file,
// imports nothing from the repo, and never prints a token, a password or a
// whole response body.
//
//   API_URL                 default http://localhost:3000
//   ADMIN_EMAIL             optional; with ADMIN_PASSWORD turns on the admin checks
//   ADMIN_PASSWORD          optional
//   API_CHECK_ALLOW_REMOTE  set to 1 to allow an API_URL that is not this machine

const API_URL = (process.env.API_URL || "http://localhost:3000").replace(/\/+$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const HAS_ADMIN = ADMIN_EMAIL !== "" && ADMIN_PASSWORD !== "";

const REQUEST_TIMEOUT_MS = 15000;
const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;
const MISSING_ID = 2147483646; // fits a PostgreSQL integer; no row has it
// The last two are whole numbers too big for a PostgreSQL integer column.
const BAD_IDS = ["abc", "1.5", "0", "-3", "12abc", "2147483648", "99999999999"];
const BAD_ID_TEXT = "Invalid id";
const MAX_ERROR_TEXT = 200;

const EMAIL_TAKEN = "This email is already registered";
const USER_HAS_CONTENT =
  "This user has posts, comments or an alumni profile and cannot be deleted";
const BAD_LOGIN = "Invalid email or password";
const INVALID_VALUE = "Invalid value in request";

// Text that only PostgreSQL or its driver writes: its wording, constraint and
// index names, system names. None of it may reach a response (AC5).
const DB_TEXT =
  /violates|duplicate key|constraint|relation|syntax|invalid input|invalid byte sequence|character varying|out of range|null value|column "|does not exist|permission denied|deadlock|SQLSTATE|ECONNREFUSED|ETIMEDOUT|pg_|_fkey|_pkey|_key\b|_check\b|_idx\b|"User"/i;

// What every alumni and comment answer holds, reads and writes alike.
const ALUMNI_KEYS = [
  "id", "user_id", "department", "graduation_year", "current_company", "job_title",
  "experience", "bio", "linkedin_url", "mentorship_available", "field",
  "name", "email", "photo_url",
];
const COMMENT_KEYS = ["id", "posts_id", "parent_id", "user_id", "content", "created_at", "name", "photo_url"];

const RUN = String(Date.now());
const emailOf = (who) => `apicheck-${RUN}-${who}@example.com`;
const newPassword = () => globalThis.crypto.randomUUID();

// The test users. `token` and `password` stay in memory and are never printed.
// Carol signs up only at the end, for the two-creates-at-once check.
const people = {
  alice: { name: `Apicheck Alice ${RUN}`, email: emailOf("alice"), role: "alumni", password: newPassword() },
  bob: { name: `Apicheck Bob ${RUN}`, email: emailOf("bob"), role: "alumni", password: newPassword() },
  sam: { name: `Apicheck Sam ${RUN}`, email: emailOf("sam"), role: "student", password: newPassword() },
  dana: { name: `Apicheck Dana ${RUN}`, email: emailOf("dana"), role: "student", password: newPassword() },
  carol: { name: `Apicheck Carol ${RUN}`, email: emailOf("carol"), role: "alumni", password: newPassword() },
};
const admin = { token: undefined };

const ALICE_PROFILE = {
  department: `Apicheck Dept ${RUN}`,
  graduation_year: 2019,
  current_company: `Apicheck Co ${RUN}`,
  job_title: `Lead 100% ${RUN}`,
  field: `Apicheck Field ${RUN}`,
  mentorship_available: true,
};
// A blank department, so /filters can be checked for blank values.
// The two new fields are left out on purpose (AC14 defaults).
const BOB_PROFILE = {
  department: "   ",
  graduation_year: 2021,
  job_title: `Lead 100x ${RUN}`,
};

// Rows this run created and has not deleted yet: id -> owner key in `people`.
const livePosts = new Map();
const liveComments = new Map();
const ids = {}; // named ids the checks share: post1, c1, aliceProfile, ...
const answers = {}; // write answers kept for the shape checks: alumniCreate, commentCreate, commentUpdate
const stats = {};

// ---------------------------------------------------------------- runner

const results = [];

class Skip extends Error {}

function fail(message) {
  throw new Error(message);
}

async function check(id, ac, description, fn) {
  let status = "PASS";
  let detail = "";
  try {
    await fn();
  } catch (err) {
    status = err instanceof Skip ? "SKIP" : "FAIL";
    detail = err instanceof Error ? err.message : String(err);
  }
  results.push({ id, ac, description, status, detail });
  const line = `${status}  ${id.padEnd(4)} [${ac}] ${description}`;
  console.log(detail === "" ? line : `${line}\n        -> ${detail}`);
}

function adminCheck(id, ac, description, fn) {
  return check(id, ac, description, async () => {
    if (!HAS_ADMIN) throw new Skip("ADMIN_EMAIL and ADMIN_PASSWORD are not set");
    if (!admin.token) fail("the admin login did not work (see X01)");
    await fn();
  });
}

// ---------------------------------------------------------------- HTTP

async function api(method, path, options = {}) {
  const headers = {};
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  let body;
  if (options.rawBody !== undefined) {
    headers["Content-Type"] = "application/json";
    body = options.rawBody;
  } else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  const response = await fetch(API_URL + path, {
    method,
    headers,
    body,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const text = await response.text();
  let json;
  try {
    json = text === "" ? undefined : JSON.parse(text);
  } catch {
    json = undefined;
  }
  return { status: response.status, json, empty: text === "" };
}

const get = (path, token) => api("GET", path, { token });
const post = (path, token, body) => api("POST", path, { token, body });
const put = (path, token, body) => api("PUT", path, { token, body });
const del = (path, token) => api("DELETE", path, { token });

function query(params) {
  return "?" + new URLSearchParams(params).toString();
}

// ---------------------------------------------------------------- asserts

function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** The `error` text of a response, shortened, with nothing else from the body. */
function errorText(res) {
  if (!isObject(res.json)) return "(no JSON object in the body)";
  const text = res.json.error;
  if (typeof text !== "string") return "(no `error` text in the body)";
  return JSON.stringify(text.slice(0, MAX_ERROR_TEXT));
}

function expectStatus(res, expected) {
  if (res.status !== expected) {
    const tail = res.status >= 400 ? `, error: ${errorText(res)}` : "";
    fail(`expected status ${expected}, got ${res.status}${tail}`);
  }
}

/** An error answer: the status, the body `{ error: "<text>" }`, no `message` key, no database text. */
function expectError(res, expected, exactText) {
  expectStatus(res, expected);
  if (!isObject(res.json)) fail(`status ${expected}, but the body is not a JSON object`);
  if (typeof res.json.error !== "string" || res.json.error === "") {
    fail(`status ${expected}, but the body has no \`error\` text`);
  }
  if ("message" in res.json) fail(`status ${expected}, but the body has a \`message\` key`);
  if (DB_TEXT.test(res.json.error)) {
    fail(`the error text looks like a raw database message: ${errorText(res)}`);
  }
  if (hasDbText(res.json)) {
    fail(`status ${expected}, but a key or value beside \`error\` looks like raw database text`);
  }
  if (exactText !== undefined && res.json.error !== exactText) {
    fail(`expected error ${JSON.stringify(exactText)}, got ${errorText(res)}`);
  }
}

/** True when any key or any text anywhere in `value` matches DB_TEXT. */
function hasDbText(value) {
  if (typeof value === "string") return DB_TEXT.test(value);
  if (Array.isArray(value)) return value.some((item) => hasDbText(item));
  if (isObject(value)) {
    return Object.entries(value).some(([key, item]) => DB_TEXT.test(key) || hasDbText(item));
  }
  return false;
}

function expectNoPassword(value, where) {
  if (Array.isArray(value)) {
    value.forEach((item) => expectNoPassword(item, where));
  } else if (isObject(value)) {
    for (const key of Object.keys(value)) {
      if (key.toLowerCase() === "password") fail(`${where} has a \`password\` key`);
      expectNoPassword(value[key], where);
    }
  }
}

function expectKeys(value, keys, where) {
  if (!isObject(value)) fail(`${where} is not an object`);
  const missing = keys.filter((key) => !(key in value));
  if (missing.length > 0) fail(`${where} is missing: ${missing.join(", ")}`);
}

function expectEqual(actual, expected, what) {
  if (actual !== expected) {
    fail(`${what}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

/** A list answer `{ items, total, page, limit }`. Returns the body. */
function expectList(res, where) {
  expectStatus(res, 200);
  expectKeys(res.json, ["items", "total", "page", "limit"], where);
  if (!Array.isArray(res.json.items)) fail(`${where}: items is not an array`);
  for (const key of ["total", "page", "limit"]) {
    if (!Number.isInteger(res.json[key])) fail(`${where}: ${key} is not a whole number`);
  }
  expectNoPassword(res.json, where);
  return res.json;
}

/** A value an earlier check should have stored. */
function need(value, name) {
  if (value === undefined || value === null) {
    fail(`cannot run: ${name} is missing because an earlier step failed`);
  }
  return value;
}

const tokenOf = (who) => need(people[who].token, `${who}'s token`);
const idOf = (who) => need(people[who].id, `${who}'s user id`);

function sameJson(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function isSortedBy(list, compare) {
  return list.every((item, index) => index === 0 || compare(list[index - 1], item) <= 0);
}

// ---------------------------------------------------------------- helpers

async function signUp(who) {
  const person = people[who];
  const res = await post("/api/users", undefined, {
    name: person.name,
    email: person.email,
    password: person.password,
    role: person.role,
  });
  expectStatus(res, 201);
  expectKeys(res.json, ["id", "email", "role"], "the sign-up answer");
  expectNoPassword(res.json, "the sign-up answer");
  person.id = res.json.id;
}

async function logIn(who) {
  const person = people[who];
  const res = await post("/api/auth/login", undefined, {
    email: person.email,
    password: person.password,
  });
  expectStatus(res, 200);
  if (!isObject(res.json) || typeof res.json.token !== "string" || res.json.token === "") {
    fail("the login answer has no `token` text");
  }
  person.token = res.json.token;
}

async function readStats(name) {
  const res = await get("/api/stats", tokenOf("alice"));
  expectStatus(res, 200);
  expectKeys(res.json, ["alumni", "students", "posts", "mentoring"], "the stats answer");
  for (const key of ["alumni", "students", "posts", "mentoring"]) {
    if (!Number.isInteger(res.json[key]) || res.json[key] < 0) {
      fail(`stats.${key} is not a whole number of 0 or more`);
    }
  }
  stats[name] = res.json;
  return res.json;
}

async function createPost(who, name, caption) {
  const res = await post("/api/posts", tokenOf(who), { caption });
  expectStatus(res, 201);
  expectKeys(res.json, ["id", "user_id"], "the new post");
  ids[name] = res.json.id;
  livePosts.set(res.json.id, who);
  return res.json;
}

async function createComment(who, name, body) {
  const res = await post("/api/comments", tokenOf(who), body);
  expectStatus(res, 201);
  expectKeys(res.json, ["id", "posts_id", "parent_id", "user_id"], "the new comment");
  ids[name] = res.json.id;
  liveComments.set(res.json.id, who);
  return res.json;
}

/** The post as `GET /api/posts` shows it; looks through the first pages. */
async function postInFeed(postId) {
  const maxPages = 5;
  for (let page = 1; page <= maxPages; page += 1) {
    const list = expectList(
      await get("/api/posts" + query({ page, limit: MAX_LIMIT }), tokenOf("alice")),
      "the post list",
    );
    const found = list.items.find((item) => item.id === postId);
    if (found) return found;
    if (list.items.length < MAX_LIMIT) break;
  }
  return fail(`post ${postId} is not in the first ${maxPages} pages of GET /api/posts`);
}

async function expectCommentCount(postId, expected) {
  const found = await postInFeed(postId);
  expectEqual(found.comment_count, expected, "comment_count");
}

/** The alumni list narrowed to this run's rows (every test row holds RUN). */
function alumniList(params, who = "sam") {
  return get("/api/alumni" + query(params), tokenOf(who));
}

async function expectBadIds(method, pathOf, who) {
  for (const badId of BAD_IDS) {
    const res = await api(method, pathOf(badId), {
      token: tokenOf(who),
      body: method === "GET" || method === "DELETE" ? undefined : {},
    });
    if (res.status !== 400) {
      fail(`id "${badId}": expected status 400, got ${res.status}, error: ${errorText(res)}`);
    }
    if (res.json?.error !== BAD_ID_TEXT) {
      fail(`id "${badId}": expected error ${JSON.stringify(BAD_ID_TEXT)}, got ${errorText(res)}`);
    }
    expectError(res, 400, BAD_ID_TEXT);
  }
}

/** The comments of one post, as `GET /api/posts/:id/comments` lists them. */
async function commentsOf(postId) {
  const res = await get(`/api/posts/${postId}/comments`, tokenOf("sam"));
  expectStatus(res, 200);
  if (!Array.isArray(res.json)) fail("the comment list is not an array");
  return res.json;
}

/**
 * Confirms a three-level thread is really there before a delete: `top` has no
 * parent, `reply` hangs under `top`, `deep` under `reply`.
 */
function expectThread(list, top, reply, deep) {
  const byId = new Map(list.map((item) => [item.id, item]));
  const levels = { "the top comment": top, "the reply": reply, "the reply to the reply": deep };
  for (const [label, id] of Object.entries(levels)) {
    if (!byId.has(id)) fail(`cannot test the deep delete: ${label} is not on the post`);
  }
  expectEqual(byId.get(top).parent_id, null, "parent_id of the top comment");
  expectEqual(byId.get(reply).parent_id, top, "parent_id of the reply");
  expectEqual(byId.get(deep).parent_id, reply, "parent_id of the reply to the reply");
}

/** Every comment in `gone` answers 404 on edit. The 404 comes before the author check. */
async function expectCommentsGone(gone) {
  for (const [label, id] of Object.entries(gone)) {
    const res = await put(`/api/comments/${id}`, tokenOf("sam"), { content: "still here?" });
    if (res.status !== 404) fail(`${label}: expected status 404 on edit, got ${res.status}, error: ${errorText(res)}`);
    expectError(res, 404);
  }
}

// ---------------------------------------------------------------- checks

async function setUp() {
  await check("S01", "setup", "the API answers GET /api/health", async () => {
    const res = await get("/api/health");
    expectStatus(res, 200);
  });
  if (results[0].status !== "PASS") return false;

  await check("S02", "AC12", "sign-up of Alice (alumni) answers 201 with no password", () => signUp("alice"));
  await check("S03", "AC2", "a correct login answers 200 { token }", () => logIn("alice"));
  await check("S04", "AC26", "GET /api/stats answers { alumni, students, posts, mentoring } as whole numbers", async () => {
    await readStats("start");
  });
  await check("S05", "AC12", "sign-up and login of Bob (alumni), Sam and Dana (students)", async () => {
    for (const who of ["bob", "sam", "dana"]) {
      await signUp(who);
      await logIn(who);
    }
  });
  await check("S06", "AC26", "stats.students grows by 2 after two students sign up", async () => {
    const before = need(stats.start, "the first stats read");
    const after = await readStats("afterUsers");
    expectEqual(after.students, before.students + 2, "students");
  });
  return true;
}

async function errorShapeChecks() {
  await check("A01", "AC4", "no token answers 401 { error }", async () => {
    expectError(await get("/api/alumni"), 401);
  });
  await check("A02", "AC4", "a broken token answers 401 { error }", async () => {
    expectError(await get("/api/alumni", "not-a-real-token"), 401);
  });
  await check("A03", "AC4", "the role check answers 403 { error } (student creates a post)", async () => {
    expectError(await post("/api/posts", tokenOf("sam"), { caption: "x" }), 403);
  });
  await check("A04", "AC4", "an unknown URL under /api answers 404 { error }", async () => {
    expectError(await get(`/api/no-such-route-${RUN}`), 404);
    expectError(await post("/api/auth/no-such-route", undefined, {}), 404);
  });
  await check("A05", "AC4", "a body that is not valid JSON answers 400 { error }", async () => {
    const res = await api("POST", "/api/auth/login", { rawBody: '{"email": ' });
    expectError(res, 400);
  });
  await check("A06", "AC3", "errors from the token check, a controller, a Manager and a missing route share one shape", async () => {
    expectError(await get("/api/stats"), 401);
    expectError(await get("/api/users/abc", tokenOf("alice")), 400);
    const taken = { name: "Copy", email: people.alice.email, password: newPassword(), role: "student" };
    expectError(await post("/api/users", undefined, taken), 409);
    expectError(await get(`/api/alumni/${MISSING_ID}`, tokenOf("alice")), 404);
  });
  await check("A07", "AC5", "a value too long for its column answers 400 with the fixed text and no database text", async () => {
    // "User".name and "User".email hold 100 characters.
    const bodies = {
      "name of 150 characters": { name: "n".repeat(150), email: emailOf("longname") },
      "email of 150 characters": { name: "X", email: `apicheck-${RUN}-${"e".repeat(150)}@example.com` },
    };
    for (const [label, body] of Object.entries(bodies)) {
      const res = await post("/api/users", undefined, { ...body, password: newPassword(), role: "student" });
      if (res.status === 201) fail(`${label}: the sign-up was accepted; that user row now exists`);
      if (res.status !== 400) fail(`${label}: expected status 400, got ${res.status}, error: ${errorText(res)}`);
      expectError(res, 400, INVALID_VALUE);
    }
  });
  await check("A08", "AC5", "text the database cannot store (a zero byte) answers 400 with the fixed text and no database text", async () => {
    const res = await post("/api/users", undefined, {
      name: "zero\u0000byte",
      email: emailOf("zerobyte"),
      password: newPassword(),
      role: "student",
    });
    if (res.status === 201) fail("the sign-up was accepted; that user row now exists");
    expectError(res, 400, INVALID_VALUE);
  });
}

async function idChecks() {
  await check("B01", "AC6", "GET /api/users/:id refuses abc, 1.5, 0, -3, 12abc, 2147483648, 99999999999 with 400 Invalid id", () =>
    expectBadIds("GET", (id) => `/api/users/${id}`, "alice"));
  await check("B02", "AC6", "PUT /api/users/:id refuses the bad ids with 400", () =>
    expectBadIds("PUT", (id) => `/api/users/${id}`, "alice"));
  await check("B03", "AC6", "PUT /api/users/:id/logout refuses the bad ids with 400", () =>
    expectBadIds("PUT", (id) => `/api/users/${id}/logout`, "alice"));
  await check("B04", "AC6", "GET /api/alumni/:id refuses the bad ids with 400", () =>
    expectBadIds("GET", (id) => `/api/alumni/${id}`, "alice"));
  await check("B05", "AC6", "PUT /api/alumni/:id refuses the bad ids with 400", () =>
    expectBadIds("PUT", (id) => `/api/alumni/${id}`, "alice"));
  await check("B06", "AC6", "PUT /api/posts/:id refuses the bad ids with 400", () =>
    expectBadIds("PUT", (id) => `/api/posts/${id}`, "alice"));
  await check("B07", "AC6", "DELETE /api/posts/:id refuses the bad ids with 400", () =>
    expectBadIds("DELETE", (id) => `/api/posts/${id}`, "alice"));
  await check("B08", "AC6", "GET /api/posts/:id/comments refuses the bad ids with 400", () =>
    expectBadIds("GET", (id) => `/api/posts/${id}/comments`, "alice"));
  await check("B09", "AC6", "PUT /api/comments/:id refuses the bad ids with 400", () =>
    expectBadIds("PUT", (id) => `/api/comments/${id}`, "alice"));
  await check("B10", "AC6", "DELETE /api/comments/:id refuses the bad ids with 400", () =>
    expectBadIds("DELETE", (id) => `/api/comments/${id}`, "alice"));
}

async function signUpAndLoginChecks() {
  await check("C01", "AC7", "sign-up with a taken email answers 409 with the exact message", async () => {
    const res = await post("/api/users", undefined, {
      name: "Copy",
      email: people.alice.email,
      password: newPassword(),
      role: "student",
    });
    expectError(res, 409, EMAIL_TAKEN);
  });
  await check("C02", "AC7", "a user update to a taken email answers 409 with the exact message", async () => {
    const res = await put(`/api/users/${idOf("bob")}`, tokenOf("bob"), { email: people.alice.email });
    expectError(res, 409, EMAIL_TAKEN);
  });
  await check("C03", "AC8", "sign-up with email or password missing, empty or not text answers 400", async () => {
    const good = { name: "X", email: emailOf("never"), password: newPassword(), role: "student" };
    const bodies = {
      "no email": { ...good, email: undefined },
      "no password": { ...good, password: undefined },
      "empty email": { ...good, email: "" },
      "empty password": { ...good, password: "" },
      "email is a number": { ...good, email: 12345 },
      "password is a number": { ...good, password: 12345 },
    };
    for (const [label, body] of Object.entries(bodies)) {
      const res = await post("/api/users", undefined, body);
      if (res.status !== 400) fail(`${label}: expected status 400, got ${res.status}, error: ${errorText(res)}`);
      expectError(res, 400);
    }
  });
  await check("C04", "AC8", "login with email or password missing or not text answers 400", async () => {
    const bodies = {
      "no email": { password: "x" },
      "no password": { email: people.alice.email },
      "email is a number": { email: 5, password: "x" },
      "password is a number": { email: people.alice.email, password: 5 },
      "empty body": {},
    };
    for (const [label, body] of Object.entries(bodies)) {
      const res = await post("/api/auth/login", undefined, body);
      if (res.status !== 400) fail(`${label}: expected status 400, got ${res.status}, error: ${errorText(res)}`);
      expectError(res, 400);
    }
  });
  await check("C05", "AC8", "a wrong email and a wrong password both answer 401 with the same message", async () => {
    const wrongEmail = await post("/api/auth/login", undefined, { email: emailOf("nobody"), password: newPassword() });
    const wrongPassword = await post("/api/auth/login", undefined, { email: people.alice.email, password: newPassword() });
    expectError(wrongEmail, 401, BAD_LOGIN);
    expectError(wrongPassword, 401, BAD_LOGIN);
  });
  await check("C06", "AC8", "a login password of only spaces answers 401 (it is compared, not trimmed)", async () => {
    const res = await post("/api/auth/login", undefined, { email: people.alice.email, password: "   " });
    expectError(res, 401, BAD_LOGIN);
  });
  await check("C07", "AC12", "sign-up with role admin answers 400", async () => {
    const res = await post("/api/users", undefined, {
      name: "X",
      email: emailOf("wantsadmin"),
      password: newPassword(),
      role: "admin",
    });
    expectError(res, 400);
  });
}

async function lookupChecks() {
  await check("D01", "AC9", "GET /api/users/:id for no user answers 404; for Alice 200 with no password", async () => {
    expectError(await get(`/api/users/${MISSING_ID}`, tokenOf("sam")), 404);
    const res = await get(`/api/users/${idOf("alice")}`, tokenOf("sam"));
    expectStatus(res, 200);
    expectEqual(res.json?.email, people.alice.email, "email");
    expectNoPassword(res.json, "the user");
  });
  await check("D02", "AC9", "GET /api/alumni/:id for no profile answers 404", async () => {
    expectError(await get(`/api/alumni/${MISSING_ID}`, tokenOf("sam")), 404);
  });
  await check("D03", "AC9", "GET /api/alumni/email/:email answers 404 for an unknown email and for a user with no profile", async () => {
    expectError(await get(`/api/alumni/email/${encodeURIComponent(emailOf("nobody"))}`, tokenOf("sam")), 404);
    expectError(await get(`/api/alumni/email/${encodeURIComponent(people.sam.email)}`, tokenOf("sam")), 404);
  });
  await adminCheck("D04", "AC9", "GET /api/users/email/:email answers 404 for an unknown email; 200 with no password for Alice", async () => {
    expectError(await get(`/api/users/email/${encodeURIComponent(emailOf("nobody"))}`, admin.token), 404);
    const res = await get(`/api/users/email/${encodeURIComponent(people.alice.email)}`, admin.token);
    expectStatus(res, 200);
    expectEqual(res.json?.id, idOf("alice"), "id");
    expectNoPassword(res.json, "the user");
  });
  await check("D05", "AC12", "GET /api/users/email/:email by a non-admin answers 403", async () => {
    expectError(await get(`/api/users/email/${encodeURIComponent(people.alice.email)}`, tokenOf("alice")), 403);
  });
}

async function alumniWriteChecks() {
  await check("E01", "AC12", "a student creating an alumni profile answers 403", async () => {
    expectError(await post("/api/alumni", tokenOf("sam"), { department: "x" }), 403);
  });
  await check("E02", "AC14", "POST /api/alumni with a wrong type for mentorship_available or field answers 400 and creates nothing", async () => {
    const wrongFlag = await post("/api/alumni", tokenOf("alice"), { ...ALICE_PROFILE, mentorship_available: "yes" });
    expectError(wrongFlag, 400, "mentorship_available has the wrong type");
    const wrongField = await post("/api/alumni", tokenOf("alice"), { ...ALICE_PROFILE, field: 5 });
    expectError(wrongField, 400, "field has the wrong type");
    expectError(await get("/api/alumni/me", tokenOf("alice")), 404);
  });
  await check("E03", "AC23", "GET /api/alumni/me answers 404 for a user with no profile (Sam)", async () => {
    expectError(await get("/api/alumni/me", tokenOf("sam")), 404);
  });
  await check("E04", "AC14", "POST /api/alumni accepts mentorship_available and field and returns them", async () => {
    const res = await post("/api/alumni", tokenOf("alice"), { ...ALICE_PROFILE, user_id: idOf("bob") });
    expectStatus(res, 201);
    expectKeys(res.json, ["id", "user_id", "mentorship_available", "field"], "the new profile");
    expectEqual(res.json.mentorship_available, true, "mentorship_available");
    expectEqual(res.json.field, ALICE_PROFILE.field, "field");
    expectEqual(res.json.user_id, idOf("alice"), "user_id (a user_id in the body must be ignored)");
    ids.aliceProfile = res.json.id;
    answers.alumniCreate = res.json;
  });
  await check("E05", "AC14", "POST /api/alumni without the two fields stores false and null", async () => {
    const res = await post("/api/alumni", tokenOf("bob"), BOB_PROFILE);
    expectStatus(res, 201);
    expectKeys(res.json, ["id", "mentorship_available", "field"], "the new profile");
    expectEqual(res.json.mentorship_available, false, "mentorship_available");
    expectEqual(res.json.field, null, "field");
    ids.bobProfile = res.json.id;
  });
  await check("E06", "AC26", "stats: alumni grows by 2 and mentoring by 1 after the two profiles", async () => {
    const before = need(stats.afterUsers, "the second stats read");
    const after = await readStats("afterProfiles");
    expectEqual(after.alumni, before.alumni + 2, "alumni");
    expectEqual(after.mentoring, before.mentoring + 1, "mentoring");
  });
  await check("E07", "AC24", "a second profile for the same user answers 409 and creates nothing", async () => {
    const res = await post("/api/alumni", tokenOf("alice"), { department: `Second ${RUN}` });
    expectError(res, 409);
    const list = expectList(await alumniList({ q: people.alice.name }), "the alumni list");
    expectEqual(list.total, 1, "profiles for Alice");
    const counts = await readStats("afterSecondTry");
    expectEqual(counts.alumni, need(stats.afterProfiles, "the third stats read").alumni, "stats.alumni");
  });
  await check("E08", "AC23", "GET /api/alumni/me answers the caller's profile, the same as GET /api/alumni/:id", async () => {
    const mine = await get("/api/alumni/me", tokenOf("alice"));
    expectStatus(mine, 200);
    expectEqual(mine.json?.id, need(ids.aliceProfile, "Alice's profile id"), "id");
    const byId = await get(`/api/alumni/${ids.aliceProfile}`, tokenOf("alice"));
    expectStatus(byId, 200);
    if (!sameJson(mine.json, byId.json)) fail("/me and /:id gave different bodies for the same profile");
  });
  await check("E09", "AC16", "every alumni read has mentorship_available and field, and no password", async () => {
    const profileId = need(ids.aliceProfile, "Alice's profile id");
    const reads = {
      "/:id": await get(`/api/alumni/${profileId}`, tokenOf("sam")),
      "/email/:email": await get(`/api/alumni/email/${encodeURIComponent(people.alice.email)}`, tokenOf("sam")),
      "/me": await get("/api/alumni/me", tokenOf("alice")),
    };
    for (const [label, res] of Object.entries(reads)) {
      expectStatus(res, 200);
      expectKeys(res.json, ["mentorship_available", "field", "name", "email", "photo_url"], `GET /api/alumni${label}`);
      expectEqual(res.json.mentorship_available, true, `${label} mentorship_available`);
      expectEqual(res.json.field, ALICE_PROFILE.field, `${label} field`);
      expectNoPassword(res.json, `GET /api/alumni${label}`);
    }
    const list = expectList(await alumniList({ q: people.alice.name }), "the alumni list");
    expectKeys(list.items[0], ["mentorship_available", "field"], "a list item");
  });
  await check("E10", "AC16", "the POST /api/alumni answer has the same fields as a read: name, email, photo_url, no password", async () => {
    const created = need(answers.alumniCreate, "the answer of POST /api/alumni (see E04)");
    expectKeys(created, ALUMNI_KEYS, "the POST /api/alumni answer");
    expectEqual(created.name, people.alice.name, "name");
    expectEqual(created.email, people.alice.email, "email");
    expectNoPassword(created, "the POST /api/alumni answer");
  });
}

async function alumniListChecks() {
  await check("F01", "AC18", "GET /api/alumni: list shape, defaults page 1 and limit 12, item fields, no password, open to a student", async () => {
    const list = expectList(await get("/api/alumni", tokenOf("sam")), "the alumni list");
    expectEqual(list.page, 1, "page");
    expectEqual(list.limit, DEFAULT_LIMIT, "limit");
    if (list.items.length > DEFAULT_LIMIT) fail(`more than ${DEFAULT_LIMIT} items came back`);
    if (list.items.length === 0) fail("the list is empty, but two profiles were just created");
    list.items.forEach((item) => expectKeys(item, ALUMNI_KEYS, "a list item"));
    const mine = expectList(await alumniList({ q: people.alice.name }), "the alumni list");
    expectEqual(mine.items[0]?.name, people.alice.name, "name");
    expectEqual(mine.items[0]?.email, people.alice.email, "email");
  });
  await check("F02", "AC18", "paging: limit=500 becomes 50; page=0, limit=0, page=abc, limit=1.5, limit=-1 answer 400", async () => {
    const big = expectList(await alumniList({ limit: 500 }), "the alumni list");
    expectEqual(big.limit, MAX_LIMIT, "limit");
    if (big.items.length > MAX_LIMIT) fail(`more than ${MAX_LIMIT} items came back`);
    const bad = [{ page: 0 }, { limit: 0 }, { page: "abc" }, { limit: "1.5" }, { limit: -1 }];
    for (const params of bad) {
      const res = await alumniList(params);
      if (res.status !== 400) fail(`${query(params)}: expected status 400, got ${res.status}, error: ${errorText(res)}`);
      expectError(res, 400);
    }
  });
  await check("F03", "AC18", "total counts every match; limit=1 gives one item per page; a page past the end is 200 with no items", async () => {
    const first = expectList(await alumniList({ q: RUN, limit: 1, page: 1 }), "page 1");
    const second = expectList(await alumniList({ q: RUN, limit: 1, page: 2 }), "page 2");
    const past = expectList(await alumniList({ q: RUN, limit: 1, page: 999 }), "page 999");
    expectEqual(first.total, 2, "total on page 1");
    expectEqual(second.total, 2, "total on page 2");
    expectEqual(past.total, 2, "total on a page past the end");
    expectEqual(first.items.length, 1, "items on page 1");
    expectEqual(second.items.length, 1, "items on page 2");
    expectEqual(past.items.length, 0, "items on a page past the end");
    expectEqual(past.page, 999, "page");
    if (first.items[0].id === second.items[0].id) fail("pages 1 and 2 hold the same profile");
  });
  await check("F04", "AC19", "q matches part of the name, the company or the job title, ignoring case", async () => {
    const byName = expectList(await alumniList({ q: `ALICE ${RUN}` }), "q by name");
    expectEqual(byName.total, 1, "matches for part of the name in capitals");
    expectEqual(byName.items[0]?.id, need(ids.aliceProfile, "Alice's profile id"), "profile id");
    const byCompany = expectList(await alumniList({ q: `apicheck co ${RUN}` }), "q by company");
    expectEqual(byCompany.total, 1, "matches for the company in small letters");
    const byTitle = expectList(await alumniList({ q: `lead 100x ${RUN}` }), "q by job title");
    expectEqual(byTitle.total, 1, "matches for the job title");
    expectEqual(byTitle.items[0]?.id, need(ids.bobProfile, "Bob's profile id"), "profile id");
  });
  await check("F05", "AC19", "% and _ in q are plain characters, not wildcards", async () => {
    const percent = expectList(await alumniList({ q: `100% ${RUN}` }), "q with %");
    expectEqual(percent.total, 1, 'matches for "100% <run>" (2 means % worked as a wildcard)');
    expectEqual(percent.items[0]?.id, need(ids.aliceProfile, "Alice's profile id"), "profile id");
    const underscore = expectList(await alumniList({ q: `100_ ${RUN}` }), "q with _");
    expectEqual(underscore.total, 0, 'matches for "100_ <run>" (2 means _ worked as a wildcard)');
    const onlyPercent = expectList(await alumniList({ q: `%${RUN}%` }), "q wrapped in %");
    expectEqual(onlyPercent.total, 0, 'matches for "%<run>%"');
  });
  await check("F06", "AC20", "department alone matches the whole value only", async () => {
    const whole = expectList(await alumniList({ department: ALICE_PROFILE.department }), "department filter");
    expectEqual(whole.total, 1, "matches for the whole department");
    expectEqual(whole.items[0]?.department, ALICE_PROFILE.department, "department");
    const part = expectList(await alumniList({ department: `Dept ${RUN}` }), "department filter");
    expectEqual(part.total, 0, "matches for part of the department");
  });
  await check("F07", "AC20", "graduation_year alone keeps only that year; a value that is not a whole number answers 400", async () => {
    const list = expectList(await alumniList({ graduation_year: 2019, limit: MAX_LIMIT }), "graduation_year filter");
    if (list.items.some((item) => item.graduation_year !== 2019)) fail("an item has another graduation_year");
    if (!list.items.some((item) => item.id === ids.aliceProfile)) fail("Alice's profile (2019) is not in the list");
    for (const value of ["abc", "2020.5", "20x", "99999999999"]) {
      const res = await alumniList({ graduation_year: value });
      if (res.status !== 400) fail(`graduation_year=${value}: expected status 400, got ${res.status}, error: ${errorText(res)}`);
      expectError(res, 400);
    }
  });
  await check("F08", "AC20", "field alone matches the whole value only", async () => {
    const whole = expectList(await alumniList({ field: ALICE_PROFILE.field }), "field filter");
    expectEqual(whole.total, 1, "matches for the whole field");
    expectEqual(whole.items[0]?.field, ALICE_PROFILE.field, "field");
    const part = expectList(await alumniList({ field: `Field ${RUN}` }), "field filter");
    expectEqual(part.total, 0, "matches for part of the field");
  });
  await check("F09", "AC20", "mentoring=true keeps only open profiles; mentoring=false and mentoring=yes answer 400", async () => {
    const list = expectList(await alumniList({ mentoring: "true", limit: MAX_LIMIT }), "mentoring filter");
    if (list.items.some((item) => item.mentorship_available !== true)) fail("an item is not open to mentoring");
    if (!list.items.some((item) => item.id === ids.aliceProfile)) fail("Alice's profile (open) is not in the list");
    const run = expectList(await alumniList({ mentoring: "true", q: RUN }), "mentoring filter");
    expectEqual(run.total, 1, "open profiles of this run (Bob is not open)");
    expectError(await alumniList({ mentoring: "false" }), 400);
    expectError(await alumniList({ mentoring: "yes" }), 400);
  });
  await check("F10", "AC20", "filters combine with AND; a filter sent empty counts as not sent", async () => {
    const all = {
      q: RUN,
      department: ALICE_PROFILE.department,
      graduation_year: 2019,
      field: ALICE_PROFILE.field,
      mentoring: "true",
    };
    const match = expectList(await alumniList(all), "all filters");
    expectEqual(match.total, 1, "matches with every filter set to Alice's values");
    expectEqual(match.items[0]?.id, need(ids.aliceProfile, "Alice's profile id"), "profile id");
    const miss = expectList(await alumniList({ ...all, graduation_year: 2021 }), "all filters, other year");
    expectEqual(miss.total, 0, "matches when one filter does not fit");
    const empty = expectList(
      await alumniList({ q: RUN, department: "", graduation_year: "", field: "", mentoring: "" }),
      "empty filters",
    );
    expectEqual(empty.total, 2, "matches when the other filters are sent empty");
  });
  await check("F11", "AC21", "the alumni list is newest first (highest id): Bob's profile before Alice's, the same on a second call", async () => {
    const whole = expectList(await alumniList({ limit: MAX_LIMIT }), "the alumni list");
    if (!isSortedBy(whole.items, (a, b) => b.id - a.id)) fail("the ids are not in falling order");
    // Only this run's two profiles are compared, so a profile someone else
    // adds during the run cannot fail the check.
    const expected = [need(ids.bobProfile, "Bob's profile id"), need(ids.aliceProfile, "Alice's profile id")];
    if (!(expected[0] > expected[1])) fail("cannot run: Bob's profile was expected to have the higher id");
    const first = expectList(await alumniList({ q: RUN }), "this run's profiles");
    const second = expectList(await alumniList({ q: RUN }), "this run's profiles");
    if (!sameJson(first.items.map((item) => item.id), expected)) {
      fail("this run's two profiles are not in newest-first order (Bob's, then Alice's)");
    }
    if (!sameJson(second.items.map((item) => item.id), expected)) {
      fail("two calls with the same query gave a different order");
    }
  });
  await check("F12", "AC22", "GET /api/alumni/filters: three sorted lists of distinct values, no null or blank", async () => {
    const res = await get("/api/alumni/filters", tokenOf("sam"));
    expectStatus(res, 200);
    expectKeys(res.json, ["departments", "graduation_years", "fields"], "the filters answer");
    const { departments, graduation_years: years, fields } = res.json;
    for (const [label, list] of Object.entries({ departments, fields })) {
      if (!Array.isArray(list)) fail(`${label} is not an array`);
      if (list.some((value) => typeof value !== "string" || value.trim() === "")) {
        fail(`${label} holds a null or blank value (Bob's department is three spaces)`);
      }
      if (new Set(list).size !== list.length) fail(`${label} holds a value twice`);
      // The database sorts by its own collation, so either plain order passes.
      const byCode = isSortedBy(list, (a, b) => (a < b ? -1 : a > b ? 1 : 0));
      const byLocale = isSortedBy(list, (a, b) => a.localeCompare(b));
      if (!byCode && !byLocale) fail(`${label} is not sorted A to Z`);
    }
    if (!Array.isArray(years)) fail("graduation_years is not an array");
    if (years.some((value) => !Number.isInteger(value))) fail("graduation_years holds a value that is not a whole number");
    if (!years.every((value, index) => index === 0 || years[index - 1] < value)) {
      fail("graduation_years is not sorted low to high without repeats");
    }
    if (!departments.includes(ALICE_PROFILE.department)) fail("Alice's department is missing");
    if (!fields.includes(ALICE_PROFILE.field)) fail("Alice's field is missing");
    if (!years.includes(2019) || !years.includes(2021)) fail("2019 or 2021 is missing from graduation_years");
  });
  await check("F13", "AC20", "a query key sent twice (?department=a&department=b) answers 400", async () => {
    for (const key of ["q", "department", "graduation_year", "field", "mentoring"]) {
      const res = await get(`/api/alumni?${key}=a&${key}=b`, tokenOf("sam"));
      if (res.status !== 400) fail(`${key} sent twice: expected status 400, got ${res.status}, error: ${errorText(res)}`);
      expectError(res, 400, `${key} must be a single value`);
    }
    for (const key of ["page", "limit"]) {
      const res = await get(`/api/alumni?${key}=1&${key}=2`, tokenOf("sam"));
      if (res.status !== 400) fail(`${key} sent twice: expected status 400, got ${res.status}, error: ${errorText(res)}`);
      expectError(res, 400);
    }
  });
}

async function alumniUpdateChecks() {
  const path = () => `/api/alumni/${need(ids.aliceProfile, "Alice's profile id")}`;

  await check("G01", "AC15", "PUT /api/alumni/:id: a field that is not sent keeps its value", async () => {
    const res = await put(path(), tokenOf("alice"), { bio: `Bio ${RUN}` });
    expectStatus(res, 200);
    expectKeys(res.json, ["mentorship_available", "field", "bio", "department"], "the updated profile");
    expectEqual(res.json.bio, `Bio ${RUN}`, "bio");
    expectEqual(res.json.field, ALICE_PROFILE.field, "field");
    expectEqual(res.json.mentorship_available, true, "mentorship_available");
    expectEqual(res.json.department, ALICE_PROFILE.department, "department");
  });
  await check("G02", "AC15", "PUT /api/alumni/:id: field null clears it; mentorship_available false is stored", async () => {
    const cleared = await put(path(), tokenOf("alice"), { field: null });
    expectStatus(cleared, 200);
    expectEqual(cleared.json?.field, null, "field");
    expectEqual(cleared.json?.mentorship_available, true, "mentorship_available");
    const closed = await put(path(), tokenOf("alice"), { mentorship_available: false });
    expectStatus(closed, 200);
    expectEqual(closed.json?.mentorship_available, false, "mentorship_available");
    const read = await get(path(), tokenOf("alice"));
    expectStatus(read, 200);
    expectEqual(read.json?.field, null, "field when read back");
    expectEqual(read.json?.mentorship_available, false, "mentorship_available when read back");
    expectEqual(read.json?.bio, `Bio ${RUN}`, "bio when read back");
  });
  await check("G03", "AC15", "PUT /api/alumni/:id: mentorship_available null or text answers 400; field as a number answers 400", async () => {
    expectError(await put(path(), tokenOf("alice"), { mentorship_available: null }), 400);
    expectError(await put(path(), tokenOf("alice"), { mentorship_available: "true" }), 400);
    expectError(await put(path(), tokenOf("alice"), { field: 7 }), 400);
  });
  await check("G04", "AC16", "the update answer has mentorship_available and field; stats.mentoring follows the change", async () => {
    const res = await put(path(), tokenOf("alice"), { field: ALICE_PROFILE.field, mentorship_available: true });
    expectStatus(res, 200);
    expectKeys(res.json, ["mentorship_available", "field"], "the updated profile");
    expectEqual(res.json.mentorship_available, true, "mentorship_available");
    expectEqual(res.json.field, ALICE_PROFILE.field, "field");
    const counts = await readStats("afterUpdates");
    expectEqual(counts.mentoring, need(stats.afterProfiles, "the third stats read").mentoring, "stats.mentoring");
  });
  await check("G05", "AC12", "editing someone else's profile answers 403; no fields answers 400; a missing profile answers 404", async () => {
    expectError(await put(path(), tokenOf("bob"), { bio: "not mine" }), 403);
    expectError(await put(path(), tokenOf("alice"), {}), 400);
    expectError(await put(path(), tokenOf("alice"), { user_id: idOf("bob") }), 400);
    expectError(await put(`/api/alumni/${MISSING_ID}`, tokenOf("alice"), { bio: "x" }), 404);
    const read = await get(path(), tokenOf("alice"));
    expectEqual(read.json?.bio, `Bio ${RUN}`, "bio after the refused edit");
    expectEqual(read.json?.user_id, idOf("alice"), "user_id");
  });
  await check("G06", "AC16", "the PUT /api/alumni/:id answer has the same fields as a read: name, email, photo_url, no password", async () => {
    const res = await put(path(), tokenOf("alice"), { bio: `Bio ${RUN}` });
    expectStatus(res, 200);
    expectKeys(res.json, ALUMNI_KEYS, "the PUT /api/alumni/:id answer");
    expectEqual(res.json.name, people.alice.name, "name");
    expectEqual(res.json.email, people.alice.email, "email");
    expectNoPassword(res.json, "the PUT /api/alumni/:id answer");
  });
}

async function userRuleChecks() {
  await check("H01", "AC12", "editing another user answers 403; logging another user out answers 403", async () => {
    expectError(await put(`/api/users/${idOf("alice")}`, tokenOf("bob"), { name: "Hacked" }), 403);
    expectError(await put(`/api/users/${idOf("alice")}/logout`, tokenOf("bob")), 403);
  });
  await check("H02", "AC12", "a user edits their own name: 200, no password, role cannot be changed", async () => {
    const res = await put(`/api/users/${idOf("sam")}`, tokenOf("sam"), { name: people.sam.name, role: "admin" });
    expectStatus(res, 200);
    expectNoPassword(res.json, "the updated user");
    expectEqual(res.json?.role, "student", "role");
    expectError(await put(`/api/users/${idOf("sam")}`, tokenOf("sam"), { role: "admin" }), 400);
    expectError(await put(`/api/users/${idOf("sam")}`, tokenOf("sam"), { email: "   " }), 400);
  });
  await check("H03", "AC12", "PUT /api/users/:id/logout for yourself answers 200", async () => {
    expectStatus(await put(`/api/users/${idOf("dana")}/logout`, tokenOf("dana")), 200);
  });
  await check("H04", "AC25", "GET /api/users by a non-admin answers 403 { error }", async () => {
    expectError(await get("/api/users", tokenOf("alice")), 403);
  });
  await check("H05", "AC33", "DELETE /api/users/:id by a non-admin answers 403 and deletes nothing", async () => {
    expectError(await del(`/api/users/${idOf("dana")}`, tokenOf("alice")), 403);
    expectStatus(await get(`/api/users/${idOf("dana")}`, tokenOf("alice")), 200);
  });
  await check("H06", "AC12", "a user changes their own password: login with the new one answers 200, with the old one 401", async () => {
    const oldPassword = people.dana.password;
    const changed = newPassword();
    const res = await put(`/api/users/${idOf("dana")}`, tokenOf("dana"), { password: changed });
    expectStatus(res, 200);
    people.dana.password = changed;
    expectNoPassword(res.json, "the updated user");
    await logIn("dana");
    const old = await post("/api/auth/login", undefined, { email: people.dana.email, password: oldPassword });
    expectError(old, 401, BAD_LOGIN);
  });
}

async function feedChecks() {
  await check("I01", "AC12", "POST /api/posts: 201; the author is the caller even with a user_id in the body", async () => {
    const res = await post("/api/posts", tokenOf("alice"), { caption: `First ${RUN}`, user_id: idOf("bob") });
    expectStatus(res, 201);
    expectEqual(res.json?.user_id, idOf("alice"), "user_id");
    expectEqual(res.json?.comment_count, 0, "comment_count");
    ids.post1 = res.json.id;
    livePosts.set(res.json.id, "alice");
  });
  await check("I02", "AC12", "POST /api/posts with a caption that is not text answers 400", async () => {
    expectError(await post("/api/posts", tokenOf("alice"), { caption: 5 }), 400, "caption has the wrong type");
  });
  await check("I03", "AC26", "stats.posts grows by 1 after a post", async () => {
    const counts = await readStats("afterPost");
    expectEqual(counts.posts, need(stats.afterUpdates, "the stats read before the post").posts + 1, "posts");
  });
  await check("I04", "AC27", "GET /api/posts: list shape, defaults, author name and photo_url, no password", async () => {
    await createPost("alice", "post2", `Second ${RUN}`);
    await createPost("bob", "post3", `Bob's ${RUN}`);
    const list = expectList(await get("/api/posts", tokenOf("sam")), "the post list");
    expectEqual(list.page, 1, "page");
    expectEqual(list.limit, DEFAULT_LIMIT, "limit");
    list.items.forEach((item) =>
      expectKeys(item, ["id", "user_id", "caption", "media_url", "created_at", "updated_at", "comment_count", "name", "photo_url"], "a post"));
    const mine = await postInFeed(need(ids.post1, "the first post's id"));
    expectEqual(mine.name, people.alice.name, "author name");
    expectEqual(mine.caption, `First ${RUN}`, "caption");
  });
  await check("I05", "AC27", "the post list is newest first", async () => {
    const list = expectList(await get("/api/posts" + query({ limit: MAX_LIMIT }), tokenOf("sam")), "the post list");
    const times = list.items.map((item) => Date.parse(item.created_at));
    if (times.some((time) => Number.isNaN(time))) fail("a post has no readable created_at");
    if (!times.every((time, index) => index === 0 || times[index - 1] >= time)) fail("created_at is not in falling order");
    const order = list.items.map((item) => item.id);
    const at = (name) => order.indexOf(need(ids[name], `${name}'s id`));
    if (at("post1") < 0 || at("post2") < 0 || at("post3") < 0) fail("the three new posts are not all on the first page of 50");
    if (!(at("post3") < at("post2") && at("post2") < at("post1"))) fail("the three new posts are not in newest-first order");
  });
  await check("I06", "AC27", "post paging: limit=500 becomes 50; page=0 and limit=abc answer 400; a page past the end is empty with the right total", async () => {
    const big = expectList(await get("/api/posts" + query({ limit: 500 }), tokenOf("sam")), "the post list");
    expectEqual(big.limit, MAX_LIMIT, "limit");
    expectError(await get("/api/posts" + query({ page: 0 }), tokenOf("sam")), 400);
    expectError(await get("/api/posts" + query({ limit: "abc" }), tokenOf("sam")), 400);
    const past = expectList(await get("/api/posts" + query({ page: 1000000, limit: 1 }), tokenOf("sam")), "a page past the end");
    expectEqual(past.items.length, 0, "items");
    expectEqual(past.total, big.total, "total");
  });
  await check("I07", "AC32", "editing someone else's post answers 403; the author's edit answers 200", async () => {
    const path = `/api/posts/${need(ids.post1, "the first post's id")}`;
    expectError(await put(path, tokenOf("bob"), { caption: "not mine" }), 403);
    expectError(await put(path, tokenOf("alice"), {}), 400);
    const res = await put(path, tokenOf("alice"), { caption: `First ${RUN}`, media_url: null });
    expectStatus(res, 200);
    expectEqual(res.json?.caption, `First ${RUN}`, "caption");
    expectError(await put(`/api/posts/${MISSING_ID}`, tokenOf("alice"), { caption: "x" }), 404);
  });
}

async function commentChecks() {
  const post1 = () => need(ids.post1, "the first post's id");

  await check("J01", "AC10", "a comment on a post that does not exist answers 404", async () => {
    expectError(await post("/api/comments", tokenOf("sam"), { posts_id: MISSING_ID, content: "x" }), 404);
  });
  await check("J02", "AC10", "posts_id or parent_id that is not a positive whole number answers 400", async () => {
    // `post_id` was the old body key; only `posts_id` (the column's name) is read now.
    for (const body of [{ content: "x" }, { post_id: post1(), content: "x" }, { posts_id: "abc", content: "x" }, { posts_id: 0, content: "x" }, { posts_id: 1.5, content: "x" }]) {
      expectError(await post("/api/comments", tokenOf("sam"), body), 400);
    }
    expectError(await post("/api/comments", tokenOf("sam"), { posts_id: post1(), parent_id: "abc", content: "x" }), 400);
    expectError(await post("/api/comments", tokenOf("sam"), { posts_id: MISSING_ID, parent_id: "abc", content: "x" }), 400);
    expectError(await post("/api/comments", tokenOf("sam"), { posts_id: post1(), content: 5 }), 400, "Content is required");
    expectError(await post("/api/comments", tokenOf("sam"), { posts_id: 99999999999, content: "x" }), 400, "Invalid posts_id");
    expectError(await post("/api/comments", tokenOf("sam"), { posts_id: post1(), parent_id: 99999999999, content: "x" }), 400, "Invalid parent_id");
  });
  await check("J03", "AC28", "comment_count is 0 on a new post and 1 after a comment", async () => {
    await expectCommentCount(post1(), 0);
    const created = await createComment("sam", "c1", { posts_id: post1(), content: `Top ${RUN}`, user_id: idOf("bob") });
    answers.commentCreate = created;
    expectEqual(created.user_id, idOf("sam"), "user_id (a user_id in the body must be ignored)");
    expectEqual(created.posts_id, post1(), "posts_id");
    expectEqual(created.parent_id, null, "parent_id");
    await expectCommentCount(post1(), 1);
  });
  await check("J04", "AC10", "a parent_id that does not exist, or is on another post, answers 400 and adds nothing", async () => {
    expectError(await post("/api/comments", tokenOf("sam"), { posts_id: post1(), parent_id: MISSING_ID, content: "x" }), 400);
    const otherPost = need(ids.post2, "the second post's id");
    expectError(await post("/api/comments", tokenOf("sam"), { posts_id: otherPost, parent_id: need(ids.c1, "the first comment's id"), content: "x" }), 400);
    await expectCommentCount(post1(), 1);
    await expectCommentCount(otherPost, 0);
  });
  await check("J05", "AC28", "comment_count counts replies: 3 after two nested replies, 4 after a second top comment", async () => {
    const r1 = await createComment("bob", "r1", { posts_id: post1(), parent_id: need(ids.c1, "the first comment's id"), content: `Reply ${RUN}` });
    expectEqual(r1.parent_id, ids.c1, "parent_id of the reply");
    await createComment("alice", "r2", { posts_id: post1(), parent_id: r1.id, content: `Reply to reply ${RUN}` });
    await expectCommentCount(post1(), 3);
    await createComment("sam", "s1", { posts_id: post1(), content: `Sibling ${RUN}` });
    await expectCommentCount(post1(), 4);
  });
  await check("J06", "AC10", "a comment with no content, null content or only spaces answers 400 and adds nothing (same rule as editing)", async () => {
    const postId = need(ids.post2, "the second post's id");
    for (const body of [{ posts_id: postId }, { posts_id: postId, content: null }, { posts_id: postId, content: "" }, { posts_id: postId, content: "   " }]) {
      expectError(await post("/api/comments", tokenOf("sam"), body), 400, "Content is required");
    }
    await expectCommentCount(postId, 0);
    const created = await createComment("sam", "extra", { posts_id: postId, content: `Second post ${RUN}` });
    expectEqual(created.posts_id, postId, "posts_id");
  });
  await check("J07", "AC29", "GET /api/posts/:id/comments: every comment, replies included, oldest first, with parent_id, name, photo_url", async () => {
    const res = await get(`/api/posts/${post1()}/comments`, tokenOf("dana"));
    expectStatus(res, 200);
    if (!Array.isArray(res.json)) fail("the answer is not an array");
    expectNoPassword(res.json, "the comment list");
    res.json.forEach((item) =>
      expectKeys(item, COMMENT_KEYS, "a comment"));
    const expected = ["c1", "r1", "r2", "s1"].map((name) => need(ids[name], `${name}'s id`));
    if (!sameJson(res.json.map((item) => item.id), expected)) {
      fail(`expected the four comments in the order they were written, got ${res.json.length} in another order`);
    }
    expectEqual(res.json[0].name, people.sam.name, "author name of the first comment");
    expectEqual(res.json[1].parent_id, ids.c1, "parent_id of the first reply");
    expectEqual(res.json[2].parent_id, ids.r1, "parent_id of the nested reply");
  });
  await check("J08", "AC29", "comments of a post that does not exist answer 404; a post with none answers []", async () => {
    expectError(await get(`/api/posts/${MISSING_ID}/comments`, tokenOf("dana")), 404);
    const res = await get(`/api/posts/${need(ids.post3, "Bob's post id")}/comments`, tokenOf("dana"));
    expectStatus(res, 200);
    if (!Array.isArray(res.json) || res.json.length !== 0) fail("expected an empty array");
  });
  await check("J09", "AC12", "comment edit: someone else 403, only spaces 400, the author 200, a missing comment 404", async () => {
    const path = `/api/comments/${need(ids.c1, "the first comment's id")}`;
    expectError(await put(path, tokenOf("bob"), { content: "not mine" }), 403);
    expectError(await put(path, tokenOf("sam"), { content: "   " }), 400);
    const res = await put(path, tokenOf("sam"), { content: `Top edited ${RUN}`, posts_id: ids.post2 });
    expectStatus(res, 200);
    answers.commentUpdate = res.json;
    expectEqual(res.json?.content, `Top edited ${RUN}`, "content");
    expectEqual(res.json?.posts_id, post1(), "posts_id (must not change)");
    expectError(await put(`/api/comments/${MISSING_ID}`, tokenOf("sam"), { content: "x" }), 404);
  });
  await check("J10", "AC12", "deleting someone else's comment answers 403 and deletes nothing", async () => {
    expectError(await del(`/api/comments/${need(ids.r2, "the nested reply's id")}`, tokenOf("sam")), 403);
    await expectCommentCount(post1(), 4);
  });
  await check("J11", "AC31", "deleting a reply with nothing under it removes only that reply: comment_count goes 5 to 4", async () => {
    // A new leaf under the sibling comment, so the three-level thread under
    // the first comment stays whole for J12.
    const leaf = await createComment("dana", "leaf", { posts_id: post1(), parent_id: need(ids.s1, "the sibling comment's id"), content: `Leaf ${RUN}` });
    await expectCommentCount(post1(), 5);
    expectStatus(await del(`/api/comments/${leaf.id}`, tokenOf("dana")), 200);
    liveComments.delete(leaf.id);
    await expectCommentCount(post1(), 4);
    expectError(await del(`/api/comments/${leaf.id}`, tokenOf("dana")), 404);
    const left = (await commentsOf(post1())).map((item) => item.id);
    if (!left.includes(ids.s1)) fail("the parent of the deleted reply is gone too");
  });
  await check("J12", "AC31", "deleting a top comment with a reply and a reply to that reply removes all three; the sibling comment survives", async () => {
    const topId = need(ids.c1, "the first comment's id");
    const replyId = need(ids.r1, "the reply's id");
    const deepId = need(ids.r2, "the nested reply's id");
    const siblingId = need(ids.s1, "the sibling comment's id");
    const before = await commentsOf(post1());
    expectThread(before, topId, replyId, deepId);
    if (!before.some((item) => item.id === siblingId)) fail("cannot run: the sibling comment is not on the post");
    await expectCommentCount(post1(), before.length);

    expectStatus(await del(`/api/comments/${topId}`, tokenOf("sam")), 200);
    for (const id of [topId, replyId, deepId]) liveComments.delete(id);

    const after = await commentsOf(post1());
    expectEqual(after.length, before.length - 3, "comments left on the post (three fewer)");
    if (!sameJson(after.map((item) => item.id), [siblingId])) {
      fail(`expected only the sibling comment to be left, found ${after.length} comments`);
    }
    await expectCommentsGone({ "the top comment": topId, "the reply": replyId, "the reply to the reply": deepId });
    await expectCommentCount(post1(), before.length - 3);
    // The sibling is still a working comment, not only a row in the list.
    expectStatus(await put(`/api/comments/${siblingId}`, tokenOf("sam"), { content: `Sibling ${RUN}` }), 200);
  });
  await check("J13", "AC28", "comment_count is right after the deletes: 1", async () => {
    await expectCommentCount(post1(), 1);
  });
  await check("J14", "AC12", "GET /api/comments answers 200 with an array, no password in any item, name and photo_url on this run's comments, and none of the deleted comments", async () => {
    const res = await get("/api/comments", tokenOf("dana"));
    expectStatus(res, 200);
    if (!Array.isArray(res.json)) fail("the answer is not an array");
    expectNoPassword(res.json, "the comment list");
    res.json.forEach((item) => expectKeys(item, ["id", "posts_id", "parent_id", "user_id", "content"], "a comment"));
    const all = new Set(res.json.map((item) => item.id));
    if (!all.has(need(ids.s1, "the sibling comment's id"))) fail("the sibling comment is missing");
    if (!all.has(need(ids.extra, "the second post's comment id"))) fail("the second post's comment is missing");
    // Only this run's own comments are held to the joined shape.
    for (const item of res.json) {
      if (item.id === ids.s1) expectKeys(item, ["name", "photo_url"], "the sibling comment in the list");
      if (item.id === ids.extra) expectKeys(item, ["name", "photo_url"], "the second post's comment in the list");
    }
    for (const name of ["c1", "r1", "r2", "leaf"]) {
      if (all.has(need(ids[name], `${name}'s id`))) fail(`a deleted comment (${name}) is still listed`);
    }
  });
  await check("J15", "AC12", "the POST /api/comments answer has the same fields as a read: name, photo_url, no password", async () => {
    const created = need(answers.commentCreate, "the answer of POST /api/comments (see J03)");
    expectKeys(created, COMMENT_KEYS, "the POST /api/comments answer");
    expectEqual(created.name, people.sam.name, "name");
    expectNoPassword(created, "the POST /api/comments answer");
  });
  await check("J16", "AC12", "the PUT /api/comments/:id answer has the same fields as a read: name, photo_url, no password", async () => {
    const updated = need(answers.commentUpdate, "the answer of PUT /api/comments/:id (see J09)");
    expectKeys(updated, COMMENT_KEYS, "the PUT /api/comments/:id answer");
    expectEqual(updated.name, people.sam.name, "name");
    expectNoPassword(updated, "the PUT /api/comments/:id answer");
  });
}

async function postDeleteChecks() {
  await check("K01", "AC12", "deleting someone else's post answers 403 and deletes nothing", async () => {
    const postId = need(ids.post1, "the first post's id");
    expectError(await del(`/api/posts/${postId}`, tokenOf("bob")), 403);
    expectError(await del(`/api/posts/${postId}`, tokenOf("sam")), 403);
    await expectCommentCount(postId, 1);
  });
  await check("K02", "AC30", "deleting a post that holds a comment, a reply and a reply to that reply answers 200", async () => {
    const postId = need(ids.post1, "the first post's id");
    const topId = need(ids.s1, "the sibling comment's id");
    const reply = await createComment("dana", "s2", { posts_id: postId, parent_id: topId, content: `Late reply ${RUN}` });
    const deep = await createComment("bob", "s3", { posts_id: postId, parent_id: reply.id, content: `Late reply to reply ${RUN}` });
    const before = await commentsOf(postId);
    expectEqual(before.length, 3, "comments on the post before the delete");
    expectThread(before, topId, reply.id, deep.id);
    await expectCommentCount(postId, 3);
    await readStats("beforePostDelete");
    expectStatus(await del(`/api/posts/${postId}`, tokenOf("alice")), 200);
    livePosts.delete(postId);
    for (const id of [topId, reply.id, deep.id]) liveComments.delete(id);
  });
  await check("K03", "AC30", "after the delete: the post's comments answer 404, all three levels are gone, the post is out of the feed", async () => {
    const postId = need(ids.post1, "the first post's id");
    if (livePosts.has(postId)) fail("cannot run: the post was not deleted (see K02)");
    expectError(await get(`/api/posts/${postId}/comments`, tokenOf("sam")), 404);
    await expectCommentsGone({
      "the top comment": need(ids.s1, "the sibling comment's id"),
      "the reply": need(ids.s2, "the late reply's id"),
      "the reply to the reply": need(ids.s3, "the late reply-to-reply's id"),
    });
    expectError(await del(`/api/posts/${postId}`, tokenOf("alice")), 404);
    const list = expectList(await get("/api/posts" + query({ limit: MAX_LIMIT }), tokenOf("sam")), "the post list");
    if (list.items.some((item) => item.id === postId)) fail("the deleted post is still in the list");
    const counts = await readStats("afterPostDelete");
    expectEqual(counts.posts, need(stats.beforePostDelete, "the stats read before the delete").posts - 1, "stats.posts");
  });
  await check("K04", "AC30", "the other posts and their comments are untouched", async () => {
    const otherPost = need(ids.post2, "the second post's id");
    await expectCommentCount(otherPost, 1);
    await expectCommentCount(need(ids.post3, "Bob's post id"), 0);
    const left = (await commentsOf(otherPost)).map((item) => item.id);
    if (!sameJson(left, [need(ids.extra, "the second post's comment id")])) {
      fail(`expected the second post to keep its one comment, found ${left.length}`);
    }
  });
}

async function adminChecks() {
  await check("X01", "AC2", "the admin login answers 200 { token }", async () => {
    if (!HAS_ADMIN) throw new Skip("ADMIN_EMAIL and ADMIN_PASSWORD are not set");
    const res = await post("/api/auth/login", undefined, { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
    expectStatus(res, 200);
    if (!isObject(res.json) || typeof res.json.token !== "string" || res.json.token === "") {
      fail("the login answer has no `token` text");
    }
    admin.token = res.json.token;
  });
  await adminCheck("X02", "AC25", "GET /api/users: list shape, defaults, ordered by id, no password in any item", async () => {
    const list = expectList(await get("/api/users", admin.token), "the user list");
    expectEqual(list.page, 1, "page");
    expectEqual(list.limit, DEFAULT_LIMIT, "limit");
    if (list.items.length === 0) fail("the user list is empty");
    list.items.forEach((item) => expectKeys(item, ["id", "name", "email", "role", "photo_url"], "a user"));
    const all = expectList(await get("/api/users" + query({ limit: 500 }), admin.token), "the user list");
    expectEqual(all.limit, MAX_LIMIT, "limit for limit=500");
    if (!isSortedBy(all.items, (a, b) => a.id - b.id)) fail("the ids are not in rising order");
    expectError(await get("/api/users" + query({ page: 0 }), admin.token), 400);
    const past = expectList(await get("/api/users" + query({ page: 1000000, limit: 1 }), admin.token), "a page past the end");
    expectEqual(past.items.length, 0, "items on a page past the end");
    expectEqual(past.total, all.total, "total on a page past the end");
  });
  await adminCheck("X03", "AC25", "GET /api/users: q matches part of the name or the email, ignoring case; % is a plain character", async () => {
    const byName = expectList(await get("/api/users" + query({ q: `APICHECK ALICE ${RUN}` }), admin.token), "q by name");
    expectEqual(byName.total, 1, "matches for Alice's name in capitals");
    expectEqual(byName.items[0]?.id, idOf("alice"), "user id");
    const byEmail = expectList(await get("/api/users" + query({ q: `APICHECK-${RUN}-` }), admin.token), "q by email");
    expectEqual(byEmail.total, 4, "matches for the email prefix of this run");
    const percent = expectList(await get("/api/users" + query({ q: `%${RUN}%` }), admin.token), "q with %");
    expectEqual(percent.total, 0, 'matches for "%<run>%" (4 means % worked as a wildcard)');
    const underscore = expectList(await get("/api/users" + query({ q: `apicheck_${RUN}` }), admin.token), "q with _");
    expectEqual(underscore.total, 0, 'matches for "apicheck_<run>" (4 means _ worked as a wildcard)');
  });
  await adminCheck("X04", "AC25", "GET /api/users: role matches the whole value and combines with q", async () => {
    const students = expectList(await get("/api/users" + query({ role: "student", limit: MAX_LIMIT }), admin.token), "role filter");
    if (students.items.some((item) => item.role !== "student")) fail("an item has another role");
    const mine = expectList(await get("/api/users" + query({ role: "student", q: `apicheck-${RUN}-` }), admin.token), "role and q");
    expectEqual(mine.total, 2, "students of this run");
    const part = expectList(await get("/api/users" + query({ role: "stud", q: `apicheck-${RUN}-` }), admin.token), "part of a role");
    expectEqual(part.total, 0, "matches for part of a role");
  });
  await adminCheck("X05", "AC32", "an admin editing someone else's post answers 403", async () => {
    expectError(await put(`/api/posts/${need(ids.post2, "the second post's id")}`, admin.token, { caption: "admin edit" }), 403);
  });
  await adminCheck("X06", "AC12", "an admin may edit another user's profile and user row, but not their comment", async () => {
    const profile = await put(`/api/alumni/${need(ids.bobProfile, "Bob's profile id")}`, admin.token, { bio: `Admin note ${RUN}` });
    expectStatus(profile, 200);
    const user = await put(`/api/users/${idOf("dana")}`, admin.token, { name: people.dana.name });
    expectStatus(user, 200);
    expectNoPassword(user.json, "the updated user");
    expectError(await put(`/api/comments/${need(ids.extra, "the second post's comment id")}`, admin.token, { content: "admin edit" }), 403);
  });
  await adminCheck("X07", "AC33", "DELETE /api/users/:id for a user with content answers 409 with the exact message and deletes nothing", async () => {
    expectError(await del(`/api/users/${idOf("alice")}`, admin.token), 409, USER_HAS_CONTENT);
    expectStatus(await get(`/api/users/${idOf("alice")}`, admin.token), 200);
    // Sam has only a comment; Bob has a profile and a post.
    expectError(await del(`/api/users/${idOf("sam")}`, admin.token), 409, USER_HAS_CONTENT);
    expectError(await del(`/api/users/${idOf("bob")}`, admin.token), 409, USER_HAS_CONTENT);
  });
  await adminCheck("X08", "AC31", "an admin may delete someone else's comment", async () => {
    const commentId = need(ids.extra, "the second post's comment id");
    expectStatus(await del(`/api/comments/${commentId}`, admin.token), 200);
    liveComments.delete(commentId);
    await expectCommentCount(need(ids.post2, "the second post's id"), 0);
  });
  await adminCheck("X09", "AC30", "an admin may delete someone else's post", async () => {
    const postId = need(ids.post3, "Bob's post id");
    expectStatus(await del(`/api/posts/${postId}`, admin.token), 200);
    livePosts.delete(postId);
  });
  await adminCheck("X10", "AC33", "DELETE /api/users/:id for a user with no content answers 200; again 404; a bad id 400", async () => {
    const danaId = idOf("dana");
    expectStatus(await del(`/api/users/${danaId}`, admin.token), 200);
    people.dana.deleted = true;
    expectError(await del(`/api/users/${danaId}`, admin.token), 404);
    expectError(await get(`/api/users/${danaId}`, admin.token), 404);
    expectError(await del(`/api/users/${MISSING_ID}`, admin.token), 404);
    for (const badId of BAD_IDS) {
      expectError(await del(`/api/users/${badId}`, admin.token), 400, BAD_ID_TEXT);
    }
  });
}

// Runs last: Carol and her profile must not be there while the earlier checks
// count this run's users and profiles.
async function raceChecks() {
  await check("R01", "AC24", "two POST /api/alumni sent at the same moment for one new user: exactly one 201 and one 409", async () => {
    await signUp("carol");
    await logIn("carol");
    const body = { job_title: `Race ${RUN}` };
    const both = await Promise.all([
      post("/api/alumni", tokenOf("carol"), body),
      post("/api/alumni", tokenOf("carol"), body),
    ]);
    const created = both.filter((res) => res.status === 201);
    if (created.length > 0 && isObject(created[0].json)) ids.carolProfile = created[0].json.id;
    const statuses = both.map((res) => res.status).sort((a, b) => a - b);
    if (!sameJson(statuses, [201, 409])) {
      fail(`expected one 201 and one 409, got ${statuses.join(" and ")}`);
    }
    expectError(both.find((res) => res.status === 409), 409);
    expectKeys(created[0].json, ALUMNI_KEYS, "the POST /api/alumni answer");
    expectEqual(created[0].json.user_id, idOf("carol"), "user_id");
  });
  await check("R02", "AC24", "after the two creates Carol has exactly one profile", async () => {
    const profileId = need(ids.carolProfile, "Carol's profile id");
    const mine = await get("/api/alumni/me", tokenOf("carol"));
    expectStatus(mine, 200);
    expectEqual(mine.json?.id, profileId, "the id /me answers (the profile the 201 answered)");
    const list = expectList(await alumniList({ q: people.carol.name }), "the alumni list");
    expectEqual(list.total, 1, "profiles for Carol");
    expectEqual(list.items[0]?.id, profileId, "the listed profile");
  });
}

// ---------------------------------------------------------------- clean-up

async function cleanUp() {
  console.log("\nClean-up");

  for (const [commentId, who] of [...liveComments].reverse()) {
    try {
      const res = await del(`/api/comments/${commentId}`, people[who].token);
      if (res.status === 200 || res.status === 404) liveComments.delete(commentId);
    } catch {
      // left in the list below
    }
  }
  for (const [postId, who] of livePosts) {
    try {
      const res = await del(`/api/posts/${postId}`, people[who].token);
      if (res.status === 200 || res.status === 404) livePosts.delete(postId);
    } catch {
      // left in the list below
    }
  }

  // Bob's department was three spaces for the /filters check. Clear it.
  if (ids.bobProfile !== undefined && people.bob.token) {
    try {
      await put(`/api/alumni/${ids.bobProfile}`, people.bob.token, { department: null });
    } catch {
      // nothing to do
    }
  }

  // With an admin, the two students can go once their comments are gone.
  // Carol too, but only when her profile was never created.
  if (admin.token) {
    for (const who of ["sam", "dana", "carol"]) {
      const person = people[who];
      if (person.id === undefined || person.deleted) continue;
      if (ids[`${who}Profile`] !== undefined) continue;
      try {
        const res = await del(`/api/users/${person.id}`, admin.token);
        if (res.status === 200 || res.status === 404) person.deleted = true;
      } catch {
        // left in the list below
      }
    }
  }

  console.log("Test rows left in the database:");
  let left = 0;
  for (const who of Object.keys(people)) {
    const person = people[who];
    if (person.id === undefined || person.deleted) continue;
    left += 1;
    const profile = ids[`${who}Profile`];
    const profileNote = profile === undefined ? "" : `, alumni profile id ${profile}`;
    console.log(`  user id ${person.id}  ${person.email}  (${person.role})${profileNote}`);
  }
  for (const [postId] of livePosts) {
    left += 1;
    console.log(`  post id ${postId} (could not be deleted)`);
  }
  for (const [commentId] of liveComments) {
    left += 1;
    console.log(`  comment id ${commentId} (could not be deleted)`);
  }
  if (left === 0) console.log("  none");
  console.log(
    "  An alumni profile cannot be deleted through the API, and a user with a profile cannot be deleted either.",
  );
}

// ---------------------------------------------------------------- main

function isLocal(url) {
  try {
    const host = new URL(url).hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
  } catch {
    return false;
  }
}

function summary() {
  const count = (status) => results.filter((result) => result.status === status).length;
  const failed = results.filter((result) => result.status === "FAIL");

  console.log("\nSummary");
  console.log(`  ${count("PASS")} passed, ${failed.length} failed, ${count("SKIP")} skipped, ${results.length} in all`);
  if (!HAS_ADMIN) {
    console.log("  The admin checks were skipped: set ADMIN_EMAIL and ADMIN_PASSWORD to run them.");
  }
  if (failed.length > 0) {
    console.log("\nFailed checks");
    for (const result of failed) {
      console.log(`  ${result.id} [${result.ac}] ${result.description}\n        -> ${result.detail}`);
    }
  }
  return failed.length;
}

async function main() {
  if (!isLocal(API_URL) && process.env.API_CHECK_ALLOW_REMOTE !== "1") {
    console.log("API_URL is not this machine. This script writes test rows.");
    console.log("Set API_CHECK_ALLOW_REMOTE=1 if that is what you want.");
    return 1;
  }

  // Only the origin is printed, in case the URL holds a user name or password.
  console.log(`API check against ${new URL(API_URL).origin}`);
  console.log(`Run tag ${RUN}. Test users: apicheck-${RUN}-<name>@example.com`);
  console.log(HAS_ADMIN ? "Admin checks: on\n" : "Admin checks: off (ADMIN_EMAIL / ADMIN_PASSWORD not set)\n");

  const ready = await setUp();
  if (!ready) {
    console.log("\nThe API did not answer. Start it with: npm run dev:api");
    return 1;
  }

  await errorShapeChecks();
  await idChecks();
  await signUpAndLoginChecks();
  await alumniWriteChecks();
  await alumniListChecks();
  await alumniUpdateChecks();
  await userRuleChecks();
  await feedChecks();
  await commentChecks();
  await postDeleteChecks();
  // The admin login comes before the lookups: one of them needs an admin.
  await adminChecks();
  await lookupChecks();
  await raceChecks();
  await cleanUp();

  return summary() > 0 ? 1 : 0;
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (err) => {
    // Only the error's own message: never a body, a header or a setting.
    console.log(`The script stopped: ${err instanceof Error ? err.message : "unknown error"}`);
    process.exitCode = 1;
  },
);
