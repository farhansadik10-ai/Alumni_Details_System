# Architecture adversary — REQ-fs-003-finish-backend-api

Written by: architecture-adversary (tier: balanced), dispatched sub-agent.

| Field | Value |
|---|---|
| Generated | 2026-10-06 |
| Trigger | new-adr, large-blast-radius, sensitive-surface (auth, public API contract) |
| Verdict | found problems |

## Summary

Read the spec (38 ACs), architecture, ADR-11/12, 12 tasks and the current code; ran `tsc --listFilesOnly` (no database) to check what the dal and businessLogic compiles cover. 9 findings: 0 critical, 2 major, 7 minor. Biggest: the `ESCAPE '\'` clause in the alumni and user search SQL will break if it is copied into a JS template string as written. Second: three parallel tier-1 tasks all need exports from `dal/index.ts`, and none of them owns that file.

Dispatch questions: (1) SQL: recursive delete is valid PostgreSQL (the self foreign key is NO ACTION, checked at end of statement, so parent and children can go in one DELETE); count sub-query, stats statement and `$n` numbering are fine; ILIKE finding is ADV-001. (2) Route order and 404/error placement: checked, nothing. (3) ACs with no task: AC38 only (ADV-009 note); untestable task acceptance: ADV-005. (4) Same-tier same-file: none written, but ADV-002 is a same-file collision waiting to happen. (5) Unsaid REQ-fs-002 changes: checked, nothing (every change maps to AC4-AC10, AC25, AC33). (6) TypeScript: ADV-003; `handler()` and `checkFields` are workable as sketched (one internal cast in `checkFields`).

## Findings

### ADV-001: `ESCAPE '\'` breaks inside a JS template string

| Field | Value |
|---|---|
| Severity | major |
| Confidence | medium |
| Lens | failure-mode |
| Where | `tasks/TASK-005.md` and `tasks/TASK-006.md` (`ILIKE $n ESCAPE '\'`); `tasks/TASK-002.md` (`likePattern`) |

**What:** The existing Query files write SQL in backtick template strings. In a template string `'\'` becomes `'` (the backslash escapes the quote), so the SQL reaches PostgreSQL as `ESCAPE ' OR ...`: an unterminated string, a syntax error, a 500 on every search with `q`. The build cannot see it (LESSON-REQ-fs-001-1).
**Why it matters:** AC19, AC25 and every `q` search fail; only the owner's script run would catch it.
**Why this holds up:** I looked for a guard: the tasks show the SQL as plain SQL and never say how it is written in TypeScript. An implementer who copies it literally gets the bug.
**Recommendation:** In TASK-002, export a constant (for example `LIKE_ESCAPE_CLAUSE = "ESCAPE '\\\\'"` written so the SQL text holds one backslash) or drop the clause: backslash is already PostgreSQL's default LIKE escape. Say which in TASK-005/006, and add a name-by-name read of the final SQL text to their acceptance.

### ADV-002: Per-Query types and filter types have no export path; three tier-1 tasks would collide on `dal/index.ts`

| Field | Value |
|---|---|
| Severity | major |
| Confidence | medium |
| Lens | hidden-coupling |
| Where | `tasks/TASK-005/006/007.md` (Files to touch); `tasks/TASK-002.md` (index.ts exports) |

**What:** Managers must write `UpdateFields<UserUpdateColumn>`, `AlumniUpdateColumn`, `PostUpdateColumn`, and take the list filter types. Managers import only from `@alumni/dal` (`dal/index.ts`). TASK-002 exports only the helper types; TASK-005/006/007 export the column types from the Query files but do not list `dal/index.ts` in Files to touch.
**Why it matters:** Either `tsc -p businessLogic` fails at the end of tier 1, or each of the three parallel tasks edits `dal/index.ts` and they overwrite each other.
**Why this holds up:** Deep imports like `@alumni/dal/query/UserQuery` might resolve, but no task says to use them and no Manager does that today.
**Recommendation:** Move all new type exports (`UserUpdateColumn`, `AlumniUpdateColumn`, `PostUpdateColumn`, the filter interfaces) into TASK-002 (it owns `dal/index.ts`), defining the column types in a file TASK-002 creates, or declare the types in the Query tasks and make TASK-002 export them by name.

### ADV-003: DTO nullability list is incomplete, and a null `role` breaks login typing

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | high |
| Lens | contradiction |
| Where | `tasks/TASK-001.md` (DTOs), `tasks/TASK-008.md` (`signToken({ sub, role })`), spec AC11 |

**What:** TASK-001 says "type every nullable column as `T | null`" but its list leaves out nullable columns in `db/schema.md`: `user_id` (alumni, posts, comment), `posts_id`, `comment_count`, all `created_at`/`updated_at`. Separately `User.role` becomes `string | null` but `signToken` and `req.user.role` take `string`, so TASK-008's login call stops compiling, and nothing says what a null-role user gets.
**Why it matters:** The implementer guesses; AC11 is only partly planned.
**Why this holds up:** `LEFT JOIN "User"` in the read constants already assumes a nullable `user_id`; the typing should match.
**Recommendation:** State the full column list in TASK-001, and in TASK-008 say a login with a null role answers 401 (or the token gets a fixed fallback), so `signToken` keeps `role: string`.

### ADV-004: Missing `JWT_SECRET` answers 401, not the 500 the plumbing task promises

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | medium |
| Lens | contradiction |
| Where | `tasks/TASK-004.md` (`token.ts` vs `authMiddleware.ts`) |

**What:** `verifyToken` throws a plain `Error` when the secret is missing "so the middleware answers 500", but the middleware turns any failure from `verifyToken` into `UnauthorizedError("Invalid or expired token")`, as today's `try`/`catch` does.
**Why it matters:** A misconfigured server tells every caller their token is bad.
**Why this holds up:** The `try`/`catch` in the current `authMiddleware.ts` swallows all errors; the sketch keeps that shape.
**Recommendation:** In `authMiddleware`, map only `jwt.JsonWebTokenError` / `TokenExpiredError` to 401 and pass anything else to `next(err)`.

### ADV-005: AC35 says SQL lives only in `dal/query/`, but TASK-002 puts `BEGIN`/`COMMIT`/`ROLLBACK` in `dal/config/transaction.ts`

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | high |
| Lens | testability |
| Where | spec AC35, `tasks/TASK-002.md`, `tasks/TASK-012.md` check 5 |

**What:** TASK-012's search for SQL keywords outside `dal/query/` will flag `transaction.ts`, or the implementer will quietly exempt it.
**Why this holds up:** `transaction.ts` is a necessary home for the helper; the AC wording is what is off.
**Recommendation:** Note in TASK-012 that `dal/config/transaction.ts` is the one allowed exception (transaction control only, no table names), or word AC35 as "no table or column names outside `dal/query/`".

### ADV-006: A double-submitted profile create beats the 409 check

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | medium |
| Lens | failure-mode |
| Where | `architecture.md` §Approach 3 (second profile), AC24 |

**What:** Look-up then insert lets two simultaneous POSTs both pass. A double click on the future "create profile" button is the likeliest trigger, and it leaves two profiles (the directory shows a duplicate, `/me` shows the lower id).
**Why this holds up:** The architecture names the race and defers to a UNIQUE constraint. But the transaction helper already exists, so a no-schema fix is cheap: take `pg_advisory_xact_lock(user_id)` inside `withTransaction`, then check and insert.
**Recommendation:** Do that in `AlumniQuery.createAlumni` (find-then-insert in one transaction under the lock), or accept it in the AC24 wording ("refused unless two requests arrive together").

### ADV-007: Filter values returned by `/filters` may not match when sent back

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | low |
| Lens | contradiction |
| Where | `tasks/TASK-006.md` (`getFilterValues`), `tasks/TASK-004.md` (`queryText` trims), AC20/AC22 |

**What:** `/filters` returns stored values untrimmed (it only hides blank ones). `department=` is trimmed by `queryText`, then matched exactly. A stored `"CSE "` is offered, sent back as `CSE`, and matches nothing.
**Why this holds up:** Needs a stored value with outer whitespace; the signup forms may allow it.
**Recommendation:** Return `DISTINCT btrim(department)` and compare `btrim(a.department) = $n`, or do not trim `department` and `field` in `queryText`.

### ADV-008: `post_id` accepts `"3"`, `parent_id` refuses it

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | high |
| Lens | contradiction |
| Where | `tasks/TASK-010.md` (`createComment` vs Notes), `tasks/TASK-004.md` (`parseId`) |

**What:** `parseId` accepts a digit string, so `post_id: "3"` passes, while the Notes say `parent_id: "3"` is 400.
**Recommendation:** Add `parseBodyId` (numbers only) and use it for both body ids, or allow digit strings for both.

### ADV-009: No task for AC38, and the post count has no index behind it

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | medium |
| Lens | omission |
| Where | spec AC38; `tasks/TASK-007.md` (count sub-query) |

**What:** AC38 (roadmap rows done) has no task; the architecture says "at wrap-up". Separately, `db/schema.md` shows `comment` has only its primary-key index, so each post on a page runs a full scan of `comment` for its count.
**Why this holds up:** AC38 is covered by `/wrapup` by convention, so I would only name it in TASK-012. The scan is fine at student-project size.
**Recommendation:** Add "AC38 is done by /wrapup" to TASK-012 notes, and add one line to the Risks table: counts rely on a scan until the owner adds an index on `comment(posts_id)` (schema change, owner's call).

## Coverage

- **Lenses run:** omissions, failure modes, hidden coupling, rollback (code only, no schema change; the hand-edited `db/schema.md` is revertible), contradiction and testability.
- **Lenses skipped:** UX (no UI surface), cross-repo (single repo).
- **Acceptance-criteria coverage:** AC1-AC37 checked against tasks (AC13/17 by TASK-001, AC34-37 by TASK-012; AC11 partial, see ADV-003; AC35 see ADV-005). AC38 checked: no task (ADV-009).
