
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
