# REQ-fs-006-frontend-feed-and-dashboard — Verification

| Field | Value |
|---|---|
| Generated | 2026-10-08 (round 3 refreshed) |
| Work path | C:/Users/Lenovo/Alumni_Details_System |
| Isolation | branch |
| Branch | feat/REQ-fs-006-frontend-feed-and-dashboard |
| Files changed | 54 in the 9 committed commits + 23 in the uncommitted fix rounds |
| Base | redesign |

Full reviewer narratives (all rounds): `review-log.md` — open on demand.

## Summary

- **Round 1:** 0 critical · 1 major · 16 minor · 2 trivial. The owner chose `fix all`.
- **Fix round 1 (12 findings) and fix round 3 (n1, n3, n4, n5):** all held. Build passes, style check passes, library check 469 of 469 (was 434). Round 2 re-ran all five reviewers; round 3 re-ran the past-mistakes check and the quality reviewer. The browser review passed every check in rounds 1 and 2 (headless Edge, mock API, port 3000 never touched).
- **Open now:** 0 critical · **1 major** (M1, a process decision, not code) · **7 minor** · **10 trivial**.
- **Pattern:** each fix round closed its findings and exposed a narrower edge of the same kind (a late answer meeting a newer user action). The remaining one (REFL-009) is the 404 branch of n1.
- **ADR conflicts:** none; no new ADR. **Vault-stale:** yes (m16, wrap-up).
- **Fixes are uncommitted** by protocol; they are committed when this gate clears. Packet sizes: 379KB, 197KB, 71KB.

## Findings at a glance (open only)

| ID | Sev | Finding | Where | Effort | Fix |
|----|-----|---------|-------|--------|-----|
| M1 | major | Safety near-misses are not a standing rule (gotcha + conventions line) | CAND-003/014 | small | your call (wrap-up) |
| r1 | minor | A 404 on saving a comment moves focus even if the user started another edit or reply meanwhile (REFL-009) | CommentItem.tsx handleSave | small | yes |
| n2 | minor | A Load more racing a write can show the total one off (CORR-004, UI-004) | store/postAtoms.ts | small | your call |
| n6 | minor | `toPeopleBlockState` has no check cases (REFL-007) | store/peopleBlockState.ts | small | your call |
| m6 | minor | Edit Save is on with no change and sends a PUT (UI-002) | PostForm / FeedPost | small | your call |
| m14 | minor | Pages convert atom state to block state by hand (ARCH-002) | pages | medium | your call |
| m15 | minor | `ApiFailure` imported from the big postAtoms (ARCH-003) | PeopleBlock, CountsBlock | medium | your call |
| m16 | minor | Vault pages and docs now stale (REFL-004) | vault, roadmap, CLAUDE.md | small | your call (wrap-up) |
| t1-t10 | trivial | lib-check gaps; dev page size; `countText` home (ARCH-005); `postSummaryLinkContext` has no case (QUAL-010); lesson-candidates numbers repeat (QUAL-011, REFL-008: wrap-up renumbers); same-id edit race (REFL-010); pattern 32/33 wording (REFL-011); header comment in postActions.ts (QUAL-013); the "still the same edit" rule checked in two files (QUAL-012) | — | — | — |

## Resolved (one line each)

- Fix round 1: m1 (repeated rules), m2 (late total), m3 (comment count on open), m4 (stuck dialog), m5 (Cancel during save), m7 (link names), m8 (403 wording), m9 (reply-target rule), m10 (unused words), m11 (plural rule), m12 (shared CSS), m13 (trim rule) — all resolved round 2; the browser confirmed m3, m4, m5, m7, m8.
- Fix round 3: n1 REFL-006 (late answer wiped a newer reply or edit) — resolved round 3 for send and save; r1 is its 404 branch. n3 QUAL-009/CORR-005 (blank guard had a made-up 400) — resolved round 3, new result variant. n4 QUAL-008 (stale doc lines) — resolved round 3. n5 ARCH-004 (store file imports a component type) — resolved round 3 by a sentence in pattern 33.

## Consolidated (open, major and minor)

### Major (1)
- **M1** (reflector REFL-005): at wrap-up merge CAND-003 and CAND-014 into one gotcha, "Throwaway checks that import app code", and add one line to `context/conventions.md`. The owner decides.

### Minor (7)
- **r1** (REFL-009): check `editingRef` in the 404 branch of `handleSave` before calling `onRemoved()`, as the ok branch does.
- **n2, n6, m6, m14, m15, m16**: owner's calls, see the table. n2 is accepted beside ADV-001 unless you want it fixed.

## Acceptance criteria check

- [✓] AC1-AC38 — met. AC3 and AC19 carry two accepted edge cases (ADV-001, n2). AC38 is finished at wrap-up (`docs/roadmap.md`).
- Browser evidence: 66 screenshots in `ui-evidence/` (rounds 1 and 2). The round 3 change (n1, n3) was checked by reading, not in a browser; the owner's `manual-checklist.md` has a step for n1.
