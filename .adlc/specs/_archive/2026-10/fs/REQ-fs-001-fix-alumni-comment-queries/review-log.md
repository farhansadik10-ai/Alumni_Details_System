# REQ-fs-001-fix-alumni-comment-queries — Review log

Full reviewer narratives. The consolidated verdict lives in `verification.md` —
read that first; come here for the long form behind a finding ID.

## Correctness findings

Written by: correctness-reviewer (tier: balanced), dispatched sub-agent.

**Summary:** Checked all 9 changed SQL statements column by column against db/schema.md, the `$n` binding counts, the join, and the `graduation_year` rename (no `graduation_yr` left under backend/src). Every statement is valid and every placeholder is bound. No `password` can leave through the join. 0 critical, 0 major, 2 minor. The biggest: update/delete on a missing id now succeeds with an empty body (CORR-001). Owner-accepted items (G02, G19, G23, LEFT JOIN, optional DTO fields) were not re-raised.

### CORR-001: Update/delete of a missing id returns success with no body

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `backend/src/dal/query/AlumniQuery.ts:49`, `backend/src/dal/query/CommentQuery.ts:30` |
| Category | error-handling |

**What:** `UPDATE ... RETURNING *` on an id that does not exist gives zero rows, so `rows[0]` is `undefined`. The controller then sends 200 with an empty body. `deleteComment` returns void whatever happened.

**Why it matters:** These paths could not run before, so this is newly reachable. A client cannot tell "updated" from "nothing there".

**Recommendation:** Out of scope here (same family as G16). In the follow-up REQ, throw "not found" from the Manager when `rows[0]` is undefined and map it to 404.

**References:** [[knowledge/gotchas#^g16|G16]]

### CORR-002: Alumni list has no ORDER BY

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `backend/src/dal/query/AlumniQuery.ts:61` |
| Category | logic |

**What:** `getAllAlumni` has no `ORDER BY`. The join and the new `UPDATE` (which rewrites rows) make Postgres row order unstable.

**Why it matters:** The list can reorder after an edit, so a screen's rows may jump. `getAllComments` already sorts by `created_at`.

**Recommendation:** Add `ORDER BY a.id` at the end of the SQL in `getAllAlumni`.

Dispatch notes: join column clash (`id`, `updated_at`) checked, nothing, `a.*` is alumni-only and `u.*` is not used. Unused `created_at` on the DTO is never written by the SQL, checked, nothing. A bad `:id` (NaN) gives a pg error returned as 404, pre-existing, not listed.

## Quality findings

Written by: quality-reviewer (tier: balanced)

**Summary:** Checked 4 changed files against conventions.md (naming, logging, SQL rules, password rule, dead code, tests). Text greps under `backend/src`: zero `graduation_yr`, `INSER`, `FROM users`, or `comments` inside SQL. 0 critical, 0 major, 1 minor, 1 trivial. Biggest: a `console.log` was removed from `getAllAlumni` but its twin in `getAllComments` stays. Test coverage: no runner exists (conventions, Testing), so nothing to flag beyond the owner's manual checklist. Owner-decided items not re-raised.

**Packet-gap:** none.

### QUAL-001: console.log removed in one getAll method, kept in its twin

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `backend/src/dal/query/CommentQuery.ts:18` |
| Category | dead-code |
| Rule | conventions.md, Logging: "No `console.log` in production code" (template default, not confirmed) |

**What:** `getAllAlumni` no longer logs each row, but `getAllComments` still does `console.log(comment)` per row, so the two list methods now differ for no reason.
**Why it matters:** The spec and architecture said both logs stay. The owner's later removal covered only alumni (for the name/email in the log). The leftover is a debug print, and the rule is unconfirmed, so it is not a violation.
**Recommendation:** Ask the owner whether to drop it in `CommentQuery.ts:18` in this REQ or in a follow-up. Also correct architecture.md "Deviations", which still says both logs stay.

### QUAL-002: LEFT JOIN in findAlumniByEmail behaves as an inner join

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `backend/src/dal/query/AlumniQuery.ts:21` |
| Category | naming |
| Rule | none |

**What:** `WHERE u.email = $1` drops every row where the user is missing, so `LEFT JOIN` here reads as intent it does not have.
**Why it matters:** A later reader may think by-email can return a user-less row. Architecture.md already notes this, so it is a taste call.
**Recommendation:** Leave as is for a consistent select shape, or use `JOIN` here. No action needed.

(0 other trivials not listed. Existing quirks left alone per "No other change": `.js` import suffix in AlumniQuery only, `created_at` on the DTO, the copy-loop in `getAllAlumni`.)

## Architecture findings

Written by: architecture-reviewer (tier: balanced)

**Summary:** Checked 4 changed files against layering (SQL only in dal/query, parameterized), ADR-05 join rule, `shared/types/alumni.types.ts`, and the two Query classes' patterns. 2 findings: 0 critical, 0 major, 1 minor, 1 trivial. Layering is intact and no password column can come back. Biggest: the new response fields exist in `AlumniDTO` but not in `@alumni/shared` `Alumni`.
Dispatch questions: layering kept - checked, nothing. Join follows ADR-05 (named columns, no `password`) - checked, nothing. Owner-decided items not re-raised.
**Packet-gap:** none.

### ARCH-001: Joined fields not in the shared `Alumni` type

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `shared/types/alumni.types.ts:1` (vs `backend/src/dal/dto/AlumniDTO.ts:14-16`) |
| Category | contract |
| Rule broken | CLAUDE.md Frontend: "Types come from @alumni/shared" |

**What:** The three alumni reads now return `name`, `email`, `photo_url`, but `Alumni` in `@alumni/shared` does not declare them, so the backend DTO and the shared contract differ.
**Why it matters:** The first screen built on `GET /api/alumni` must either cast or add the fields itself; two sides can then disagree on null handling (LEFT JOIN gives `null`, see CAND-006).
**Recommendation:** In the follow-up REQ, add `name`, `email`, `photo_url` (as `string | null`) to `Alumni` before any screen uses them. Architecture.md already defers this; just keep it on the follow-up list with G19/G02.
**References:** [[architecture/adr-05-post-list-returns-author-name-and-photo|ADR-05]], REQ architecture "Typing the joined rows".

### ARCH-002: Vault note still calls `graduation_yr` a live bug

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `.adlc/context/architecture.md:72` |
| Category | contract |
| Rule broken | CLAUDE.md "When two sources disagree, surface it" |

**What:** Line 72 says "The backend's `graduation_yr` is wrong (G12)"; after this REQ it is fixed, and G01-G07/G12 are now stale in `knowledge/gotchas.md`.
**Why it matters:** Later REQs would read the vault as saying the bug is still open.
**Recommendation:** At /wrapup, mark G01-G07 and G12 resolved and reword line 72.
**References:** [[knowledge/gotchas#^g12|G12]]


## Reflection findings

Written by: reflector (tier: balanced)

**Summary:** Checked 0 lessons (none exist), 24 gotchas, 6 ADRs (accepted), 1 component page, `context/architecture.md` (no Mermaid diagram, so no `diagram-stale`). 3 findings: 0 critical, 0 major, 3 minor (2 `vault-stale`, 1 `concept-drift`). The code respects ADR-05's join rule and G17 (`a.*` is alumni only; user columns named; no password), and `graduation_yr` is gone from the whole repo outside vault notes. The biggest issue is that eight gotchas and `architecture.md` still describe the broken code. `docs likely affected:` none (no README/docs page names these endpoints).
Dispatch questions: G19/G23 and G02 owner decisions, LEFT JOIN, optional DTO fields: checked, not re-raised. Packet-gap: none.

### REFL-001: Gotchas G01-G07, G12 and architecture.md still describe the pre-fix code

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `.adlc/knowledge/gotchas.md` (G01-G07, G12, G19, G23), `.adlc/context/architecture.md:72` |
| Category | vault-stale |
| Vault reference | [[knowledge/gotchas#^g01\|G01]], [[knowledge/gotchas#^g12\|G12]], [[context/architecture]] |

**What:** The preamble says "None has been fixed", and each entry still reads as live. Now fixed: G01, G03, G04, G06, G07, G12 fully. G02 fixed except the NULL overwrite (keep that half open). G05 fixed: the join exists and `password` is not selected. G19 and G23 are no longer "masked": the routes now work and stay open by owner decision. `architecture.md:72` still says "the backend's `graduation_yr` is wrong".
**Why it matters:** The next REQ will "fix" things that are done or distrust a working query.
**Recommendation:** In `/wrapup` step 3, set Status to `fixed by REQ-fs-001` on those entries, trim G02 to the NULL-overwrite half, and add a line to G19/G23: "Live since REQ-fs-001; owner accepted no check at the 2026-10-05 spec gate". Fix `architecture.md:72` and the preamble. `console.log` in `getAllAlumni` is gone, so this REQ's spec Assumptions and architecture "Deviations" lines saying it stays are now wrong; add one line recording the owner's request. CAND-005 is also moot for `getAllAlumni`.

### REFL-002: component page `dal-query-classes` is still a stub

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `.adlc/knowledge/components/dal-query-classes.md` |
| Category | vault-stale |
| Vault reference | [[knowledge/components/dal-query-classes]] |

**What:** The page is marked "stub, needs verification", and its Related line says G01-G12 as open problems.
**Why it matters:** This is the page the next REQ reads first for `PostQuery`/`UserQuery` work. It lacks the facts this REQ learned.
**Recommendation:** At wrapup, fill it in: reads join `"User"` with named columns only; `RETURNING *` on create/update has no joined fields; LEFT JOIN fields come back as `null` (CAND-006); `findAlumniByEmail` returns only the first row; the `pool.query` result is untyped, so `tsc` never checks SQL (CAND-003). Remove the stub banner.

### REFL-003: ADR-05 field names are now set by alumni and posts has not caught up

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `backend/src/dal/dto/AlumniDTO.ts:14-16` |
| Category | concept-drift |
| Vault reference | [[architecture/adr-05-post-list-returns-author-name-and-photo]] |

**What:** ADR-05 leaves "field names for the author's name and photo" open and says the alumni gap "is not covered". This REQ now fixes `name`, `email`, `photo_url` for alumni, and the same shape was chosen as the precedent.
**Why it matters:** When posts gets its join, a different name (`author_name`, `photo`) would give the frontend two shapes for one person.
**Recommendation:** At wrapup, add a line to ADR-05 Consequences/Open questions: alumni uses `name`/`email`/`photo_url`; posts should use `name`/`photo_url`, or state why not. The "alumni list has the same gap" row can be marked done by REQ-fs-001.

## UI/UX findings

_(no UI surface in this change — ui-reviewer not dispatched. Coupling check run 2026-10-05: nothing under `frontend/src` calls `/api/alumni` or `/api/comments` or references `graduation_yr`.)_
