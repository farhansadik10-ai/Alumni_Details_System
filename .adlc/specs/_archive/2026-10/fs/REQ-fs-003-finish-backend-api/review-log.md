# REQ-fs-003-finish-backend-api — Review log

Full reviewer narratives. The consolidated verdict lives in `verification.md` —
read that first; come here for the long form behind a finding ID.

## Correctness findings

Written by: correctness-reviewer. Read-only; nothing run (no server, no database, no script).

**Summary:** Traced every new SQL statement, every `$n` position, all routes, the error middleware, token code, paging and the check script against db/schema.md and AC1-AC37. 0 critical, 0 major, 3 minor, 2 trivial not listed. No SQL, binding, auth or error-path bug found; the owner's two database runs agree.
**Dispatch answers:** (1) Yes: every statement is valid against schema.md; `$n` is built from `values.length` in alumni (5 filters) and users (2), the count and page share `values`, LIMIT/OFFSET follow; the one-parameter statements are fine. (2) No: `classifyDbError` and `logDbError` never read `detail`; clients get fixed texts; `AppError` messages are constants. The log may carry a client-sent value inside a 22P02 message, never a hash. (3) No: all 24 routes use `handler(...)`; the two middlewares are synchronous and call `next(err)`; the router decode error is a 400. (4) Yes, one set not named: COR-001. (5) Yes: the lock is taken on the transaction client; both deletes are right; the self-FK is NO ACTION, checked at statement end, so one-statement parent-and-child delete works. (6) One edge: COR-002; huge `page` caps to 180143985094819, offset stays under 2^53, total stays right.
**Script check:** it can pass while the API is wrong in three ways, see COR-003. It never prints secrets.
**Packet-gap:** none (requirement.md AC list and verification.md top read as my own required input; db/schema.md is in the packet).

### COR-001: Create and token rules tightened beyond what the spec names

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `controllers/PostController.ts:23-27,36`, `AlumniController.ts:77-82`, `utils/token.ts:67-69` |
| Category | spec-deviation |
| Rule | AC12; out-of-scope line "type checks on the older create fields beyond AC8 and AC14" |

**What:** `POST /api/posts` now answers 400 for a non-string `caption` or `media_url`, and `POST /api/alumni` for a wrong type in the older fields (`department`, `graduation_year` and so on); before, the database coerced them. `verifyToken` also now needs `typeof sub === "number"` and a string `role`, so a token minted for a user with a NULL role before this change gives 401 where it gave 403. `POST /api/users` still skips the type check on `name` and `photo_url` (an object is stored as its JSON text), so create is now strict on posts and loose on users.
**Why it matters:** Harmless in practice, but AC12 says only AC4-AC10 changes may differ, and the three creates now follow three rules.
**Recommendation:** Record the stricter creates as accepted in the spec (the strictness is better), or drop them. Decide the user-create rule in the same breath.

### COR-002: Trim in the filter differs from trim in the SQL

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `utils/requestHelpers.ts:1773`, `dal/query/AlumniQuery.ts:2757,2765,2796,2802` |
| Category | edge-case |
| Rule | AC20, AC22 |

**What:** `queryText` trims with JavaScript `trim()` (tabs, newlines, no-break space). The SQL uses `btrim`, which strips spaces only. A stored `"Eng\t"` is listed by `/filters` as `"Eng\t"`; sending it back becomes `"Eng"`, which equals no `btrim` value, so the list is empty. A department of only a tab also passes the `<> ''` blank test and shows in `/filters`.
**Why it matters:** A filter chip from `/filters` can match nothing. Needs odd stored data, so rare.
**Recommendation:** Use `btrim(x, E' \t\r\n')` or `regexp_replace` on both the columns and the `/filters` queries, or trim only spaces in JavaScript.

### COR-003: The check script has three ways to pass while the API is wrong

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `scripts/api-check.mjs:35-36`, `:394-400` (A07), `:704-712` (F11), `:321-332` |
| Category | test-coverage |
| Rule | AC5, AC6, AC37 |

**What:** (a) A07 accepts 400 or 500, so a classifier that stopped mapping 22/23 codes passes (500 text is checked, the design promise of 400 is not). The `DB_TEXT` pattern misses `invalid byte sequence`, `does not exist`, `permission denied`, `ECONNREFUSED`. (b) `expectBadIds` proves the 400 but not "no database query runs" (AC6); it cannot tell a parse-first from a query-first controller. (c) F11 needs Bob's profile to be the highest id in the database, so another profile created during the run fails it. The recursion depth gap and the missing race are QUAL-001 and QUAL-002.
**Why it matters:** A green run is the owner's only proof of AC5 and AC6.
**Recommendation:** Pin A07 to 400 and the exact text `Invalid value in request`; widen `DB_TEXT`; compare against this run's own two ids in F11.

(2 trivials not listed: the echoed `page` is the capped value, not the one asked for, for pages above 180143985094819; login skips `bcrypt.compare` for an unknown email, a timing difference that sign-up's 409 already gives away.)
**Lesson candidates:** CAND-047 to CAND-049 appended.

## Quality findings

Written by: quality-reviewer (tier: balanced). Read-only; nothing run.

**Summary:** Read the whole diff (controllers, managers, DAL, utils, shared) and all 1241 lines of `scripts/api-check.mjs` against conventions.md and LESSON-REQ-fs-002-3. 0 critical, 1 major, 7 minor (one is a convention-gap), 2 trivial not listed. Biggest: the check script never deletes a comment three levels deep, so the recursive delete SQL (AC31 "every level") is only tested two deep.
**Dispatch answers:** (1) Layering and class controllers follow the rules; magic strings and logging are partly off, see QUAL-005, QUAL-008. (2) Yes, QUAL-003. (3) Dead code: QUAL-004; stale text in conventions.md: QUAL-006; no stale code comments after the `posts_id` change, checked. (4) DTOs are honest; shared input types are not, QUAL-007. (5) See QUAL-001 and QUAL-002.
**Script safety:** safe. Settings come from env vars only, no file is read, random UUID passwords and tokens are never printed, error text is cut to 200 chars, a remote URL needs an opt-in, only the origin is printed. It leaves 2 users, 2 alumni profiles (Alice, Bob) per run that the API cannot delete; it says so at the end.
**Packet-gap:** none.

### QUAL-001: AC31 "every level" is only tested two levels deep

| Field | Value |
|---|---|
| Severity | major |
| Effort | small |
| File | `scripts/api-check.mjs:956-975` (J11, J12), `:988-996` (K02) |
| Category | test-coverage |
| Rule | spec AC31, AC30 (ADR-06) |

**What:** J11 deletes the deepest reply (r2) first, so J12 only deletes c1 plus one reply (r1). K02 deletes a post with a comment and one reply. No check deletes a comment that has a reply that has a reply.
**Why it matters:** The recursive `WITH RECURSIVE` delete in `CommentQuery.ts` and `PostQuery.ts` is the riskiest new SQL. A one-level walk would pass every current check.
**Recommendation:** In J11 delete a different leaf (for example s1's reply made for this), and let J12 delete c1 while r1 and r2 still hang under it, then assert the post's comments are only s1. Or add a reply-to-reply under s1 before K02 and delete the post.

### QUAL-002: Other acceptance criteria the script does not exercise

| Field | Value |
|---|---|
| Severity | minor |
| Effort | medium |
| File | `scripts/api-check.mjs` (whole file) |
| Category | test-coverage |
| Rule | spec AC37 |

**What:** Not covered: (a) AC24 race: no two simultaneous `POST /api/alumni`, though the advisory lock exists for exactly that. (b) AC6 upper bound: `BAD_IDS` (line 25) lacks `2147483648`, so the cap in `parseId` is untested. (c) AC12: a password change through `PUT /api/users/:id` followed by a login with the new password (the bcrypt path), and `GET /api/comments` (still routed, rewritten as a class method). (d) AC5: the 500 `Internal server error` branch (A07 accepts 400 or 500). (e) `?q=a&q=b` and `?q[x]=a` (the "single value" 400). (f) Without `ADMIN_*`, AC25, AC9 by email, AC32 admin half and the AC33 200 path are skipped; the summary says so.
**Why it matters:** (a) and (c) are behaviour a refactor can break silently.
**Recommendation:** Add (a) with `Promise.all` of two creates as one user: expect exactly one 201 and one 409. Add `2147483648` to `BAD_IDS`. Add (c) and (e) as short checks. (b), (d), (f) are optional.

### QUAL-003: Duplicated helpers and constants (the LESSON-REQ-fs-002-3 pattern)

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `controllers/AlumniController.ts:65`, `PostController.ts:29`, `AlumniController.ts:63-80`, `requestHelpers.ts:14,97` |
| Category | duplication |
| Rule | LESSON-REQ-fs-002-3 |

**What:** (1) `textOrNull` is written twice with the same body. (2) `DIGITS_ONLY` and the digits-to-number step in `readGraduationYear` repeat `toWholeNumber`/`DIGITS_ONLY` in `requestHelpers.ts`. (3) `CREDENTIALS_REQUIRED_MESSAGE` is defined in both `AuthController.ts:10` and `UserController.ts:41`; "No fields to update" is a constant in two controllers and an inline string in `PostController.ts:70`. (4) The five `STATUS_*` numbers are in `businessLogic/src/errors.ts:1-5` and again in `errorMiddleware.ts:3-5`. (5) `UserController.updateUser` checks `email`/`password` in a loop and again through `USER_UPDATE_RULES`.
**Why it matters:** A rule changed in one copy (for example what counts as a number) leaves the other copy behind.
**Recommendation:** Move `textOrNull` and `numberOrNull` to `requestHelpers.ts`; export `toWholeNumber` and reuse it in `readGraduationYear`; put the shared messages in one `api/utils/messages.ts`; export the status numbers from `errors.ts` or use `AppError` subclasses in the middleware.

### QUAL-004: Dead code

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `utils/requestHelpers.ts:84`, `UserController.ts:54-55`, `PostController.ts:41` |
| Category | dead-code |

**What:** `findWrongType` has no caller left (only a stale `dist/*.d.ts` mentions it). In `USER_UPDATE_RULES`, `email` and `password` can never fail, because the loop above already refused them. `PostController.findPostById` is bound to no route (comment cites G33).
**Why it matters:** Unused exports look like supported API; the dead rule entries suggest a check that does not exist.
**Recommendation:** Delete `findWrongType`. Either drop the loop and let `checkFields` give the message, or leave only `name` and `photo_url` in the rules. Delete `findPostById` or bind it (`GET /api/posts/:id`) with a spec line.

### QUAL-005: Magic strings in controllers

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `CommentController.ts:78,97,100,118,122`; `PostController.ts:64,69,70,86,97,100`; `StatsQuery.ts:4`; routes |
| Category | convention |
| Rule | conventions.md, Config: "No magic strings or numbers" |

**What:** Alumni, User and Auth controllers name every message; Post and Comment controllers write "Not authorized to edit this comment", "Comment deleted successfully", "Post deleted successfully", "Created post could not be read back" inline. Role names `"alumni"`, `"admin"`, `"student"` are bare strings in the routes, `UserController.ts` and `StatsQuery.ts`, though `ADMIN_ROLE` exists.
**Why it matters:** Same file family, two styles; a wording change needs a search.
**Recommendation:** Hoist each message to a `const` at the top, as the other controllers do. Use one `ROLES` constant in `requestHelpers.ts` for the routes and the controller.

### QUAL-006: conventions.md is stale after this REQ (convention-gap)

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `.adlc/context/conventions.md:33,37,55,60-61` |
| Category | documentation |
| Rule | convention-gap |

**What:** It still says "Controllers are classes ... Not built yet" and "Error handling ... Not built yet", and lists "Response format" and "Pagination" as not written down. ADR-11 and ADR-12 now define all four. Logging says nothing about `console.error`, which `errorMiddleware.ts:316,327` now uses.
**Why it matters:** Reviewers check against this file; they will flag correct code or miss drift.
**Recommendation:** At wrap-up, update those lines to point at ADR-11 and ADR-12, and decide whether `console.error` is allowed for server faults until a logger exists (ADR-11 open question).

### QUAL-007: Shared input types do not match what the API accepts

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `shared/types/posts.types.ts:18-25`, `alumni.types.ts:18-27`, `comment.types.ts:14-19` |
| Category | convention |
| Rule | spec AC11/AC17 (G31); CLAUDE.md "Types come from @alumni/shared" |

**What:** Response types and DTOs are honest about null. The request types are not: `UpdatePostDTO` and `CreateAlumniDTO` (`graduation_year`, `department`, ...) forbid `null`, yet the controllers accept it (the check script sends `media_url: null`). `CreatePostDTO` and `CreateCommentDTO` require `user_id`, which the server ignores. `CreateCommentDTO.parent_id` lacks `| null`. `Post.comment_count` is `number` but `PostDTO.comment_count` is `number | null`. The tracked compiled `alumni/comment/posts .d.ts/.js` still hold the old shapes; `list.types.ts` has no compiled copy.
**Why it matters:** The frontend rebuild takes these types as truth and will hide valid calls or send fields that do nothing.
**Recommendation:** Add `| null` to the nullable create/update fields, drop `user_id` from the two create types, make `comment_count` agree, and regenerate or delete the stale compiled files (owner's call, G-note in CLAUDE.md).

### QUAL-008: Manager parameter types are built with `Parameters<...>`

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `AlumniManager.ts:34,44-45`, `PostManager.ts:19,34`, `UserManager.ts:12-14`, `AlumniController.ts:99`, `asyncHandler.ts:16` |
| Category | naming |

**What:** The filter and update types exist in the Query files (`AlumniListFilter`, `UserListFilter`, `AlumniUpdateColumn`, ...) but `dal/index.ts` does not export them, so Managers and one controller rebuild them with `Parameters<X["y"]>[n]`. `UserManager` names them with aliases; the other Managers inline them. The helper `handler` lives in `asyncHandler.ts`.
**Why it matters:** Hard to read, and two styles for one job.
**Recommendation:** Export the filter and column types from `dal/index.ts` and import them. Rename the export `handler` to `asyncHandler` (or the file to `handler.ts`).

(2 trivials not listed: repeated "check status then `expectError`" lines in the script, which `expectError` already does; mixed `.js` import suffixes in `dal/query/*`.)
**Lesson candidates:** CAND-036 to CAND-041 appended.

## Architecture findings

Written by: architecture-reviewer (tier: balanced)

**Summary:** Checked 71 files (all controllers, routes, Managers, Queries, middleware, ADR-11/12, shared types) against ADR-02/03/05/06/08/11/12. 0 critical, 3 major, 4 minor (2 trivials not listed). Biggest: ARCH-001, write answers for alumni and comments have a different shape from their reads, while the shared types promise one shape.
**Dispatch answers.** (1) Checked, nothing: every route goes route → controller → Manager → Query, and SQL lives only in `dal/query/` (CommentController also calls PostManager, see ARCH-003). (2) Api imports `@alumni/dal` for DTO classes (all four controllers, as before) and now `classifyDbError` (errorMiddleware.ts:3); acceptable but see ARCH-005. (3) Not consistent: ARCH-001, ARCH-002; the error body `{ error }` is consistent everywhere. (4) ADR-11 needs a wording change (ARCH-004); ADR-12 matches the code as written. (5) Only partly: ARCH-003. (6) ARCH-001, ARCH-002, ARCH-006.

### ARCH-001: Create/update answers have a different shape from reads (alumni, comments)

| Field | Value |
|---|---|
| Severity | major |
| Effort | small |
| File | `backend/src/dal/query/AlumniQuery.ts:100-125`, `backend/src/dal/query/CommentQuery.ts:27-36` |
| Category | contract |
| Rule broken | ADR-05 (one post shape everywhere; PostQuery now does this via `POST_READ`), G25, shared `Alumni`/`Comment` types |

**What:** `POST/PUT /api/alumni` and `POST/PUT /api/comments` return bare table rows with no `name`, `email`, `photo_url`, while the reads return them and `shared/types` declares them as required fields. Posts were fixed to one shape; these two were not.
**Why it matters:** The frontend types a created comment or edited profile as `Comment`/`Alumni`, then renders `name`/`photo_url` as `undefined` until a refetch. Two shapes per resource is the kind of drift that costs a bug per screen.
**Recommendation:** Return the joined read after insert/update for alumni and comments, as `PostQuery.createPost` does (re-read by id). If kept bare on purpose, mark those fields optional in the shared types and write it in ADR-05's follow-up.
**References:** [[architecture/adr-05-post-list-returns-author-name-and-photo]], [[knowledge/gotchas#^g25|G25]]

### ARCH-002: Shared types are stale or missing for what the API now answers

| Field | Value |
|---|---|
| Severity | major |
| Effort | small |
| File | `shared/types/user.types.ts:1-12`, `shared/types/posts.types.ts:17-25`, `shared/types/comment.types.ts:15-20`, `shared/package.json` |
| Category | contract |
| Rule broken | CLAUDE.md "Types come from @alumni/shared"; REQ AC17 (types follow the API) |

**What:** (a) `User` still has `password: string`, non-null `name`/`role`, and no list item type; the API never sends `password` and `name`, `role` can be null. (b) `CreatePostDTO` and `CreateCommentDTO` still carry `user_id` (the server ignores it); `UpdatePostDTO` omits `null` that the server accepts; `parent_id?: number` omits `null`. (c) Dates are typed `Date` but arrive as strings. (d) `main` is `index.ts` but no such file exists, so `Paged`, `Stats`, `AlumniFilters` have no barrel; checked-in `.js`/`.d.ts` for alumni/comment/posts are older than the `.ts`, and `list.types` has none.
**Why it matters:** The new frontend is told to import these. A `User` type that includes `password` invites rendering it; missing barrel means each REQ invents import paths.
**Recommendation:** Update `user.types.ts` (public user without password, nullable columns), fix the three DTOs, type dates as `string`, add `shared/index.ts` exporting all, rebuild or remove stale compiled output.
**References:** [[context/conventions]] (frontend types rule), [[architecture/adr-12-list-endpoints-answer-items-total-page-limit]]

### ARCH-003: Business rules are split across controller, Manager and Query; most Managers are pass-through

| Field | Value |
|---|---|
| Severity | major |
| Effort | medium |
| File | `CommentController.ts:36-52`, `AlumniQuery.ts:49-62`, `AlumniController.ts:79-83`, `UserManager.ts:15-24,64-72` |
| Category | separation |
| Rule broken | CLAUDE.md layering ("Managers ... validation layer"); ADR-11 follow-up (owner checks in controllers) |

**What:** Rules sit in three places. Controller: post exists, parent is on the same post (CommentController, using PostManager), owner/admin checks. Query: "one profile per user" with an advisory lock, signalled by returning `undefined` that the controller turns into 409. Manager: email-taken and user-has-content mapping (UserManager only). Alumni, Post, Comment and Stats Managers add nothing.
**Why it matters:** A second caller of the same rule (admin creating a profile for someone, ADR-03 follow-up; delete-user flow) must copy it. `undefined` meaning "duplicate" is easy to misread. A post deleted between the existence check and the insert becomes a generic 409, not 404.
**Recommendation:** Move "profile exists" into `AlumniManager.createAlumni` (throw `ConflictError`; keep the lock and transaction in the Query), and "post exists / parent on post" into `CommentManager.createComment`. Leave owner checks for the follow-up already recorded.
**References:** [[architecture/adr-03-one-alumni-profile-per-user-created-by-that-user]], [[architecture/adr-11-typed-errors-and-one-error-middleware]]

### ARCH-004: ADR-11 wording does not match the code

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `.adlc/architecture/adr-11-typed-errors-and-one-error-middleware.md:43,83`; `errorMiddleware.ts:297-328,336-354` |
| Category | contract |
| Rule broken | ADR-11 as written |

**What:** The ADR lists three answers (AppError, classified DB error, 500). The code has a fourth: Express's own 4xx faults (bad JSON, body too large) answer a fixed message with their own status (`readRequestFault`). The ADR also says only `dal/errors.ts` reads PostgreSQL error codes, but `logDbError` reads `code`, `constraint`, `table`, `column` from the raw error. The ADR says the middlewares "throw"; they call `next(err)`.
**Recommendation:** Add the fourth branch and the log-reading exception to ADR-11 (or have `classifyDbError` return the loggable fields). ADR-12: no change needed.
**References:** [[architecture/adr-11-typed-errors-and-one-error-middleware]]

### ARCH-005: Manager signatures borrow Query types; Managers read DB constraint names

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `AlumniManager.ts:30-36`, `AlumniController.ts:83`, `UserManager.ts:5-9` |
| Category | layering |
| Rule broken | CLAUDE.md dependency chain api → businessLogic → dal |

**What:** `Parameters<AlumniQuery["listAlumni"]>[0]` appears in the Manager and again in the controller because `AlumniListFilter`, `UserListFilter` are not exported from `dal/index.ts`. `UserManager` hard-codes the DB constraint name `User_email_key`, so the business layer knows a schema name.
**Recommendation:** Export the named filter types from dal and re-export from businessLogic; have `classifyDbError` or a dal constant carry the email-constraint name.
**References:** [[knowledge/components/dal-query-classes]], [[architecture/adr-11-typed-errors-and-one-error-middleware]]

### ARCH-006: List filter contract details the frontend may regret

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `AlumniController.ts:44-52`, `UserController.ts:67-70`, `CommentQuery.ts:18-22` |
| Category | contract |
| Rule broken | ADR-12 (one list convention) |

**What:** `mentoring=false` is 400 (only `true` allowed), so a toggle must omit the key. `GET /api/users` passes `q: undefined` keys, `GET /api/alumni` leaves keys out: same Query contract, two styles. `GET /api/comments` has no `id` tiebreaker in its order. Post `comment_count` is `number|null` in the DTO but `number` in shared.
**Recommendation:** Document the `mentoring` rule in the API notes the frontend reads; build user filters the way alumni does; add `, id DESC` to the comments order; type DTO `comment_count` as `number`.
**References:** [[architecture/adr-12-list-endpoints-answer-items-total-page-limit]]

(2 trivials not listed: duplicated updatable-field lists in controller, query and shared types (G30); authMiddleware/roleMiddleware pass errors with `next()` where the ADR says "throw".)

## Reflection findings

Written by: reflector (tier: balanced), dispatched sub-agent. Re-run; first run died on a rate limit.

**Summary.** Checked 8 lessons (0 superseded), 34 gotchas, 12 accepted ADRs, 2 concepts, 2 components against the diff. 8 findings: 0 critical, 1 major, 7 minor. The biggest: ten gotchas and four ADR pages are now stale and need a decision at wrap-up (REFL-001, REFL-002). 9 lesson candidates appended (CAND-060 to CAND-068).
**Packet-gap:** none in the packet. I paged out of it at line 3709 and read `requirement.md` directly for AC10 to AC38 text; `owner-run.md` and `api-check.md` are REQ records, read as required.

**Dispatch answers.**
1. Repeated mistakes: one weak echo of LESSON-REQ-fs-002-3 (REFL-006). No row logs, no `SELECT *` over a join, every `rows[0]` read is typed `| undefined`, `parseId` refuses null, `""`, arrays: checked, nothing.
2. ADRs: no real conflict. Two letter-versus-spirit points, ADR-06 (REFL-004) and ADR-11 (REFL-005). ADR-02, ADR-01, ADR-12 hold.
3. Closes G08, G13, G16, G24, G26, G27, G29, G31, G34; G11 closed in effect; G25, G30, G32 only partly; G28, G33 untouched. New gotchas: see CAND-060 to CAND-064.
4. Stale pages: REFL-001 (gotchas), REFL-002 (ADRs, components, concepts, context), REFL-003 (repo docs).
5. Left out: only AC38 (roadmap rows, a wrap-up job) and the compiled `shared/` twins (REFL-008). Request-side shared types are already CAND-045.

### REFL-001: Gotcha pages that this REQ closes or changes

| Field | Value |
|---|---|
| Severity | major |
| Effort | small |
| File | `.adlc/knowledge/gotchas.md` (G08, G11, G13, G16, G24, G25, G26, G27, G29, G30, G31, G32, G34) |
| Category | vault-stale (needs-decision, for /wrapup step 3) |
| Vault reference | [[knowledge/gotchas#^g08\|G08]], [[knowledge/gotchas#^g34\|G34]] |

**What:** The code changes the facts behind these entries; none is edited yet. The owner's 2026-10-07 run (own script 91/91, `api-check.mjs` 0 failed) backs every "fixed" row below.

| Gotcha | Now | The page should say |
|---|---|---|
| G08 | fixed | Post delete is one transaction; comment delete is one recursive statement; a user with posts, comments or an alumni row gets 409 and nothing is deleted. Still open: how an admin removes such a user (ADR-06). |
| G11 | closed in effect | `comment_count` is counted at read time (replies included). The stored column is never read or written and stays 0; `updateCommentCount` is gone. Add the "do not read the stored column" trap (CAND-061). |
| G13 | fixed | The body key is `posts_id`; `post_id` is refused with 400. Comments saved by earlier test runs through the old code may have `posts_id` NULL. |
| G16 | fixed | All four lookups (user and alumni, by id and email) answer 404 `{ error }`. |
| G27 | fully fixed | Drop "Still open: G16". |
| G24 | fixed | `GET /api/posts/:id/comments`: array, oldest first, author `name` and `photo_url`. `GET /api/comments` is still every comment, unpaged. |
| G25 | alumni part stays | Alumni reads carry `mentorship_available` and `field`; create and update still return alumni columns only. Shared `Alumni` now has `name`, `email`, `photo_url` as `string \| null` (done). Posts now return one joined shape from create, update and read. |
| G26 | fixed | Alumni `ORDER BY a.id DESC`, users `ORDER BY id` (ascending), posts `created_at DESC, id DESC`. |
| G29 / G34 | fixed | Every error is `{ error }` through `errorMiddleware`; bad id is 400 `Invalid id`; taken email is 409 `This email is already registered`. The legacy sign-up check for `User_email_key` is now dead (UI-001). |
| G30 | still open, text stale | Alumni list now has 9 fields; the controller list also drives create; `FIELD_RULES` and the `INSERT` column list in `createAlumni` are further copies. Change all four together. |
| G31 | fixed | DTOs mirror schema nullability; `UpdateFields` is the one input type; the casts are gone. |
| G32 | half | A second profile is 409 under a per-user advisory lock. Still true: admin creates only their own, no UNIQUE, pre-existing duplicates remain (`/me` returns the lowest `id`). |

**Recommendation:** Update each page at wrap-up as above; set "fixed by REQ-fs-003 (2026-10-07)" where the row says fixed. G28 and G33 need no edit.

### REFL-002: ADR, component, concept and context pages that went stale

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | see table |
| Category | vault-stale (needs-decision, for /wrapup step 3) |
| Vault reference | [[architecture/adr-06-deleting-rows-that-other-rows-reference\|ADR-06]], [[knowledge/components/api-controllers-and-routes]] |

| Page | Stale line | Should say |
|---|---|---|
| `architecture/adr-03` | Open question UNIQUE; "backend or UI must check" | The backend enforces it with a per-user lock and a 409 (`AlumniQuery.createAlumni`); UNIQUE is still undecided. |
| `architecture/adr-05` | Open questions on field names and on comments; `getAllPosts` in Components | Names are `name`, `photo_url` for posts and comments; comments done; the method is `listPosts`. |
| `architecture/adr-06` | Open question "where does the transaction live" | In the Query class, via `withTransaction`; user-delete refusal is mapped in `UserManager`. See REFL-004. |
| `architecture/adr-08` | Open question "which endpoint returns the filter values"; "later REQ" migration | `GET /api/alumni/filters`; owner ran the migration 2026-10-06; length limit for `field` still open. |
| `components/api-controllers-and-routes` | Status "as of REQ-fs-002"; "exported functions with try/catch"; "Two error shapes"; "Create handlers do not type-check"; the who-may-do table | Class controllers, `handler()` on every route, `errorMiddleware`, `AuthController` + `utils/token.ts`; creates are type-checked; table gains `DELETE /api/users/:id`, `/api/alumni/me`, `/filters`, `/api/stats`, `/api/posts/:id/comments`; admin paths now confirmed by the owner's run; fixed paths must sit above `/:id`. |
| `components/dal-query-classes` | State table; "only the three alumni reads join"; "plain lookups answer 200 empty"; "DTO types do not allow null" | Posts and comment-by-post join too; lookups are 404; DTOs nullable; new files `errors.ts`, `transaction.ts`, `listHelpers.ts`, `StatsQuery`. |
| `concepts/partial-update-sent-fields` | "next due: mentorship_available, field; needs a boolean check" | Done (`isBoolean`, `FIELD_RULES`); add `checkFields` and `UpdateFields`. |
| `concepts/user-join-read-shape` | "Not yet applied: posts, comments"; "Open: field names" | Applied to posts and comments; names settled; the SQL is now the `ALUMNI_READ` and `POST_READ` constants. |
| `context/architecture.md`, `context/conventions.md` | "Target rule... today's controllers are exported functions"; Auth "no AuthController"; Error handling; Pagination and Response format "not written down"; ADR list stops at ADR-10; Logging | Rules are built; point to ADR-11 and ADR-12; `console.error` in `errorMiddleware` is now the only log call in the backend source besides `server.ts` and `db.ts`. (Pagination row is already CAND-046.) |

**Recommendation:** Edit these at wrap-up step 3; nothing here needs a code change.

### REFL-003: Repo docs that now disagree with the code

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `CLAUDE.md:33-38`, `docs/roadmap.md:8-11` |
| Category | vault-stale (docs likely affected: `AuthController`, `login`, `/api/stats`) |
| Vault reference | [[context/architecture]] (Cross-cutting concerns) |

**What:** Root `CLAUDE.md` says controllers are "functions" and "there is no dedicated `AuthController`... login and `verifyToken` live in `UserController.ts`". Now `AuthController.login` and `api/utils/token.ts` exist, there is a `StatsManager`/`StatsQuery`, and `app.ts` mounts `/api/stats`, a 404 handler and `errorMiddleware`. `docs/roadmap.md` rows B3, B3a, B4, B5 still say "To do" (AC38, wrap-up). `docs/design/README.md:164-166` "backend needs" are now met; no edit needed. `postman/` is empty: nothing to update.
**Recommendation:** `/wrapup` step 1 edits `CLAUDE.md` (Backend layers, Auth specifics) and the roadmap rows.

### REFL-004: ADR-06 says "one transaction"; comment delete is one statement

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `backend/src/dal/query/CommentQuery.ts` (`deleteComment`) |
| Category | adr-conflict (letter, not spirit) |
| Vault reference | [[architecture/adr-06-deleting-rows-that-other-rows-reference\|ADR-06]] |

**What:** ADR-06 and its consequences say `deleteComment` "becomes a multi-statement transaction". The code uses one `WITH RECURSIVE ... DELETE`, which is all-or-nothing on its own. `deletePost` does use `withTransaction`.
**Why it matters:** The outcome is what ADR-06 wants, but the next reader who greps for a transaction in `deleteComment` will think it is missing and wrap it, or add a second statement outside one.
**Recommendation:** One line in ADR-06 (and the G08 update): "comment delete is a single recursive statement, atomic without a transaction; post delete is a transaction". Not a code change.

### REFL-005: ADR-11 says only `dal/errors.ts` reads PostgreSQL error codes

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `backend/src/api/MiddleWare/errorMiddleware.ts:79-80` |
| Category | adr-conflict (letter, not spirit) |
| Vault reference | [[architecture/adr-11-typed-errors-and-one-error-middleware\|ADR-11]] |

**What:** `logDbError` reads `code`, `message`, `constraint`, `table`, `column` straight off the error in `api`. `UserManager.ts` also holds the constraint name `User_email_key`. Nothing reaches a client, and `detail` is correctly left out of the log.
**Why it matters:** The "only one file reads PG codes" row in ADR-11 is no longer literally true, so it will not stop the next person adding a second code check in a controller.
**Recommendation:** Either reword the ADR row to "only `dal/errors.ts` reads codes to decide an answer; the middleware may log them", or make `classifyDbError` also return a safe log record. The first is cheaper.

### REFL-006: Small inline copies left beside the new helpers

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `AlumniController.ts` and `PostController.ts` (`textOrNull`); `requestHelpers.ts:84` (`findWrongType`) |
| Category | repeated-mistake |
| Vault reference | [[knowledge/lessons/LESSON-REQ-fs-002-3-new-helper-convert-every-sibling]] |

**What:** `checkFields` replaced `findWrongType`, which now has no caller (only its definition is left). `textOrNull` is written twice, and the `Array.isArray(req.params.email)` read twice (`AlumniController`, `UserController`). The lesson says to settle each copy in the same change. The `UserController.updateUser` required-field loop beside `checkFields` is deliberate (own message first), so it is not counted.
**Recommendation:** Delete `findWrongType`; move `textOrNull` and the email-param read into `requestHelpers.ts`. Skip if the quality reviewer already filed it; this is the same root cause.

### REFL-007: Three list queries rebuild the same paging pattern

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `UserQuery.ts` (`listUsers`), `AlumniQuery.ts` (`listAlumni`), `PostQuery.ts` (`listPosts`) |
| Category | re-derivation, missing-vault-page |
| Vault reference | [[architecture/adr-12-list-endpoints-answer-items-total-page-limit\|ADR-12]] |

**What:** Each builds its own `conditions` and `values`, runs a `COUNT(*)::int`, then a page read with `LIMIT`/`OFFSET`. `listHelpers.ts` holds only `likePattern` and two types. The count and the page are two statements with no shared snapshot, so under writes `total` and `items` can disagree (ADR-12 accepts this).
**Recommendation:** Write a concept page `paged-list-query` at wrap-up (the pattern, the `$n` rule, the no-`ESCAPE` rule, the snapshot caveat) so the next list endpoint copies it. Extracting a helper is optional.

### REFL-008: Checked-in compiled `shared/` files are now behind the `.ts` sources

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `shared/types/alumni.types.d.ts`, `comment.types.d.ts`, `posts.types.d.ts` (and `.js`) |
| Category | concept-drift |
| Vault reference | [[knowledge/gotchas#^g25\|G25]] |

**What:** The `.ts` files gained `mentorship_available`, `field`, author fields and nullability. The tracked `.d.ts` and `.js` twins are unchanged (the alumni `.d.ts` has no `mentorship_available`); `list.types.ts` has no twin. Out of scope for this REQ, and `shared/index.ts` does not exist (TASK-001 note), so nothing may read them.
**Why it matters:** Root `CLAUDE.md` says the compiled output is checked in and consumers may resolve it. A tool that picks the `.d.ts` first sees the old shapes.
**Recommendation:** Owner decision at wrap-up: regenerate them, stop tracking them, or record a gotcha "edit the `.ts`; the twins are stale" (CAND-064).

## UI/UX findings

Written by: ui-reviewer (tier: balanced). Static tier only: no browser, no server, no database writes.

**Summary:** Traced 6 frontend call sites (apiClient, authApi, usersApi, useCurrentUser, HeaderUserMenu, useLogout) plus LoginPage, SignUpPage and the 3 common error helpers against the new contract. All three spec claims hold. 0 critical, 0 major, 0 minor, 1 trivial. No legacy screen breaks; the only effect is two dead code branches.

**Spec claims:** (a) Sign-up with a taken email: HOLDS. The 409 `{ error: "This email is already registered" }` skips `isDuplicateEmail` (it needs status 400), is rethrown, and `getErrorMessage` (apiClient.ts:46) shows the `error` text on the form via SignUpPage.tsx:34. Same wording as before, so the `needs verification` mark can be cleared after the manual check below. (b) Unknown id on GET /users/:id: HOLDS. 404 makes axios throw, `useCurrentUser` keeps it in `profileError`, and HeaderUserMenu never reads it (falls back to the role label, HeaderUserMenu.tsx:24). Only the 401 path redirects (apiClient.ts:28-31); 404 does not. (c) Error helpers: HOLDS. apiClient, ErrorState, FormModal, ConfirmDelete all read `message || error` and the type has both keys (types/api.ts:4-7).

**Traces:** Wrong password: 401 skips the redirect (`skipAuthRedirect`, authApi.ts:9) and the form shows "Invalid email or password". Expired or bad token on a protected call: 401 `{ error }` clears the token and goes to login (unchanged). 403 "Forbidden": shown via ErrorState/FormModal text. Missing fields on login or sign-up: 400 with the server text; the form's own required rules normally stop this first. Logout: unchanged, errors swallowed (useLogout.ts:27).

### UI-001: Two legacy branches are now dead code

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| Route / flow | `/signup`, header menu profile load |
| Lens | flow |
| Evidence | `frontend/src/services/usersApi.ts:15-18` and `:35-36` (source read) |

**What:** `isDuplicateEmail` needs status 400 plus `User_email_key`, which the API no longer sends. The "empty 200 body means not found" check in `getUserById` never fires now. Both fail safe: the user still sees the right text.
**Recommendation:** Leave them (this REQ must not touch the legacy app). The rebuild drops these files anyway.

**UI review tier:** static-only — sign-up, log-in, header menu, error helpers read against the new contract; 0 screenshots; 0 critical / 0 major / 0 minor (1 trivial).

## UI manual-verification checklist
Run in a browser against a TEST database (sign-up writes a row).
1. `/login`, wrong password for a real email: red message "Invalid email or password"; no redirect, no page reload.
2. `/login`, unknown email: same message.
3. `/signup` with an already-used email: form error "This email is already registered"; stays on the page.
4. `/signup` with a new email: goes to login with the "registered" notice (only on a test database).
5. Log in, delete the token in DevTools Local Storage, click any list page: lands on `/login`.
6. Log in, then edit the token's `sub` to a non-existent id (or use a user deleted in the test DB): header shows the role label instead of a name, no crash, no redirect.
7. Log in as a non-admin, open an admin-only screen or call: 403 "Forbidden" appears in the screen's error state, no crash.
8. Header menu, Log out: goes to `/login`; DevTools Network shows `PUT /api/users/:id/logout` returning 2xx.


## Round 2 — Architecture re-review

Written by: architecture-reviewer (tier: balanced)

**Summary:** Checked 14 files of the fix round against ADR layering, the shared contract and the round-1 findings. ARCH-001 resolved, ARCH-002 resolved except two small leftovers. 2 new findings (both minor), 0 critical or major. No SQL outside `dal/query/`, no layer skipped. Biggest: `GET /api/comments` still answers the bare row while the shared `Comment` type promises `name` and `photo_url`.
- ARCH-001 (M1): **resolved.** Alumni create, update and empty update, and comment create and update, all answer the joined read (`AlumniQuery.ts` 1083, 1132, 1145; `CommentQuery.ts` 1256, 1298). Create re-reads on the transaction client, so the uncommitted row is visible.
- ARCH-002 (M2): **resolved for what the API sends.** Dates are strings, bodies match the controllers, `Comment` writes match. Leftovers: ARCH-101, ARCH-102.
- Leftovers: (a) fix first, see ARCH-102 (one constant, two lines). (b) acceptable: `User` is frozen for the legacy screens (`frontend/src/types/api.ts:1`), `PublicUser` sits beside it; retire `User` when antd is removed. (c) acceptable, trivial: the transaction is harmless; do not spread it. (d) acceptable: nothing imports the `.js`, TypeScript prefers `.ts`; note it in wrap-up.
- Dispatch Q1: yes, checked, nothing. Q2: no, one gap, ARCH-101. Q3: sound, all 5 type files exported, types only, `main` now resolves; legacy deep imports still work. Q4: checked, nothing.

### ARCH-101: `CreateUserDTO` does not match what `POST /api/users` accepts

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `shared/types/user.types.ts:14-20`, `backend/src/api/controllers/UserController.ts:628-634` |
| Category | contract |
| Rule broken | M2 aim: every shared request type matches its controller; ADR-01 (role chosen at sign-up) |

**What:** `CreateUserDTO` has `role?` optional and `name` required, but the controller returns 400 when `role` is not `student` or `alumni`, and never requires `name`. `UpdateUserDTO` does not exist, though `PUT /api/users/:id` has a body.
**Why it matters:** A new screen that follows the type and leaves `role` out gets a 400. The legacy frontend imports this type, so editing it is not free.
**Recommendation:** Add a new `SignUpUserDTO` (`role: "student" | "alumni"`, `name?: string | null`) and an `UpdateUserDTO` beside `PublicUser`; export both from `shared/index.ts`. Leave `CreateUserDTO` as it is.
**References:** [[architecture/adr-01]], `.adlc/context/conventions.md` (types come from `@alumni/shared`)

### ARCH-102: `GET /api/comments` and `findCommentById` still answer a shape the shared `Comment` type does not describe

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `backend/src/dal/query/CommentQuery.ts:37-49` |
| Category | contract |
| Rule broken | M1/M2 aim: one read shape per resource (gotcha G25) |

**What:** Both queries still use `SELECT * FROM comment`; every other comment read now uses `COMMENT_READ`.
**Why it matters:** The same comment has two shapes depending on the route, which is the G25 problem again, on a public endpoint. The fix is two lines and the constant already exists.
**Recommendation:** Build both from `COMMENT_READ` (`WHERE c.id = $1` and `ORDER BY c.created_at DESC`). Ship after this, not before wrap-up. Also at wrap-up: retire gotcha G25 (`knowledge/gotchas.md:624`), now false, and its reference at `AlumniDTO.ts:18`.
**References:** [[knowledge/gotchas#^g25|G25]], `CommentQuery.ts:11` (`COMMENT_READ`)

## Round 2 — Correctness re-review

**Verdict:** the fixes are correct. 0 critical, 0 major, 0 minor; 1 trivial new finding. Nothing was run (rules of this session); the A08 premise is judged from how node-pg and PostgreSQL behave, not tested.
**Round-1 findings:** COR-002 (m2): resolved. COR-003 (m3): resolved, with one premise (A08) that only a run can confirm.

- **COR-002 resolved.** `queryFilterValue` strips only U+0020 at both ends, which is exactly what `btrim(x)` strips, so a stored "Eng<tab>" (offered by `/filters`) now comes back unchanged and matches. A value that is empty or spaces-only becomes `undefined`, i.e. not sent. A tab-only value is sent, and `btrim(field) = '\t'` is consistent with `/filters` offering it. `q` still uses `queryText`, correct because `q` is not compared with `btrim`.
- **COR-003 resolved.** A07, F13, H06, J11, J12, K02-K04, R01, R02 and the bad-id list pass when the API is right and fail when it is wrong. Counts add up through the chain: J10 4, J11 5 then 4, J12 4 then 1, J13 1, K01 1, K02 3, K04 1 and 0. Sam keeps `extra` until X08, so X07 still gets its 409; Dana has no content left for X10. A08: a NUL in a text parameter makes the server answer 22021 (invalid byte sequence for UTF8), a class-22 code that `classifyDbError` maps to 400 "Invalid value in request". node-pg sends parameters length-prefixed, so the NUL does reach the server. I am fairly sure but did not run it.

### Dispatch answers
1. Queries: correct. Both inserts re-read on the transaction client (`client.query`), so the uncommitted row is visible, and `$1` is bound to `inserted.rows[0].id`. `createAlumni` returns `undefined` only for the duplicate, which the controller maps to 409. `createComment` cannot return `undefined`: the row exists on the same client. `updateAlumni` and `updateComment` use the pool after an auto-committed UPDATE, so a delete in between gives `undefined`, and both controllers turn that into 404. No write answers `undefined` where the controller assumes a row.
2. Yes for both questions, see COR-002 above.
3. No change in status code, message or order of checks in the five controllers beyond the table: only constants moved (same text), `toWholeNumber` replaces the digits regex (same 400 and message for "2147483648" and 20-digit input).
4. See COR-003 above. R01 cannot deadlock: one advisory lock, taken first, on its own transaction client, and the pool holds 10 connections. The second create waits, then sees the committed row (READ COMMITTED), so the result is one 201 and one 409. If the two requests happen not to overlap, the check still passes, so it proves the lock only when they overlap.

## COR-101 — `OUTER_SPACES` regex is quadratic on a long run of spaces
| Field | Value |
|---|---|
| Severity | trivial |
| File | `backend/src/api/utils/requestHelpers.ts` (`OUTER_SPACES`) |
| Confidence | medium |

**What:** `/^ +| +$/g` retries ` +$` from each space of a long run that ends in a non-space, so work grows with the square of the run length. The request line and headers are capped at about 16 KB, so the worst case is a few tens of milliseconds per request, not a hang.
**Recommendation:** Leave it, or strip with two index loops. No action needed for this REQ.

## Round 2 — Quality re-review

Written by: quality-reviewer (tier: balanced). Read-only; nothing run.

**Summary:** Read this round's diff, the packet's script hunks, and the script's J/K and clean-up blocks. Round-1 findings are resolved or partly resolved; the kept-as-is choices hold. 0 critical, 0 major, 3 minor new (QUAL-101 to QUAL-103), 1 trivial not listed. The three-level delete is now really tested. Nothing the fixes broke.

**Round-1 findings**
- QUAL-001 (M4): resolved. J11 deletes a new leaf under s1; J12 deletes c1 with r1 and r2 still hanging under it, after `expectThread` proves the three levels (parent ids checked), then checks only s1 is left, all three answer 404, the count is `before - 3`, and s1 still edits. K02 builds s1 -> s2 -> s3 and deletes the post; K03 checks all three gone and `stats.posts` down by 1; K04 checks the other post keeps its comment.
- QUAL-002 (m3): resolved for what was asked. Added: race R01/R02 (one 201, one 409, one profile), `2147483648` and `99999999999` in BAD_IDS and the comment ids, password change then login (H06), `GET /api/comments` (J14), repeated query keys (F13), A07 pinned to 400 and the fixed text, A08 zero byte. Left optional: `?q[x]=a`, and repeated keys on `/api/users`.
- QUAL-003 (m4): partly, by design. Fixed: `textOrNull`, `toWholeNumber`, both shared messages (the inline "No fields to update" is gone too). Kept: status numbers in two files, double email/password check.
- QUAL-004 (m5): resolved. `findWrongType` is gone. `PostController.findPostById` stays unbound with a G33 comment; G33 is out of scope in the spec, acceptable.
- QUAL-005 (m6): partly. Every inline message in the Post and Comment controllers is now a named constant. Role strings (`"alumni"`, `"admin"`, `"student"`) are still bare in `AlumniRoutes`, `PostRoutes`, `UserRoutes`, `UserController`; the packet did not claim them.
- QUAL-007 (M2): resolved for the request types (nulls, string dates, `user_id` dropped, `PublicUser`, barrel). Left: `Post.comment_count: number` against `PostDTO.comment_count: number | null` (the response is always a number: acceptable), compiled twins (owner's decision). See QUAL-102.

**Kept-as-is choices**
- Two `USER_UPDATE_RULES` entries and the double check: the reason holds. `checkFields` loops over `rules` and passes on only keys that have one, so removing `email` and `password` would silently drop those changes; the loop gives the specific message first. The new comment says so.
- Status numbers in two files: the packet gives no reason; on the merits it is acceptable. Only 400 and 409 repeat (errors.ts has five codes, the middleware three, used for database answers, not `AppError`). HTTP codes do not drift. Trivial.
- `StatsQuery.ts`: holds. It has `STUDENT_ROLE` with a doc line; my round-1 note was wrong about that file.

### QUAL-101: "write, then read it back" is done three ways

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `CommentQuery.ts` (`createComment`, `updateComment`), `AlumniQuery.ts` (`createAlumni`, `updateAlumni`), `PostQuery.ts:34,68,79` |
| Category | consistency |

**What:** `createComment` wraps insert and read in a transaction; `createAlumni` must (it holds a lock); `updateAlumni` and `updateComment` run `UPDATE ... RETURNING id` then a second `pool.query` read; `PostQuery` re-reads through `findPostById` and the controller turns a missing row into a 500.
**Why it matters:** The next write method copies whichever it sees first. The `createComment` comment ("nothing else can see or delete it") applies to the update paths just as much.
**Recommendation:** Pick one: the pool re-read, `undefined` when the row vanished, and keep a transaction only where a lock needs it. Or write the reason beside `createComment`.

### QUAL-102: the new barrel exports the types the new code should not use

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `shared/index.ts` (user export), `shared/types/user.types.ts:1-21` |
| Category | contract |

**What:** `index.ts` exports `User` (still `password: string`, non-null `name` and `role`) and `CreateUserDTO` (`role` optional, `name` required) beside `PublicUser`. The API refuses sign-up without `role` student or alumni and accepts a null `name`. There is no update-user body type.
**Why it matters:** CLAUDE.md sends the redesign to `@alumni/shared`; a `User` import invites rendering a password field.
**Recommendation:** Leave `User` out of the barrel (the legacy frontend imports the file, not the barrel). Make `CreateUserDTO.role` required, `name` and `photo_url` nullable; add `UpdateUserDTO`.

### QUAL-103: `queryFilterValue` repeats `queryText` almost line for line

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `backend/src/api/utils/requestHelpers.ts` (`queryText`, `queryFilterValue`) |
| Category | duplication |

**What:** They differ only in the strip step (`trim()` against `OUTER_SPACES`); the absent test, the single-value refusal and the blank-to-undefined step are copied. This is the LESSON-REQ-fs-002-3 pattern one change after it was fixed elsewhere. Also ` +$` is quadratic on a long run of spaces then a letter; the header limit keeps it near 0.1 s, a nit.
**Why it matters:** A change to the refusal text or rule has to be made twice.
**Recommendation:** One private reader that takes the strip function. Strip with a loop or `slice` instead of the regex.

(1 trivial not listed: `GET /api/comments` and `findCommentById` still answer bare rows without `name` and `photo_url`; the spec keeps that route as it was and J14 checks five keys on purpose.)

**Dispatch answers**
1. Yes. Comment delete: c1 -> r1 -> r2 proven in place by `expectThread`, c1 deleted, all three 404, s1 survives and still edits. Post delete: s1 -> s2 -> s3 proven, post deleted, all three 404, the other post keeps its comment (K04); no same-post sibling in K02, which is enough.
2. Yes. Settings come from `API_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `API_CHECK_ALLOW_REMOTE` in `process.env`; no file read; no token or password logged; `hasDbText` fails with a fixed sentence, never the value; a remote URL is refused unless opted in (line 1400). Carol adds a third user and profile left behind, and the closing note covers it.
3. Mostly. The G25 comment is gone and nothing refers to it; `toWholeNumber` is exported and has a caller; no dead export. New duplicate: QUAL-103.
4. Yes for profiles, posts, comments, lists and the barrel (every type in every file is named). The create and update bodies match `FIELD_RULES` and `POST_FIELD_RULES`. The user types are the exception: QUAL-102.

## Round 3 — Architecture re-review

Both round-2 findings are resolved; round 3 introduced nothing that breaks a layer or an owner check. One low note (ARCH-201).

- ARCH-101 → n1: resolved. `SignUpUserDTO` and `UpdateUserDTO` match `createUser` (role student|alumni required, email/password non-empty, name/photo_url optional) and `updateUser` (the four fields, role absent). The barrel no longer exports `User` with `password`.
- ARCH-102 → n2: resolved. `getAllComments` and `findCommentById` now use `COMMENT_READ`; every comment read has the `Comment` shape.

| ID | Severity | Where | Type |
|---|---|---|---|
| ARCH-201 | Low | shared/types/*.d.ts, *.js (checked in) | Stale compiled output |

**ARCH-201.** The checked-in `user.types.d.ts` (and `.js`) lacks `PublicUser`, `SignUpUserDTO`, `UpdateUserDTO`, `LoginResponse`, `ApiError`; `list.types.ts` has no compiled copy. Imports by file path resolve to `.ts` first, so nothing breaks today. A tool that prefers `.d.ts` would not see the new types. Suggest: say in wrap-up that these files are stale, or regenerate them (owner's call).

Dispatch answers:
1. Yes. `COMMENT_READ` returns `c.*` plus `name`, `photo_url`, so every field of `Comment` is there. Controllers read `user_id`, `posts_id`, `parent_id` from `findCommentById` at lines 51, 88, 99-102, 115, and `c.*` still carries them.
2. Yes. Dropping `User` and `CreateUserDTO` from the barrel is safe: `frontend/src/types/api.ts` and `services/usersApi.ts` import by file path, and both types remain in `user.types.ts`.
3. No. `findCommentById` rows are only used inside controllers for checks and to copy fields into a `CommentDTO`. Nothing sends one to a client. `updateComment` re-reads with `COMMENT_READ`, so the answer still has the author fields, as before.

## Round 3 — Quality re-review

Written by: quality-reviewer (tier: balanced). Read-only; nothing run.

**Summary:** Read the round-3 packet, the diff, `shared/index.ts` and J14. All three of my open findings are resolved. 0 new findings. QUAL-101 (three ways to write then read back) was not in this round and stays open as a minor.

**My findings this round addressed**
- QUAL-103 (n4): resolved. One private `readSingleValue` takes the strip function; `queryText` passes `trim()`, `queryFilterValue` passes `stripOuterSpaces`. The quadratic regex is gone (two index walks).
- QUAL-005 leftover (m6): resolved. No role name is a bare string left in `backend/src/api` (checked with double, single and backtick quotes); the three constants sit in `requestHelpers.ts` only. The two shared messages moved there too.
- QUAL-102 (n1): resolved. `SignUpUserDTO` (role required, `"student" | "alumni"`, nullable name and photo) and `UpdateUserDTO` exist; the barrel no longer exports `User` or `CreateUserDTO`, and both files carry a note saying why they stay.

**New findings:** none from this round.

**Dispatch answers**
1. Yes. `queryText` is the same code path as before (absent and empty and spaces and tab-only give `undefined`; array or object throws the same message). `queryFilterValue` strips only U+0020; tab-only stays a tab (not blank), by design. `stripOuterSpaces`: "" gives "", all spaces gives "" (`start == end`), one character gives itself.
2. No bare role names remain. Each constant holds the same text as the string it replaced, and every `requireRole` call lists the same roles (alumni+admin on create alumni and create post; admin on the three user routes).
3. Yes. J14 uses `expectKeys` (`key in value`) for `name` and `photo_url` on the two comments of this run, so a bare row fails it; a null value still passes, as it should. The script reads no file and prints no secret.
