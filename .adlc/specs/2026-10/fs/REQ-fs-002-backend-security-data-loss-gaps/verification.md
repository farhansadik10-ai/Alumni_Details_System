# REQ-fs-002-backend-security-data-loss-gaps — Verification

| Field | Value |
|---|---|
| Generated | 2026-10-06 |
| Work path | C:/Users/Lenovo/Alumni_Details_System |
| Isolation | branch |
| Branch | feat/REQ-fs-002-backend-security-data-loss-gaps |
| Files changed | 19 (source; vault files not counted) |
| Commits | 7 |
| Base | redesign |

Full reviewer narratives: `review-log.md` — not loaded by later phases; open on demand.

## Summary

- **Round 2 (2026-10-06):** the owner chose to fix m1, m2, m5, t1. All four are resolved; quality, architecture and the reflector re-checked the fix diff (5 files) and found no new conflict. One new trivial (t2). Build exit 0 after the fixes. Round-2 packet 51KB.
- **Counts now open:** 0 critical · 2 major · 5 minor · 1 trivial. Round 1 was 0 / 2 / 8 / 1. Both majors are "the vault is out of date", not code faults.
- **Code:** no reviewer found a bug that breaks an acceptance criterion. Owner checks run before every write; column names in the built SQL come only from fixed lists; `password` is selected only by the login read.
- **Pattern:** four reviewers independently pointed at the same leftover: `PostController.deletePost` / `findPostById` still load every post and compare ids inline, although `postManager.findPostById`, `isSelf` and `isAdmin` now exist (m2).
- **Repeated lesson:** row `console.log` in `PostQuery` and `CommentQuery` was left again (m1); LESSON-REQ-fs-001-4 says to settle sibling logs in the same change. The spec had put them out of scope.
- **ADRs:** no conflict with an accepted ADR. One gap recorded against ADR-03 (m7): "one profile per user" is still not enforced; that needs a schema change or a new check and is out of scope in the spec.
- **Vault-stale:** M1 (13 gotchas), M2 (two component pages, one concept page, `context/architecture.md`, `docs/roadmap.md` row B2). Routed to `/wrapup`.
- **UI check:** ran at the static tier only (no server, no browser — the owner's session rules forbid database writes). No legacy screen breaks. It left a 5-step manual list in `review-log.md`; steps 1–4 write to the database.
- **Database run (owner, 2026-10-06):** see "Owner's database run" below — 39 checks, 39 passed, twice. The reviewers themselves ran nothing against a database.
- **Packet:** 84KB (target ≤120KB). No packet gaps reported.

## Findings at a glance

| ID | Severity | Finding (one line) | Where | Effort | Fix |
|----|----------|--------------------|-------|--------|-----|
| M1 | major | 13 gotchas still say "confirmed" / "live" for things this change fixes | `.adlc/knowledge/gotchas.md` | small | your call (wrap-up) |
| M2 | major | Component and concept pages, `context/architecture.md`, roadmap row B2 are out of date | vault + `docs/roadmap.md` | small | your call (wrap-up) |
| m1 | minor | `console.log` of every row in two list queries — **resolved, round 2** | `PostQuery`, `CommentQuery` | — | done |
| m2 | minor | `deletePost` and controller `findPostById` loaded all posts, inline checks — **resolved, round 2** | `PostController.ts` | — | done |
| m3 | minor | Each update's allowed-field list is written twice (controller and Query) | User / Post / Alumni controller + Query | small | your call |
| m4 | minor | Update inputs typed three ways; casts hide that `null` is legal | `UserManager`, `PostController`, `AlumniController`, DTOs | medium | yes |
| m5 | minor | Methods typed as always returning a row — **resolved, round 2** (types widened; the nothing-to-write shape is kept and commented, G25) | `AlumniQuery`, `CommentQuery` | — | done |
| m6 | minor | Changing email to one already taken returns the raw database message | `UserController.updateUser` | small | your call (roadmap B3) |
| m7 | minor | ADR-03 "one profile per user" still not enforced | `AlumniController.createAlumni` | — | your call |
| m8 | minor | Frontend comments still say the backend returns the password hash | `frontend/src/services/usersApi.ts` + 2 | small | your call (AC27 forbids frontend edits) |
| t1 | trivial | Stale comment on the delete route — **resolved, round 2** | `PostRoutes.ts` | — | done |
| t2 | trivial | New in round 2: a non-numeric post id on `DELETE /api/posts/:id` now gives 400 with the raw database message instead of 404 | `PostController.deletePost` | small | your call (same as the accepted non-numeric-id risk; roadmap B3) |

Reviewed by: correctness (balanced) · quality (balanced) · architecture (balanced) · reflector (balanced) · ui (static tier; its report carried no "Written by" line).

## Consolidated by severity

### Critical (0)

### Major (2)

#### M1 — gotchas out of date

- **Source:** reflector (REFL-001, vault-stale)
- **What:** G02, G09, G10, G14, G15, G17–G23 are fixed by this change; G27 is partly fixed. Their Status rows still say otherwise. G08, G11, G13, G16, G26 stay open.
- **Recommendation:** add a dated REQ-fs-002 update to each at `/wrapup`.

#### M2 — other vault pages and the roadmap out of date

- **Source:** reflector (REFL-002, vault-stale)
- **What:** `dal-query-classes` still says updates write every column and `UserQuery` returns the password; the two stubs written at the design gate are still stubs; `context/architecture.md` and `docs/roadmap.md` row B2 need updating.
- **Recommendation:** update at `/wrapup`.

### Minor (5 open; m1, m2, m5 resolved in round 2)

- **m3** (quality QUAL-004, architecture ARCH-002) — the two lists are deliberate (the Query does not trust a list handed in). Risk: a column added to one list only is dropped while the call still answers 200. Options: keep and note it, or export the list from the DAL.
- **m4** (architecture ARCH-001, quality QUAL-005) — give the three updates one input type that allows `null`; touches DTO files no task named.
- **m6** (correctness CORR-001) — map a duplicate email to a clear 409; belongs with the shared error middleware (roadmap B3, a non-goal here).
- **m7** (reflector REFL-005, adr-gap) — record on ADR-03 or as a follow-up; a UNIQUE constraint needs the owner.
- **m8** (ui) — three stale comments in the legacy frontend; cannot be touched under AC27.

### Trivial (1 open; t1 resolved in round 2)

- **t2** (quality QUAL-006, round 2) — `deletePost` used to find the post in a list, so `/api/posts/abc` was a plain 404; it now asks the database for id `NaN` and returns the database message as 400. Same family as the non-numeric-id risk accepted in the design; fix with the shared error middleware (B3).

### Extra wrap-up items from round 2 (reflector)

- `knowledge/components/dal-query-classes.md`: the bullet about row `console.log` is now wrong for all Query classes — remove it.
- G27: note that the `| undefined` return types now make the "no row" case visible to the compiler.

## Acceptance criteria check

Met by reading the code (correctness reviewer plus the orchestrator's own read), and at run time by the owner's database run below, except the admin paths.

- [✓] AC1–AC3 — user update writes only sent columns; no password sent keeps the hash; `role` is not in the allowed list
- [✓] AC4 — post update writes only `caption` / `media_url` when sent; `user_id` not writable
- [✓] AC5 — alumni update writes only the sent ones of seven columns; `user_id` not writable
- [✓] AC6 — `null` clears nullable fields; `email` / `password` null or empty is 400 (spaces-only counts as empty, owner's choice)
- [✓] AC7 — empty update is 400 on all three
- [✓] AC8 — `password` selected only in `findUserWithPasswordByEmail`; other user queries name their columns
- [✓] AC9 — login reads the hash through `findUserForLogin`
- [✓] AC10 — no row of any table is logged (post and comment row logs removed in round 2)
- [✓] AC11, AC12 — exact-match role check before hashing
- [✓] AC13 — self or admin, else 403
- [✓] AC14 — profile owner or admin, else 403
- [✓] AC15 — comment edit author-only
- [✓] AC16 — comment delete author or admin
- [✓] AC17 — 404 for a missing row; the users route answers 403 first for non-admins (owner's choice)
- [✓] AC18, AC19 — author from the token
- [✓] AC20 — comment edit takes only `content`
- [✓] AC21 — login-stamp route and its code removed
- [✓] AC22 — post edit author-only, 404 for a missing id
- [✓] AC23 — alumni `user_id` from the token
- [✓] AC24 — logout self-only
- [✓] AC25 — `npm run build` exit 0 (run by the orchestrator after all tasks)
- [✓] AC26, AC27 — no change under `db/`, `frontend/` or `shared/`
- [✓] AC28 — SQL only in `dal/query/`, values bound, layers kept
- [✓] At run time — owner's 39-check run, 39 passed (see below)
- [⚠] Admin paths at run time (the admin halves of AC13, AC14, AC15, AC16, AC17 and AC22) — not yet tested

## Owner's database run (2026-10-06)

Reported by the owner; the pipeline did not run it and has not seen the script or its output.

- **What:** a 39-check script against the real database, with the API running on this feature branch.
- **When:** twice — once before the review, once after the round-2 fixes.
- **Result:** both runs 39 passed, 0 failed.
- **Covered:** sign-up role rules; no password in any answer; 401 without a token; `PUT /api/users/:id/login` returns 404; owner checks (403) on user update, logout, post edit, comment edit and delete, alumni update; partial updates keep unsent fields on user, post and alumni; the password still works after a name-only update; an empty update returns 400; a user cannot make themselves admin; the owner comes from the token for post, comment and alumni; a spaces-only comment returns 400; a wrong type for `graduation_year` returns 400.
- **Not tested:** admin paths, and deleting a user.
- **Not named in the owner's summary** (so neither confirmed nor refuted here): a field sent as `null` being cleared; `email` / `password` sent as `null` or empty; 404 for a missing id on the update and delete routes.
- **Vault effect:** the "needs verification" marks this run covers were removed from G01 (the alumni insert from REQ-fs-001, which the alumni checks exercised), G02, G09, G10, G14, G17, G20, G22, the concept page `partial-update-sent-fields` and the two component pages. The mark stays, for the admin path only, on G18, G19, G21 and G23.
