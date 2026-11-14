# REQ-fs-003-finish-backend-api — Verification

| Field | Value |
|---|---|
| Generated | 2026-10-07 |
| Work path | C:/Users/Lenovo/Alumni_Details_System |
| Isolation | branch |
| Branch | feat/REQ-fs-003-finish-backend-api |
| Files changed | 46 outside the vault (71 with the REQ's own notes) |
| Commits | 14 |
| Base | redesign |

Full reviewer narratives: `review-log.md` — not loaded by later phases; open on demand.

## Owner's run against the real database (2026-10-07)

Run by the repo owner, not by Claude. Recorded from the owner's report.

| Round | Owner's own script | `scripts/api-check.mjs` |
|---|---|---|
| 1 | 71 passed, 4 failed, one cause: `POST /api/comments` with `{ posts_id, content }` answered 400 `Invalid post_id` | 89 passed, 0 failed, 11 skipped (no admin account set) |
| 2, after the fix | 91 of 91 passed, 14 of them admin checks | run with the admin account: 0 failed |
| 3, after review rounds 2 and 3 | passed (the owner reported "both pass"; no counts given) | passed, the 110-check version (no counts given) |

Fix between the rounds: comment create reads `posts_id` (the column's name) and needs non-empty content.

Round 3 was run on the code after the review fixes: alumni and comment create/update and every comment read answer the author fields; the script has 110 checks.

The 14 admin checks in the owner's script covered: list and search users; role filter; an admin updates another user; an admin cannot edit another user's post; an admin deletes another user's comment and post; 409 on deleting a user who has content; 200 on deleting a user who has none; 404 for an unknown user. These are the admin paths that REQ-fs-002 left untested.

## Summary

**After round 3 (2026-10-07): 0 critical · 0 major open · 4 minor open (all the owner's call) · 7 trivial.** After round 2: 0 major open, 9 minor open. Round 1 found 0 critical, 5 major, 10 minor. No reviewer, in either round, found a bug in the SQL, the parameter binding, the auth and owner rules, or the error paths.

- **Fixed and re-checked in round 2:** M1, M2, M4, m2, m3, m5; m4 and m6 mostly (what is left is in the table).
- **Decided by the owner at the round-1 gate:** M3 — record where each rule lives at wrap-up, no code change. The compiled `.js` / `.d.ts` files in `shared/` stay as they are and are noted as stale.
- **For wrap-up, not code:** M5 (13 gotcha entries), m7 (docs and vault pages), m8 (ADR-06 and ADR-11 wording), m10 (a concept page for the paging pattern).
- **New in round 2:** four minor items (n1–n4). **Round 3** fixed n1, n2, n4 and the rest of m6, re-checked by architecture and quality; it found nothing new above trivial.
- **Run by the owner after round 3:** both scripts pass on the final code (reported at the review gate, 2026-10-07; counts not given).
- **ADR conflicts:** none in substance; wording only (m8).
- **UI check:** by reading code only (round 1); nothing found; an 8-step browser checklist is in `review-log.md`.
- **Review packet:** round 1 180KB, round 2 122KB, round 3 30KB (target 120KB, ceiling 250KB).

## Findings at a glance

| ID | Severity | Finding (one line) | Where | Effort | Fix |
|----|----------|--------------------|-------|--------|-----|
| M1 | major | ARCH-001 — resolved, round 2 | | | done |
| M2 | major | ARCH-002, QUAL-007 — resolved, round 2 (user request types: see n1) | | | done |
| M3 | major | Rules in three layers; thin Managers — owner: record at wrap-up, leave the code | controllers, `AlumniQuery.ts`, `UserManager.ts` | — | decided |
| M4 | major | QUAL-001 — resolved, round 2 | | | done |
| M5 | major | 13 gotcha entries to update (G08, G11, G13, G16, G24–G27, G29–G32, G34); G25 is now false | `.adlc/knowledge/gotchas.md` | small | wrap-up |
| m1 | minor | A token for a user with no role is 401, was 403 (wrong-typed create fields being 400 was kept by the owner) | `token.ts` | small | your call |
| m2 | minor | COR-002 — resolved, round 2 | | | done |
| m3 | minor | QUAL-002, COR-003 — resolved, round 2 (A08's zero-byte premise needs one run to confirm) | | | done |
| m4 | minor | QUAL-003 — resolved except: status numbers 400 and 409 are still written in `errors.ts` and `errorMiddleware.ts` (kept: sharing them needs a new export) | `errors.ts`, `errorMiddleware.ts` | small | your call |
| m5 | minor | QUAL-004 — resolved, round 2 (two user-update rules kept: removing them would drop email and password changes) | | | done |
| m6 | minor | QUAL-005 — resolved, round 3 | | | done |
| m7 | minor | Docs and vault pages out of date (`conventions.md`, `context/architecture.md`, ADR-03/05/06/08, component and concept pages, root `CLAUDE.md`, `docs/roadmap.md`) | see `review-log.md` | small | wrap-up |
| m8 | minor | ADR wording: ADR-11, ADR-06 | ADR pages | small | wrap-up |
| m9 | minor | Contract details: `mentoring=false` is 400 (as the spec says); list order differs per endpoint | `AlumniController.ts` | small | your call |
| m10 | minor | No concept page for the paging pattern | vault | small | wrap-up |
| n1 | minor | ARCH-101, QUAL-102 — resolved, round 3 | | | done |
| n2 | minor | ARCH-102 — resolved, round 3 | | | done |
| n3 | minor | "Write, then read it back" is done three ways (transaction; second pool read; re-read with a 500 if missing) | `CommentQuery.ts`, `AlumniQuery.ts`, `PostQuery.ts` | small | your call |
| n4 | minor | QUAL-103 — resolved, round 3 | | | done |

Reviewed by: correctness (balanced) · quality (balanced) · architecture (balanced) · reflector (balanced) · ui (balanced, static tier). Round 2: correctness · quality · architecture. Round 3: quality · architecture.

## Consolidated by severity

### Critical (0)

### Major (0 open)

M1, M2 and M4 are resolved (round 2). M3 is decided: no code change; wrap-up records where each rule lives. M5 is wrap-up work.

### Minor (4 open, all the owner's call; 4 more wait for wrap-up)

- **m1** — a token for a user with no role is 401, was 403 (`token.ts`; COR-001).
- **m4** — status numbers 400 and 409 are written in both `errors.ts` and `errorMiddleware.ts` (QUAL-003).
- **m9** — `mentoring=false` is 400 (as the spec says); list order differs per endpoint (ARCH-006).
- **n3** — "write, then read it back" is done three ways across the Query classes (QUAL-101).
- Wrap-up work: m7 (docs and vault pages), m8 (ADR-06, ADR-11 wording), m10 (paging concept page), and M5 above.

### Trivial (7)

UI-001; COR-101 (the slow regex, removed in round 3); ARCH-201 (the compiled `user.types` files in `shared/` lack the new types — left by the owner's decision, noted at wrap-up); and four counted without listing.

## Acceptance criteria check

- [✓] AC1–AC3 — class controllers, login in `AuthController`, one error middleware, no `try`/`catch` in controllers
- [✓] AC4–AC6 — `{ error }` everywhere; no database text in answers or the log; bad `:id` is 400 before any query
- [✓] AC7–AC9 — 409 on a taken email; 400 on missing credentials; 404 on empty lookups
- [✓] AC10 — as changed by the owner on 2026-10-07: body key `posts_id`, content required, 404 / 400 for post and parent
- [✓] AC11 — one update input type; no casts
- [✓] AC12 — REQ-fs-002 rules hold; owner's script confirmed the admin halves (⚠ m1: a no-role token is 401, was 403)
- [✓] AC13 — both columns in `db/schema.md` (hand-edited from the owner's statement) and the vault summary
- [✓] AC14–AC17 — new fields on create, update, every read, and in the shared types
- [✓] AC18–AC26 — alumni list, search, filters, order, `/filters`, `/me`, 409 on a second profile, users list, stats (m2 fixed in round 2)
- [✓] AC27–AC29 — paged feed with author and counted comments; comments of a post
- [✓] AC30 — post delete takes its comments, in one transaction
- [✓] AC31 — comment delete at every level: right by reading the SQL; the script now deletes a three-level thread (J12, K02), run by the owner after round 3
- [✓] AC32, AC33 — post edit author-only; user delete 409 / 200 / 404 (owner's admin run)
- [✓] AC34–AC36 — build and type-checks pass; SQL only in `dal/query/`; nothing under `frontend/` changed
- [✓] AC37 — `scripts/api-check.mjs` exists; the owner ran the 100-check version; the owner ran the 100-check version and, after round 3, the 110-check version
- [ ] AC38 — roadmap rows: done at wrap-up
