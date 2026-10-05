
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
