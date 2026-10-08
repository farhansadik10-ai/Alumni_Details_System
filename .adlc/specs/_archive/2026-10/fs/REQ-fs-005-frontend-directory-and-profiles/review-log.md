# REQ-fs-005-frontend-directory-and-profiles — Review log

Full reviewer narratives. The consolidated verdict lives in `verification.md` —
read that first; come here for the long form behind a finding ID.

## Correctness findings

Written by: correctness-reviewer (tier: balanced), dispatched sub-agent.

**Summary.** Read the whole frontend diff for logic, races and input handling, and the two backend controllers and routes for the contract. 0 critical, 0 major, 5 minor (1 security, 4 logic or error-handling), 1 trivial not listed. The request helper (latestRequest), the session resets, the 409 and 403/404 paths, the double-submit guard and the validator sizes against db/schema.md all hold. The biggest finding: the profile "Email" links put the stored email into a `mailto:` address unencoded (CORR-001). Packet-gap: none.

**Dispatch questions.** latestRequest and aborted answers: checked, nothing (cancel bumps the counter and aborts; every loader checks the ticket before writing; StrictMode double start is safe). Debounce/address/focus: CORR-002, CORR-003. Session switch and atom reset: checked, nothing (all four loaders and `myAlumni` also check the user id; both token paths call resetAlumniAtom). Form 409/403/404/double submit/reset in place: checked, nothing for the paths named; CORR-005 for edits made while saving. Validators vs columns: checked, nothing (100 characters counted as code points matches varchar(100); bio, link, field are `text`, so the caps are product choices). Null handling: checked, nothing (every Alumni field is typed `| null` in `shared/types/alumni.types.ts` and the helpers accept null). Unsafe links: LinkedIn and photo are https/http only with `noopener`; mailto is CORR-001. Backend contract: checked, nothing (the nine keys, `field` included, are all in `UPDATABLE_FIELDS`; null is accepted for all but `mentorship_available`, which is always a boolean).

### CORR-001: The `mailto:` address is built from the raw email

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `frontend/src/pages/AlumniProfilePage/AlumniProfilePage.tsx:173` and `:232` |
| Category | security |

**What:** `href={`mailto:${email}`}` uses the stored email as is; the server accepts any non-empty string as an email at sign-up (`UserController.ts:62`), so an email like `a@b.co?cc=x@y.z&body=...` is possible.
**Why it matters:** A visitor who clicks "Email Name" on that profile gets a mail draft with a copy-to address and text chosen by the profile owner. It needs a click and the draft is visible before sending, so it is low impact. It is not script injection (the `mailto:` prefix is fixed).
**Recommendation:** Build the link in one helper in `lib/alumniDisplay.ts` that returns null unless the email passes the sign-up shape (`validateEmail`) and has no `?`, `&`, `#`, `%`, or else encode it; use it in both places.

### CORR-002: A page click can send a waiting search to the wrong page

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `frontend/src/pages/DirectoryPage/DirectoryPage.tsx:132-138, 161-163` |
| Category | logic |

**What:** `handlePageChange` goes through `writeControl`, which sends a search still waiting for its timer together with the new page number.
**Why it matters:** If the user types and clicks "Next" within 300 ms, the new search text is written with `page=N`, not page 1, so the result can be empty or past the end (then the clamp moves it). The filter handlers do reset the page; only paging does not.
**Recommendation:** In `writeControl`, when `pending` is not null and differs from `base.q`, set `page: 1` unless the patch sets it for a filter.

### CORR-003: The past-the-end fix runs once per address and can leave an endless skeleton

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `frontend/src/pages/DirectoryPage/DirectoryPage.tsx:98, 221-226` |
| Category | logic |

**What:** `clampedKey` remembers the last address that was moved. If the same address (for example `?page=4`) is past the end a second time while the page stays mounted, nothing moves it and `pastTheEnd` keeps the view on "loading".
**Why it matters:** Needs a list that shrinks, a clamp, growth, a return to that page, and a shrink again, so it is rare. The result is a skeleton with no error and no Retry.
**Recommendation:** Clear `clampedKey.current` whenever `pastTheEnd` is false, so each new past-the-end episode gets its own fix.

### CORR-004: A profile page can show the last visit's error or "not found" for one frame

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `frontend/src/pages/AlumniProfilePage/AlumniProfilePage.tsx:88-92` |
| Category | logic |

**What:** `status` trusts `viewed` when `viewed.id === id`; the load that sets "loading" runs in an effect after the first paint. The same holds for the directory, whose old `ready` list for the same address shows until its effect runs.
**Why it matters:** Opening a profile again after a "not found" or an error shows that old state for a moment, then the skeleton, then the result. A returning visitor sees a flicker and a wrong message.
**Recommendation:** Keep the effect but treat the state as fresh only after this mount has asked: for example a `requested` ref or state set in the effect, with `status = "loading"` until then.

### CORR-005: Edits typed while a save is running are overwritten

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `frontend/src/components/profile/AlumniProfileCard/AlumniProfileCard.tsx:159-162, 1177` (the `setValues(alumniToForm(result.alumni))` line after the save) |
| Category | logic |

**What:** Only the button is busy; the fields stay editable. On success the form is reset to the saved answer, and `setMyAlumniAtom` also triggers the reset in render.
**Why it matters:** Text typed during the (slow) request is lost without notice. Same for the Account card (`setName`/`setPhotoUrl` after the save).
**Recommendation:** Disable the fields (or make the form `aria-busy` and read-only) while `busy`, or reset only fields that still equal what was sent.

### CORR-006: The alumni calls have no timeout

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `frontend/src/services/alumniService.ts:1-79`, `apiClient.ts` (`axios.create()` with no timeout) |
| Category | error-handling |

**What:** Only the logout call sets a timeout. A server that accepts the connection and never answers keeps the list, profile, My profile and the save on skeleton or busy forever.
**Why it matters:** There is no error state, so there is no "Try again"; the user must reload. A busy save button also never frees.
**Recommendation:** Set a default timeout (for example 15 s) in `apiClient.ts`; a timed-out call is already shown as "no answer" by `toApiFailure`.

(1 trivial not listed: the filter options are loaded once per session, so a department or field added by a save shows in the directory filters only after a reload.)

## Quality findings

**Summary.** No blocker. Naming, no barrels, camelCase files, `import type`, tokens-only CSS and the comments rule all hold. The library check runs green (282 passed) and has real expected values typed from the spec. Findings are duplication and one uncovered pure rule. Packet-gap: none.

### Q-1 `saveFailureText.ts` is a pure rule outside `lib/` and outside the check (WARN)
| Field | Value |
|---|---|
| File | frontend/src/components/profile/saveFailureText.ts |
| Rule | pattern 28 "one rule, one function in lib ... checked from the command line" |

`saveFailureReason` maps 403/404/409/500+/network to five reasons and has no case in `scripts/frontend-lib-check.ts`. It sits in `components/` only because it imports `ApiFailure` from the store; `loadFailure.ts` solved the same problem by declaring its own shape. Pattern 28 admits the exception but the rule it sets up (tested pure rules) is not met. Fix: declare the failure shape in lib, move the file, add ~8 cases (499, 500, 403, 404, 409, 400, network, conflict word missing).

### Q-2 The form skeleton CSS is copied, not composed (WARN)
| Field | Value |
|---|---|
| Files | AccountCard.module.css, AlumniProfileCard.module.css |
| Rule | spec promise: one copy of every shared rule |

`.card` and `.form` are byte-identical in both modules (flex column, `--space-5`); the rule `border-top: var(--border-line) solid var(--line); padding-top: var(--space-5)` is repeated as `.logOut` and `.actions`. Only `.heading` uses `composes`, so the file's own comment ("so the two cards cannot drift") holds for one rule of four. Also the heading composes across component folders (AlumniProfileCard depends on AccountCard's CSS file); a shared `profile/ProfileCard.module.css` would be the owner of it.

### Q-3 Form wiring repeated between the two cards (NOTE)
| Field | Value |
|---|---|
| Files | AccountCard.tsx 133-170, AlumniProfileCard.tsx 139-175 |
| Rule | duplication |

Both `handleSubmit` functions repeat: preventDefault, `sending.current` guard, validate, focus first bad field, set busy, await, reset flags, toast or `setFormError(saveFailureText(...))`. The skeleton/ErrorState/form branch ("loading, error, ready") is also written twice. Acceptable for two uses; a third form (part 3) should trigger a `useSaveForm` hook. Same shape of local `NO_ERRORS` constant in both.

### Q-4 Weak or non-failing cases in the library check (NOTE)
| Field | Value |
|---|---|
| File | scripts/frontend-lib-check.ts lines 523-527, 161 |

"dir write: the same query gives the same text" compares the function with itself (a copy of the object); it can only fail for a non-deterministic writer. Line 161 checks the test fixture, not the code (useful, but it counts as a case, so "282 cases" in patterns doc line 437 overstates coverage by two). Not covered: `isWebLink` directly, `tooLongMessage`/`graduationYearRangeMessage` (only through validators, fine), `saveFailureText` (Q-1), `createLatestRequest` (not in lib; doc admits stores are checked by throwaway scripts).

### Q-5 Hardcoded numbers in CSS comments and the 767.98px breakpoint (NOTE)
| Field | Value |
|---|---|
| Files | AccountCard.module.css:8, ProfileBand.module.css:18-21, DirectoryPage.module.css:17, MyProfilePage.module.css:6 |
| Rule | Comments: stale-prone; Frontend: no hardcoded values |

Comments quote "24px", "44px", "16px/8px", "320px" next to token use; they go stale when a token changes. `@media (max-width: 767.98px)` is now typed in 13 files (new: DirectoryFilters, ProfileBand, AlumniProfilePage, MyProfilePage), and `config/layout.ts` has the same value for JS. CSS cannot read a token in a media query, so this is a known limit; but nothing guards the copies (the style check could grep for any other literal).

### Q-6 Docs (NOTE)
| Field | Value |
|---|---|
| File | docs/frontend-patterns.md |

Sections 23 to 28: every path I opened exists (`setProfileUserAtom`, `isCancelled`, `resetAlumniAtom` with four loaders, the Contents links) and the "282 cases" count is true. Stale spots: heading "Files added in review round 1" and the intro line 3-5 still describe part 1 as the whole document; pattern 22 line 563 is fine. Pattern 28 says "three copies" but lists three plus the validators; fine. Frontend README: accurate (folders and commands match, `hooks/` and `icons/` exist).

### Q-7 Exports with no outside user (NOTE)
Value exports used only inside their own file: `DIRECTORY_FILTERS_BUTTON`, `MIN_GRADUATION_YEAR`, `GRADUATION_YEARS_AHEAD`, `MAX_LINK_LENGTH`, `tooLongMessage`, `graduationYearRangeMessage`, `EMAIL_*_MESSAGE` and friends (the older ones are part 1's pattern 16, deliberate). No unused text constants, no unused props, no TODO/console/inline styles/commented-out code found. `interface` and `type` are mixed for object shapes (`SaveFailureWords`, `RequestTicket` use `interface`; most props use `type`); conventions.md does not rule, so only a nit.

**Dispatch questions.** Can the check fail: yes, 282 distinct expectations typed from the spec; only Q-4 cases are tautological. One copy of each shared rule: lib helpers yes (presentText, loadFailureText, readProfileId); CSS and submit flow no (Q-2, Q-3).

## Architecture findings

Written by: architecture-reviewer (tier: balanced), dispatched sub-agent (retry run).

**Summary.** No critical or major finding. Checked: 14 layering import edges (grep over all of `frontend/src`), 6 store/service/atom files, 3 pages, 4 shared pieces, the 7 listed deviations, 6 ADRs, and the API controllers (`AlumniController`, `UserController`, `parsePaging`). Findings: 0 critical, 0 major, 5 minor, 2 trivial. Biggest: the layering rules for `lib/` and `store/` are kept today but only by habit, since style rule d guards the UI folders only (ARCH-001).
- Layering: pages and components import no axios or `services/`; `lib/` imports no React, services or store; only `store/` imports `services/` (plus `wireApi`). Clean.
- Contract: paged shape, `mentoring=true` only, `graduation_year` integer, `page`, `/me` 404 as "none", `PUT /api/users/:id` with name and photo only (no email), `PUT /api/alumni/:id` with all nine fields, 403/404 as "gone", 409 as reload: all match `backend/src/api`. Checked, nothing.
- ADR-03, 07, 11, 12, 13, 14: compliant (create only after a 404 from `/me`; `user_id` never sent; errors read by status only; CSS Modules on tokens; session reset on every user change). Checked, nothing.
- Unlisted deviations: ARCH-002 (deviation 2 is wider than listed), ARCH-006 (two files not in the blast radius, "five" vs seven). Packet-gap: none.

### ARCH-001: Layer rules for lib/ and store/ are not enforced by any check
| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `scripts/frontend-style-check.mjs:47` |
| Category | layering |
| Rule broken | ADR-13 (structure); `docs/frontend-patterns.md` pattern 1 and 28 |

**What:** Rule d scans `components/ pages/ routes/ hooks/ icons/` only. "lib has no React or services" and "store never imports components or pages" hold today (grep is clean) but nothing fails when they stop holding.
**Why it matters:** `loadFailure.ts:10` already copies `ApiFailure` by hand to dodge this rule, and `saveFailureText.ts:1` went the other way and imported the store type into `components/`. The next author has no signal which side is right.
**Recommendation:** Add rule k: files in `lib/` may not import `react`, `jotai`, `services/`, `store/`; files in `store/` may not import `components/` or `pages/`. Then move the failure shape to one place (see ARCH-003).

### ARCH-002: Search submit replaces the history entry, wider than deviation 2
| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `frontend/src/pages/DirectoryPage/DirectoryPage.tsx:133-140` |
| Category | pattern |
| Rule broken | spec choice 3 (every new filter state is an entry); architecture deviation 2 |

**What:** Deviation 2 says only typing replaces. `commitSearch` is also used by Enter and the Search button (`:247`) and always passes `replace: true`, so a deliberate search is not a Back step either.
**Why it matters:** The owner approved a narrower rule. A user who presses Search, opens a profile, and presses Back is fine (state is in the address), but Back from the results goes past the search, not to the previous search.
**Recommendation:** Pass `replace` from the caller: true for the timer, false for Enter and the Search button. Or add the wider wording to deviation 2 at the gate.

### ARCH-003: The failure shape is declared in three places, two rules sit outside lib/
| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `frontend/src/lib/loadFailure.ts:10`, `frontend/src/components/profile/saveFailureText.ts:1`, `frontend/src/services/apiError.ts:6` |
| Category | separation |
| Rule broken | pattern 28 (one rule, one function in lib); L-REQ-fs-004-2 |

**What:** `ApiFailure` (services), `LoadFailure` (lib, a hand copy) and an `ApiFailure` re-export through `store/alumniAtoms.ts:22` (used by the save rule). The HTTP status numbers 404, 409, 403, 500 are also written in `alumniAtoms.ts:87`, `alumniActions.ts:34` and `saveFailureText.ts:23-26`. Quality Q-1 covers the missing check cases; this is the structural cause.
**Why it matters:** A change to the failure shape compiles in `services/` but silently diverges in the lib copy (structural typing hides it).
**Recommendation:** Own the shape in `lib/` (e.g. `lib/failure.ts` with the status constants and `isNotFound`), make `services/apiError.ts` import it, and move `saveFailureText` beside `loadFailure`. Needs no ADR.

### ARCH-004: Directory page carries the address/timer/focus machinery; one component reads the store type
| Field | Value |
|---|---|
| Severity | minor |
| Effort | medium |
| File | `frontend/src/pages/DirectoryPage/DirectoryPage.tsx:63-218`, `frontend/src/components/alumni/DirectoryFilters/DirectoryFilters.tsx:29` |
| Category | separation |
| Rule broken | pattern 24; `hooks/` as the home of shared React logic (README) |

**What:** About 150 lines of debounce, "last committed" refs, clamp-to-last-page and focus flags sit in the page body, and none of it can reach the library check. `DirectoryFilters` calls itself "controlled" yet imports `FiltersState` from the store for one `status` union.
**Why it matters:** This is the most bug-prone code of the REQ (ADV-003, ADV-007) and the only copy of the pattern. A second searchable list (posts, part 3) would copy it.
**Recommendation:** Move the address and timer logic to `hooks/useDirectoryAddress.ts` returning `{ query, searchText, handlers }`; pass `optionsStatus` as a plain union typed in `DirectoryFilters`. Not needed before merge.

### ARCH-005: Same-key state is shown for one frame before its reload
| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `frontend/src/pages/DirectoryPage/DirectoryPage.tsx:207`, `frontend/src/pages/AlumniProfilePage/AlumniProfilePage.tsx:85` |
| Category | pattern |
| Rule broken | architecture "derives the status from the address" (ADV-007); AC9 (old results never shown as new) |

**What:** Both pages treat atom state as theirs when its key (`queryKey`, `id`) equals the address. After Back from a profile, or opening your own profile after saving it, the key matches, the old `ready` data renders, then the mount effect sets `loading` and the skeleton replaces it.
**Why it matters:** A flash of possibly stale data, then a skeleton, then data again. For a just-saved profile the first frame is the pre-save version. Scroll position of the list is lost too.
**Recommendation:** Either stop the reload when the key matches a `ready` state that is younger than a few seconds, or clear the viewed atom when `setMyAlumniAtom` stores a save (one line). Pick one and say it in pattern 23.

### ARCH-006: Doc drift against architecture.md (trivial)
| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `.adlc/specs/2026-10/fs/REQ-fs-005-frontend-directory-and-profiles/architecture.md` (Open questions) |
| Category | pattern |
| Rule broken | blast-radius completeness |

**What:** Open questions say "five deviations", the list has seven. `lib/loadFailure.ts` and `lib/profileId.ts` are built (and checked) but are not in the blast radius table; `components/ui/Link/Link.tsx` (`state` prop) is also missing from it, though the commit and CAND-017 record it. All three are small and correct.
**Recommendation:** Fix the count and add the three paths at wrap-up so the record matches the code.

### ARCH-007: Band slot leaves two soft contracts (trivial)
| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `frontend/src/components/shell/PageLayout/PageLayout.tsx:13-17`, `frontend/src/pages/AlumniProfilePage/AlumniProfilePage.tsx:101` |
| Category | separation |
| Rule broken | pattern 26 (the person band) |

**What:** The `band` slot works and `ProfileBand` really composes `Band` (`composes` for band, inner, heading, sub); the slot is shared by two pages. But "the band must hold the one h1" is a comment only, the heading is passed twice (to the layout and the band) in both pages, and the profile page reaches into the band with `querySelector("h1")` (CAND-024) because `ProfileBand` has no heading ref.
**Recommendation:** Give `ProfileBand` a `headingRef` prop when next edited; consider `PageLayout` taking `profile={...}` props instead of a free node. Do not change now.

**State placement.** Atoms hold the loaded data and statuses (directory, filters, viewed, mine, profile); component state holds form values, errors, the open panel and the typed search text. The address is the truth for the filters. This matches pattern 23-25. Checked, nothing. One note: the four `createLatestRequest()` instances in `alumniAtoms.ts:95-98` are module-level, not in the Jotai store, so a second store (a test, a Provider) would share tickets; harmless in this app.

**Shared pieces.** `latestRequest` (4 loaders), `ProfileBand` (2 pages), `saveFailureText` (2 cards), `alumniProfilePath`, `alumniDisplay`, `loadFailureText` (3 users), `readProfileId` are single copies. Not shared: the "department, class, field" tag list is built twice with the same filter (`AlumniCard.tsx:243-247`, `AlumniProfilePage.tsx:139-143`); a `lib/alumniDisplay` `profileTags(alumni)` would be the one copy (L-REQ-fs-002-3). Counted under ARCH-003's family, not a separate finding.

## Reflection findings

Written by: reflector (tier: balanced), dispatched sub-agent, retry run.

**Summary.** Checked 22 lessons (0 superseded), G01 to G50, 14 ADRs (all accepted), 3 concept pages, the frontend-app component page, ADR-13 layers by grep, and 28 existing candidates. Findings: 0 critical, 1 major (REFL-003, vault-stale), 4 minor (REFL-001 repeated-mistake, REFL-002 concept-drift, REFL-004 and REFL-005 vault-stale), 2 trivial (REFL-006 gotcha updates, REFL-007 candidates). The vault-stale ones are needs-decision for /wrapup, not a fix round. No ADR conflict. No gotcha ignored: G36, G37, G39, G48 and G49 are respected (checked, nothing); G42 is a known, documented choice. The biggest: "trimmed text or null" is written six times although `presentText` calls itself the one copy.
**Dispatch questions.** L-REQ-fs-002-3 shared piece: REFL-001. L-REQ-fs-004-1 router state: checked, nothing (`readDirectorySearch` never trusts the state; keeping it after a reload is wanted by AC17). L-REQ-fs-004-2 rule in lib: checked, nothing (`loadFailure.ts`, `profileId.ts`, `directoryQuery.ts` live in lib with cases; library check ran here: 282 passed). L-REQ-fs-004-3 to -7: checked, nothing (mock API on 3999, tracked-file check proof in check-notes, no module deleted). Doc drift: REFL-003 to REFL-006. Candidates file: REFL-007.

### REFL-001: "Trimmed text, or null" is written six times

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `frontend/src/store/alumniActions.ts:96`, `frontend/src/lib/alumniForm.ts:122`, `frontend/src/lib/alumniDisplay.ts:16`, `frontend/src/store/sessionActions.ts:116`, `Header.tsx:50`, `PhoneMenu.tsx:53` |
| Category | repeated-mistake |
| Vault reference | [[knowledge/lessons/LESSON-REQ-fs-002-3-new-helper-convert-every-sibling]], [[knowledge/lessons/LESSON-REQ-fs-004-2-one-rule-one-function-in-lib]], spec AC36 |

**What:** `presentText` (alumniDisplay.ts:13) says it is "the one copy of this rule", but `textOrNull` in alumniForm.ts does the same thing, and `.trim() || null` appears in `saveAccountAtom` (two lines), sign-up and the header name.
**Why it matters:** AC36 asked for no repeated block. The part 1 copies existed before, but this REQ added three more and the new helper's comment is now false. A later change to "what counts as empty" will miss one.
**Recommendation:** Move `presentText` to a small lib file (or have alumniForm.ts and alumniActions.ts import it); add one library-check case. Leave the part 1 copies for a note in wrapup if the owner wants this REQ small.

### REFL-002: Code comments cite "AC7" and "ADV-005" with no REQ id

| Field | Value |
|---|---|
| Severity | minor |
| Effort | medium |
| File | 75 comment lines under `frontend/src` (for example `DirectoryFilters.tsx:73`, `AlumniProfileCard.tsx:1156`); only 2 files name a REQ |
| Category | concept-drift |
| Vault reference | [[context/conventions]] (Comments, written in this REQ); `.adlc/CLAUDE.md` "Name a REQ by its ID" |

**What:** The new Comments rule allows a pointer such as `AC12`, but AC and ADV numbers repeat in every REQ, so "AC7" means nothing once REQ-fs-006 exists.
**Recommendation:** Decide at wrapup: amend the conventions line to "REQ-fs-005 AC7" (and add the REQ id to the existing comments only when a file is touched again), or accept it. The conventions page is still marked needs-verification, so this is the cheapest moment to fix the wording.

### REFL-003: frontend-app component page still describes part 1

| Field | Value |
|---|---|
| Severity | major (vault-stale) |
| Effort | small |
| File | `.adlc/knowledge/components/frontend-app.md:6,15-24,28,32` |
| Category | vault-stale |
| Vault reference | [[knowledge/components/frontend-app]] |

**What:** Status says REQ-fs-004 and "directory, profiles ... are being built pages". The pieces table lacks `components/alumni/`, `components/profile/`, `ProfileBand`, `alumniService`, `alumniAtoms`, `alumniActions`, `latestRequest`, `alumniForm`, `alumniDisplay`, `directoryQuery`, `directoryReturn`, `loadFailure`, `profileId`. "six being built pages" is now three (feed, dashboard, users). Checks line says 108 cases; it is 282 now. "Touched by" has no REQ-fs-005 row.
**Recommendation:** Needs-decision for /wrapup step 3: update those lines; add REQ-fs-005 to Touched by; link patterns 23 to 28.

### REFL-004: design-system.md component table has no row for the new components

| Field | Value |
|---|---|
| Severity | minor (vault-stale) |
| Effort | small |
| File | `.adlc/context/design-system.md:154,167,178` |
| Category | vault-stale |
| Vault reference | [[context/design-system]] (Components) |

**What:** The table says "Built in REQ-fs-004 ... every component here is shown on /dev/components". There is no row for AlumniCard, DirectoryFilters, ProfileBand, AccountCard, AlumniProfileCard, and the Avatar row has no `xl` size (120px, 96px on phone; `--avatar-xl`). The card avatar is 44px against the picture's 56px (deviation 3), which also belongs in the Notes.
**Recommendation:** Needs-decision at wrapup: add the rows and the Avatar sizes; update the "Built in" sentence.

### REFL-005: project-level text still says part 1 and "being built"

| Field | Value |
|---|---|
| Severity | minor (doc-stale) |
| Effort | small |
| File | `CLAUDE.md:47`, `.adlc/context/project-overview.md:43,91`, `docs/roadmap.md:17-18`, `.adlc/now.md:9` |
| Category | vault-stale |
| Vault reference | [[context/project-overview]]; root CLAUDE.md "Frontend" paragraph |

**What:** Root CLAUDE.md says part 1 is done and "the other pages are 'This page is being built' placeholders"; that is false for `/directory`, `/directory/:id`, `/profile`. project-overview says part 1 of 4 only. Roadmap F6 and F7 are "To do" (the convention says update at wrap-up, so this one is expected). `now.md` says nothing in flight.
**Recommendation:** Wrapup: reword CLAUDE.md:47 (parts 1 and 2 done; feed, dashboard, users still placeholders), project-overview lines 43 and 91, roadmap F6/F7 Done (REQ-fs-005), now.md.

### REFL-006: two gotchas have facts that changed

| Field | Value |
|---|---|
| Severity | minor (vault-stale) |
| Effort | small |
| File | `.adlc/knowledge/gotchas.md` G38 (Update 2026-10-07), G42 |
| Category | vault-stale |
| Vault reference | [[knowledge/gotchas#^g38|G38]], [[knowledge/gotchas#^g42|G42]] |

**What:** G38's update says the "kept for the legacy frontend" comments are stale and waiting for the owner; this REQ rewrote them (AC46, `shared/types/user.types.ts`, `shared/index.ts`; grep finds no "legacy" left). G42 says "don't show the email on a public-facing card without asking the owner"; the profile page now shows the email and an "Email <name>" link, as drawn, and the owner has not yet decided (open point 4).
**Recommendation:** Wrapup: add a one-line Update to G38 (comments fixed in REQ-fs-005; the two types are still there), and one to G42 (shown on `/directory/:id` Details and band; one row and one link to remove, `AlumniProfilePage.tsx:145,228`).

### REFL-007: lesson-candidates.md has 28 entries; about half are not lessons

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `lesson-candidates.md` |
| Category | vault-stale |
| Vault reference | [[knowledge/lesson-ledger]] |

**What:** Suggested verdicts for /wrapup, not edits. Discard (already fixed in code or already in `docs/frontend-patterns.md`): 015, 016, 018 (fixed: `profileId.ts`, `loadFailure.ts`, `presentText` exported), 002, 004, 014, 019, 020, 021, 022, 023, 024, 025. Merge: 008 and 009 into G39 as a one-line "frontend side"; 010 and 012 into one lesson (a cancel must also retire the ticket; a save must cancel its atom's load); 026, 027, 028 into G50; 001 as a new "Saw it in" line on L-REQ-fs-004-7. Promote to gotcha: 003 (axios adapter), 005 (token order), 006 and 007 (band tag and `composes`), 011 (CRLF). Promote to lesson: 013, 017. Several `file:line` refs are off by 10 to 25 lines (019, 020, 013); re-point them when promoting.
**Recommendation:** Keep at most 6 survivors. Duplicates found: none by number; 008 repeats part of G39.

## UI/UX findings

Written by: ui-reviewer (tier: balanced), dispatched sub-agent, retry run.

**Summary.** Ran the app against the mock API (never port 3000) in headless Chrome over its debugging socket. Checked the 3 pages in light and dark at 1280, 640 and 320 px (the last two stand in for 200% and 400% zoom, with device scale), reduced motion, a real Tab walk, the accessibility tree, tag contrast, validation, double click and a failed save. 0 critical, 1 major, 1 minor, 1 trivial. Biggest: "Save profile" and "Save account" are enabled on an untouched form and send a request that changes nothing (UI-001). No console errors; no sideways scroll anywhere; contrast of all tags 6.5 to 18:1.
**Implementer items (check-notes section 3).** 1, 2, 3: not re-run, steps are plausible from the code (typing replaces the entry; a replaced card loses focus). 4: confirmed on screen (only "LinkedIn link" says optional). 5 (extra list call): not reproduced.
**Dispatch questions.** 200% zoom and 360 px: checked, nothing (no overflow; phone layout takes over at 640). Reduced motion: checked, nothing (skeleton is deliberately still, base.css kills animation and transition). Forced themes: checked, nothing. Keyboard: checked, nothing (order matches the screen, ring is 3px gold; Filters panel opens in reading order; Escape does not close it, trivial). Names in the accessibility tree: checked, nothing ("View profile of Nadia Rahman", year field has aria-invalid and aria-describedby to its error). Admin tag on the band: UI-002.

### UI-001: Save buttons are live on a pristine form and send a no-change request

| Field | Value |
|---|---|
| Severity | major (by the dirty-state rule; the spec is silent, owner may downgrade) |
| Effort | small |
| Route / flow | `/profile` — "Save profile", "Save account" |
| Lens | interaction-state |
| Evidence | Opened `/profile`, clicked Save profile without typing: mock log shows `PUT /api/alumni/1`; button not disabled, no aria-disabled. Toast "Profile saved" shown for a save that changed nothing. |

**What:** Both save buttons are enabled when the values equal what was loaded, and a click sends a PUT and shows a success toast. AC27 and AC29 never ask for a dirty guard.
**Why it matters:** A pointless write bumps `updated_at` and tells the user something was saved when nothing changed. "Discard changes" is also live with nothing to discard.
**Recommendation:** Compare values to the last saved ones in `AlumniProfileCard.tsx` and `AccountCard.tsx`; keep the buttons enabled only when changed (use `aria-disabled` plus a guard in submit, so keyboard users still find the button), or record in the spec that always-enabled is the choice.

### UI-002: Light-theme "Admin" tag in the band looks like plain text

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| Route / flow | `/profile` as admin, light theme, band |
| Lens | design-match |
| Evidence | `ui-evidence/review/r2-my-admin-light-1280.png` (band) against `r2-my-save-failed-light.png` (Alumni tag, gold) |

**What:** The admin tag uses the action colour (#161616), the same as the band, so the band shows the word "Admin" with no box. Contrast is fine (18:1) and the word is there, but the tag shape is lost; dark theme shows a light box as intended. The Account card shows the same tag as a black box, so the two disagree.
**Recommendation:** Give the band's role tag a 1.5px `--band-text` outline (or a lighter fill) in `ProfileBand` for the admin role, light theme only.

### UI-003: Escape does not close the phone Filters panel (trivial)

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| Route / flow | `/directory` at 360 px, Filters open |
| Lens | a11y |
| Evidence | Esc with focus on Filters: `aria-expanded` stays true. |

**What:** Not required by an AC; the Filters button toggles and the Tab order is right (Filters, Search, selects, checkbox, cards). Mention only.

**UI review tier:** headless (Chrome DevTools socket, mock API) — directory, alumni profile and My profile (alumni, admin) at 1280/640/360/320, both themes; 32 screenshots in `ui-evidence/review/`; 0 critical / 1 major / 1 minor (1 trivial). Mock, Vite and Chrome stopped by PID; ports 3999, 5199, 9333 free.

## Round 2 — Quality findings

Written by: quality-reviewer (tier: balanced), dispatched sub-agent, round 2.

**Summary.** Ran the checks myself: build passes, style check 144 files with rules a to k all 0, library check 326 passed, 0 failed. Q-1 and Q-2 resolved; Q-3 partly; Q-6 partly (3 stale spots left); Q-7 clean (the new exports all have users; `saveFailureText.ts` is gone and nothing references it). New: 0 critical, 0 major, 4 minor, 1 trivial. Biggest: 18 code comments cite review finding ids (CORR-004, UI-001) that mean nothing once the log is archived (R2-1). Packet-gap: none.

**Round-1 status.** Q-1 resolved: `lib/saveFailure.ts:1-55`, with the shape and status numbers in `lib/loadFailure.ts:12-22`; 12 save cases at `scripts/frontend-lib-check.ts:657-676`, expected words typed by hand (the words are the reason names, so a wrong pick fails). Q-2 resolved: `.card`, `.form`, `.ruled`, `.heading` are owned once in `AccountCard.module.css` and composed at `AlumniProfileCard.module.css:7,17,28,54` and `AccountCard.module.css:58` (the cross-folder composes remains, as a note). Q-3 partly: see R2-3. Q-4: unchanged, not re-reported; the new cases (mailto, same form, same text) all compare to typed values and none compares a function with itself. Q-6: pattern 28 and the rule list a to k match the code (paths exist); three stale spots, R2-4. One copy of "trimmed text or null": yes, `presentText` at `lib/alumniDisplay.ts:13`; grep finds no `.trim() ||` and no `textOrNull`; the remaining `.trim()` calls are emails, search text and photo links (not the null rule).

### R2-1: Review finding ids written into 18 code comments
| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `AccountCard.tsx:160,191`, `AlumniProfileCard.tsx:118,130`, `alumniAtoms.ts:237,248,259`, `DirectoryPage.tsx:126,202,224`, `AlumniProfilePage.tsx:87,155`, `MyProfilePage.tsx:36`, `lib/alumniForm.ts:126`, `lib/mailtoLink.ts:3`, `ProfileBand.module.css:76`, `frontend-lib-check.ts:632,657` |
| Category | convention |
| Rule | conventions.md Comments (a pointer must outlive the work); same family as REFL-002 |

**What:** Fix-round comments end in `(CORR-005)`, `(UI-001)`, `(CORR-004, ARCH-005)`. These ids live only in this REQ's review-log and carry no REQ number.
**Why it matters:** Once the REQ is archived the pointer leads nowhere; the sentence before it already says why, so the id adds nothing.
**Recommendation:** Delete the parenthesised ids, or write `REQ-fs-005 CORR-005`. Decide together with REFL-002.

### R2-2: `mailtoHref` checks the same thing three times
| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `frontend/src/lib/mailtoLink.ts:21-35`, `AlumniProfilePage.tsx:241-243` |
| Category | duplication |

**What:** The function tests length, then `validateEmail`, then `PLAIN_ADDRESS`; the regex alone already rejects almost everything the other two do. The page then branches three times on `email` and `emailHref` (none, link, text).
**Why it matters:** Three overlapping rules drift: if `validateEmail` changes, the reader cannot tell which one is the real gate. The 19 cases pass either way.
**Recommendation:** Keep the length cap and the regex, drop the `validateEmail` call (or say in a comment why both). In the page use one branch: link when `emailHref` is not null, else the email text or "Not given".

### R2-3: The two cards solve the same two problems in two different ways
| Field | Value |
|---|---|
| Severity | minor |
| Effort | medium |
| File | `AccountCard.tsx:211-219,298-309` against `AlumniProfileCard.tsx:98-118,139-149,205-216` |
| Category | duplication |

**What:** "Keep what the user typed during a save" is a `latest` ref plus an updater compare in the Account card, and a `sent` state plus an in-render reset check in the Alumni card. "Move focus off a button about to switch off" is inline in one and `keepFocusFrom` in the other; `handleRetryLoad` and the `headingRef` with `tabIndex={-1}` are written twice.
**Why it matters:** Q-3 said a third form should trigger a hook; the fix round added about 50 lines that a hook would hold, and a fix to one mechanism will miss the other.
**Recommendation:** Not before merge. Say in pattern 24 or 28 that the two differ on purpose, or extract one `useFocusHeading()` (heading ref, retry, keep-focus) now and the saved-values rule at part 3.

### R2-4: Docs still say what the fix round changed
| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `docs/frontend-patterns.md:438`, `:738`, the "Part 2: the Try again buttons" Open-points bullet |
| Category | documentation |

**What:** Line 438 says "282 cases after part 2" (now 326). The heading "Files added in review round 1" lists part 1 files only. The open point that "Try again" focus falls to the page was fixed (m16: `AccountCard.tsx:185-190`). Nothing documents the new "Save is off until a value differs" rule, the focus hand-off to the card heading, or the `mailtoHref` helper.
**Why it matters:** The patterns doc is the owner's guide; a fixed gap listed as open misleads the next author.
**Recommendation:** Update or drop the count, rename the heading, delete the fixed open point, add one short paragraph for the changed-form rule and `lib/mailtoLink.ts`.

### R2-5: Library check imports sit in the middle of the file (trivial)
| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `scripts/frontend-lib-check.ts:659-663` |
| Category | convention |

**What:** Three `import` lines sit under a comment ("Imports are hoisted...") although the other lib imports are at the top (lines 37-45).
**Recommendation:** Move them into the top import block; the cases stay where they are.

**Dispatch questions.** Conventions in the diff: checked, nothing (no barrels, `import type` used, camelCase files; the new CSS uses tokens only, the `.tag` override uses `--band-text` and `--band`). Dead code: checked, nothing (old `saveFailureText.ts` deleted and unreferenced; every new export has a user; each `clear...Atom` is used by one page). Page words in `config/text.ts`: checked, nothing. Status numbers: checked, nothing (written once in `loadFailure.ts`; other hits are comments). Pattern 23 text against code: matches. Rule list a to k: matches `frontend-style-check.mjs`. Focus hand-off, the updater compare and the clear on unmount have no automated case (the doc already admits this for stores).


## Round 2 — Reflection findings

Written by: reflector (tier: balanced), dispatched sub-agent, round 2.

**Summary.** Checked the fix round against 22 lessons (0 superseded), G48/G49 and the other store/shell gotchas, 14 accepted ADRs, pattern 1/3/9/23/25/28 of `docs/frontend-patterns.md`, and ran both checks here (style check passes, library check 326 passed). Findings: 0 critical, 0 major, 3 minor (REFL-008 to REFL-010), 1 trivial (not listed in full). No ADR conflict. REFL-001, 002 to 007 are not re-reported (003 to 005 and 002 stay open for wrapup on purpose). Biggest: the two My profile cards solve "keep what was typed, move focus, same-values" twice with different code (REFL-008).
**Dispatch questions.** REFL-001 (one definition): yes. `presentText` (`lib/alumniDisplay.ts:17`) is the only "trim, empty is null" rule; alumniForm, alumniActions, sessionActions, Header and PhoneMenu all call it and each means the same as the old `trim() || null` (sessionActions also covers undefined, as `?.` did). Left on purpose and different in meaning: `SignUpPage.tsx:124` (empty means "leave the key out", not null), `Avatar.tsx:24`, `initials.ts:13`, `directoryQuery.ts:73`, `validation.ts` (checks, not presents). Checked, nothing. L-REQ-fs-004-7: no leftover of `components/profile/saveFailureText` or `LoadFailure` in the repo or in `.adlc` outside specs and knowledge (grep run); nothing in `knowledge/` names them either. L-REQ-fs-004-6 rule k: reads the right files (`rel` from `frontend/src`, `lib/` prefix, all script files, multi-line `from` matched); can fail (TASK-006 records a planted-file proof, 4 hits). Gap: REFL-010. G48: the three clear atoms run in effect cleanups; StrictMode runs the load effects again after the cleanup, so checked, nothing. G49 / L-REQ-fs-004-1: checked, nothing. Pattern 23 matches the code (three clear atoms, My profile clears only on close). Rule list a to k matches the script. Patterns 25 and 28 lag: REFL-009.

### REFL-008: The two My profile cards each build the same three behaviours their own way

| Field | Value |
|---|---|
| Severity | minor |
| Effort | medium |
| File | `AccountCard.tsx:140-146,203-211`, `AlumniProfileCard.tsx:100-130,165-170` |
| Category | re-derivation |
| Vault reference | [[knowledge/lessons/LESSON-REQ-fs-002-3-new-helper-convert-every-sibling]], [[knowledge/lessons/LESSON-REQ-fs-004-2-one-rule-one-function-in-lib]] |

**What:** (1) Keep newer typing: Account uses functional `setState` plus a `latest` ref; Alumni uses a `sent` state plus a render-time reset plus a `latestValues` ref. (2) Focus to the heading: `handleRetryLoad` is written twice, the focus move once inline and once as `keepFocusFrom`. (3) Same-values: Alumni has `sameAlumniForm` in `lib/` (with cases); Account compares two fields inline with `sameText`, no lib function and no case.
**Why it matters:** Same rules, two shapes: the next form (feed post, users edit) copies one of them, and a fix to one card will not reach the other (the round-1 M1 and m5 bugs were exactly this).
**Recommendation:** Add `sameAccountForm(a, b)` beside `sameAlumniForm` with cases. Optional: one small hook for "heading takes focus" used by both cards. Leave the two keep-typing mechanisms if the owner accepts them, but say so in pattern 25.

### REFL-009: Patterns 25 and 28 do not describe the fix round

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `docs/frontend-patterns.md:621-643`, `:683-698` |
| Category | concept-drift |
| Vault reference | pattern 25 and 28 of `docs/frontend-patterns.md`; [[knowledge/lessons/LESSON-REQ-fs-004-2-one-rule-one-function-in-lib]] |

**What:** Pattern 25 still says the values "are reset in place" with no condition; the code now resets only if the form still holds what was sent, keeps Save and Discard off until a value differs (UI-001), and moves focus to the heading before a button is switched off. Pattern 28 says "three copies" and lists `presentText`, `loadFailureText`, `readProfileId`; it omits `sameText`, `sameAlumniForm`, `saveFailureText` and the `HTTP_*` status constants.
**Why it matters:** A reader building the next form will not learn the same-values and keep-typing rules from the doc. This is the doc item for wrapup step 1 (not a fix round).
**Recommendation:** Add three sentences to pattern 25 and extend the pattern 28 list. Pattern 23, 9, 1, 3 and the rule list are correct.

### REFL-010: Status number and layer rule copies remain

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `store/alumniAtoms.ts:87`, `scripts/frontend-style-check.mjs:53-54` |
| Category | repeated-mistake |
| Vault reference | [[knowledge/lessons/LESSON-REQ-fs-002-3-new-helper-convert-every-sibling]] |

**What:** The fix round moved 403/404/409/500 into `lib/loadFailure.ts` and converted `alumniActions.ts` (409), but `alumniAtoms.ts:87` still declares `const NOT_FOUND = 404`, the same value as `HTTP_NOT_FOUND`; `HTTP_*` are also parked in a file named for loads. Rule k bans react, react-dom, react-router-dom, `services/`, `store/`, but not `jotai`, `axios`, `hooks/`, `components/`, `pages/` from `lib/` (none do it now: grep run).
**Why it matters:** One sibling of the new constants was missed in the same change; the check guards the layer only partly while pattern 1 says "lib knows nothing about React or the browser".
**Recommendation:** Import `HTTP_NOT_FOUND` in `alumniAtoms.ts` and delete the local. Add `jotai`, `axios` and the UI/store folders to rule k's lists (one line each), or word pattern 1 to match.

(1 trivial not listed: `resetAlumniAtom` repeats the bodies of the three clear atoms; it could call them.)


## Round 2 — Architecture findings

Written by: architecture-reviewer (tier: balanced), dispatched sub-agent, round 2.

**Summary.** Checked: every import edge of the 21 round-2 files (grep), rule k in `scripts/frontend-style-check.mjs`, the 3 clear actions and all their readers, the composes edges, ADR-14 and architecture.md. New: 0 critical, 0 major, 2 minor, 1 trivial (ARCH-008 to ARCH-010). No layering regression: `lib/` imports only `config/`, `@alumni/shared` (type) and itself; no page or component imports `services/` or `axios`; `services/` and `lib/` import no `store/`; only `store/` imports `services/`.
- ARCH-001 (rule k): **partly resolved**. `scripts/frontend-style-check.mjs:51-53,339-348` blocks `react`, `react-dom`, `react-router-dom` and relative `services/` or `store/` from `lib/`. Pattern 1 (`docs/frontend-patterns.md:57`) says more: "services knows nothing about the store", and `lib/` is the bottom layer. Still unchecked: `lib/` importing `components/`, `pages/`, `hooks/`, `routes/` or `jotai`; `services/` importing `store/`; `store/` importing `components/` or `pages/`. Fix: widen `LIB_BANNED_FOLDER` and `LIB_BANNED_PACKAGES` (add `jotai`, `axios`), add a rule for `services/` to `store/`.
- ARCH-003 (failure rules in `lib/`): **partly resolved**. The save rule is now in `lib/saveFailure.ts:32-48` (resolved) and both failure rules read one `CallFailure` (`lib/loadFailure.ts:12`). But `services/apiError.ts:5` still declares the same shape by hand, so two copies remain (was three), and the shape plus the status numbers (`lib/loadFailure.ts:14-18`) sit in a file named for load words; `store/alumniActions.ts:6` imports `HTTP_CONFLICT` from it. Fix: move shape and numbers to `lib/failure.ts`, let `services/apiError.ts` import the type.
- ARCH-005 (stale same-key state): **resolved**. The clears run at `DirectoryPage.tsx:203`, `AlumniProfilePage.tsx:88`, `MyProfilePage.tsx:37`; the atom is idle before the next mount, so no frame shows old data. StrictMode's simulated unmount clears and the effects then reload; checked, nothing.
- Clear on close vs ADR-14 and the session reset: consistent. ADR-14 is about storage; `resetAlumniAtom` (user change) and the clears (page close) are two lifecycles on the same atoms and both end at idle with the call cancelled. `filtersAtom` is rightly kept (address-independent). Readers of `myAlumniAtom` are `MyProfilePage` and `AlumniProfileCard` only (grep), both inside the page that clears it; the header and phone menu read `profileAtom`, which is not cleared. The band's public link is safe. Checked, nothing, apart from ARCH-010.
- Composes (Q-2): see ARCH-009. Unlisted deviation: Save and Discard are now disabled until a value changes (UI-001); it is not in architecture.md's deviation list (line 182). It follows a review finding, so list it for the gate.

### ARCH-008: Two different ways to keep typed text across a save
| Field | Value |
|---|---|
| Severity | minor |
| Effort | medium |
| File | `AccountCard.tsx:265-269,316-324`, `AlumniProfileCard.tsx:595-620,700` (packet lines) |
| Category | pattern |
| Rule broken | pattern 8 (one rule, one function in `lib/`); L-REQ-fs-002-3 (convert every sibling) |

**What:** The Account card keeps a `latest` ref plus a functional `setName((cur) => same ? saved : cur)` after the await. The Alumni card keeps `sent` state, a `latestValues` ref, a render-phase reset against `filledFrom`, and the same-values test. Same rule (CORR-005), two mechanisms.
**Why it matters:** The next form (post composer, part 3) will copy one of them; the two will drift, and neither can reach the library check because both live in components.
**Recommendation:** Pick one shape and put the decision ("reset a field only if it still holds what was sent") in `lib/` as a pure function used by both. A shared hook is optional.

### ARCH-009: Alumni card styles depend on a sibling card's file
| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `AlumniProfileCard.module.css:7,17,28,54` |
| Category | separation |
| Rule broken | ADR-13 (shared blocks in a shared place); precedent `ProfileBand.module.css:9` composes from `Band`, a shared shell piece |

**What:** Four blocks (`card`, `heading`, `form`, `ruled`) are owned by `AccountCard.module.css`, and the Alumni card composes from it. Renaming a class there breaks the other card, and a missing composes name is not always a build error.
**Why it matters:** Q-2 is fixed, but the owner is one of the two users, not a shared file. Part 3 forms will compose from "AccountCard" too.
**Recommendation:** Move the four blocks to `components/profile/profileCard.module.css` and compose both cards from it. Not needed before merge.

### ARCH-010: Clear on close can be undone by a save still running (trivial)
| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `store/alumniAtoms.ts:229-264`, `store/alumniActions.ts:76-79` |
| Category | pattern |
| Rule broken | the clear actions' own comment (next visit starts from idle) |

**What:** `clearMyAlumniAtom` cancels the loader, but a save that ends after the page closed still runs `setMyAlumniAtom` and puts `ready` back. The data is the saved profile, so it is correct, only not idle. Also architecture.md still gives "kept when the user comes back" as the reason for the store; pattern 23 was reworded, the architecture file was not.
**Recommendation:** Accept and say so in pattern 23, or skip `setMyAlumniAtom` when the page is closed. Fix the architecture.md sentence at wrap-up.

## Round 2 — Correctness findings

Written by: correctness-reviewer (tier: balanced), dispatched sub-agent, round 2.

**Summary.** Re-read the fix-round diff and the new files (`mailtoLink.ts`, `saveFailure.ts`), plus `AlumniController.ts`, `UserController.ts`, `errorMiddleware.ts`, `latestRequest.ts`, `Button.tsx`, `useFormError.ts`. CORR-001 to CORR-005 are all resolved; CORR-006 left as needs-decision. New: 0 critical, 0 major, 2 minor, 1 trivial. Biggest: Save stays off on an empty new profile, so AC24 ("Save profile creates the profile") cannot be done from the empty form (R2-001). Packet-gap: none.

**Round-1 items.**
- CORR-001 resolved: `lib/mailtoLink.ts:15-34` returns null unless the email passes `validateEmail`, a plain-address pattern and the length cap, and encodes both halves; used at `AlumniProfilePage.tsx:1604` (band) and `:1652-1695` (Details row shows text, not a link). A valid but unusual address (an apostrophe, a non-ASCII domain) is now text only, which is the safe side.
- CORR-002 resolved: `DirectoryPage.tsx` `writeControl` forces `page: 1` when the waiting text differs from the address (typed-then-reverted text does not count). Checked, nothing wrong.
- CORR-003 resolved: the mark is cleared whenever `pastTheEnd` is false and set only if `writeAddress` really wrote. The write-then-render gap is covered (the mark is set before the next render); no loop, since a `false` write sets no state.
- CORR-004 resolved for Back, forward and a new visit: the three pages clear on unmount, so the next mount starts at idle. StrictMode: the simulated unmount runs all cleanups first, then all effects again, so each page's load effect re-runs after the clear. Unmount while a request runs: `cancel()` bumps the ticket, and the loaders drop the late answer without setting an error.
- CORR-005 resolved in both cards: a field is reset only if it still holds what was sent (`AccountCard.tsx:307-324`; `AlumniProfileCard.tsx:610-620`, `:700`).

**Dispatch questions.** Disabled-Save logic (same-values rule, spaces, dirty-again, failed save, Discard): R2-001, R2-002; the rest checked, nothing (a save that returns a trimmed value makes the form clean again; typed-more keeps Save on; a failed save keeps the values and Save on). Typing during a save: checked, nothing (store answer arrives while `busy` is still true, so the button is not yet disabled when the focus check runs; the order is right). mailtoHref: checked, nothing. Debounce/page/clamp: checked, nothing. Clear atoms: checked, nothing beyond the save-after-close point already in the architecture section. Focus after save and Try again: checked, nothing (heading has `tabIndex=-1`, and focus moves before the button is switched off). saveFailure/loadFailure vs backend: checked, nothing (400 validation, 403 not owner or not self, 404 not found, 409 unique or exists, 5xx; all land on the intended reason; 401 never reaches a card).

### R2-001: A new alumnus cannot create a profile from the empty form

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `frontend/src/components/profile/AlumniProfileCard/AlumniProfileCard.tsx:624, 671, 813` |
| Category | logic |

**What:** With no profile yet, the form equals `alumniToForm(null)`, so `changed` is false: "Save profile" is off and `handleSubmit` returns early.
**Why it matters:** AC24 says Save on the empty form creates the profile. Now the user must type something or tick mentoring first, and the off button gives no reason. Whether an empty profile is wanted is a product call (the directory would list a blank card).
**Recommendation:** Needs-decision. Either keep it and note it in the spec as a deviation, or make `changed` true when `mine.status === "none"` so the first create is always allowed.

### R2-002: "Discard changes" works while a save is running and is silently undone

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `frontend/src/components/profile/AlumniProfileCard/AlumniProfileCard.tsx:715-721, 818` |
| Category | concurrency |

**What:** Discard is enabled whenever the form differs (`disabled={!changed}`), also while `busy`. It resets the values and calls `setSent(null)`; the running save then lands and the render-time reset (`:615`, `sent === null`) fills the form with what was sent.
**Why it matters:** The user sees their text vanish, then reappear as saved with "Profile saved". The request cannot be cancelled, so the discard did nothing, and the form changed twice.
**Recommendation:** Add `|| busy` to the Discard button's `disabled` (use `aria-disabled` or keep focus handling as in `keepFocusFrom`).

### R2-003: Stale messages cannot be cleared when the form is clean (trivial)

**What:** Save and Discard are both off when the form equals the saved one. A card-level failure message (after typing back to the saved values) and field errors from stored data over the limits (ADV-008) then stay until a field is edited. Cosmetic; `AlumniProfileCard.tsx:624`.

## Round 2 — UI/UX findings

Written by: ui-reviewer (tier: balanced)

**Summary.** Re-checked in headless Chrome against the mock API (port 3999), never the real server. All round-1 UI items I was asked to re-verify are fixed. M1/UI-001: Save profile, Discard changes and Save account are really disabled (the `disabled` attribute) on an untouched form, enabled by a change, disabled again after a save, after Discard, and when the typed value is put back by hand. Zero PUT/POST requests from a click or Enter on a pristine form. UI-002 (Admin tag) is fixed in light and dark. m16, m4, m5, m2, m3, m1 all pass. 3 pages x 2 widths x 2 themes: no horizontal overflow, no console errors. 0 critical, 0 major, 1 minor, 1 trivial new.

**Dispatch answers (one line each)**
- M1 keyboard: after a save with nothing left changed, focus moves to the card heading (Alumni profile or Account); after Discard it also moves to the heading. Tab from there reaches the first field of the form, so the keyboard user is not trapped. Disabled buttons are skipped by Tab, as expected. Checked, nothing wrong.
- Screen reader: a disabled button is announced as unavailable, but nothing says why. See R2-UI-001.
- UI-002: Admin tag is a white chip on the dark band (light theme) and a cream chip on the grey band (dark theme), 55x26 px, 2px radius, text clearly readable (about 15:1 or better by eye and colour values). Same shape as the other role tags. Screenshots `r2-myprofile-admin-1280-light.png`, `...-1280-dark.png`, `...-360-light.png`, `...-360-dark.png`. Checked, nothing.
- m16: Try again on each load error moves focus to that card's heading, with a ring that hugs the words (`r2-myprofile-after-retry-focus.png`). Works whether the retry fails again or succeeds. Checked, nothing.
- m4: with an 800 ms delay, directory to My profile to directory, directory to profile 2 to Back, directory to profile 3, a not-found profile to My profile, and a failed list then a good one: no old list, error or not-found text appears under the new address. Only a one-frame empty main while the page mounts (about 10 ms). Checked, nothing.
- m5: typing during a 1.5 s save is kept on both cards (Full name "First Name plus", Job title "AlphaBeta", Department "Physics"), Save stays enabled for the newer text, Discard goes back to the saved values. Double click on Save sends one PUT. Checked, nothing.
- m2: typing "Er" then clicking Next within 300 ms sends one request `?q=Er` (page 1), not page 3. m3: `?page=999` goes to page 3 with cards, no stuck skeleton, also the second time and with a search. Checked, nothing.
- m1: email `a@b.co?cc=x@y.z` and `a b@c.d` show as plain text with no link; `person5@example.com` shows the Email button and a mailto link. Checked, nothing.
- 500 on save: message gets focus, Save stays enabled, retry succeeds and the message goes away. Checked, nothing.
- UI-003 left alone as asked.

### R2-UI-001: Disabled Save and Discard give no reason

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| Route / flow | `/profile`, both cards, untouched form |
| Lens | a11y |
| Evidence | `ui-evidence/review/r2-myprofile-pristine-1280-light.png`; DOM: `<button type="submit" disabled>Save profile</button>`, no `aria-describedby` |

**What:** The three buttons are natively disabled, so they are skipped by Tab and read as "unavailable". Nothing near them says "No changes to save".
**Why it matters:** A screen reader user (or anyone who lands on a form and sees a dimmed button) cannot tell if the form is broken or just unchanged. Not a blocker: the state is correct and conveyed.
**Recommendation:** Optional. Add a short hint under or beside the button row ("No changes to save", `aria-live` off, linked by `aria-describedby`), or accept as is and note it in the patterns doc.

### R2-UI-002: Focus drops to the page if the user undoes the edit by hand while Save has focus

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| Route / flow | `/profile`, Alumni profile card |
| Lens | a11y |
| Evidence | script check: Save focused, typed value changed back to the saved one, `document.activeElement` became body |

**What:** The code moves focus to the heading only after a save and after Discard. Retyping the saved value while the button has focus (rare: Save is reached by Tab, so the user is not typing) makes the button disabled under focus and Chrome drops focus to the body.
**Recommendation:** Leave it, or call `keepFocusFrom` in an effect when `changed` turns false. Low value.

(0 other trivials. The sampled one-frame empty main on route change is not listed as a finding.)

**UI review tier:** headless (Chrome via DevTools protocol, mock API, Vite on a scratch config) — `/directory`, `/directory/:id`, `/profile` at 1280 and 360, light and dark, admin, alumni, student, new-alumni users; 55 r2-prefixed screenshots in `ui-evidence/review/`; 0 critical / 0 major / 1 minor (+1 trivial).


## Round 2 — Correctness re-check (batch F)

**Summary:** R2-001 resolved, R2-002 resolved. One new minor (focus lost after a 409 on create), one test-quality note. Enter on a pristine existing profile sends nothing. 0 critical / 0 major / 1 minor.

### R2-001 — resolved
`lib/alumniForm.ts` canSaveAlumniForm (`isNew || !sameAlumniForm`), wired in `AlumniProfileCard.tsx` as `canSave = canSaveAlumniForm(mine.status === "none", ...)`. A "none" user can save the empty form. After create, status is "ready" and values equal saved, so Save goes off. A "none" user with an old limit-breaking value: Save on, validation runs on submit (correct). A failed first save keeps status "none", so Save stays on. A failed edit then further edits: `changed` stays true, Save on. Reverting to the saved values turns Save off with the message kept (acceptable).

### R2-002 — resolved
`<Button disabled={!changed || busy}>` for Discard. AccountCard is not in the diff.

### R2-003 (minor) — focus is lost when a 409 on create turns Save off
`AlumniProfileCard.tsx` failure branch (~line 216): `keepFocusFrom(saveRef)` runs only on `result.ok`. After a 409 the store reloads the existing profile (status "ready", the form is reset to it), so `canSave` becomes false and the focused Save button is disabled with no focus move. Keyboard focus drops to the page; the conflict message stays visible. Fix: call `keepFocusFrom(saveRef.current)` before `showFailure` when the reason is the conflict (or always, cheaply, if `!canSave` after the answer).

### Enter on a pristine EXISTING profile — OK
The submit button is `disabled` (not just aria-disabled) when `!canSave && !busy`, which blocks implicit submission, and `handleSubmit` also returns early on `!canSave`. Both layers hold. The busy case relies on the `sending` ref and Button's click guard, unchanged.

### New cases (scripts/frontend-lib-check.ts ~697-712)
They can fail: an always-true or always-false function, a flipped `isNew`, or `return isNew` alone each break at least one case. Case "after the first create" compares `createdForm` with itself, so it tests only `sameAlumniForm`; the "empty first create" case is the real one. Not covered by any case: the `mine.status === "none"` wiring and the focus moves (no component tests exist). Note for the first-create focus: `keepFocusFrom` runs after the store write, so it relies on React not yet having committed the disabled state; not verified in a browser this round.
