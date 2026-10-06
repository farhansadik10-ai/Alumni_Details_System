# REQ-fs-002 — Codebase exploration

| Field | Value |
|---|---|
| Generated | 2026-10-06 |
| By | codebase-explorer (tier: fast) |
| Repo(s) scanned | alumni-details-system (primary working directory) |

## 1. Similar existing implementations

| Path | What it does | Recommended action |
|---|---|---|
| `backend/src/api/controllers/PostController.ts` → `deletePost` (lines 53–72) | Fetches all posts, finds the matching id, checks owner or admin role, then deletes. | deviate |
| `backend/src/api/MiddleWare/authMiddleware.ts` (lines 4–14) | Extracts bearer token, verifies it, sets `req.user = { sub: number; role: string }`. | follow |
| `backend/src/api/MiddleWare/roleMiddleware.ts` (lines 3–9) | `requireRole(...roles)` middleware checks `req.user.role` against allowed list. | follow |

**Notes:**
- PostController.deletePost is the only existing owner check in the backend. It uses an inefficient pattern (fetches all posts to find one). AC22 will require the same check for updatePost.
- authMiddleware and roleMiddleware are the only auth mechanisms; they should be used for all new checks.
- No partial update patterns exist yet; all updates overwrite omitted fields to NULL.

## 2. Blast radius

| Path | Why touched | Risk |
|---|---|---|
| `backend/src/dal/query/UserQuery.ts` | `updateUser` (lines 51–75): overwrites all four fields (name, photo_url, password, email) regardless of what the request sends. AC1, AC2, AC3 require conditional column updates. `createUser` (lines 8–24): returns password in RETURNING *; AC8 requires it omitted. `getAllUsers` (lines 78–91): logs every user row including password; AC10 requires removal. `updateLoginTime` (lines 103–110): AC21 requires deletion. `updateLogoutTime` (lines 113–120): AC24 requires owner check (called by frontend's useLogout). `findUserById` (lines 40–48): returns password; AC8 requires omission. | high |
| `backend/src/dal/query/PostQuery.ts` | `updatePost` (lines 39–46): overwrites both caption and media_url. AC4 requires conditional updates. `createPost` (lines 6–13): takes user_id from data; AC18 requires it ignored. | high |
| `backend/src/dal/query/CommentQuery.ts` | `updateComment` (lines 25–32): only updates content, which is correct (AC20). But no `findCommentById` method exists; AC15 and AC16 require one to check ownership before update/delete. `createComment` (lines 6–12): takes user_id from data; AC19 requires it ignored. | high |
| `backend/src/dal/query/AlumniQuery.ts` | `updateAlumni` (lines 39–57): overwrites all seven fields. AC5 requires conditional updates. `createAlumni` (lines 5–20): takes user_id from data; AC23 requires it ignored. Both queries return the base row only (no user join); AC5 and AC8 operate only on the alumni table, so no password exposure here. | high |
| `backend/src/businessLogic/src/UserManager.ts` | `updateUser` (lines 25–28): passes Partial<UserDTO> to the Query, but the Query still overwrites all fields. `updateLoginTime` (lines 40–42): AC21 requires deletion. `updateLogoutTime` (lines 44–46): AC24 requires owner check added in the controller. | high |
| `backend/src/businessLogic/src/PostManager.ts` | `updatePost` (lines 14–17): passes a full PostDTO to the Query, which overwrites both media fields. AC4, AC22 require conditional updates. | high |
| `backend/src/businessLogic/src/CommentManager.ts` | No methods reference ownership; AC15 and AC16 will need a new `findCommentById` method added here and in the Query. | medium |
| `backend/src/businessLogic/src/AlumniManager.ts` | `updateAlumni` (lines 25–28): passes Partial<AlumniDTO> but the Query overwrites all fields. | high |
| `backend/src/api/controllers/UserController.ts` | `createUser` (lines 34–44): returns the full user object (includes password); AC8 requires it omitted. Does not validate role. `updateUser` (lines 74–85): builds a full UserDTO from partial request fields; leaves them as `undefined` if not sent, then passes it to the Manager. AC1–AC3 and AC6 require validating that at least one field is sent, building a partial update SQL, and rejecting null/empty email and password. `findUserById` (lines 55–62): returns the user row including password; AC8 requires it omitted. `findUserByEmail` (lines 64–72): returns password; AC8 requires it omitted. `updateLoginTime` (lines 97–105): AC21 requires deletion. `updateLogoutTime` (lines 107–115): AC24 requires owner check. | high |
| `backend/src/api/controllers/PostController.ts` | `createPost` (lines 7–16): takes user_id from the body; AC18 requires it taken from `req.user.sub`. `updatePost` (lines 41–51): takes user_id from the body and overwrites both caption and media_url. AC4, AC22 require: conditional column updates and owner check (only post owner can edit). `findPostById` (lines 27–39): calls `getAllPosts()` to find a single post (inefficient); when AC22's owner check is added, this will need a direct `findPostById` call via PostManager. | high |
| `backend/src/api/controllers/CommentController.ts` | `createComment` (lines 7–16): takes user_id from the body; AC19 requires it taken from `req.user.sub`. `updateComment` (lines 27–37): takes user_id, post_id, parent_id from the body but should only allow changing content; AC20 requires blocking these fields and adding owner check. Needs a `findCommentById` call to check ownership. `deleteComment` (lines 39–48): deletes by id with no owner check; AC16 requires owner-or-admin check. Needs a `findCommentById` call. | high |
| `backend/src/api/controllers/AlumniController.ts` | `createAlumni` (lines 7–38): takes user_id from the body; AC23 requires it taken from `req.user.sub`. `updateAlumni` (lines 70–80): passes `req.body` directly to Manager without selecting fields; AC5 and AC6 require validating that at least one field is sent, rejecting null/empty required fields, and building conditional SQL. No owner check; AC14 requires owner-or-admin check. | high |
| `backend/src/api/routes/UserRoutes.ts` | Route `:id/login` (line 23): no `authMiddleware`. AC21 requires the entire route and its backing code to be removed. Route `:id/logout` (line 24): has `authMiddleware` but no owner check; AC24 requires one. | high |
| `backend/src/api/routes/PostRoutes.ts` | Route `/:id` PUT (line 15): has `authMiddleware` only; AC22 requires an owner check (matching deletePost's pattern). | high |
| `backend/src/api/routes/AlumniRoutes.ts` | Route `/:id` PUT (line 18): has `authMiddleware` only; AC14 requires owner-or-admin check. | high |
| `backend/src/api/routes/CommentRoutes.ts` | Route `/:id` PUT (line 9): has `authMiddleware` only; AC15 requires owner check. Route `/:id` DELETE (line 10): has `authMiddleware` only; AC16 requires owner-or-admin check. | high |
| `backend/src/dal/dto/UserDTO.ts` | Constructor (line 14): takes five arguments (name, email, password, role, photo_url), all required. AC6 requires building a UserDTO from partial fields without null-checking role (role is not sent). Constructor sets login_at, logout_at, created_at, updated_at (line 20–24) to `now`, which is wrong for updates. | high |
| `backend/src/dal/dto/PostDTO.ts` | Constructor (line 12): takes three arguments (userId, caption, mediaUrl), all required except caption and mediaUrl are optional. Good for partial updates. | low |
| `backend/src/dal/dto/CommentDTO.ts` | Constructor (line 10): takes four arguments (userId, postID, content, parentID), only parentID is optional. Will need to accept partial fields for AC20. | medium |
| `backend/src/dal/dto/AlumniDTO.ts` | Constructor (line 19–40): takes seven arguments, only the last six are optional. Takes graduation_year as a separate argument that is assigned afterward (line 31). Good structure for partial updates. | low |
| `frontend/src/services/usersApi.ts` | `logout` function (line 41–43): calls `PUT /api/users/:id/logout` with the user's token. This route has `authMiddleware`, so it can already read `req.user.sub`. AC24 requires it to reject if the id doesn't match. The frontend's useLogout.ts (line 26) calls this only for the logged-in user, so the frontend's behavior is already correct; the backend just needs the check. | low |
| `shared/types/user.types.ts` | No password field in `CreateUserDTO` (line 14–20), good. User type (line 1–12) includes password; AC8 doesn't require changes to shared types (it only affects responses). `login_at` and `logout_at` are optional Date; shared types are fine. | low |

## 3. Integration points

**Authentication and authorization:**
- `authMiddleware` (backend/src/api/MiddleWare/authMiddleware.ts) sets `req.user = verifyToken(token)`, where verifyToken returns `{ sub: number; role: string }`. All protected routes must use this.
- `requireRole(...roles)` middleware checks `req.user.role` against allowed list. Used on some routes.
- `req.user.sub` is the numeric user id. Confirmed in UserController.login (line 20): `{ sub: user.id, role: user.role }`. This is always a number.

**Partial update patterns:**
- No existing partial update pattern. UserDTO constructor requires all five fields. AlumniDTO has good optional structure. PostDTO has optional caption and media_url.
- The Query layer must be changed to build dynamic SQL that only updates sent columns.

**Password handling:**
- `UserQuery.createUser`, `updateUser`, `findUserByEmail`, `findUserById`, `getAllUsers` all use `SELECT *` or `RETURNING *`, which include password.
- AC8 requires every endpoint to omit password from responses. This must be done in the controller or Query layer (Query is cleaner for future callers).
- `UserController.login` (line 12–26) calls `findUserByEmail` to get the hash, then compares with bcrypt. The login controller must not return the hash; it already doesn't (returns `{ token }` only).

**User extraction for ownership checks:**
- To check if the logged-in user is the owner, controllers must compare `req.user.sub` with the row's `user_id` field.
- For posts and comments, the id is in `req.params.id` (number).
- For users, the id to update is `req.params.id`, and the check is `req.user.sub === Number(req.params.id)`.
- For alumni, the check is `alumni.user_id === req.user.sub` (need to fetch the alumni row first).
- For comments, the check is `comment.user_id === req.user.sub` (need to fetch the comment row first).

**Role validation at sign-up:**
- `UserController.createUser` (line 36) extracts role from req.body without validating it.
- AC11 and AC12 require validating that role is exactly `"student"` or `"alumni"` (case-sensitive).
- Any other value (including `"admin"`, different case, or missing) must return 400.

**The removed route:**
- `PUT /api/users/:id/login` (UserRoutes.ts, line 23) has no `authMiddleware` and is never called by any code in backend, frontend, or shared (confirmed by grep search).
- AC21 requires removing: the route, `UserController.updateLoginTime`, `UserManager.updateLoginTime`, `UserQuery.updateLoginTime`.
- No other code references these.

**Existing owner check to follow:**
- PostController.deletePost (lines 53–72) already has an owner check: fetch the row, check `existing.user_id === req.user.sub || req.user.role === "admin"`.
- AC15 (comments edit: owner only) and AC22 (posts edit: owner only) must follow this pattern.
- AC16 (comments delete: owner or admin) and deletePost already follow the pattern.

**Console logging:**
- `UserQuery.getAllUsers` (line 86): `console.log(user)` for every row including password. AC10 requires removal.
- `PostQuery.getAllPosts` (line 21): `console.log(post)`. No password in posts, so not a security issue, but should still be removed for AC10 (no code path writes a row to the console).
- `CommentQuery.getAllComments` (line 19): `console.log(comment)`. Same as posts.

**The Controllers pass fields through to Managers without modification:**
- UserController.updateUser (line 78) builds a UserDTO with potentially undefined fields, then passes it to the Manager.
- AlumniController.updateAlumni (line 72–74) passes `req.body` directly to the Manager.
- PostController.updatePost (lines 43–45) builds a PostDTO from body fields and passes it.
- This pattern will need to change for partial updates to work.

## 4. Test coverage

| Test file | Scenarios covered | Gaps for new code |
|---|---|---|
| None | (No test runner configured. TestManager.ts and TestDal.ts are commented-out manual scratch scripts, not an automated suite.) | All new features lack automated test coverage. Per [[knowledge/lessons/LESSON-REQ-fs-001-1]], the build does not check SQL, so each query change must be verified by eye against db/schema.md and run by the owner against the database. |

**Existing test files (commented out, not run):**
- `backend/src/businessLogic/src/TestManager.ts` — Commented-out manual snippets for creating and updating posts, comments, alumni, users.
- `backend/src/dal/TestDal.ts` — Two commented-out manual creates (post, comment).

**Coverage gaps for this REQ:**
1. No test for partial updates (AC1–AC7, AC20).
2. No test for password omission from responses (AC8–AC9).
3. No test for sign-up role validation (AC11–AC12).
4. No test for owner checks (AC13–AC16, AC22, AC23, AC24).
5. No test for author field coming from token (AC18–AC19, AC23).
6. No test for removal of updateLoginTime (AC21).

Owner will manually exercise each endpoint against the real database and verify:
- Partial updates work correctly (only sent fields change).
- Password never appears in responses.
- Sign-up rejects invalid role.
- Owner checks block non-owners with 403.
- Admins have the correct permissions per ADR-02 (delete any post, edit only own).
- Author fields come from token, not body.
- Missing id returns 404, not 200 (AC17, AC27).

## Vault references

Pages from the knowledge vault relevant to this REQ:

- [[knowledge/gotchas#^g02|G02]] — `updateAlumni` overwrites omitted fields to NULL (AC5 required this to be fixed).
- [[knowledge/gotchas#^g09|G09]] — Editing a user without password locks them out; `updateUser` overwrites all four fields (AC1–AC3 address this).
- [[knowledge/gotchas#^g10|G10]] — `updatePost` overwrites caption and media_url (AC4, AC22 address this).
- [[knowledge/gotchas#^g14|G14]] — Sign-up stores whatever role the body says, so anyone can register as admin (AC11–AC12 address this).
- [[knowledge/gotchas#^g15|G15]] — `PUT /api/users/:id/login` needs no login; anyone can stamp any user's login_at (AC21 removes it; the owner chose this at the spec gate).
- [[knowledge/gotchas#^g17|G17]] — User endpoints return the password hash (AC8 addresses this).
- [[knowledge/gotchas#^g18|G18]] — Any logged-in user can update any user (AC13 adds owner check).
- [[knowledge/gotchas#^g19|G19]] — Any logged-in user can update any alumni profile (AC14 adds owner-or-admin check).
- [[knowledge/gotchas#^g20|G20]] — `POST /api/posts` takes user_id from body (AC18 addresses this).
- [[knowledge/gotchas#^g21|G21]] — Any logged-in user can edit any post (AC22 adds owner-only check).
- [[knowledge/gotchas#^g22|G22]] — `POST /api/comments` takes user_id from body (AC19 addresses this).
- [[knowledge/gotchas#^g23|G23]] — Any logged-in user can edit or delete any comment (AC15–AC16 address this).
- [[knowledge/gotchas#^g25|G25]] — Alumni reads return name, email, photo_url (from join); writes return alumni columns only. AC5 updates alumni only, so no shape change.
- [[knowledge/concepts/user-join-read-shape]] — Rule for joining "User" in a read without exposing password. AC8 applies this to user reads and write responses.
- [[knowledge/components/dal-query-classes]] — Overview of Query class patterns. Partial updates must be done here; the build does not check SQL.
- [[knowledge/lessons/LESSON-REQ-fs-001-1]] — The build does not check SQL; each change must be verified by eye and run.
- [[knowledge/lessons/LESSON-REQ-fs-001-2]] — Fixing one gotcha can open another (e.g., fixing G02 SQL but not adding the owner check opens G19). AC22 is here because it was added at the spec gate to prevent the same issue.
- [[knowledge/lessons/LESSON-REQ-fs-001-3]] — `req.body` passed straight through (AlumniController.updateAlumni is an example). AC5 and AC6 require validating and building conditional SQL.
- [[knowledge/lessons/LESSON-REQ-fs-001-4]] — Rows printed to the log (UserQuery.getAllUsers, PostQuery.getAllPosts, CommentQuery.getAllComments). AC10 requires removal.
- [[architecture/adr-01-sign-up-role-is-student-or-alumni|ADR-01]] — Sign-up role is student or alumni; admin is never selectable. Backend must enforce it (AC11–AC12). Owner chose "reject" at the spec gate.
- [[architecture/adr-02-admin-deletes-any-post-edits-only-own|ADR-02]] — Admin can delete any post but edit only their own (AC22).
- [[architecture/adr-03-one-alumni-profile-per-user-created-by-that-user|ADR-03]] — A user creates only their own alumni profile; `user_id` comes from the logged-in user (AC23).

## Open questions

- [ ] **AC7**: If a request body has no updatable fields, should the response be 400 (invalid request) or 200 with the unchanged row? This does not change scope; the architect will propose and the owner will decide.
- [ ] **Comment role checks**: ADR-02 says an admin can delete any post but edit only their own. Does the same rule apply to comments (AC15 says "owner only" and AC16 says "owner or admin")? The spec does not explicitly say. The requirement seems to be: edit is owner-only for every role; delete is owner-or-admin. This is consistent with ADR-02 and AC15–AC16 as written.
- [ ] **CommentQuery.findCommentById**: Does not exist. To implement AC15 and AC16, the architect must decide whether to add it to CommentQuery and call it via CommentManager, or to use a different pattern (e.g., iterate through getAllComments to find the id, as deletePost currently does). The latter is inefficient; adding the method is recommended.
- [ ] **Post owner check efficiency**: PostController.deletePost calls `getAllPosts()` to find one post. AC22 will add the same check to updatePost. Should updatePost use the same pattern, or should PostQuery.findPostById (which exists) be called via PostManager? The latter is more efficient; the architect should ensure it is used.
