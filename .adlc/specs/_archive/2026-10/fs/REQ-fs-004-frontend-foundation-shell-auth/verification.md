# REQ-fs-004-frontend-foundation-shell-auth — Verification

| Field | Value |
|---|---|
| Generated | 2026-10-07 (round 2) |
| Work path | C:/Users/Lenovo/Alumni_Details_System |
| Isolation | branch |
| Branch | feat/REQ-fs-004-frontend-foundation-shell-auth |
| Files changed | 114 in round 1; 32 in round 2 (26 edited, 7 new, one stray test file left out) |
| Commits | 14 committed; the round-1 fixes are not committed yet |
| Base | redesign |

Full reviewer narratives (both rounds): `review-log.md` — not loaded by later phases; open on demand.

## Summary

- **Round 2 result.** The 16 fixes hold: all 16 round-1 findings they targeted are resolved. 0 critical, 0 major. Open now: 12 minor, 5 trivial listed (more in the log). 7 of the open items are new from the fixes, 8 are round-1 items left for the owner.
- **Round 1 → 2.** 24 entries → 16 resolved, 8 left for the owner (m2, m5, m13, m15, m16, m17, m18, t3), plus 9 new (n1 to n5 minor, t5 to t8 trivial and listed; the rest in the log). New ones are small: a focus nuance after log in, a stale flag in an unused component, two comments, a type, three missing test cases, doc drift.
- **Machine checks (re-run by reviewers and by me):** build passes · style check 0 findings across 10 rules and 118 files · library check 108 of 108 (was 72). `npm run check:frontend` works.
- **Past-mistakes check:** the leftover-copies lesson (LESSON-REQ-fs-002-3) was NOT repeated in round 2; every inline copy was converted. Its third sighting stays in the record.
- **UI check:** headless Chrome on a mock API, dev server and production preview; nothing reached port 3000. Header, pagination focus, focus after log in and focus ring re-checked: fixed. Regression pass on phone menu, dialog and both forms: nothing found. Left for your checklist: a real screen reader, Firefox and Safari at 768px, the real API.
- **Vault:** m18 and t7 are vault or doc updates for wrap-up; no finding contradicts an accepted ADR.
- Reviewers: correctness · quality · architecture · reflector · ui, all on `sonnet`. Packet round 2: 177KB.
- **Stray file:** `scripts/_tmpfail.ts` (a one-line test leftover from a fix agent). Not committed; needs your yes to delete.

## Findings at a glance

| ID | Severity | Finding (one line) | Where | Effort | Fix |
|----|----------|--------------------|-------|--------|-----|
| M1, M2 | major | resolved, round 2 (dialog hook; return-address and pageRange checks) | — | — | — |
| m1, m3, m4, m6–m12, m14 | minor | resolved, round 2 (12 findings; see the log) | — | — | — |
| t1, t2, t4 | trivial | resolved, round 2 | — | — | — |
| n1 | minor | the "after log in" router state stays in history: a reload steals focus to the heading, and a return to `/` sets no focus (CORR R2-1, UI-007, QUAL-R2-4) | routes/paths.ts:22, AppShell.tsx:58 | small | yes |
| n2 | minor | Pagination's `keepFocus` flag stays true if the parent never changes the page (CORR R2-2, QUAL-R2-4) | Pagination.tsx:17 | small | yes |
| n3 | minor | comment in `layout.ts` says rule i, means j; `MyProfilePage` writes "My profile" instead of the constant (QUAL-R2-1) | config/layout.ts:3, MyProfilePage.tsx:22 | trivial | yes |
| n4 | minor | `isLiveSession` is a type predicate, so the false branch is typed `null` though an expired session lands there too (QUAL-R2-2) | lib/token.ts | trivial | yes |
| n5 | minor | three pageRange boundary cases missing: (1,8), (22,25), (5,8) (QUAL-R2-3) | scripts/frontend-lib-check.ts | trivial | yes |
| m2 | minor | idle open page not ended at token expiry until the next call (CORR-002) | RequireAuth.tsx | small | your call |
| m5 | minor | a photo link of just `https://` passes (CORR-005; AC53 as written) | validation.ts | small | your call |
| m13 | minor | password Show/Hide says its state twice (UI-003, D1) | PasswordInput.tsx:56 | trivial | your call |
| m15 | minor | dark `--edge` on `--sunken` 2.87:1 (UI-005; a README value) | tokens.css | trivial | your call |
| m16 | minor | frontend naming and comment rules not in conventions.md (QUAL-007) | context/conventions.md | small | your call |
| m17 | minor | store logic proven only by an unshipped scratch harness (REFL-002) | store/ | medium | your call |
| m18 | minor | "kept for the legacy frontend" now false (REFL-003) | user.types.ts, G34, G38, ADR-07 | small | your call (wrap-up) |
| t3 | trivial | `frontend/README.md` is the Vite template; ESLint config has no installed packages (REFL-005) | frontend/ | small | your call |
| t5 | trivial | comment in `sessionAtoms.ts:42` says the guards call `isExpired`; they call `isLiveSession` (ARCH-005) | store/sessionAtoms.ts:42 | trivial | yes |
| t6 | trivial | `docs/frontend-patterns.md` is out of date: "rules a to h" (now a to j), 72 cases (now 108), duplication listed as open, new files not named, "a file per page" inexact (REFL-006 to 008); same wording in an App.tsx comment | docs/, App.tsx | small | yes |
| t7 | trivial | `architecture.md` folder list lacks 7 new files (ARCH-004) | REQ architecture.md | trivial | wrap-up |
| t8 | trivial | the shrunk header name has no tooltip (UI-008) | Header.tsx | trivial | your call |

Reviewed by: correctness (balanced) · quality (balanced) · architecture (balanced) · reflector (balanced) · ui (balanced), all on `sonnet`.

## Consolidated by severity

### Critical (0) and Major (0)

None open. M1 and M2 are resolved.

### Minor (12 open)

- **n1** keep the one-time state from lasting: clear it after its first use, or have AppShell ignore it on a reload; when the return address is `/`, still set the focus. **n2** reset `keepFocus` when `onChange` does not change the page, or after the next render. **n3** fix the comment; use `MY_PROFILE_LABEL`. **n4** return `boolean` or document that `false` also means expired. **n5** add the three cases, expected values from the doc comment.
- **Your call** (unchanged from round 1): m2 accept (and say so in the patterns doc) or restore an idle timer; m5 changes AC53 as written; m13 keep the name change or the pressed state, not both; m15 the value is in the README, the owner's own check found 3.18:1 as the lowest border pair; m16, m17, m18 vault and follow-up decisions.

### Trivial (5 listed)

t3, t5, t6, t7, t8 in the table. About ten more trivials from both rounds (contact email breaking at its hyphen, theme switch as first Tab stop on log in, unused exports, `{...props}` gap in rule f) are in `review-log.md`.

## Acceptance criteria check

- [✓] AC1–3, 5–8, 11–12, 15–16, 30, 35, 60–61, 63, 65 — machine checks pass; read in code
- [✓] AC9–10, 13–14, 17–31 — values compared; components shown; theme boot seen in dev and production
- [✓] AC32 — header is one row at 72px (73 with border) at 768, 800, 850 and 1280px (fixed in round 2; the name can shrink to the avatar at 768px for an admin with a long name, judged acceptable)
- [✓] AC33–34, 36–41, 43–52, 54, 56–58 — seen in headless Chrome against the mock API; focus ring and pagination focus fixed
- [⚠] AC4, 42 — rule and expiry logic still proven only by an unshipped harness; idle page not ended (m17, m2)
- [⚠] AC53 — a photo link of just `https://` is accepted, as AC53 is written (m5)
- [⚠] AC55 — second half (log in fails after sign-up) seen against made-up answers only; your checklist covers it
- [⚠] AC59 — one border pair is under 3:1 in dark (m15)
- [⚠] AC62 — one h1 and own titles hold; focus after a log-in redirect now lands on the heading, with the reload nuance n1
- [⚠] AC64 — roadmap, root `CLAUDE.md`, design-system page: done at wrap-up
