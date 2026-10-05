# REQ-fs-001 — Codebase exploration

Written by: codebase-explorer (tier: fast)

| Field | Value |
|---|---|
| Generated | 2026-10-05 |
| By | codebase-explorer |
| Repo(s) scanned | Alumni Details System (primary repo) |

## 1. Similar existing implementations

| Path | What it does | Recommended action |
|---|---|---|
| `backend/src/dal/query/UserQuery.ts` | Clean parameterized SQL against `"User"` table; updates, creates, and reads with properly formed queries; shows correct quoting of reserved table names | **Follow**. This is the reference pattern. Clean column names, proper `$N` placeholders, no syntax errors, and correct table names. |
| `backend/src/dal/query/PostQuery.ts` | CRUD for posts; most queries are clean but `getAllPosts` has the same gap as `getAllAlumni`: reads `posts` with no join to `"User"`, so no author name/photo returned | **Follow for SQL syntax**; **deviate for response shape**. The fix to AlumniQuery should mirror ADR-05's decision (add a join for author details), not just correct the table name. |

## 2. Blast radius

| Path | Why touched | Risk |
|---|---|---|
| `backend/src/dal/query/AlumniQuery.ts` | **Direct.** All five methods require fixes: `createAlumni` (table name, column names), `findAlumniById` (table name), `findAlumniByEmail` (table name + join to `"User"`), `updateAlumni` (table name, column names, parameter binding), `getAllAlumni` (join to `"User"`). | **High** — changes all core data access paths for alumni. |
| `backend/src/dal/query/CommentQuery.ts` | **Direct.** Two methods require fixes: `updateComment` (table name + syntax error), `deleteComment` (table name). | **High** — changes comment write paths. |
| `backend/src/dal/dto/AlumniDTO.ts` | **Direct.** Rename `graduation_yr` to `graduation_year` (lines 6, 11). | **Medium** — changes the data shape that flows through the stack. |
| `backend/src/api/controllers/AlumniController.ts` | **Direct.** Line 12 reads `graduation_yr` from the body; must change to `graduation_year` to match the DTO and schema. Line 31 assigns it to the DTO field. | **Medium** — controls how the request body is interpreted. |
| `backend/src/dal/dto/BaseDTO.ts` | **Indirect — verify interface compatibility.** If `BaseDTO` defines any field that conflices with the new DTO fields or join columns, compilation may fail. | **Low** — likely a marker interface; read only to verify. |
| `backend/src/businessLogic/src/AlumniManager.ts` | **Indirect — no code changes expected.** Wraps the Query; inherits all Query fixes automatically. | **Low** — pass-through layer. |
| `backend/src/businessLogic/src/CommentManager.ts` | **Indirect — no code changes expected.** Wraps the Query; inherits all Query fixes automatically. | **Low** — pass-through layer. |
| `backend/src/api/routes/AlumniRoutes.ts` | **Indirect — no changes.** Controllers are bound to the route methods; no query signature changes. | **Low** — read only. |
| `backend/src/api/routes/CommentRoutes.ts` | **Indirect — no changes.** Controllers are bound to the route methods; no query signature changes. | **Low** — read only. |
| `backend/src/dal/index.ts` | **Indirect.** Exports `AlumniDTO`, `CommentDTO`, `AlumniQuery`, `CommentQuery`; no code change, but the types are consumed by workspaces. | **Low** — re-export only. |
| `backend/src/businessLogic/index.ts` | **Indirect.** Exports `AlumniManager`, `CommentManager`; no change. | **Low** — re-export only. |

**Note on joined types:** Each joined read (especially `findAlumniByEmail`, `findAlumniById`, `getAllAlumni`) will return rows with additional columns (`name`, `email`, `photo_url` from `"User"`). The DTO may need to accept these extra fields, or a new type may be needed. The spec acceptance criterion names "whatever type the joined read needs to compile" — this is the open question for the architect.

## 3. Integration points

**Request entry points (routes → controllers → Managers → Queries):**
- `POST /api/alumni` → `createAlumni` controller → AlumniManager → `AlumniQuery.createAlumni`
- `GET /api/alumni` → `getAllAlumni` controller → AlumniManager → `AlumniQuery.getAllAlumni`
- `GET /api/alumni/:id` → `findAlumniById` controller → AlumniManager → `AlumniQuery.findAlumniById`
- `GET /api/alumni/email/:email` → `findAlumniByEmail` controller → AlumniManager → `AlumniQuery.findAlumniByEmail`
- `PUT /api/alumni/:id` → `updateAlumni` controller → AlumniManager → `AlumniQuery.updateAlumni`
- `PUT /api/comments/:id` → `updateComment` controller → CommentManager → `CommentQuery.updateComment`
- `DELETE /api/comments/:id` → `deleteComment` controller → CommentManager → `CommentQuery.deleteComment`

**Database layer:**
- Queries use a shared `pool` from `backend/src/dal/config/db.js` (PostgreSQL).
- Foreign key: `alumni.user_id = "User".id` (from `db/schema.md`, line 32).
- Foreign keys on `comment`: `comment.user_id`, `comment.posts_id`, `comment.parent_id` (lines 87–89).

**Middleware & Auth:**
- All routes use `authMiddleware` (verifies JWT, sets `req.user = { sub, role }`).
- Alumni creation route also uses `requireRole("alumni", "admin")`.
- No owner checks exist on PUT/DELETE for alumni or comments (open per G19, G23).

**Shared utilities:**
- `@alumni/dal` exports DTOs and Queries.
- `@alumni/businesslogic` exports Managers.
- `@alumni/shared` holds cross-workspace types (mentioned in CLAUDE.md but not visible in this scan).

## 4. Test coverage

| Test file | Scenarios covered | Gaps for new code |
|---|---|---|
| *None found* | *None found* | **All scenarios.** Per CLAUDE.md ("There is no test runner configured anywhere in the repo"), `backend/src/businessLogic/src/TestManager.ts` and `backend/src/dal/TestDal.ts` are commented-out scratch scripts, not tests. `npm run build` is the only automated check. |

**Testing strategy per spec assumption:** The owner's manual checks + `npm run build` stand in for tests. For this REQ, that means:
- Compile check: `npm run build` must exit 0.
- Manual verification: The owner will test each endpoint (create, list, get-by-id, get-by-email, update alumni; update and delete comments) against a live database.
- No regressions: The diff touches only the four named files (plus any new types for the join).

## Dependency sketch

The fix spans two separate layers within a single stack:

```
Routes (AlumniRoutes, CommentRoutes)
   ↓
Controllers (AlumniController, CommentController)
   ↓
Managers (AlumniManager, CommentManager) — thin pass-through
   ↓
Queries (AlumniQuery, CommentQuery) — WHERE THE FIX GOES
   ↓
DTOs (AlumniDTO, CommentDTO) — ALSO CHANGED (field rename)
   ↓
Database (PostgreSQL: User, alumni, comment tables)
```

Controllers also read from `req.body`, which is where the `graduation_yr` → `graduation_year` name change is needed. The join in the Queries will add extra columns; how the DTO absorbs them (extend it, or create a new type) is a detail for the architect.

## Vault references

Pages from the knowledge vault relevant to this REQ:

- [[knowledge/gotchas#^g01|G01]] — `createAlumni` targets table `users` (does not exist), says `INSER`, has `?` in column names
- [[knowledge/gotchas#^g02|G02]] — `updateAlumni` fails: wrong table, wrong column name, parameter mismatch, NULL overwrite on partial fields
- [[knowledge/gotchas#^g03|G03]] — `findAlumniById` reads from `users` instead of `alumni`
- [[knowledge/gotchas#^g04|G04]] — `findAlumniByEmail` needs a join to `"User"`; email is not in `alumni`
- [[knowledge/gotchas#^g05|G05]] — `getAllAlumni` returns no name, email or photo; needs join to `"User"`
- [[knowledge/gotchas#^g06|G06]] — `updateComment` targets `comments` (no such table), missing comma in SQL
- [[knowledge/gotchas#^g07|G07]] — `deleteComment` uses table `comments` instead of `comment`
- [[knowledge/gotchas#^g12|G12]] — Backend uses `graduation_yr`; column is `graduation_year`
- [[knowledge/gotchas#^g17|G17]] — Warns: don't return `password` when joining; the fix must name columns and never use `SELECT *`
- [[architecture/adr-05-post-list-returns-author-name-and-photo|ADR-05]] — Established precedent for joins: `getAllPosts` joins `"User"` (name, photo_url; no password). Same pattern applies to alumni list.

## Open questions

- **Joined row shape:** When `findAlumniById` / `findAlumniByEmail` / `getAllAlumni` joins `"User"`, how should the result be typed? Extend `AlumniDTO` with `name`, `email`, `photo_url`? Create a new `AlumniWithUser` type? For the architect to decide based on TypeScript constraints and API contract.
- **Empty join:** If an alumni row has `user_id = NULL` or points to a deleted/missing user, should that alumni row be:
  - Excluded from reads (LEFT JOIN with IS NOT NULL filter), or
  - Returned with NULL/undefined name/email/photo (plain LEFT JOIN)?
  - For the architect unless the owner has a preference.
- **PostQuery.getAllPosts join:** ADR-05 decided to add a join for posts, but it is not in scope for this REQ. When will it be tackled? (Informational; does not block this REQ.)

No ambiguities in the spec itself; the SQLand field names are explicit.
