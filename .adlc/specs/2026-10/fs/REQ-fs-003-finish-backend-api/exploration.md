# REQ-fs-003 — Codebase exploration

| Field | Value |
|---|---|
| Generated | 2026-10-06 |
| By | codebase-explorer (tier: fast) |
| Repo(s) scanned | Alumni Details System |

## Contradictions with spec

None found. The spec's assumptions align with the current code state. The owner's `ALTER TABLE alumni ADD COLUMN mentorship_available` and `ADD COLUMN field` are reflected in the accepted spec but not yet in `db/schema.md` (owner approval is documented in the spec's Assumptions section).

---

## 1. Similar existing implementations

| Path | What it does | Recommended action |
|---|---|---|
| `backend/src/api/controllers/UserController.ts` lines 96–138 (`updateUser`) | Partial update pattern: picks sent fields via `pickSent`, type-checks them individually, writes only changed fields to the Manager | follow — this pattern (adopted in REQ-fs-002) is the model for AC11 (shared input type for all updates) |
| `backend/src/api/controllers/PostController.ts` lines 50–76 (`updatePost`) | Same partial update pattern, with `Partial<PostDTO>` cast | follow — AC11 removes the cast and unifies the input type |
| `backend/src/api/controllers/AlumniController.ts` lines 89–131 (`updateAlumni`) | Same pattern; also checks owner before 400/404 | follow — already ordered correctly (403 before 404 per component docs) |
| `backend/src/dal/query/UserQuery.ts` lines 99–111 (`getAllUsers`) | Reads all rows with no filter, order or limit; returns array | replace — becomes paginated list with fixed order (`id` descending per AC21) |
| `backend/src/dal/query/AlumniQuery.ts` lines 75–84 (`getAllAlumni`) | Reads all with `LEFT JOIN "User"` for name/email/photo, no order | replace — add search, filters, fixed order, paging per AC18–AC21 |
| `backend/src/dal/query/PostQuery.ts` lines 19–27 (`getAllPosts`) | Reads all, `ORDER BY created_at DESC`, returns array | extend — add paging, ensure newest-first order per AC27 |
| `backend/src/api/MiddleWare/authMiddleware.ts` lines 4–14 | Inline error handler with `try`/`catch`, answers `{ message }` on 401 | replace — move all error handling to one middleware per AC3, unify response shape to `{ error }` per AC4 |
| `backend/src/api/routes/AuthRoutes.ts` lines 7–15 | Inline handler for login, calls function from controller, catches with `{ message }` | replace — login becomes method of controller class per AC2, error middleware handles exceptions per AC3 |
| `backend/src/api/controllers/UserController.ts` lines 30–44 (`login` function) | Login logic as exported function, returns `{ token }` or throws with `{ status, message }` | replace — move to method of controller class per AC1–AC2 |
| `backend/src/api/controllers/UserController.ts` lines 46–48 (`verifyToken` function) | Token verification as exported function, called from authMiddleware | replace — move to static method or utility per AC1, keep accessible to authMiddleware |
| `backend/src/dal/dto/AlumniDTO.ts` lines 1–41 | Alumni DTO with optional user fields (name, email, photo_url) as optional strings | follow — keep pattern; add `mentorship_available: boolean` (not optional, per AC13) and `field?: string | null` per AC14–AC17 |
| `backend/src/api/utils/requestHelpers.ts` lines 1–79 | Validation helpers: `pickSent`, `isNonEmptyString`, `isStringOrNull`, `isIntegerOrNull`, `findWrongType` | follow — use these for AC15 type checks on new fields |

---

## 2. Blast radius

Risk levels: **low** = purely additive; **med** = modifies existing logic; **high** = changes contracts or data shapes.

### Controllers (class conversion + type unification)

| Path | Why touched | Risk |
|---|---|---|
| `backend/src/api/controllers/UserController.ts` | Convert exported functions to class methods; move `login` and `verifyToken` to class; type-check email/password per AC8 | high |
| `backend/src/api/controllers/AlumniController.ts` | Convert exported functions to class methods; add `mentorship_available` and `field` to create/update per AC14–AC15; add type check per AC15 | high |
| `backend/src/api/controllers/PostController.ts` | Convert exported functions to class methods; add paging to `getAllPosts` per AC27; add comment_count tracking per AC28 | high |
| `backend/src/api/controllers/CommentController.ts` | Convert exported functions to class methods; add type check for `parent_id` per AC10; add cascade delete logic per AC30–AC31 | high |

### Routes (bind class instance methods)

| Path | Why touched | Risk |
|---|---|---|
| `backend/src/api/routes/UserRoutes.ts` | Bind instance methods instead of functions; pass correct handler per AC1–AC2 | high |
| `backend/src/api/routes/AlumniRoutes.ts` | Bind instance methods; add new routes for filters (AC22), `/me` (AC23); add paging params to `GET /api/alumni` | high |
| `backend/src/api/routes/PostRoutes.ts` | Bind instance methods; add paging to `GET /api/posts` (AC27); add new route `GET /api/posts/:id/comments` (AC29) | high |
| `backend/src/api/routes/CommentRoutes.ts` | Bind instance methods | med |
| `backend/src/api/routes/AuthRoutes.ts` | Move login handler inline code to controller method call; simplify route | med |

### Middleware and error handling

| Path | Why touched | Risk |
|---|---|---|
| `backend/src/api/MiddleWare/authMiddleware.ts` | Change response shape from `{ message }` to `{ error }` per AC4; keep token verification logic but catch and standardize errors | med |
| `backend/src/api/MiddleWare/roleMiddleware.ts` | Change response shape from `{ message }` to `{ error }` per AC4 | low |
| `backend/src/api/app.ts` | Add one error middleware at the end, after all routes per AC3; optionally move global error handling there | med |
| `backend/src/api/utils/requestHelpers.ts` | Add validators for id format (positive integer check per AC6), email validation, nullable type checks for new fields | low |

### DAL (Query classes)

| Path | Why touched | Risk |
|---|---|---|
| `backend/src/dal/query/UserQuery.ts` | Add search and paging to `getAllUsers` per AC25; add fields to avoid password everywhere | med |
| `backend/src/dal/query/AlumniQuery.ts` | Add search, filters (`department`, `field`, `graduation_year`, `mentoring`), paging, fixed order per AC18–AC21; add new method `getAlumniFilters` (AC22); add new method `getAlumniByUserId` for AC23 (`/me`); update DTOs to include new fields | high |
| `backend/src/dal/query/PostQuery.ts` | Add paging per AC27; track comment_count on comment create/delete per AC28; add new method `getCommentsByPostId` for AC29; add cascade delete for comments per AC30 | high |
| `backend/src/dal/query/CommentQuery.ts` | Add cascade delete (delete replies when parent deleted) per AC31 | med |

### DTOs

| Path | Why touched | Risk |
|---|---|---|
| `backend/src/dal/dto/AlumniDTO.ts` | Add `mentorship_available: boolean` (not optional) and `field?: string | null` per AC13–AC17; add optional name/email/photo_url for join results | med |
| `backend/src/dal/dto/PostDTO.ts` | Add optional `name` and `photo_url` (author fields) for join results per AC27 | low |
| `backend/src/dal/dto/CommentDTO.ts` | Add optional `name` and `photo_url` (author fields) for join results per AC29 | low |
| `backend/src/dal/dto/UserDTO.ts` | No schema changes needed (already has all fields); typing updates if needed per AC11 | low |

### Business Logic (Managers)

| Path | Why touched | Risk |
|---|---|---|
| `backend/src/businessLogic/src/UserManager.ts` | Expose method for paginated list with search per AC25; pass through options for search/paging/filter | low |
| `backend/src/businessLogic/src/AlumniManager.ts` | Expose methods for filtered/paginated list (AC18), filters distinct values (AC22), get my profile (AC23), enforce one profile per user on create (AC24) | high |
| `backend/src/businessLogic/src/PostManager.ts` | Pass through paging params to Query (AC27); track comment_count on create/delete (AC28); expose new method to get comments by post (AC29); handle cascade delete (AC30) | high |
| `backend/src/businessLogic/src/CommentManager.ts` | Handle cascade delete of replies (AC31); enforce parent_id validation (AC10) | med |

### Shared types

| Path | Why touched | Risk |
|---|---|---|
| `shared/types/alumni.types.ts` | Add `mentorship_available: boolean` and `field?: string | null` per AC17 | low |
| `shared/types/user.types.ts` | May need updates for CreateUserDTO if email/password validation is shared | low |
| `shared/types/posts.types.ts` | Add author `name` and `photo_url` fields if frontend imports these types per AC27 | low |
| `shared/types/comment.types.ts` | Add author `name` and `photo_url` fields if frontend imports these types per AC29 | low |

### Database schema documentation

| Path | Why touched | Risk |
|---|---|---|
| `db/schema.md` | Update alumni table section to list `mentorship_available boolean NOT NULL DEFAULT false` and `field text` per AC13 (owner edited by hand from real `\d alumni` output) | low |

### Frontend (no changes per AC36)

| Path | Why touched | Risk |
|---|---|---|
| `frontend/src/services/usersApi.ts` | No code changes, but behavior change: duplicate email will return 409 instead of 400 with `User_email_key` text per AC7; fallback still works (reads both `error` and `message` keys) | — |
| `frontend/src/services/authApi.ts` | No changes per AC36 | — |
| Any screen calling `GET /api/users/:id` with unknown id | Will now get 404 instead of 200 with empty body per AC9; code already handles it with "User not found" | — |

### Scripts and entry points

| Path | Why touched | Risk |
|---|---|---|
| `backend/src/server.ts` | Loads app, no changes needed per AC34 | low |
| `backend/src/businessLogic/index.ts` | May need to re-export Manager classes if they become more complex | low |
| `backend/src/dal/index.ts` | May need to re-export new methods or utilities | low |

### Postman / manual tests

| Path | Why touched | Risk |
|---|---|---|
| `postman/*` | Reference docs; may need updating if endpoint signatures change (error shapes, paging params). No automation changes per AC37. | — |

---

## 3. Integration points

### Entry points and attachment sites

1. **Error middleware** (new, per AC3):
   - Registers in `app.ts` after all routes
   - Catches exceptions from all controllers
   - Catches 404 from missing routes (all unmatched `app.use("/api", ...)`)
   - Catches 400 from malformed JSON (`express.json()`)
   - Must answer `{ error: "<message>" }` for all cases (AC4)
   - Must log database errors, not leak them (AC5)
   - Must validate `:id` format before Query runs (AC6)

2. **Class instantiation** (new, per AC1):
   - Each controller becomes a class exported from its file
   - Routes create one instance per file: `const controller = new UserController(); router.post("/", controller.createUser.bind(controller));` or similar
   - `login` and `verifyToken` may be static methods on the controller class or moved to utility (authMiddleware must import them; per AC2 spec says "A correct login still answers 200 `{ token }`")
   - All handler functions become instance methods

3. **Middleware chain** (modified):
   - `authMiddleware` stays first on protected routes, still calls `verifyToken` (AC2)
   - `requireRole` stays second, now answers `{ error }` instead of `{ message }` (AC4)
   - Error middleware runs last, catches everything (AC3)

4. **New query methods** (per AC22–AC29):
   - `AlumniQuery.getAlumniFilters()` → returns `{ departments, graduation_years, fields }`
   - `AlumniQuery.getAlumniByUserId(id)` → returns one alumni row for AC23 (`/me`)
   - `PostQuery.getCommentsByPostId(postId)` → returns comment array for AC29
   - `CommentQuery` methods still delete one row at a time; cascade handled in Manager per AC30–AC31

5. **Shared utilities** (extended):
   - `requestHelpers.ts` gains validators for:
     - Positive integer id (AC6)
     - Email format if applied broadly (AC8 says "email or password missing, empty or not a string")
     - Paging params: `page >= 1`, `limit >= 1`, `limit > 50 → 50` (AC62)
     - Boolean type check (for mentorship_available)

### Cross-cutting concerns

- **Auth:** `verifyToken` stays the same logic, just a different home (class method vs. exported function). `authMiddleware` response shape changes to `{ error }` (AC4).
- **Error handling:** Every controller's `try`/`catch` disappears; one middleware handles all. This changes how database errors reach the response (G34 → AC5).
- **Validation:** Email uniqueness (409 vs. 400 per AC7, G34), id format (AC6), paging params (AC62) all move to centralized places or error middleware.
- **Nullable fields:** AC11 says "one shared input type that allows `null`" — DTO fields for nullable columns must be typed as nullable (G31). The three update controllers cast away the nullability today; AC11 unifies them.
- **Comment tracking:** `comment_count` is updated on comment create/delete per AC28. No transaction yet; AC37 says "Either all of it happens or none of it" which implies transaction handling (ADR-06 open question, not final here).

---

## 4. Test coverage

| Test file | Scenarios covered | Gaps for new code |
|---|---|---|
| (none — manual testing via Postman) | `postman/collections/` and `postman/environments/` hold example requests | Spec requires an API check script (AC37) that the owner runs; Claude does not. AC37 lists what it must exercise: AC2–AC10, AC12, AC14–AC16, AC18–AC33. No automation in the repo yet. |

### Existing manual test reference

- **Postman collections** (reference only, not run by Claude):
  - `postman/collections/` — API examples
  - `postman/environments/` — variable sets (one per environment, not checked in)
  - **Not automated:** no Postman collection runner in CI, no GitHub Actions, no npm scripts that invoke postman.

### Testing approach per spec

- REQ-fs-002 was verified by the owner's manual 39-check run (documented in vault) against the real database on 2026-10-06.
- REQ-fs-003 requires the same: an API check script (AC37) that exercises the new endpoints. The owner will run it.
- This REQ does not introduce a test runner (`backend/src/businessLogic/src/TestManager.ts` and `backend/src/dal/TestDal.ts` are commented-out manual scratch, not a test suite per CLAUDE.md).

### Gaps

1. **No existing test for controller-as-class pattern.** Controllers are today exported functions; refactoring them needs manual verification that each endpoint still works (paging params, filters, new routes AC22, AC29).
2. **No type checking for new alumni fields in the DTO.** AC13–AC17 require `mentorship_available: boolean` and `field?: string` in DTO, Query, Manager, Controller, and shared types. Mismatches will only show at runtime or from the frontend.
3. **No test of cascade deletes (AC30–AC31).** Both require transaction handling; the Query methods delete rows one at a time today. Confirming the transaction works requires the API check script or manual test against the real database.
4. **No test of paging edge cases (AC62).** Page past end, limit > 50, non-integer page/limit — all return 400 per spec. No coverage today; only the API check script will prove it.

---

## Vault references

- [[knowledge/gotchas#^g11|G11]] — `comment_count` is never updated (AC28 fixes this by tracking on comment create/delete)
- [[knowledge/gotchas#^g16|G16]] — alumni lookups return 200 with empty body (AC9 fixes this to 404)
- [[knowledge/gotchas#^g24|G24]] — no comments-for-one-post endpoint (AC29 adds `GET /api/posts/:id/comments`)
- [[knowledge/gotchas#^g25|G25]] — alumni reads and writes return different shapes (AC16 requires all reads include new fields)
- [[knowledge/gotchas#^g26|G26]] — alumni list has no fixed order (AC21 fixes to newest-first by id)
- [[knowledge/gotchas#^g28|G28]] — `npm run build` does not check DAL files that nothing imports (AC34 requires `npx tsc --noEmit` to pass for dal and businessLogic)
- [[knowledge/gotchas#^g29|G29]] — errors use `{ error }` and `{ message }` (AC4 unifies to `{ error }` everywhere)
- [[knowledge/gotchas#^g30|G30]] — updatable-field lists exist in both controller and Query (AC11 adds one input type; G30's duplication stays by design)
- [[knowledge/gotchas#^g31|G31]] — DTO types do not allow `null`, but database sends it (AC11's input type allows `null`; DTOs still typed as non-null for data-layer fields)
- [[knowledge/gotchas#^g32|G32]] — a user can create multiple alumni profiles (AC24 refuses a second with 409)
- [[knowledge/gotchas#^g34|G34]] — raw database messages on bad id and duplicate email (AC5–AC6 fix this; AC7 changes 409 response shape)
- [[architecture/adr-02-admin-deletes-any-post-edits-only-own|ADR-02]] — admin can delete any post but edit only their own (AC32 confirms this rule)
- [[architecture/adr-03-one-alumni-profile-per-user-created-by-that-user|ADR-03]] — one alumni profile per user, created by that user (AC24 refuses second with 409)
- [[architecture/adr-05-post-list-returns-author-name-and-photo|ADR-05]] — posts include author name and photo (AC27–AC28 implement; AC29 adds comments with same author fields)
- [[architecture/adr-06-deleting-rows-that-other-rows-reference|ADR-06]] — no `ON DELETE CASCADE`; backend deletes in transaction (AC30–AC31 implement; transaction location is ADR-06 open question)
- [[knowledge/concepts/user-join-read-shape]] — alumni and posts join to `"User"` for name/email/photo, never selecting password
- [[knowledge/concepts/partial-update-sent-fields]] — updates read a fixed column list from the request (G30 duplication is intentional)

---

## Open questions

1. **Login and verifyToken placement (AC1–AC2):** The spec says "Login is a method of a controller class" but does not say which one (new auth controller vs. `UserController`). The `login` function is today exported from `UserController` and imported in `AuthRoutes`. The architect should decide whether to:
   - Keep it in `UserController` as an instance method, or
   - Create a new `AuthController` class with `login` as an instance method, or
   - Keep it as a static method on `UserController` or as a utility function (if class methods don't require `this`).
   
   `verifyToken` is imported by `authMiddleware`, so it must stay accessible from outside the controller (static method or utility function).

2. **Error middleware implementation details:** The spec says "one error middleware" per AC3 but leaves implementation details open (how to handle async errors in Express 4, whether to use a library like `express-async-errors`, whether to catch all exceptions or only specific types). Express 4 does not catch async errors automatically; the team should decide on the pattern.

3. **Transaction handling for cascade deletes (ADR-06 open question):** AC30 says "Either all of it happens or none of it (ADR-06)" for post + comments deletion. Queries run one at a time today. The Manager should orchestrate this (call `pool.query("BEGIN")`, run deletes, `COMMIT` or `ROLLBACK` on error), but the exact pattern is not defined.

4. **Comment_count update timing:** AC28 says the count is "right after a comment is added and after a comment (with or without replies) is deleted," but does not say whether the Query method updates it atomically with the delete or if the Manager reads all comments afterward to recalculate. The architect should choose between:
   - Update `comment_count` on `posts` table directly (one query per create/delete), or
   - Leave it at zero and compute on read (simpler, less chance of mismatch; downside: slower on read with many comments per post).

5. **Shared input type for updates (AC11):** The spec says "one shared input type that allows `null`" for user/post/alumni updates. This likely means a generic type like `Partial<T>` or a specific `UpdateRequest<T>` type. The architect should define whether it lives in shared/, businessLogic/, or each controller.

---

## Summary of key changes

This REQ touches **every file in `backend/src/api/`, most of `backend/src/dal/`, `backend/src/businessLogic/`**, and the DTOs in shared/types:

- **Controllers:** functions → class methods (5 files)
- **Routes:** bind methods instead of functions (5 files); add 2 new routes (alumni filters, comments by post)
- **Middleware:** unify error response shape to `{ error }`; add one global error middleware
- **Queries:** add paging, search, filters, new methods (4 files)
- **DTOs:** add new alumni fields, join fields for author data (4 files)
- **Managers:** pass-through paging/filters; orchestrate cascade deletes (4 files)
- **Shared types:** add alumni fields, author fields on posts/comments (4 files)
- **Database docs:** add mentorship_available and field to alumni schema (1 file)

**No frontend code changes** per AC36, though three endpoints' response shapes change (duplicate email, unknown id, new error format).
