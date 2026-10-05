# Architecture adversary: REQ-fs-001-fix-alumni-comment-queries

Written by: architecture-adversary (tier: balanced), dispatched sub-agent. The agent returned this report in its reply instead of writing the file; the orchestrator saved it here unchanged on 2026-10-05.

| Field | Value |
|---|---|
| Generated | 2026-10-05 |
| Trigger | sensitive-surface |
| Verdict | found problems (minor only) |

## Summary
I read the spec, architecture, exploration and all 3 tasks in full. I checked them against the real `AlumniQuery.ts`, `CommentQuery.ts`, `AlumniController.ts`, `CommentController.ts` and `AlumniDTO.ts`, and against `db/schema.md` column by column. I found 2 minor findings and no critical or major ones. Every alumni and comment column the new SQL names exists in the schema. The `a.*` plus named `u.` columns select cannot clash or leak `password`. Nothing in `frontend/src`, `postman/` or `.postman/` calls `/api/alumni` or `/api/comments`. The graduation_yr rename list is complete: the only backend hits are `AlumniQuery`, `AlumniDTO` and `AlumniController`. The biggest finding is that create and update responses will not carry the joined fields that the reads do. I did not re-raise the G19, G23 or G02 decisions.

Dispatch questions
- Null or dangling `user_id`: the architecture picks `LEFT JOIN`. Checked, nothing wrong. The architecture's own Open questions list still carries the choice, and the spec's third open question is still unticked, so both need ticking at the gate.
- Optional DTO fields versus a new type: checked, nothing. The optional fields compile and nothing writes them.

## Findings

### ADV-001: Create and update responses have a different shape from the reads
| Field | Value |
|---|---|
| Severity | minor |
| Confidence | high |
| Lens | omission |
| Where | `architecture.md` §Approach (create and update keep `RETURNING *`); spec AC-37 |

**What:** `createAlumni` and `updateAlumni` return only alumni columns, with no `name`, `email` or `photo_url`. `GET /api/alumni/:id` returns all of them. The architecture never says this split is deliberate.
**Why it matters:** The REQ that builds the alumni screens will likely use the PUT or POST response to refresh a card. That card would lose its name and photo. The gap is silent and surfaces later.
**Why this holds up:** The spec says "every alumni read", and `RETURNING *` on a write cannot join. So it is within the spec. I tried to kill the finding on those grounds and failed, because nothing in the packet records the split as intended.
**Recommendation:** Add one sentence to Risks or the PR notes: "writes return alumni columns only; clients must re-GET for user fields". No code change.

### ADV-002: Clients that send `graduation_yr` to PUT also lose the year, and the Risks table only mentions create
| Field | Value |
|---|---|
| Severity | minor |
| Confidence | medium |
| Lens | omission |
| Where | `architecture.md` §Approach "graduation_year rename" and Risks row 4 |

**What:** `PUT /api/alumni/:id` passes `req.body` straight through (`AlumniController.ts:72-75`). After the rename, an old client that sends `graduation_yr` has the year written as NULL. This stacks with G02 NULL overwrite. The text only describes create.
**Why it matters:** The failure is silent data loss on an edit. The year is wiped, with a 200 response.
**Why this holds up:** Nothing in the repo calls these endpoints today (grep of `frontend/src`, `postman/` and `.postman/` found nothing), and the endpoints are currently broken. That limits the likelihood, which is why this is only minor. It does not remove the gap in the written risk.
**Recommendation:** Widen Risks row 4 to say "create and update", and put it in the PR notes.

(1 trivial not listed: the vault pages `.adlc/context/architecture.md` and `knowledge/gotchas.md` G12 still say `graduation_yr`. `/wrapup` should refresh them. They are outside the code blast radius.)

## Coverage
- **Lenses run:** omission, failure-mode, hidden-coupling, rollback, contradiction, testability.
- **Lenses skipped:** ux-consistency (no UI surface); cross-repo (single repo).
- **Rollback:** the change is text-only SQL with no schema or data change, so reverting is a plain git revert. Nothing to flag.
- **Blast radius:** the four files in the radius match the tasks one to one. TASK-001 and TASK-002 both touch `AlumniQuery.ts` and `AlumniDTO.ts`, and the architecture serialises them in the DAG. The diff-check command `git diff --name-only redesign...HEAD` is valid because the `redesign` branch exists.
- **Acceptance-criteria coverage:**
  - `AlumniQuery` ACs 1-7: checked. Create, update and the `graduation_year` bits map to TASK-001. Reads, the join and the no-password rule map to TASK-002.
  - `CommentQuery` ACs 1-3: checked, TASK-003.
  - Rename ACs 1-3: checked, TASK-001.
  - `npm run build` and diff-scope ACs: checked. Both are mechanically checkable, but the SQL cannot be run by the pipeline. The architecture owns that gap in Risks and the owner's manual checklist covers it.

## How each finding was handled (orchestrator, 2026-10-05)

- ADV-001 — accept + document: added to `architecture.md` Risks (writes return alumni columns only).
- ADV-002 — fix (wording): Risks row widened to create and update.
