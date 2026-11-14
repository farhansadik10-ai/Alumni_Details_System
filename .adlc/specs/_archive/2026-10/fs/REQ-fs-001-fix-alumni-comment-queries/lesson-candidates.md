
## CAND-001 [implement-task]
**Claim:** When a text check says "no `comments` in the SQL", read each match — do not trust a bare grep count of the file.
**Saw it in:** `backend/src/dal/query/CommentQuery.ts:17`
**Context:** `getAllComments` has a local variable named `comments`, so the file still has three matches after the fix; none are SQL.

## CAND-002 [implement-task]
**Claim:** Check a gotcha's "Don't" line against the spec-gate decisions before treating it as a blocker.
**Saw it in:** `.adlc/knowledge/gotchas.md:552`
**Context:** G23 says not to fix G06/G07 without an owner check; architecture.md Risks records the owner accepting exactly that for this REQ, so the gotcha now reads as stale.

## CAND-003 [implement-task]
**Claim:** Treat a green `npm run build` as proof of types only; check every SQL string by eye against db/schema.md, because tsc never reads it.
**Saw it in:** `backend/src/dal/query/AlumniQuery.ts:7`
**Context:** The old `INSER INTO users` text and an unbound `$8` compiled cleanly for months; `pool.query` rows are untyped.

## CAND-004 [implement-task]
**Claim:** When renaming a DTO field, also check controllers that pass `req.body` straight through, since the compiler cannot flag a stale key there.
**Saw it in:** `backend/src/api/controllers/AlumniController.ts:74`
**Context:** `updateAlumni` hands `req.body` to the Manager as `Partial<AlumniDTO>`; an old `graduation_yr` key is silently dropped and the year is written as NULL.

## CAND-005 [implement-task]
**Claim:** Before adding joined columns to a read, check whether the method logs its rows — a join can put personal data into the server log.
**Saw it in:** `backend/src/dal/query/AlumniQuery.ts:65`
**Context:** `getAllAlumni` has a `console.log(alumni)` per row that the task says to keep; after the join it prints every user's name and email on each list request.

## CAND-006 [implement-task]
**Claim:** Treat LEFT JOIN columns typed `field?: string` on a DTO as `string | null | undefined` in callers; pg returns `null`, never `undefined`.
**Saw it in:** `backend/src/dal/dto/AlumniDTO.ts:15`
**Context:** An alumni row with no user comes back with `name`, `email`, `photo_url` set to `null`; `pool.query` rows are untyped, so tsc does not catch the mismatch.

## CAND-007 [review-corr]
**Claim:** After fixing a query that never ran, list the failure modes it now exposes (missing row, FK error, raw pg message in 400) before calling it done.
**Saw it in:** `backend/src/dal/query/AlumniQuery.ts:49`
**Context:** UPDATE on an unknown id returns 200 with empty body; createAlumni with a bad user_id returns the raw FK error text as 400.

## CAND-008 [review-corr]
**Claim:** Add ORDER BY to every list query; a join or a later UPDATE makes Postgres row order unstable.
**Saw it in:** `backend/src/dal/query/AlumniQuery.ts:61`
**Context:** getAllAlumni has none, while getAllComments sorts by created_at.

## CAND-007 [review-qual]
**Claim:** When an owner removes a debug log in one method mid-REQ, grep for the same log in sibling methods and update the written "stays as is" decision.
**Saw it in:** `backend/src/dal/query/CommentQuery.ts:18`
**Context:** `getAllAlumni` log removed at the implement gate; `getAllComments` twin and the architecture Deviations line still say it stays.

## CAND-008 [review-qual]
**Claim:** Confirm or drop the unconfirmed "No console.log in production code" convention so reviewers can enforce it.
**Saw it in:** `.adlc/context/conventions.md:33`
**Context:** Rule is marked template default and existing Query classes use console.log, so findings against it stay minor.

## CAND-009 [review-reflect]
**Claim:** When a REQ fixes a gotcha, update the gotcha's Status in the same wrapup; keep any unfixed half open.
**Saw it in:** `.adlc/knowledge/gotchas.md:74` (G02: SQL fixed, NULL overwrite still open)
**Context:** Eight gotchas and `architecture.md:72` describe code this REQ already fixed.

## CAND-010 [review-reflect]
**Claim:** Write a concept page for the "join `"User"` with named columns, never `password`" read shape and reuse it for posts and comments.
**Saw it in:** `backend/src/dal/query/AlumniQuery.ts:30` (same text repeated in three methods)
**Context:** ADR-05 decided the same join for posts; there is no concept page, so posts will re-derive it.

## CAND-011 [review-reflect]
**Claim:** Pick one set of joined-author field names (`name`, `photo_url`) and record it in an ADR before the second join is written.
**Saw it in:** `backend/src/dal/dto/AlumniDTO.ts:14`
**Context:** ADR-05 left the names open; alumni has now chosen them de facto.

## CAND-012 [review-arch]
**Claim:** When a Query read gains joined columns, add them to the `@alumni/shared` type in the same change, or note the follow-up.
**Saw it in:** `shared/types/alumni.types.ts:1`
**Context:** `AlumniDTO` got name/email/photo_url but the shared `Alumni` type did not.

## CAND-013 [review-arch]
**Claim:** After a gotcha-fixing REQ, sweep `context/*.md` for prose that still describes the bug as live.
**Saw it in:** `.adlc/context/architecture.md:72`
**Context:** Line still says `graduation_yr` is wrong after the rename.

## Candidate verdicts

Two candidates share the numbers 007 and 008 (correctness and quality wrote at the same moment); the tag tells them apart.

| Candidate | Verdict | Target / Reason |
|---|---|---|
| CAND-001 | discard | trivial — one-off grep reading, no recurring pattern |
| CAND-002 | discard | handled directly: G19 and G23 now carry the owner's decision and a "live" status |
| CAND-003 | promote | LESSON-REQ-fs-001-1 |
| CAND-004 | promote | LESSON-REQ-fs-001-3 |
| CAND-005 | promote | LESSON-REQ-fs-001-4 |
| CAND-006 | demote-to-gotcha | ^g25 |
| CAND-007 [review-corr] | promote | LESSON-REQ-fs-001-2 (merged with the spec-gate finding that broken SQL was hiding G19/G23); the specific case is also ^g27 |
| CAND-008 [review-corr] | demote-to-gotcha | ^g26 |
| CAND-007 [review-qual] | discard | folded into LESSON-REQ-fs-001-4 ("and in its sibling methods") |
| CAND-008 [review-qual] | discard | not a lesson — a question for the owner (confirm or drop the "no console.log" convention); listed as a follow-up in pr-draft.md |
| CAND-009 | discard | done in this wrap-up (gotcha statuses updated); the wrap-up protocol already requires it |
| CAND-010 | discard | captured as a concept page instead: knowledge/concepts/user-join-read-shape |
| CAND-011 | discard | not a lesson — an open decision for the owner (ADR-05 field names); listed as a follow-up |
| CAND-012 | discard | covered by ^g25 and listed as a follow-up (shared `Alumni` type) |
| CAND-013 | discard | done in this wrap-up (`context/architecture.md` line 72 corrected) |

Dedup basis: `origin/redesign` as of 3 hours ago holds no lesson files; `knowledge/lessons/` was empty before this REQ.
