
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
