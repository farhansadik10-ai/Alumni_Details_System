# TASK-015 — Cleanup: shared rules into lib/, remove the copies, fix two wordings

| Field | Value |
|---|---|
| REQ | REQ-fs-005 |
| Tier | 5 |
| Status | complete |
| Repo | alumni-details-system |
| Depends on | TASK-008, TASK-012 |
| Blocks | TASK-014 |

## Goal

Every rule that two places wrote by hand lives once in `lib/` with library-check cases, the copies are gone, and two wordings are right (AC36, AC49). Added after the implementers reported these leftovers; approved by the owner at the implement phase.

## Files to touch

| Path | Action |
|---|---|
| `frontend/src/lib/alumniDisplay.ts` | edit (export the "trimmed text or null" helper) |
| `frontend/src/lib/profileId.ts` | create (`readProfileId`) |
| `frontend/src/lib/loadFailure.ts` | create (failure → which load words to show) |
| `scripts/frontend-lib-check.ts` | edit (cases for the two new files and the exported helper) |
| `frontend/src/components/alumni/AlumniCard/AlumniCard.tsx` | edit (use the shared helper) |
| `frontend/src/pages/AlumniProfilePage/AlumniProfilePage.tsx` | edit (use the shared helper, `readProfileId`, `loadFailure`; focus after "Try again") |
| `frontend/src/components/profile/AlumniProfileCard/AlumniProfileCard.tsx` | edit (use `loadFailure`) |
| `frontend/src/pages/DirectoryPage/DirectoryPage.tsx` | edit (own copy of the failure rule if any; `showClear` and the search-box ref) |
| `frontend/src/components/alumni/DirectoryFilters/DirectoryFilters.tsx` | edit (`showClear` prop, `ref` for the search box) |
| `frontend/src/components/profile/AccountCard/AccountCard.tsx` | edit (Account wording for 403 / 404; use `loadFailure`) |
| `frontend/src/config/text.ts` | edit (one Account-card sentence for "gone", in the My profile group) |

## Approach

- Search first (`grep`) for every copy of: "trimmed text or null" (`tagText`, `presentText`, private `present`), the profile id rule (`readProfileId`), and the two-line failure-to-words rule (`loadFailureText` and its twins). List them in Notes before editing.
- Move each rule into one `lib/` function; lib imports no React and no services (the failure input is a plain `"network" | status` shape, like `lib/` already avoids `services/`; take `{ kind: "network" } | { kind: "http"; status: number }` as a structural type).
- Library-check cases written from the task, not from the code: `readProfileId` (`"7"`, `"0"`, `"abc"`, `"1.5"`, `"-3"`, 2147483647, 2147483648, 23 digits, Arabic-Indic digits, empty); the failure rule (network → no-answer words, 500 and 503 → server words, 404 → server/general as the pages used it); the exported text helper (`null`, `""`, `"  "`, `" a "`). Prove one case can fail.
- After "Try again" on the profile page, focus must not fall to the body: move it to the page heading (or the retry's replacement).
- Account card, 403 or 404: a sentence that talks about the account, not "This profile…".
- AC11 gap found in TASK-008: `DirectoryFilters` always shows its own "Clear search and filters" and has no setting to hide it, so an empty result with criteria set has no button in the empty state itself. Fix: add a `showClear` prop to `DirectoryFilters` (default true) and a `ref` for its search box (so the page drops its `querySelector("input")` workaround); the page passes `showClear={false}` while the empty state with its own Clear button is on screen, and moves focus to the search box after Clear as it does today.
- Re-run a search for the three copies; it must find none.

## Acceptance

- [x] A search for each of the three copies finds exactly one definition each
- [x] `npx tsx scripts/frontend-lib-check.ts` exits 0, and was seen to exit 1 for a wrong expectation
- [x] `npm run build` and `node scripts/frontend-style-check.mjs` exit 0
- [x] No page or component behavior changed apart from the focus fix and the Account wording

## Notes

Rules for every task of this REQ: see TASK-001. Scratch files go in the session scratchpad, never in the repo, and are never deleted outside `.adlc/`.

**Copies found before editing (grep over `frontend/src`):**

- "Trimmed text or null": `present` (private) in `lib/alumniDisplay.ts:13`; `tagText` in `AlumniCard.tsx:27`; `presentText` in `AlumniProfilePage.tsx:74`. (`alumniForm.ts:124` is a different rule: it trims form strings, not `string | null`; left alone.)
- Profile id rule: `readProfileId` plus `MAX_ID` / `DIGITS_ONLY` in `AlumniProfilePage.tsx:56-71`. Only copy in the app.
- Failure → load words: `failureText` in `AlumniProfilePage.tsx:79`, `failureText` in `DirectoryPage.tsx:54`, `loadFailureText` in `AlumniProfileCard.tsx:80`; `AccountCard.tsx:83` hard-coded `FAILURE_NO_ANSWER_TEXT`.
- Directory Clear focus workaround: `filtersRef.current?.querySelector("input")` in `DirectoryPage.tsx:168`.

**What changed:**

- `present` became the exported `presentText` (same body); card and profile page import it.
- `lib/profileId.ts` and `lib/loadFailure.ts` hold the other two rules. `loadFailure.ts` declares `LoadFailure` as the structural `{ kind: "network" } | { kind: "http"; status: number }`, so lib/ does not import services/; it imports `config/text` the way `alumniDisplay.ts` already does. `null` (no failure kept) gives the no-answer words, as every page did; AccountCard now calls `loadFailureText(null)` (same words).
- Re-search after: one definition each, all in `lib/`; no other file imports `FAILURE_*_TEXT`.
- Library check: 20 new cases (4 text, 11 id, 5 load words); total 282. Proved it can fail by changing the "2147483648 is too big" expectation to 2147483648 in place: exit 1 with one FAIL; restored, exit 0.
- AC11: `DirectoryFilters` has `showClear` (default true) and `searchRef`; the page drops its wrapper div and `querySelector`, passes `showClear={false}` while the empty-with-criteria state is on screen, and that `EmptyState` now has the "Clear search and filters" button (secondary: the Search button is the page's primary). Clear still moves focus to the search box.
- Retry focus: `ProfileBand` is not in this task's files and has no heading ref, so the page wraps the band in a plain `<div ref={bandRef}>` and focuses `bandRef.current?.querySelector("h1")` (the AppShell pattern). The h1 has `tabIndex={-1}` and stays the same element in every status.
- Account words: `ACCOUNT_SAVE_FAILED_GONE` in the My profile group of `text.ts`: "Your account can no longer be saved. It may have been removed, or you may no longer have access." `SAVE_FAILED_GONE` stays for the Alumni profile card.
- Checks: `npm run build`, `node scripts/frontend-style-check.mjs`, `npx tsx scripts/frontend-lib-check.ts` all exit 0. Not run in a browser.

**Follow-ups (not done):** the "Try again" buttons of `AlumniProfileCard` and `AccountCard` load errors also unmount on retry and drop focus to the body; `ProfileBand` could take a heading ref so pages need no wrapper div.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-005-frontend-directory-and-profiles/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-002-3-new-helper-convert-every-sibling|L-REQ-fs-002-3]], [[knowledge/lessons/LESSON-REQ-fs-004-2-one-rule-one-function-in-lib|L-REQ-fs-004-2]]
