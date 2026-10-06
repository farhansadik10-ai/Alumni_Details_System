
## CAND-001 [implement-task]
**Claim:** Refuse `null`, `undefined` and `""` before turning an id into a number; `Number()` makes all of them 0, not `NaN`.
**Saw it in:** `backend/src/api/utils/requestHelpers.ts:46`
**Context:** The task said "false when NaN, null or undefined"; a plain `Number(a) === Number(b)` check would have matched a null id against user 0.

## CAND-002 [implement-task]
**Claim:** Check a pure helper with a throwaway `npx tsx` script in the session scratch folder, importing the source file by absolute path; the build alone proves only that it compiles.
**Saw it in:** `backend/src/api/utils/requestHelpers.ts:11`
**Context:** There is no test runner, and nothing imports the new helpers yet, so `npm run build` says nothing about what they return.

## CAND-003 [implement-task]
**Claim:** When picking fields from a request body, test with `hasOwnProperty` and refuse arrays; `key in body` also finds inherited names like `constructor`.
**Saw it in:** `backend/src/api/utils/requestHelpers.ts:22`
**Context:** `pickSent` takes `unknown`; an array or an inherited key would otherwise count as "sent".

## CAND-004 [implement-task]
**Claim:** Type-check a new DAL file on its own until a Query class imports it; `npm run build` does not compile it.
**Saw it in:** `backend/src/api/tsconfig.json:7`
**Context:** The API build includes only `backend/src/api`; DAL files are checked only when reached by an import, so a new helper with no importer passes the build unread.

## CAND-005 [implement-task]
**Claim:** Put the owner check before the body check in an update handler, so a caller who may not edit a row learns nothing about what a valid body looks like and always gets 403.
**Saw it in:** `backend/src/api/controllers/CommentController.ts:36`
**Context:** The task listed 404, 403, then the 400 for empty content; checking content first would give a non-author 400 or 403 depending on the body.

## CAND-006 [implement-task]
**Claim:** Treat a nullable column read through `SELECT *` as `null` at run time even when the DTO types it as optional (`parent_id?: number`); the compiler will not warn.
**Saw it in:** `backend/src/dal/dto/CommentDTO.ts:6`
**Context:** `updateComment` rebuilds a DTO from the stored row; a top-level comment's `parent_id` is `null`, not `undefined`. Harmless here because the UPDATE writes only `content`.

## CAND-007 [implement-task]
**Claim:** When a partial update may clear a field with `null`, do not trust the DTO type: its optional fields are `string | undefined`, so the controller needs a cast and the type no longer tells the truth.
**Saw it in:** `backend/src/api/controllers/PostController.ts:70`
**Context:** `pickSent` keeps `null` but `PostDTO.caption?: string` does not allow it; a shared "patch" type per table would remove the cast.

## CAND-008 [implement-task]
**Claim:** Type an `UPDATE ... RETURNING` read as `Row | null` and return `rows[0] || null`; `rows[0]` typed as the DTO hides the "no such id" case from the compiler.
**Saw it in:** `backend/src/dal/query/PostQuery.ts:63`
**Context:** The old `updatePost` promised a `PostDTO`, so the controller sent 200 with an empty body for a missing id and nothing flagged it.

## CAND-009 [implement-task]
**Claim:** Before relying on "nothing calls it" to change a Query method's signature, also grep the Manager layer: a Query method can exist with no Manager wrapper at all.
**Saw it in:** `backend/src/businessLogic/src/PostManager.ts:18`
**Context:** `PostQuery.findPostById` existed but `PostManager` had no such method, so the controller's `findPostById` and `deletePost` load every post to find one.

## CAND-010 [implement-task]
**Claim:** Cast the result of `pickSent` to `Partial<XDTO>` only after the type checks have run; the cast is what lets `null` and unchecked values through the compiler.
**Saw it in:** `backend/src/api/controllers/AlumniController.ts:123`
**Context:** `pickSent` returns `unknown` values and the DTO fields are `string | undefined`, so the Manager call needs `as Partial<AlumniDTO>`; the DTOs do not say `null` though the database sends and now accepts it.

## CAND-011 [implement-task]
**Claim:** When the author comes from the token, check who else can call the create route: an admin who creates an alumni profile now owns it, and cannot make one for another user.
**Saw it in:** `backend/src/api/routes/AlumniRoutes.ts:14`
**Context:** `POST /api/alumni` allows `alumni` and `admin`; with `user_id` from the token an admin's profile is filed under the admin's own id.

## CAND-012 [implement-task]
**Claim:** Do not copy the "missing row" check from an update handler to a read handler by assumption; `GET /api/alumni/:id` still answers 200 with an empty body for an unknown id.
**Saw it in:** `backend/src/api/controllers/AlumniController.ts:68`
**Context:** `updateAlumni` now answers 404 for a missing profile, the read beside it does not (out of scope here), so the same id gives two different answers.

## CAND-013 [implement-task]
**Claim:** Treat a "public" row type such as `PublicUserDTO` as a compile-time check only; the column list in the SQL is what keeps `password` out of a response.
**Saw it in:** `backend/src/dal/query/UserQuery.ts:8`
**Context:** `pg` returns `any` rows, so `Omit<UserDTO, "password">` compiles even over `SELECT *`. Check the SQL text, not the type.

## CAND-014 [implement-task]
**Claim:** Type a Query method that returns `rows[0]` as `T | undefined`, or the controller's "not found" branch looks like dead code to the compiler and to readers.
**Saw it in:** `backend/src/dal/query/UserQuery.ts:66`
**Context:** `findUserById` was typed `Promise<UserDTO>` while returning `undefined` for a missing id; the 404 in `updateUser` needed the honest type.

## CAND-015 [implement-task]
**Claim:** A partial-update method cannot take `Partial<XDTO>`: the DTO fields are typed `string`, so a `null` that clears a nullable column does not fit without a cast.
**Saw it in:** `backend/src/dal/query/UserQuery.ts:80`
**Context:** `updateUser` takes `Record<string, unknown>`; the controller validates types and the fixed column list guards names.

## CAND-016 [implement-task]
**Claim:** Before writing a manual check that says "read the row back", confirm a route for that read exists; a controller function with no route line cannot be called.
**Saw it in:** `backend/src/api/routes/PostRoutes.ts:14`
**Context:** `PostController.findPostById` exists but `PostRoutes.ts` has no `GET /:id`, so the checklist reads a post from the `GET /api/posts` list.

## CAND-017 [implement-task]
**Claim:** Read both `error` and `message` when checking a failed response: controllers answer `{ error }`, while `authMiddleware`, `requireRole` and login answer `{ message }`.
**Saw it in:** `backend/src/api/MiddleWare/authMiddleware.ts:7`
**Context:** A 403 from the role check and a 403 from an owner check on the same route have different body keys; the checklist had to spell out which is which.

## CAND-018 [implement-task]
**Claim:** When a test plan creates rows through the API, say up front which ones cannot be removed through it; alumni profiles have no delete route and block deleting their user.
**Saw it in:** `backend/src/api/routes/AlumniRoutes.ts:14`
**Context:** The owner runs the checklist against their real database, so leftover test rows need a hand-run statement or stay.

## CAND-Q01 [review-qual]
**Claim:** When a REQ removes a debug `console.log` that leaks data, grep the whole DAL for the same pattern in the same pass.
**Saw it in:** `backend/src/dal/query/PostQuery.ts:27`, `CommentQuery.ts:21`
**Context:** The user-row print was removed; identical row dumps stayed in two sibling Query classes.

## CAND-Q02 [review-qual]
**Claim:** When adding a shared auth helper (`isSelf`/`isAdmin`), convert every existing inline check in the same controllers.
**Saw it in:** `backend/src/api/controllers/PostController.ts` (deletePost, raw `===`)
**Context:** One old inline check survived beside the new helpers, with weaker id comparison.

## CAND-A01 [review-arch]
**Claim:** When a Query method can return no row, type it `| undefined` in the same change, for every sibling Query, not just the one you touched.
**Saw it in:** `backend/src/dal/query/AlumniQuery.ts:29`, `CommentQuery.ts:27`
**Context:** Users and posts got nullable types; alumni and comment kept `Promise<DTO>` while controllers now check for undefined.

## CAND-A02 [review-arch]
**Claim:** A field allow-list kept in both controller and Query must be documented as "change together", or exported from one place.
**Saw it in:** `AlumniController.ts:17` and `AlumniQuery.ts:5`
**Context:** A new column added to one list only is silently dropped with a 200.

## CAND-A03 [review-arch]
**Claim:** Give every Manager update method one input type shape (Partial of a Pick), not Record in one and Partial DTO in another.
**Saw it in:** `UserManager.ts:33`, `PostManager.ts:14`
**Context:** Three domains, three signatures, casts in controllers.

## CAND-901 [review-corr]
**Claim:** Build partial-UPDATE SQL from a fixed column list, never from request keys.
**Saw it in:** `backend/src/dal/query/updateSet.ts:21`
**Context:** Keeps dynamic SET safe from injection and mass assignment while still parameterizing values.

## CAND-902 [review-corr]
**Claim:** Put the owner check before the 400/404 so non-owners cannot probe which ids exist.
**Saw it in:** `backend/src/api/controllers/UserController.ts:~100`
**Context:** AC17 exception for PUT /users/:id; other routes load the row first.

## CAND-R01 [review-reflect]
**Claim:** Give the one query that must read a secret column a name that says so (`findUserWithPasswordByEmail`), and make every other read of that table list its columns.
**Saw it in:** `backend/src/dal/query/UserQuery.ts:49` (and `UserManager.findUserForLogin`)
**Context:** G17's "Don't" said login still needs the hash; this REQ solved it by splitting the read, a pattern with no vault page yet.

## CAND-R02 [review-reflect]
**Claim:** When removing a route, grep commented-out scratch files too (`TestManager.ts`), or the stale name survives.
**Saw it in:** `backend/src/businessLogic/src/TestManager.ts:134` (`// userManager.updateLoginTime(1);`)
**Context:** AC21 removed `updateLoginTime` from three layers; one dead comment still names it.

## CAND-R03 [review-reflect]
**Claim:** When an ADR says "one per user is not enforced by the database", record where it is enforced; a token-sourced `user_id` alone does not stop repeat creates.
**Saw it in:** `backend/src/api/controllers/AlumniController.ts:44` (`createAlumni`)
**Context:** ADR-03 consequence "backend or UI must check" is still open after AC23.

## Candidate verdicts

Issued at `/wrapup`, 2026-10-06. Checked against `knowledge/lessons/` on this branch and on `origin/redesign` (same four REQ-fs-001 lessons on both).

| Candidate | Verdict | Target / Reason |
|---|---|---|
| CAND-001 | promote | LESSON-REQ-fs-002-4 |
| CAND-002 | discard | a working habit, not a rule; the helper outputs are recorded in `manual-test-checklist.md` |
| CAND-003 | discard | captured in the code comment on `pickSent` and in the concept page `partial-update-sent-fields` |
| CAND-004 | demote-to-gotcha | ^g28 |
| CAND-005 | discard | captured as a rule in the component page `api-controllers-and-routes` (order of answers) |
| CAND-006 | demote-to-gotcha | ^g31 |
| CAND-007 | demote-to-gotcha | ^g31 |
| CAND-008 | promote | LESSON-REQ-fs-002-1 |
| CAND-009 | demote-to-gotcha | ^g33 |
| CAND-010 | demote-to-gotcha | ^g31 |
| CAND-011 | demote-to-gotcha | ^g32 |
| CAND-012 | discard | already G16 |
| CAND-013 | promote | LESSON-REQ-fs-002-2 |
| CAND-014 | promote | LESSON-REQ-fs-002-1 (merged with CAND-008) |
| CAND-015 | demote-to-gotcha | ^g31 |
| CAND-016 | demote-to-gotcha | ^g33 |
| CAND-017 | demote-to-gotcha | ^g29 |
| CAND-018 | discard | one-off; the checklist's "Cleaning up" section says what stays |
| CAND-Q01 | discard | duplicate of LESSON-REQ-fs-001-4; its "Saw it in" now records this second time |
| CAND-Q02 | promote | LESSON-REQ-fs-002-3 |
| CAND-A01 | promote | LESSON-REQ-fs-002-1 (merged with CAND-008) |
| CAND-A02 | demote-to-gotcha | ^g30 |
| CAND-A03 | demote-to-gotcha | ^g31 |
| CAND-901 | discard | captured in the concept page `partial-update-sent-fields` |
| CAND-902 | discard | captured in the component page `api-controllers-and-routes` (403 before 404 on users) |
| CAND-R01 | promote | LESSON-REQ-fs-002-2 (merged with CAND-013) |
| CAND-R02 | discard | trivial — one commented line in a scratch file |
| CAND-R03 | demote-to-gotcha | ^g32 |

Also written without a candidate: ^g34 (raw database messages on bad ids and duplicate emails — review findings m6 and t2).
