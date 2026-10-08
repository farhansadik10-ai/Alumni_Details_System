# REQ-fs-005-frontend-directory-and-profiles — Verification

| Field | Value |
|---|---|
| Generated | 2026-10-08 (round 2) |
| Work path | C:/Users/Lenovo/Alumni_Details_System |
| Isolation | branch |
| Branch | feat/REQ-fs-005-frontend-directory-and-profiles |
| Files changed | 46 outside the vault in the commits, plus the uncommitted fix round (21 files, 2 new, 1 removed) |
| Commits | 7 implementation commits (plus the spec commit); the fix round is not committed yet |
| Base | redesign |

Full reviewer narratives: `review-log.md` (round 1 sections, then "Round 2" sections) — not loaded by later phases; open on demand.

## Summary

Round 2 (after the fix round). Open now: 0 critical, 1 major (a stale vault page, needs-decision), 15 minor, about 15 trivial. Round 1 had 2 major and 17 minor; the fix round resolved M1 and m1-m5, m8, m9, m11, m16, and m7 and m12 in part. All five reviewers ran twice; the first round-1 dispatch stopped on a usage limit before any wrote a finding and was re-run in full. Build passes, style check passes with the new rule k, library check 326 cases (was 282). Round 2 packet 154KB. No finding conflicts with an accepted decision record. The UI reviewer (headless Chrome, mock API only, never the real backend) confirmed all UI fixes in the browser. The one regression from the Save fix (n1) and the Discard flaw (n2) were fixed in batch F and re-checked. Not covered by anyone: a real screen reader, a real phone, real browser zoom, the real backend.

Reviewed by: correctness (balanced) · quality (balanced) · architecture (balanced) · reflector (balanced) · ui (balanced), rounds 1 and 2

## Findings at a glance

Resolved in round 2 (one line each; long form in the log): M1 — resolved, round 2 · m1 — resolved · m2 — resolved · m3 — resolved · m4 — resolved · m5 — resolved · m8 — resolved · m9 — resolved · m11 — resolved · m16 — resolved · m7 — partly (see n4) · m12 — partly (see n5) · n1 — resolved (batch F) · n2 — resolved (batch F).

| ID | Severity | Finding (one line) | Where | Effort | Fix |
|----|----------|--------------------|-------|--------|-----|
| n11 | minor | NEW, small: after a 409 on create the focused Save turns off with no focus move, so focus drops to the page (the conflict message stays visible) | AlumniProfileCard.tsx ~216 | small | yes |
| n3 | minor | NEW: the two cards keep typed text across a save and move focus in two different ways; only the alumni card has a lib function with cases | both cards | medium | yes |
| n4 | minor | failure shape still declared twice (services/apiError.ts); store/alumniAtoms.ts:87 still writes 404; HTTP numbers live in loadFailure.ts | services, store, lib | small | yes |
| n5 | minor | rule k covers only part of pattern 1 (not jotai, hooks, components, pages from lib/; not store from services/; not UI folders from store/) | scripts/frontend-style-check.mjs | small | yes |
| n6 | minor | AlumniProfileCard css composes four blocks from the sibling AccountCard module; move them to a neutral shared module | both card css modules | small | yes |
| n7 | minor | 18 comments end in review finding ids (CORR-004, UI-001...) that dangle once the log is archived; 75 more cite AC7/ADV-005 with no REQ id | many | small | your call (wrapup) |
| n8 | minor | mailtoHref checks the same thing three ways; the page branches three times on the email | lib/mailtoLink.ts, AlumniProfilePage.tsx | small | your call |
| n9 | minor | patterns doc: says 282 cases, heading "Files added in review round 1", stale Open points, no text for Save-off rule or mailtoHref, patterns 25 and 28 lag | docs/frontend-patterns.md | small | yes (wrapup is fine) |
| n10 | minor | disabled Save and Discard say nothing about why; a short "No changes to save" hint would | both cards | small | your call |
| M2 | major | frontend-app component page still describes part 1 (vault-stale) | .adlc/knowledge/components/frontend-app.md | small | your call (wrapup) |
| m6 | minor | alumni calls have no timeout (apiClient.ts is a part 1 file) | services/apiClient.ts | small | your call |
| m10 | minor | Enter and Search also replace history; Back skips the plain directory; listed deviation 2 is narrower than the code | DirectoryPage.tsx | small | your call |
| m13 | minor | ~150 lines of debounce/focus logic in DirectoryPage out of check reach; DirectoryFilters imports a store type | DirectoryPage, DirectoryFilters | medium | your call |
| m14 | minor | comments cite "AC7"/"ADV-005" with no REQ id (the new Comments rule allows it) | many | — | your call (wrapup) |
| m15 | minor | docs/vault text still says part 1: design-system.md components table, root CLAUDE.md:47, project-overview.md, architecture.md blast radius | several | small | your call (wrapup) |
| m17 | minor | only "LinkedIn link" says (optional) on the profile form | AlumniProfileCard | small | your call |

Also about 15 trivial (Escape on the phone Filters panel; filter options load once per session; focus drops if the saved value is retyped under focus; a save that ends after the page closed puts "ready" back into the cleared atom; resetAlumniAtom repeats the three clear bodies; imports in the middle of the library check; and the earlier nine). Unlisted deviation to add to architecture.md: Save and Discard are disabled until a value changes.

## Consolidated by severity

### Major (1)

#### M2 — frontend-app.md is part 1 (vault-stale, needs-decision)
- **Source:** reflector (REFL-003)
- **What:** Says REQ-fs-004, six being-built pages, 108 cases, no alumni or profile components, no REQ-fs-005 row.
- **Recommendation:** Update at /wrapup step 3 with the other vault pages (m15). Not a code fix.

### Minor (16)

The table lists them; long form in `review-log.md` under: n1 R2-001 · n2 R2-002 · n3 REFL-008, R2-3 (quality), ARCH-008 · n4 ARCH-003, REFL-010 · n5 ARCH-001, REFL-010 · n6 ARCH-009 · n7 R2-1 (quality), REFL-002 · n8 R2-2 (quality) · n9 R2-4 (quality), REFL-009 · n10 R2-UI-001 · m6 CORR-006 · m10 ARCH-002 · m13 ARCH-004 · m15 REFL-004, REFL-005 · m17 round 1 check-notes.

## Acceptance criteria check

- [✓] AC1–AC14 directory — works on the mock; edges (AC3, AC7, AC8) fixed in round 2; ⚠ AC6/AC17 and Back behaviour: m10
- [✓] AC15–AC20 profile — AC16 mailto and AC18 flash fixed
- [✓] AC21–AC33 My profile — AC24 first create (n1) and AC30 fixed; ⚠ n11 focus after a 409
- [✓] AC34–AC44 all pages — AC36 copies fixed apart from n3, n6; AC41 checked at 640/320 px by device scale, not real 200% zoom; AC42 focus fixed; AC40 Admin tag fixed
- [✓] AC38 narrowed as listed (validator messages stay in lib/validation.ts)
- [✓] AC45–AC47 leftovers done; the Comments section awaits your confirmation
- [⚠] AC48 patterns 23–28 written; ⚠ n9 (stale counts and headings); roadmap rows change at wrapup
- [✓] AC49–AC52 326 library cases, build and style green, no antd, no new package, mock API only, no .env, no database command, no push
