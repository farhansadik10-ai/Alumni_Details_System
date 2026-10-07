
## CAND-001 [implement-task]
**Claim:** Keep the backend `target` at ES2015 or later while code relies on `instanceof AppError`; below that, subclasses of `Error` lose their prototype and every typed error answers 500.
**Saw it in:** `backend/src/businessLogic/src/errors.ts:11`
**Context:** Root `tsconfig.json` targets ESNext, so no `Object.setPrototypeOf` fix is needed today; the error middleware's `instanceof` check depends on that staying true.

## CAND-002 [implement-task]
**Claim:** When a task narrows a shared helper's parameter type, put the helper edit in the same task as its callers, or in a tier after them; never in a tier that is forbidden to touch the callers.
**Saw it in:** `backend/src/dal/query/updateSet.ts:28`
**Context:** TASK-002 asked for `buildUpdateSet(data: UpdateFields)` and "no Query file edited" and "tsc passes"; the three callers pass `Partial<DTO>` / `Record<string, unknown>`, so all three cannot hold.

## CAND-003 [implement-task]
**Claim:** Inside `withTransaction`, send every statement through the `client` argument; a `pool.query` call there runs on another connection and is not rolled back.
**Saw it in:** `backend/src/dal/query/transaction.ts:16`
**Context:** Every existing Query method calls `pool.query`, so copying an existing statement into a transaction keeps the wrong receiver and still compiles.

## CAND-004 [implement-task]
**Claim:** A class or DTO type is not assignable to `UpdateFields` (an index-signature type) when any field is a `Date`; build the `UpdateFields` object key by key instead of passing `Partial<SomeDTO>`.
**Saw it in:** `backend/src/dal/query/AlumniQuery.ts:56`
**Context:** `tsc` refused `Partial<AlumniDTO>` because `created_at: Date` does not fit `string | number | boolean | null`.

## CAND-005 [implement-task]
**Claim:** Import shared types by file path (`@alumni/shared/types/<name>.types`); `shared/package.json` names `index.ts` as `main`, but no `shared/index.ts` exists.
**Saw it in:** `shared/package.json:8` (and `frontend/src/types/api.ts`, which already imports by path)
**Context:** TASK-001 added `list.types.ts` and there was no index file to add an export to; root `CLAUDE.md` says imports resolve through `index.ts`.

## CAND-006 [implement-task]
**Claim:** Type timestamp fields in `@alumni/shared` response types as `string` before the first screen reads them; the API sends JSON, so a `Date` never arrives.
**Saw it in:** `shared/types/alumni.types.ts:16` (also `posts.types.ts`, `comment.types.ts`)
**Context:** The types kept `Date` (now `Date | null`) because TASK-001 only asked for nullability; a screen calling `.getFullYear()` on them will compile and crash.

## CAND-007 [implement-task]
**Claim:** When hand-adding a row to pasted `psql \d` output, expect a long column name to break the table's alignment; do not re-pad the pasted rows to fit, or the "saved unchanged" claim stops being true.
**Saw it in:** `db/schema.md:52`
**Context:** `mentorship_available` (20 letters) is wider than the 15-letter column the alumni block was printed with; the row was left overhanging and the block is marked hand-edited.

## CAND-008 [implement-task]
**Claim:** Do not read a timestamp from a DTO built with `new`: the constructors stamp `new Date()` into `created_at`, `updated_at`, `login_at` and `logout_at`, which is not what the database holds.
**Saw it in:** `backend/src/dal/dto/UserDTO.ts:30`
**Context:** Making the fields `Date | null` showed that a freshly built `UserDTO` claims a login and a logout time for a user who has done neither; left as is, outside TASK-001.

## CAND-009 [implement-task]
**Claim:** After writing a regex or a replacement string that must hold a backslash, count the backslashes in the saved file: a replacement meant to have two backslashes before `$&` but saved with one still compiles and escapes nothing.
**Saw it in:** `backend/src/dal/query/listHelpers.ts:24`
**Context:** `likePattern` reads `/[\%_]/g, "\$&"`: the class has no backslash and the replacement is the match itself, so `%` and `_` in search text stay wildcards. Found while reading the helper for TASK-007; not fixed (TASK-002's file).

## CAND-010 [implement-task]
**Claim:** When a write returns its row through a second read, type the result as possibly `undefined` and make the caller handle it; the row can be deleted between the two statements.
**Saw it in:** `backend/src/dal/query/PostQuery.ts:28`
**Context:** `createPost` is now INSERT then `findPostById`, on two pool connections; the controller in TASK-010 must not assume a post comes back.

## CAND-011 [implement-task]
**Claim:** Give a computed column the same name as the stored one only when the read names its columns; with `p.*` the row would carry two `comment_count` values and the driver keeps the last.
**Saw it in:** `backend/src/dal/query/PostQuery.ts:18`
**Context:** The post read names six `posts` columns and leaves the stored `comment_count` out, so the counted one is the only one in the row.

## CAND-012 [implement-task]
**Claim:** When a task note says a helper was "checked by reading", run the one pure expression in Node before building on it; a lost backslash in a regex or string still type-checks.
**Saw it in:** `backend/src/dal/query/listHelpers.ts:24`
**Context:** `likePattern` on disk is `/[\%_]/g` with `"\$&"` (one backslash each, two were meant): it escapes nothing, yet tsc passed and the TASK-002 note says it works. Evaluating the expression alone needs no DAL import.

## CAND-013 [implement-task]
**Claim:** Guard a check-then-insert with `pg_advisory_xact_lock` only when the key can never be null; with a null key the function returns null and takes no lock.
**Saw it in:** `backend/src/dal/query/AlumniQuery.ts:63`
**Context:** `alumni.user_id` is nullable in the DTO; the one-profile-per-user check is silently skipped for a null id, so the controller must always set it from the token.

## CAND-014 [implement-task]
**Claim:** Build the list WHERE by pushing the value first and using `values.length` as its `$n`; a filter with no value (a boolean flag) must push nothing.
**Saw it in:** `backend/src/dal/query/AlumniQuery.ts:150`
**Context:** The count and the page query share one `values` array; LIMIT and OFFSET are `values.length + 1` and `+ 2`, so a stray push shifts every later parameter.

## CAND-015 [implement-task]
**Claim:** Same as CAND-009 and CAND-012 (duplicate; merge at wrap-up): prove an escaping helper by running its one expression, not by reading it.
**Saw it in:** `backend/src/dal/query/listHelpers.ts:24`
**Context:** Third separate sighting, from TASK-005: `listUsers` calls `likePattern`, which escapes nothing on disk.

## CAND-016 [implement-task]
**Claim:** In a Manager that maps a database error, match the unique-violation by constraint name but the foreign-key refusal by kind only; a delete can trip any of several foreign keys, an insert only the one unique key you mean.
**Saw it in:** `backend/src/businessLogic/src/UserManager.ts:82`
**Context:** A user delete can be refused by alumni_user_id_fkey, posts_user_id_fkey or comment_user_id_fkey; all three mean the same 409.

## CAND-017 [implement-task]
**Claim:** Read pg rowCount as (rowCount ?? 0): its type is number or null, and a bare comparison fails under strict.
**Saw it in:** `backend/src/dal/query/UserQuery.ts:164`
**Context:** deleteUser now answers whether a row went; the same shape is needed by every delete that must tell 404 from 200.

## CAND-018 [implement-task]
**Claim:** In an error middleware, test for an Express or body-parser error (`type`, a 4xx `status`) before the database test, and never treat a bare object with a `status` as trusted: only `AppError` may send its own message.
**Saw it in:** `backend/src/api/MiddleWare/errorMiddleware.ts:79`
**Context:** The old `login` throws a plain `{ status: 401, message }`; if such a value ever reaches the middleware it answers that status with the fixed text "Request could not be read", not its message.

## CAND-019 [implement-task]
**Claim:** Do not log a whole PostgreSQL error where logs are widely readable: on a NOT NULL or CHECK failure its `detail` holds the full failing row, which for `"User"` includes the password hash.
**Saw it in:** `backend/src/api/MiddleWare/errorMiddleware.ts:63`
**Context:** TASK-004 asks for `console.error(err)` in the database branch; built as written, raised as a follow-up for the owner.

## CAND-020 [implement-task]
**Claim:** Prove a pure request helper by running a copy of its expression in Node; `requestHelpers.ts` itself cannot be imported in a check, because it imports `@alumni/businesslogic`, which loads the DAL and connects to the database.
**Saw it in:** `backend/src/api/utils/requestHelpers.ts:2`
**Context:** `parseId` and `parsePaging` had to be checked without breaking the "no script that imports the DAL" rule; the typed errors live in a package whose index also exports the Managers.

## CAND-021 [implement-task]
**Claim:** When a helper must cap a number from a digit string, apply the cap before any safe-integer test; a 30-digit `limit` should become the cap, not a 400.
**Saw it in:** `backend/src/api/utils/requestHelpers.ts:156`
**Context:** Sharing `parseId`'s safe-integer reader for `limit` refused very long digit strings, which the paging rule says must be lowered to 50.

## CAND-022 [implement-task]
**Claim:** Cast every SQL `COUNT(*)` to `::int` in the statement; `pg` returns bigint as a string, so an uncast count reaches the client as `"12"`, and TypeScript will not notice because `rows` is `any`.
**Saw it in:** `backend/src/dal/query/StatsQuery.ts:24`
**Context:** `getCounts()` promises four numbers; only the casts in the SQL make that true, the return type proves nothing.

## CAND-023 [implement-task]
**Claim:** Cap a whole number read from the query string at the column's own range (2147483647 for a PostgreSQL `integer`) before it reaches a Query; "digits only" still lets through a value the database refuses.
**Saw it in:** `backend/src/api/controllers/AlumniController.ts:83`
**Context:** `?graduation_year=99999999999` passes a digits-only check, then fails inside PostgreSQL as "out of range for integer" instead of answering the 400 the spec names.

## CAND-024 [implement-task]
**Claim:** To build a DTO from `checkFields` output without a cast, narrow each value by `typeof`; `checkFields` returns the wide `UpdateValue` union for every key, whatever rule the key passed.
**Saw it in:** `backend/src/api/controllers/AlumniController.ts:67`
**Context:** `createAlumni` needs `string | null` for the DTO constructor but gets `string | number | boolean | null`; a rule that passed is not visible to the compiler.

## CAND-025 [implement-task]
**Claim:** Build a list filter by adding only the keys that were sent; never write `{ q, department }` with possibly-undefined values when the reader tests "key is not undefined" per filter and a later reader may test "key in".
**Saw it in:** `backend/src/api/controllers/AlumniController.ts:137`
**Context:** `AlumniQuery.listAlumni` turns each set filter into a WHERE piece; an object literal with every key always present makes "sent" and "not sent" look alike to anyone reading the keys.

## CAND-026 [implement-task]
**Claim:** Run a field's own-message check before `checkFields`; `checkFields` throws "<key> has the wrong type" for every failing key, so calling it first silently changes a message a client may match on.
**Saw it in:** `backend/src/api/controllers/UserController.ts:115`
**Context:** `PUT /api/users/:id` must keep "email must be a non-empty string"; the rules object alone would have answered "email has the wrong type".

## CAND-027 [implement-task]
**Claim:** Do not validate login input with `isNonEmptyString`; it trims, so a stored password made only of spaces would answer 400 and could never log in. Check "is a string with length > 0" and let bcrypt decide.
**Saw it in:** `backend/src/api/controllers/AuthController.ts:16`
**Context:** Sign-up refuses such a password today, but rows made before REQ-fs-002 were never checked.

## CAND-028 [implement-task]
**Claim:** `PUT /api/users/:id/logout` answers 200 with an empty body, because `UserManager.updateLogoutTime` returns nothing; do not parse its answer as JSON in the frontend.
**Saw it in:** `backend/src/api/controllers/UserController.ts:146`
**Context:** Kept as it was on purpose (AC12); it also answers 200 for a self id whose row is gone.

## CAND-029 [implement-task]
**Claim:** `comment.content` is nullable in `db/schema.md`, so `POST /api/comments` with no `content` still answers 201 with a null comment; only the edit requires text.
**Saw it in:** `backend/src/api/controllers/CommentController.ts:42`
**Context:** Kept as it was (AC12); create now only refuses a `content` that is not a string or `null`.

## CAND-030 [implement-task]
**Claim:** `checkFields` returns `UpdateValue` (string, number, boolean or null) per key, so a create that builds a DTO from it must narrow each value again; do not cast.
**Saw it in:** `backend/src/api/controllers/PostController.ts:29`
**Context:** `PostDTO`'s constructor takes `string | null`; `createPost` uses a small `textOrNull` instead of `as`.

## CAND-031 [implement-task]
**Claim:** After a check-then-delete, read the delete's own result and answer 404 when it removed nothing; the row can go between the two calls.
**Saw it in:** `backend/src/api/controllers/CommentController.ts:121`
**Context:** `deleteComment` returns a row count and `deletePost` a boolean; ignoring them would answer 200 for a row someone else just deleted.

## CAND-032 [implement-task]
**Claim:** Check a script you must not run with `node --check` plus `tsc --allowJs --checkJs --noEmit`; the second catches a misspelled name, which the first cannot.
**Saw it in:** `scripts/api-check.mjs:1`
**Context:** The owner forbids running the API check here because it writes to the real database; syntax alone would have let a wrong helper name through.

## CAND-033 [implement-task]
**Claim:** `parseId` accepts any safe whole number, so an id above 2147483647 still reaches PostgreSQL and comes back as a generic 400; cap ids at the column's integer range.
**Saw it in:** `backend/src/api/utils/requestHelpers.ts:113`
**Context:** AC6 says no query runs for a bad id; the `graduation_year` filter already has this cap, `parseId` does not.

## CAND-034 [implement-task]
**Claim:** In an HTTP check script, run the wrong-input create before the valid create, and assert afterwards that nothing was created.
**Saw it in:** `scripts/api-check.mjs:523`
**Context:** One profile per user (409 on the second) means a 400 check placed after the real create would pass for the wrong reason.

## CAND-035 [implement-task]
**Claim:** To test that `%` and `_` are plain characters, store two rows that differ only at that character and search with the literal; a count of 2 means wildcard.
**Saw it in:** `scripts/api-check.mjs:643`
**Context:** `likePattern` was broken for three tasks and only reading found it; job titles `100% <run>` and `100x <run>` make the bug show as a number.

## CAND-036 [review-arch]
**Claim:** When a read joins extra columns, make create and update re-read through the same joined query so one resource has one response shape.
**Saw it in:** `backend/src/dal/query/AlumniQuery.ts:100` (posts did it right at `PostQuery.ts:30`)
**Context:** Alumni and comment writes return bare rows while reads include name/photo; shared types promise the joined shape.

## CAND-037 [review-arch]
**Claim:** Put "does this already exist" rules in the Manager that throws a typed error; a Query must not signal a business refusal by returning `undefined`.
**Saw it in:** `backend/src/api/controllers/AlumniController.ts:79`
**Context:** Duplicate-profile rule lives in AlumniQuery and the controller maps undefined to 409.

## CAND-038 [review-arch]
**Claim:** When an API changes shape, update every type in `@alumni/shared` for that area in the same REQ, including ones the diff does not otherwise touch.
**Saw it in:** `shared/types/user.types.ts:1`
**Context:** `User` still has password and non-null name while Alumni, Post and Comment were updated.

## CAND-039 [review-arch]
**Claim:** An ADR that lists error branches must be re-read against the middleware at review; extra framework branches slip in.
**Saw it in:** `backend/src/api/MiddleWare/errorMiddleware.ts:336`
**Context:** `readRequestFault` is a fourth answer path not in ADR-11.

## CAND-040 [review-arch]
**Claim:** Export named input and filter types from the lowest layer; do not derive them with `Parameters<Query["m"]>[n]` in higher layers.
**Saw it in:** `backend/src/businessLogic/src/AlumniManager.ts:30`
**Context:** The same derived type is repeated in the Manager and the controller.

## CAND-041 [review-qual]
**Claim:** In a recursive-delete check, build a chain at least three deep and delete from the top; deleting the leaf first hides a one-level bug.
**Saw it in:** `scripts/api-check.mjs:956`
**Context:** J11 removes r2 before J12 deletes c1, so the recursion is only proven for two levels.

## CAND-042 [review-qual]
**Claim:** A lock added for a race needs a check that fires two requests at once; a sequential check proves nothing about the lock.
**Saw it in:** `scripts/api-check.mjs:556`
**Context:** E07 sends the second create after the first finished; the advisory lock in `AlumniQuery.createAlumni` is never raced.

## CAND-043 [review-qual]
**Claim:** When a helper is added to a util file, search the controllers for local copies of the same small function before closing the task.
**Saw it in:** `backend/src/api/controllers/AlumniController.ts:65` and `PostController.ts:29`
**Context:** `textOrNull` and a digits-only parse exist twice, though `requestHelpers.ts` already holds the parser.

## CAND-044 [review-qual]
**Claim:** Export the Query-layer input types from the DAL index so Managers import them; `Parameters<X["y"]>[n]` is a sign a type was left unexported.
**Saw it in:** `backend/src/businessLogic/src/AlumniManager.ts:34`
**Context:** Three Managers rebuild filter and update types, each in a different style.

## CAND-045 [review-qual]
**Claim:** After a type tightens on the server (null allowed, field ignored), update the request-side shared types in the same change, not only the response types.
**Saw it in:** `shared/types/posts.types.ts:18`
**Context:** `UpdatePostDTO` still forbids null and `CreatePostDTO` still requires `user_id`; both are wrong for the new controllers.

## CAND-046 [review-qual]
**Claim:** When an ADR defines a rule that conventions.md lists as "not written down", edit conventions.md in the same REQ.
**Saw it in:** `.adlc/context/conventions.md:37,55,60`
**Context:** ADR-11 and ADR-12 settle error handling, class controllers, response format and pagination; the file still says "not built yet".

## CAND-047 [review-correct]
**Claim:** A check that accepts "400 or 500" for a refused value cannot catch a broken error classifier; pin the one status the design promises.
**Saw it in:** `scripts/api-check.mjs:397`
**Context:** A07 passes if the database error falls through to 500, the very case the 22/23 mapping exists to prevent.

## CAND-048 [review-correct]
**Claim:** When a filter value is trimmed in JavaScript and compared to a column trimmed in SQL, use the same trim on both sides (`btrim` only strips spaces, `String.trim` strips all white space).
**Saw it in:** `backend/src/api/utils/requestHelpers.ts:1773`, `backend/src/dal/query/AlumniQuery.ts:2757`
**Context:** A department with a trailing tab shows in `/filters` but selecting it matches nothing.

## CAND-049 [review-correct]
**Claim:** A spec "out of scope" line about not adding checks needs a matching look at the diff; a shared helper (`checkFields`) quietly widens strictness on every route that uses it.
**Saw it in:** `backend/src/api/controllers/PostController.ts:983`
**Context:** `POST /api/posts` now answers 400 for a non-string caption, which AC12 and the out-of-scope list did not name.

## CAND-060 [review-reflect]
**Claim:** Register fixed paths (`/filters`, `/me`) above `/:id` in a router; Express matches in order and would read the word as an id.
**Saw it in:** `backend/src/api/routes/AlumniRoutes.ts:1409`
**Context:** Only a code comment guards the order; a gotcha makes the next added route see it.

## CAND-061 [review-reflect]
**Claim:** Never read `posts.comment_count` directly; the stored column is never written and stays 0, the real count is a subquery on read.
**Saw it in:** `backend/src/dal/query/PostQuery.ts:2919` (`POST_READ`)
**Context:** G11 is closed in effect, but the column and `PostDTO.comment_count = 0` still look maintained.

## CAND-062 [review-reflect]
**Claim:** Write the HTTP check script from the spec and `db/schema.md`, not from the controller; a script copied from the code agrees with the code's bug.
**Saw it in:** `.adlc/specs/2026-10/fs/REQ-fs-003-finish-backend-api/requirement.md` (owner decision, `posts_id`)
**Context:** `api-check.mjs` passed 89/89 while the owner's own script, sending the schema's key, failed 4.

## CAND-063 [review-reflect]
**Claim:** The per-user lock stops new duplicate alumni profiles only; rows made before it remain, and `/me` returns the lowest `id`.
**Saw it in:** `backend/src/dal/query/AlumniQuery.ts:2698` (`findAlumniByUserId`)
**Context:** No UNIQUE on `alumni.user_id`; a screen must not assume one row per user in old data.

## CAND-064 [review-reflect]
**Claim:** Edit only the `.ts` in `shared/types/`; the tracked `.js`/`.d.ts` twins are stale and `list.types.ts` has none.
**Saw it in:** `shared/types/alumni.types.d.ts` (no `mentorship_available`)
**Context:** Root `CLAUDE.md` says compiled output is checked in; this REQ changed only the sources.

## CAND-065 [review-reflect]
**Claim:** List order direction differs per endpoint: alumni and posts newest first, users by `id` ascending; do not assume one direction in the UI.
**Saw it in:** `backend/src/dal/query/UserQuery.ts:3251` (`ORDER BY id`)
**Context:** ADR-12 says "a fixed order", not which one.

## CAND-066 [review-reflect]
**Claim:** A single `WITH RECURSIVE ... DELETE` is all-or-nothing without a transaction; use `withTransaction` only when a second statement is needed.
**Saw it in:** `backend/src/dal/query/CommentQuery.ts:2885`
**Context:** Concept page candidate; ADR-06 says "transaction" for both deletes (REFL-004).

## CAND-067 [review-reflect]
**Claim:** A user whose `role` is NULL still gets a token, with role `""`; it matches no role check but passes `authMiddleware`.
**Saw it in:** `backend/src/api/controllers/AuthController.ts:761`
**Context:** Only a code comment says so; `"User".role` is nullable and sign-up now always sets it.

## CAND-068 [review-reflect]
**Claim:** Decide in an ADR who may see other people's email: any logged-in user gets every alumni's `email` from the list and `/email/:email`.
**Saw it in:** `backend/src/dal/query/AlumniQuery.ts:2602` (`ALUMNI_READ`), `AlumniRoutes.ts` (`authMiddleware` only)
**Context:** ADR-gap; the design shows names and tags, and no accepted ADR covers email exposure.

## CAND-069 [implement-task]
**Claim:** Before deleting a `checkFields` rule that "can never fail", check what else the rule does: `checkFields` passes on only the keys that have a rule.
**Saw it in:** `backend/src/api/utils/requestHelpers.ts` (`checkFields`, the `for (const key in rules)` loop)
**Context:** Review finding m5 called the `email` / `password` entries in `USER_UPDATE_RULES` dead; removing them would silently drop email and password changes.

## CAND-085 [review-arch]
**Claim:** When a write is made to answer the read shape, change every read of that resource in the same step, including the list-all and find-by-id ones; a missed read keeps the drift.
**Saw it in:** `backend/src/dal/query/CommentQuery.ts:37`
**Context:** Round 2 joined create and update to `COMMENT_READ`, but `getAllComments` and `findCommentById` stayed bare.

## CAND-086 [review-arch]
**Claim:** A shared request type is only done when it is checked against the controller's required fields, not just its field names (optional in the type but refused in the controller is drift).
**Saw it in:** `shared/types/user.types.ts:18` vs `UserController.ts:628`
**Context:** `CreateUserDTO.role?` is optional; the controller returns 400 without a valid role.

## CAND-080 [review-qual]
**Claim:** A helper added beside a near-identical one to loosen a single rule should share the common steps; copy-and-change recreates the duplicate the same change set just removed.
**Saw it in:** `backend/src/api/utils/requestHelpers.ts` (`queryFilterValue` beside `queryText`)
**Context:** Round 2 of REQ-fs-003 merged four duplicate helpers and added a fifth that repeats `queryText`.
