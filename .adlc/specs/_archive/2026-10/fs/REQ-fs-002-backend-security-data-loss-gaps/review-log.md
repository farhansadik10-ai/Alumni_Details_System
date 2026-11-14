# REQ-fs-002-backend-security-data-loss-gaps — Review log

Full reviewer narratives. The consolidated verdict lives in `verification.md` —
read that first; come here for the long form behind a finding ID.

## Correctness findings

Written by: correctness-reviewer (tier: balanced), dispatched sub-agent.

**Summary:** Checked all 19 files against AC1-AC28: 7 changed controllers/routes, 4 Query classes, `updateSet`, `requestHelpers`, and the Manager pass-throughs. Also grepped for stale callers of the changed `findPostById`/`updatePost`/`updateUser`/`updateLoginTime` signatures (none left outside the commented-out TestManager). Checked SQL column names against `db/schema.md`. 0 critical, 0 major, 1 minor, 1 trivial-level note (not listed as a finding). No bug found that breaks an AC. Owner checks run before writes on every route, column names in dynamic SQL come only from fixed lists, and no password column is selected outside the login read.

Dispatch questions: none given beyond the brief. Packet-gap: none.

### CORR-001: Duplicate-email edit returns the raw database error text

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `backend/src/api/controllers/UserController.ts:~137` (catch in `updateUser`) |
| Category | error-handling |

**What:** Changing a user's email to one already taken fails on the `User_email_key` unique constraint, and the catch block sends the Postgres message (constraint name, "duplicate key value...") as a 400 body.
**Why it matters:** `email` is now a first-class updatable field, so this path is easy to hit and shows internal schema names. The status code is right (client error); the text is the problem. Same pattern already exists on sign-up, so this is not new, just newly reachable.
**Recommendation:** Out of scope for this REQ (shared error middleware is a stated non-goal). Fix in the error-middleware REQ: map pg code `23505` to 409 "Email already in use".
**References:** spec Non-goals (error middleware).

(1 trivial not listed: `GET /api/users/:id` for an unknown id still returns 200 with an empty body; AC17 does not cover that route.)


## Quality findings

Written by: quality-reviewer (tier: balanced)

**Summary:** Checked 19 files against conventions.md (API, Logging, Config, Testing sections). 5 findings: 0 critical, 0 major, 4 minor, 1 trivial. Biggest: leftover `console.log` that dumps whole post and comment rows in two Query classes, right next to the one this REQ removed. No tests exist; that is the owner-accepted state (reported once, not a finding). Dispatch questions: none given. Packet-gap: none.

### QUAL-001: console.log still prints every row in Post and Comment queries

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `backend/src/dal/query/PostQuery.ts:~27`, `backend/src/dal/query/CommentQuery.ts:~21` |
| Category | dead-code |
| Rule | conventions.md > Logging: no `console.log` in production code (template default, unconfirmed) |

**What:** This REQ removed the `console.log(user)` from `UserQuery.getAllUsers`, but the same debug print remains in `PostQuery.getAllPosts` and `CommentQuery.getAllComments`.
**Why it matters:** Every list call writes every row to the server log. `getAllPosts` is also called by `findPostById` and `deletePost` in the controller, so one delete logs the whole table.
**Recommendation:** Delete both lines (no schema or behavior change), or log a follow-up if the owner wants this REQ kept narrow.

### QUAL-002: Post controller still loads all posts to find one, next to the new `findPostById`

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `backend/src/api/controllers/PostController.ts:30-40` and `deletePost` (`:~60`) |
| Category | duplication |
| Rule | conventions.md > API: layering (Manager to Query) |

**What:** `updatePost` uses the new `postManager.findPostById(id)`, but `findPostById` and `deletePost` in the same file still call `getAllPosts()` and `.find(...)`. The comment controller uses `findCommentById` for all three.
**Why it matters:** Two ways to load one post in one file; the old way reads the whole table per request.
**Recommendation:** Switch both to `postManager.findPostById(id)` (null check stays the same).

### QUAL-003: deletePost keeps its own admin/owner check instead of the new helpers

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `backend/src/api/controllers/PostController.ts:~63-67` |
| Category | duplication |
| Rule | none (consistency with `requestHelpers.ts`) |

**What:** `deletePost` declares a local `const isAdmin = req.user.role === "admin"` and compares `existing.user_id === req.user.sub` with `===`. Every other controller now uses `isSelf(req, ...)` and `isAdmin(req)`.
**Why it matters:** `isSelf` handles a string-versus-number id; the raw `===` does not. The local `isAdmin` hides the helper name, so a later import of the helper would clash.
**Recommendation:** Replace with `isSelf(req, existing.user_id) || isAdmin(req)`, as `deleteComment` does.

### QUAL-004: Updatable-column list written twice per entity (controller and query)

| Field | Value |
|---|---|
| Severity | minor |
| Effort | medium |
| File | `AlumniController.ts:12-20` and `AlumniQuery.ts:5-13`; `PostController.ts:13` and `PostQuery.ts:5`; `UserController.ts:20` and `UserQuery.ts:12` |
| Category | duplication |
| Rule | none |

**What:** The same field list is declared in the controller and again in the query for all three entities.
**Why it matters:** Adding a column means editing two files; if they drift, the field is silently dropped (no error). The double list is deliberate defense, so this may be accepted.
**Recommendation:** Keep it, but add a one-line comment on each query list saying "keep in step with the controller list". Or export the list from the DAL and import it in the controller.

### QUAL-005: Stale route comment, and loose types on the update path

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `backend/src/api/routes/PostRoutes.ts:16`; `UserManager.ts:~28`, `PostQuery.ts:~49` |
| Category | documentation |
| Rule | none |

**What:** The delete route still says "ownership check ideally in controller", though the controller now checks. `UserManager.updateUser` takes `Record<string, unknown>` and `PostQuery.updatePost` casts `data as Record<string, unknown>`, so TypeScript no longer checks field names on these paths.
**Recommendation:** Update the comment; optionally type the user fields as `Partial<Pick<UserDTO, "name"|"email"|"password"|"photo_url">>`.

(0 trivials not listed)

### Round 2 re-review

- QUAL-001: resolved. Both `console.log(post)` and `console.log(comment)` are gone from `PostQuery.getAllPosts` and `CommentQuery.getAllComments`.
- QUAL-002: resolved. `findPostById` and `deletePost` now call `postManager.findPostById(id)`; no `getAllPosts().find` is left in the controller.
- QUAL-003: resolved. `deletePost` denies on `!isSelf(req, existing.user_id) && !isAdmin(req)` using the imported helpers; the local `isAdmin` const that shadowed the helper is removed, so the import does not clash.
- QUAL-005 (route comments): resolved. Delete says "author or admin", PUT says "author only, even for admins (ADR-02)"; both match the controller.

New findings from the fix diff:

### QUAL-006: Non-numeric post id now gives a raw database message instead of "Post not found"

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `backend/src/api/controllers/PostController.ts` (`findPostById`, `deletePost`) |
| Category | behavior-change |
| Rule | none |

**What:** The old code compared ids in memory, so `GET`/`DELETE /api/posts/abc` gave 404 "Post not found". Now `Number("abc")` is `NaN`, goes to PostgreSQL as a parameter, and the catch returns the raw database error (404 on GET, 400 on DELETE).
**Why it matters:** Small. It matches the already accepted non-numeric-id risk (ADV-003, roadmap B3) and `updatePost` already behaves this way. Worth a line in the wrap-up notes only.
**Recommendation:** Accept; no change.

Type changes in `AlumniQuery` and `CommentQuery` (`| undefined`): the callers already null-check (`updateAlumni`, `updateComment`, `findAlumniById` in the update controllers), so no new issue. Not run: build (read-only review).

## Architecture findings

Written by: architecture-reviewer (tier: balanced)

**Summary:** Checked 19 files for layering, contract, pattern and dispatch-scope drift. 0 critical, 0 major, 4 minor. Route -> Controller -> Manager -> Query order holds everywhere; SQL stays in `dal/query/`; the two approved deviations are not exceeded. Biggest: three update paths type their Manager input three different ways (ARCH-001). Removed `updateLoginTime` has no live callers (grep: only commented lines in `TestManager.ts`); `findPostById` has no other callers.

### ARCH-001: Manager update inputs are typed three ways

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `backend/src/businessLogic/src/UserManager.ts:33`, `PostManager.ts:14`, `PostQuery.ts:49` |
| Category | pattern |
| Rule broken | Established pattern: `AlumniManager.updateAlumni(id, Partial<AlumniDTO>)`; [[knowledge/components/dal-query-classes]] |

**What:** Users take `Record<string, unknown>`, posts take `Partial<PostDTO>` and the Query casts it back to `Record`, alumni take `Partial<AlumniDTO>`; controllers use `as Partial<...>` casts to get there.
**Why it matters:** The Manager signature no longer tells the next author which fields are legal, and the casts hide a wrong key at compile time. B3 will copy whichever form it sees first.
**Recommendation:** Pick one: `Partial<Pick<XDTO, "name"|"email"|...>>` per domain, built from the same constant list as the Query columns, and drop the casts.

### ARCH-002: Field allow-list is written twice per domain

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `AlumniController.ts:17` vs `AlumniQuery.ts:5`; `PostController.ts:14` vs `PostQuery.ts:5`; `UserController.ts:20` vs `UserQuery.ts:11` |
| Category | separation |
| Rule broken | Architecture Approach 1-2 (allow-list in controller, fixed column list in Query) |

**What:** The same field names sit in a controller constant and a Query constant; adding a column means two edits, and a miss is silent (the field is accepted, then dropped, and the client sees 200).
**Why it matters:** Silent data loss of a new field is the exact class of bug this REQ closes. The two-layer list is a design choice, so this is drift risk only, not a violation.
**Recommendation:** Keep both (defence in depth) but note in `knowledge/concepts/partial-update-sent-fields` that they must change together; or export the Query list and import it in the controller via the Manager.

### ARCH-003: `PostController` still reads the whole table and uses its own owner check

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `PostController.ts:36-45` (`findPostById`), `PostController.ts:80-92` (`deletePost`) |
| Category | pattern |
| Rule broken | Convention: shared helpers `isSelf`/`isAdmin` in `api/utils/requestHelpers.ts`; Architecture Approach 4 ("reading one row instead of the whole table") |

**What:** `PostManager.findPostById(id)` now exists, but `findPostById` and `deletePost` still call `getAllPosts()` and compare `user_id === req.user.sub` and `role === "admin"` inline. `updatePost` in the same file uses the new helpers.
**Why it matters:** One file holds two owner-check styles, and the inline one skips the `isSelf` string/number guard. It also logs every post row (`PostQuery.getAllPosts` console.log) on each delete.
**Recommendation:** Switch both to `postManager.findPostById(id)` and `isSelf`/`isAdmin`. Out of the stated scope, so fine to defer to B3 if the owner prefers; say so at wrap-up.

### ARCH-004: Query return types claim a row but can return nothing

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `AlumniQuery.ts:29,41` (`findAlumniById`, `updateAlumni` -> `Promise<AlumniDTO>`), `CommentQuery.ts:27` (`updateComment` -> `Promise<CommentDTO>`) |
| Category | contract |
| Rule broken | Same-REQ pattern: `UserQuery`/`PostQuery` now return `X \| undefined` / `X \| null` |

**What:** The controllers now test `!existing` / `!updated` on these results, but the declared types say a row always comes back, so the compiler cannot flag a forgotten check elsewhere. Users and posts were fixed in this diff; alumni and comment were not.
**Why it matters:** The 404 contract (AC17) rests on a check the types do not enforce; also, `updateAlumni`'s empty-body branch returns a bare `alumni` row while `findAlumniById` returns the joined shape (G25), so the two differ.
**Recommendation:** Change the four return types to `| undefined` (as `findCommentById` already is) and update `AlumniManager` inference accordingly.

### Dispatch notes
- Layering / cross-layer imports: checked, nothing (controllers import only Managers and DTOs; no SQL outside `dal/query/`).
- Two approved deviations (function controllers, checks in controllers): checked, code stays within them.
- API contract: removed `PUT /api/users/:id/login` and new 400/403/404 codes match the spec; `PublicUserDTO` is exported from `@alumni/dal` and `@alumni/shared` is untouched, so no contract drift. Checked, nothing.
- Helper placement (`api/utils/requestHelpers.ts`, `dal/query/updateSet.ts`): checked, nothing; each stays in its own layer with no Express or pg import crossing.
- Mocks / test architecture: checked, nothing (no runner, per spec).

### Round 2 re-review

Checked the 5 fix-round files plus `PostManager`, `AlumniManager`, `CommentManager`, `requestHelpers.ts` and the three controllers that consume the widened types. 0 new findings.

- ARCH-003: resolved. `findPostById` and `deletePost` now call `postManager.findPostById(id)`; `deletePost` allows exactly author (`isSelf`) or admin (`isAdmin`), same as before. `isSelf` is stricter than the old `===` (a numeric-string token `sub` now matches too, null/empty is refused), which only removes a false 403/pass risk. 404 comes first, then 403, then delete. The `console.log` that fired on each delete path is gone.
- ARCH-004 first half (return types): resolved. `findAlumniById`, `updateAlumni` and `updateComment` now return `X | undefined`. The Managers have inferred return types, so the widening flows through unchanged, and every controller call site already tests `!existing` / `!updated` (`AlumniController.ts:93,121`, `CommentController.ts:53`, `PostController.ts:53,70`). No caller depends on a non-undefined result.
- ARCH-004 second half (bare alumni row on nothing-to-write): resolved as accepted. The shape matches the `UPDATE ... RETURNING *` path (G25), the comment names that rule, and the path is unreachable from the controller (400 first).
- Side note, no action: `PostController.findPostById` is still not wired in `PostRoutes.ts`, so its change has no live route; unchanged by this round. A non-numeric `:id` still reaches PostgreSQL and returns the raw message, as accepted in the architecture risks.

## Reflection findings

Written by: reflector (tier: balanced), dispatched sub-agent.

**Summary:** Checked 4 lessons (0 superseded), 27 gotchas, 3 applicable ADRs (ADR-01/02/03; all 10 accepted, the rest do not touch this diff), 2 concept pages, 2 component pages. 5 findings: 0 critical, 2 major (both vault-stale, needs-decision for /wrapup), 3 minor. No ADR conflict: ADR-01 (sign-up role), ADR-02 (admin edits only own post) and ADR-03 (user_id from token) are implemented as written. Biggest: about 15 gotcha entries and two component pages now describe a backend that no longer exists.
**Dispatch questions:** architecture.md Mermaid diagram: checked, it has none. docs likely affected: `PUT /api/users/:id/login` (postman/ collections and docs/ may name it), and roadmap row B2 (`docs/roadmap.md:7`, status "Next").

### REFL-001: Gotchas G02, G09, G10, G14, G15, G17-G23, G27 are now stale

| Field | Value |
|---|---|
| Severity | major |
| Effort | medium |
| File | `.adlc/knowledge/gotchas.md` |
| Category | vault-stale |
| Vault reference | [[knowledge/gotchas#^g09\|G09]], [[knowledge/gotchas#^g17\|G17]], [[knowledge/gotchas#^g19\|G19]], [[knowledge/gotchas#^g27\|G27]] |

**What:** The diff fixes the behaviour these entries still call "confirmed" or "live": partial update (G02, G09, G10), sign-up role (G14), login route removed (G15), hash in responses (G17), owner checks (G18, G19, G21, G23), author from token (G20, G22), 404 on missing row for alumni and comment update/delete (G27).
**Why it matters:** The next REQ (frontend on these endpoints) will read "any user can edit any alumni profile" and design around a hole that is closed, or skip a check it thinks is missing.
**Recommendation (needs-decision, /wrapup step 3):** Add an "Update 2026-10-06 (REQ-fs-002)" line and set Status to "fixed by REQ-fs-002 (not yet run against the database)" on those entries, as REQ-fs-001 did. Leave open: G16 (`findAlumniById`, `findUserById` still send 200 on a missing row, `UserController.ts:77`, `AlumniController` reads), G13 (create still reads `post_id`), G08, G11, G26. G27: only the two update paths and delete-comment-by-owner-check are fixed; say so. G17: note that `findUserWithPasswordByEmail` is now the one hash read.

### REFL-002: Component and concept pages describe the old state

| Field | Value |
|---|---|
| Severity | major |
| Effort | small |
| File | `.adlc/knowledge/components/dal-query-classes.md:18-29`, `api-controllers-and-routes.md`, `concepts/partial-update-sent-fields.md:9` |
| Category | vault-stale |
| Vault reference | [[knowledge/components/dal-query-classes]], [[knowledge/concepts/partial-update-sent-fields]] |

**What:** `dal-query-classes` still says updates write every column, `console.log` is in `UserQuery.getAllUsers`, and `UserQuery` returns `password`. The code now has `updateSet.ts`, `PUBLIC_USER_COLUMNS` and no log in `UserQuery`. The concept page is marked "not yet built" and the controllers page is a stub.
**Recommendation (needs-decision, /wrapup):** Rewrite those three bullets and the state table; remove "needs verification" on the concept once the owner's manual checklist passes and add `requestHelpers.ts` (`pickSent`, `isSelf`, `isAdmin`) and `buildUpdateSet` to it; fill the controllers page (owner-check order, token-sourced author). Also update `docs/roadmap.md` row B2 and `.adlc/context/architecture.md:94-95` (now true for all but delete-user paths). Root `CLAUDE.md` names nothing removed.

### REFL-003: Row logging still present in two siblings

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `backend/src/dal/query/CommentQuery.ts:19`, `backend/src/dal/query/PostQuery.ts:25` |
| Category | repeated-mistake |
| Vault reference | [[knowledge/lessons/LESSON-REQ-fs-001-4-join-then-check-the-logs]] |

**What:** The user log was removed (AC10 as written covers user rows only), but the lesson says to settle each sibling log in the same change; the exploration report also read AC10 as covering posts and comments.
**Why it matters:** Comment and post rows carry free text and `user_id`; the same lesson was recorded last REQ and the same two lines were left then too.
**Recommendation:** Delete the two `console.log(...)` lines, or record in the spec that they were left on purpose. This is the second REQ that skipped them.

### REFL-004: Post controller still re-derives owner/admin and fetch-all lookups

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `backend/src/api/controllers/PostController.ts:56-62` (`deletePost`), `:40-43` (`findPostById`) |
| Category | re-derivation |
| Vault reference | [[knowledge/concepts/partial-update-sent-fields]] (no owner-check concept exists) |

**What:** `deletePost` still does a raw `existing.user_id === req.user.sub` and `getAllPosts()` to find one row, beside the new `isSelf`/`isAdmin` and `postManager.findPostById`. `findPostById` also still scans all posts.
**Why it matters:** Two ways to do the same check in one file; the old one skips the null/zero guard `isSelf` adds. (Quality may also have flagged this; cross-reference only.)
**Recommendation:** Use `isSelf || isAdmin` and `postManager.findPostById(id)` in both. Add a short "owner check" concept page at /wrapup (order: 403 before 400/404 for users; fetch row, then check, then validate).

### REFL-005: ADR-03 "one profile per user" still not enforced

| Field | Value |
|---|---|
| Severity | minor |
| Effort | medium |
| File | `backend/src/api/controllers/AlumniController.ts:44` |
| Category | adr-conflict (partial, not a contradiction) |
| Vault reference | [[architecture/adr-03-one-alumni-profile-per-user-created-by-that-user]] |

**What:** `user_id` now comes from the token (AC23, as the ADR says), but nothing stops one user posting `POST /api/alumni` twice; the ADR lists the check as "new work" and the REQ spec does not cover it.
**Recommendation:** Do not fix here (a UNIQUE needs owner approval). At /wrapup note it on ADR-03 as still open, or open a follow-up REQ; the frontend must hide "add my profile" when one exists.

(0 trivials not listed.) Lesson candidates: CAND-R01 to R03 in `lesson-candidates.md` (most reflector ideas were already surfaced by earlier agents).

### Round 2 re-review

- REFL-003: **resolved.** `console.log(post)` and `console.log(comment)` are gone from `PostQuery.getAllPosts` and `CommentQuery.getAllComments`. Remaining `console.*` calls are only in `server.ts`, `api/server.ts`, `db.ts` and the scratch `TestDal.ts`: none print rows (LESSON-REQ-fs-001-4 holds).
- REFL-004: **resolved.** `deletePost` and `findPostById` now call `postManager.findPostById(id)` (one row, not the whole table) and `deletePost` uses `isSelf || isAdmin` from `requestHelpers`. The old inline `existing.user_id === req.user.sub` is gone, so the role string and the id comparison are written once. Behaviour stays the same, and `isSelf` is stricter on a null or empty id (refuses it), which is safe.

New conflicts with a lesson, gotcha or ADR: **none.**
- ADR-02 holds: delete is author or admin, edit (`updatePost`, unchanged) is author only. The route comments now say so.
- G25 holds: the new comment in `AlumniQuery.updateAlumni` keeps the bare alumni SELECT on the nothing-to-write path.
- Nit (not a finding): `findPostById` still answers 404 for a non-numeric `:id` through its `catch`, so that path behaves as before.

Vault pages the fix round adds to the wrap-up list (one line each):
- `knowledge/components/dal-query-classes.md` line 20 says the row `console.log` is still in `CommentQuery.getAllComments` (and `UserQuery`): now stale for Comment and Post, and for User after round 1. Delete the bullet.
- G27 (`knowledge/gotchas.md` ~line 648) still says `updateAlumni` and `updateComment` give an empty 200: already on the REFL-001 list; the new `| undefined` return types make the "no row" case visible to the compiler, so mention that when updating it.

## UI/UX findings

Tier: STATIC only (no server, no browser; owner forbids DB writes). Trigger: indirect-api-impact.

**Summary:** No legacy screen breaks under the new contract. Sign-up sends lowercase "student"/"alumni" (matches the new check). Nothing reads `password`; the frontend already deletes it defensively. No `user_id` is sent, and the removed login-stamp route is never called. Logout already swallows any error, so a 403 is harmless. 0 blockers, 2 low notes.

### UI-1 (Low, note) Stale comments about the password hash
| Field | Value |
|---|---|
| Files | frontend/src/services/usersApi.ts:6, frontend/src/pages/auth/SignUpPage.tsx:29, frontend/src/types/api.ts:18 |
| Impact | Comments say the backend "still returns the password hash (plan L.1)"; no longer true |
| Action | None in this REQ (AC27 forbids frontend edits). `withoutPassword` is harmless and can go when the frontend is rebuilt. |

### UI-2 (Low, note) Sign-up error text relies on raw backend messages
| Field | Value |
|---|---|
| Files | frontend/src/services/usersApi.ts:15-18, SignUpPage.tsx:34 |
| Impact | Duplicate email still maps via 400 + "User_email_key" (controller still passes the DB message through at UserController.ts:64, unchanged path). A bad role would show "Role must be student or alumni" via getErrorMessage, but the form cannot send one (Select limited to SIGNUP_ROLES). |
| Action | Owner to confirm duplicate-email message in the manual check below. |

### Checked, no issue
- Sign-up body: name, email, password, role (lowercase, from SIGNUP_ROLES), optional photo_url. Matches the new role rule.
- GET /api/users/:id (useCurrentUser, HeaderUserMenu): uses name, email, photo_url only. Own-id read; the getUserById code still expects 200 with an empty body for an unknown id; if the backend now returns 404 it throws and the header falls back to the role label (HeaderUserMenu:23-24), so no crash.
- Logout: PUT /api/users/{own id}/logout from the token's sub, so passes the owner check. A 403 or any error is caught and the user is logged out locally.
- Login: /api/auth/login only. The removed PUT /api/users/:id/login is not referenced anywhere in frontend/src.
- No frontend call to posts, comments, alumni or PUT /api/users/:id exists yet, so those new 403/404/400 answers have no consumer.

### Manual checklist for the owner (touches the real DB; run only if you accept that)
1. Sign up as student, then as alumni: each succeeds and lands on login with the email prefilled.
2. Sign up again with the same email: the form shows "This email is already registered".
3. Log in, check the header shows your name/email/photo (profile load works without `password`).
4. Click Logout: you return to the login page; a second logout from a stale tab does not show an error.
5. Optional: in browser dev tools, confirm the GET /api/users/:id response has no `password` field.
