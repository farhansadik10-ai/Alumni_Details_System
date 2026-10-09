# REQ-fs-007-frontend-users-about-polish-perf — Verification

| Field | Value |
|---|---|
| Generated | 2026-10-09 (round 2) |
| Work path | C:/Users/Lenovo/Alumni_Details_System |
| Isolation | branch |
| Branch | feat/REQ-fs-007-frontend-users-about-polish-perf |
| Files changed | 47 in round 1; 19 more in the fix round (uncommitted) |
| Commits | 10 on the branch (8 code and docs, 2 vault); the fix round is not committed yet |
| Base | redesign |

Full reviewer narratives, both rounds: `review-log.md` (43KB) — not loaded by later phases. Packets: round 1 249KB (ceiling 250KB), round 2 116KB.

## Summary

- Round 2 (after "fix all" and the owner's answers): 0 critical, 0 major. Open: 4 minor (m8b, m11, m12, m13: accepted or recorded at wrap-up), 7 trivial (none needs a fix). 15 earlier findings resolved.
- Reviewed by: correctness (balanced) · quality (balanced) · architecture (balanced) · reflector (balanced) · ui (balanced, headless Chrome 147 over a mock API). All five re-ran on the fix diff and confirmed their own findings resolved.
- Checks after the fix round: build ok · style check PASS (200 files) · library check 565 passed, 0 failed (was 536) · no stray files in the repo · nothing listening on the review ports · port 3000 never touched.
- ADR: no new ADR. Two small differences from accepted ADRs need your decision (m11 ADR-06, m12 ADR-10).
- UI: ran again for the Users, Directory, login and comment paths the fixes touched (about 75 checks, both themes, 360 and 1280px), no console errors. One path was read from source only: a late comment 404 while another edit is open (m2), because the mock has no second editable comment.
- Docs stale for wrap-up (not code): root `CLAUDE.md` line 47, `.adlc/context/project-overview.md` line 70, `.adlc/context/design-system.md` lines 179, 197, 217, 219, 247, `.adlc/knowledge/components/frontend-app.md`, gotcha G50.

## Findings at a glance (open only)

| ID | Sev | Finding (one line) | Where | Effort | Fix |
|----|-----|--------------------|-------|--------|-----|
| m8b | minor | The loading/error/empty/ready chain and the count-text lookup are copied between Users and Directory pages (QUAL-004) | UsersPage, DirectoryPage | medium | your call |
| m11 | minor | 409 words differ from the words ADR-06 fixes: same facts, longer text (ARCH-001) | config/text.ts:497 | small | your call |
| m12 | minor | About leaves out "who can join" and "app version" that ADR-10 and design-system list; no deviation recorded (REFL-002) | AboutPage, ADR-10 | small | your call |
| m13 | minor | At 360px two delete toasts can cover pagination Next and the About link for about 5 s; same class as the My profile case in `skipped.md` (UI-001) | Toast | — | your call |
| t4 | trivial | Whitespace-only edit counts as unchanged (CORR-002) | FeedPost, CommentItem | — | accept |
| t5 | trivial | A delete during a load is not in a log; a total may be one high until the next load (REFL-005) | usersAtoms.ts | — | accept |
| t6 | trivial | After deleting on page 1 the next page skips one user until reload; normal offset paging (UI-004) | UsersPage | — | accept |
| t8 | trivial | `ListAddressStatus` is a fifth copy of the four list states; the hook may not import the store and the compiler checks the match (ARCH-004, QUAL-009) | useListAddress.ts | — | accept |
| t9 | trivial | `asRole` takes only `string`, so three callers keep a null guard (QUAL-007) | token.ts and callers | small | your call |
| t10 | trivial | The library-check header does not list the TASK-008 block; no record of one wrong-expectation run (QUAL-008) | scripts/frontend-lib-check.ts | small | your call |
| t11 | trivial | The dev page builds one `mailto:` link by hand from sample data (REFL-007) | ComponentsPage.tsx:1069 | — | accept |
| v1 | vault-stale | Files with old wording, listed in the Summary; for `/wrapup` step 3 (REFL-006) | vault, root CLAUDE.md | — | your call (wrap-up) |

## Owner decisions at the review gate (2026-10-09)

- m6b: delete `BeingBuilt.tsx` — yes. Done; the docs were updated; build, style check and 565 library cases pass.
- m11: keep the new 409 words and add a deviation line to ADR-06 at wrap-up (no code change).
- m12: record a deviation line in ADR-10 at wrap-up (no version or "who can join" on the About page; no code change).
- m8b and m13: accepted as follow-ups (listed in `skipped.md`). Trivials t4–t6, t8, t11 accepted. t9 and t10 left as notes.

## Resolved (one line each)

- Round 1 fix round, confirmed by round 2: m1 CORR-001 (stale flag on leaving the page) · m2 REFL-001 (comment 404 guard) · m3 UI-002 (empty Actions label in phone cards) · m4 QUAL-003 (asRole, one copy) · m5 REFL-003 (LoginPage mailto, dev ROLE_OPTIONS) · m6a QUAL-001 text part (PageNote example) · m7 QUAL-002 and REFL-004 (stale docs bullet) · m8a QUAL-004 cases (word functions) · m9 QUAL-005 (toPeopleBlockState cases) · m10 ARCH-002 (refill moved into the store) · t1 ARCH-003 (hook typing, shared reset body) · t2 QUAL-006 (PAGE_KEY) · t3 UI-003 (dev page overflow) · t7 (isKnownRole removed with m4).

## Consolidated (open, minor)

#### m6b — dead `BeingBuilt.tsx`
- **Source:** quality. **What:** no importer; header comment stale; two English strings. **Recommendation:** delete the file. Needs your yes (outside `.adlc/`).

#### m8b — duplicated view chain
- **Source:** quality. **What:** `UsersPage.tsx` and `DirectoryPage.tsx` each decide loading / error / empty / ready and the count line the same way. **Recommendation:** a small shared function in `lib/` with cases, or leave: it is 10 lines in two places.

#### m11 — 409 words vs ADR-06
- **Source:** architecture. **What:** ADR-06 fixes "This user has posts, comments or an alumni profile and cannot be deleted". The page says "{name} cannot be deleted because they still have posts, comments or an alumni profile. Nothing was changed." **Recommendation:** keep the new words and add one line to ADR-06 (the words name the person and say nothing changed), or switch to the ADR text.

#### m12 — About vs ADR-10
- **Source:** reflector (adr-conflict). **What:** the spec forbids invented facts, so "app version" and "who can join" were left out; nothing records it. **Recommendation:** add a deviation line to ADR-10 (neutral wording needs no version), or add one sentence on who can join from the sign-up roles (student, alumni).

#### m13 — toasts on a phone
- **Source:** ui. **What:** two toasts at the bottom of a 360px screen can cover Next and the About link for about 5 s. Each has Dismiss. **Recommendation:** accept for now; a fix is a design call (one toast at a time, or a smaller offset above the footer).

## Acceptance criteria check

- [✓] AC1–AC19, AC21 — met; browser-verified twice (the phone audit, then two independent UI reviews).
- [⚠] AC20 — dialog and menu are fine; two toasts can cover a bottom button for 5 s (m13).
- [✓] AC22–AC24, AC26–AC31, AC33–AC36 — met (sizes recorded, one font preload naming the requested file, memo with counted savings, docs updated, 565 library cases, build and style check clean, no `.env`, backend import or database use).
- [⚠] AC25 — the post picture box never moves the page; a link that fails after the box is drawn is hidden and the page moves once (your choice at the implement gate).
- [⚠] AC32 — root `CLAUDE.md` and the project overview are updated at wrap-up by design (v1).
