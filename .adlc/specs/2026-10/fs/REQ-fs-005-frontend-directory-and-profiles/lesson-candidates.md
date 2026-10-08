
## CAND-001 [implement-task]
**Claim:** When a comment explains why a type is kept "for X", grep for that reason again when X is removed.
**Saw it in:** `shared/types/user.types.ts:1` (and `shared/index.ts:19`)
**Context:** The legacy frontend was deleted in REQ-fs-004 but three comments in shared/ still gave it as the reason; L-REQ-fs-004-7 missed comments in another workspace.

## CAND-002 [implement-task]
**Claim:** Before writing a form label from the spec, compare it with the approved picture; the two can name a field differently.
**Saw it in:** `frontend/src/config/text.ts` (`ALUMNI_COMPANY_LABEL`), `docs/design/screens/my-profile.html`
**Context:** AC23 says "Company"; my-profile.html says "Current company". The picture was followed (design README wins).

## CAND-003 [implement-task]
**Claim:** To test an axios error path without a network, pass a per-call `adapter` that throws an `AxiosError`; one that returns a 500 response resolves instead.
**Saw it in:** `frontend/src/services/apiError.ts:10` (`isCancelled`)
**Context:** A custom adapter skips axios's own status check, so a fake 500 "succeeded" until the adapter threw itself. An already-aborted signal rejects before the adapter runs.

## CAND-004 [implement-task]
**Claim:** In the library check, write an expected object's keys in the order the code adds them; `check` compares JSON text, so the same keys in another order fail.
**Saw it in:** `scripts/frontend-lib-check.ts:38` (and the "form errors: one message per bad field" case)
**Context:** `validateAlumniForm` adds errors in screen order; an expected map typed in another order would be a false failure.

## CAND-005 [implement-task]
**Claim:** Put the phone value of a token added under "Added by later tasks" in a phone block after it, not in section 4.
**Saw it in:** `frontend/src/styles/tokens.css:193` (the --avatar-xl phone block)
**Context:** Same-specificity :root rules: the later one wins, so a phone value in the earlier media block is silently ignored.

## CAND-006 [implement-task]
**Claim:** A plain Tag on the dark band is unreadable in light theme; scope `--text: var(--band-text)` on the row that holds it.
**Saw it in:** `frontend/src/components/shell/ProfileBand/ProfileBand.module.css:98`
**Context:** Tag writes `color: var(--text)` (#161616), the same as `--band`; redefining the token keeps Tag untouched.

## CAND-007 [implement-task]
**Claim:** When a class `composes` one from another stylesheet, only add properties the composed class does not set.
**Saw it in:** `frontend/src/components/shell/ProfileBand/ProfileBand.module.css:1`
**Context:** Which stylesheet loads first decides a clash, and that order is not under the author's control.

## CAND-008 [implement-task]
**Claim:** Strip only spaces (not JS `trim`) from a filter value the server compares with `btrim`, or an option with a tab never round-trips.
**Saw it in:** `frontend/src/lib/directoryQuery.ts:52`
**Context:** ADV-004; Postgres `btrim(x)` removes spaces only, so a JS-trimmed value would no longer match the option the server sent.

## CAND-009 [implement-task]
**Claim:** Treat an address key sent twice as absent; `URLSearchParams.get` silently takes the first one.
**Saw it in:** `frontend/src/lib/directoryQuery.ts:55`
**Context:** `?q=a&q=b` would otherwise show one value while axios might send another.

## CAND-010 [implement-task]
**Claim:** Make `cancel()` of a latest-request helper retire the ticket too, not only abort; a call without a signal is then still dropped.
**Saw it in:** `frontend/src/store/latestRequest.ts:35`, `frontend/src/store/alumniAtoms.ts:206`
**Context:** `getMyAlumni` takes no signal, so only the ticket stops a late `/me` answer after a reset.

## CAND-011 [implement-task]
**Claim:** Rewriting a file with Python's default `open()` turns CRLF into LF for the whole file; pass `newline` to keep the file's endings.
**Saw it in:** `frontend/src/store/sessionActions.ts:1`
**Context:** The store files are CRLF in the work tree; a scripted edit silently changed every line ending.

## CAND-012 [implement-task]
**Claim:** A save that writes a loaded atom should cancel that atom's running load first, or the older load's answer can overwrite the save.
**Saw it in:** `frontend/src/store/alumniAtoms.ts:228`
**Context:** `setMyAlumniAtom` cancels the my-profile request before it stores the saved profile.

## CAND-013 [implement-task]
**Claim:** Give a reused form card a "primary" prop instead of fixing its submit button as primary; the page decides, so one primary button per view holds.
**Saw it in:** `frontend/src/components/profile/AccountCard/AccountCard.tsx:60`
**Context:** The task said primary; the design and design-system.md say the Account card's save is secondary next to the alumni card.

## CAND-014 [implement-task]
**Claim:** Don't put maxLength on a field whose validator has a length message; the browser cuts pasted text off silently and the message never shows.
**Saw it in:** `frontend/src/components/profile/AccountCard/AccountCard.tsx:186`
**Context:** Sign-up uses maxLength on the name; AC26 wants a 101-character name to show a message in words.

## CAND-015 [implement-task]
**Claim:** Put a frontend "id from the address" reader (digits, 1 to 2147483647) in lib/ with library-check cases before a second page needs it.
**Saw it in:** `frontend/src/pages/AlumniProfilePage/AlumniProfilePage.tsx:62`
**Context:** No lib helper existed, so TASK-009 kept a small local `readProfileId`; the server's `parseId` has the same cap.

## CAND-016 [implement-task]
**Claim:** Map an ApiFailure to FAILURE_SERVER_TEXT / FAILURE_NO_ANSWER_TEXT through one lib function, not per page.
**Saw it in:** `frontend/src/pages/AlumniProfilePage/AlumniProfilePage.tsx:77`
**Context:** The profile page wrote its own two-line `failureText`; the directory and My profile pages need the same rule (L-REQ-fs-004-2).

## CAND-017 [implement-task]
**Claim:** Check that a reused component can carry everything the design asks of it (router state, aria-label, className) before the architecture says "no change needed".
**Saw it in:** `frontend/src/components/ui/Link/Link.tsx:13`
**Context:** The card link must carry `{ directorySearch }` router state (AC17), but `Link` takes only `to`, so the card cannot set it without editing a file no task names.

## CAND-018 [implement-task]
**Claim:** Export one "trimmed text or null" helper from lib/alumniDisplay.ts; tags and rows both need it.
**Saw it in:** `frontend/src/components/alumni/AlumniCard/AlumniCard.tsx:27`, `frontend/src/pages/AlumniProfilePage/AlumniProfilePage.tsx:74`
**Context:** `present` in alumniDisplay.ts is private, so the card and the profile page each wrote their own copy (AC36, L-REQ-fs-002-3).

## CAND-019 [implement-task]
**Claim:** When a phone panel sits behind a button, put the panel after every control the button sits with, in the DOM, so Tab order equals screen order on both layouts.
**Saw it in:** `frontend/src/components/alumni/DirectoryFilters/DirectoryFilters.tsx:150`
**Context:** The wide picture puts the selects before the Search button and the phone picture puts them after it; CSS `order` would make Tab jump, so the wide layout moved the selects to a second row.

## CAND-020 [implement-task]
**Claim:** To refill a form when its saved data changes without a remount, compare the stored object to the one the form was filled from during render and reset values there; do not key the form on the data.
**Saw it in:** `frontend/src/components/profile/AlumniProfileCard/AlumniProfileCard.tsx:113`
**Context:** A key or a none/ready branch with two form elements would remount after the first create and the 409 reload, losing focus and the failure message (ADV-002).

## CAND-021 [implement-task]
**Claim:** When a page wraps its cards in a layout box, remember PageLayout pulls up only its first child over the band, so the whole box overlaps, not one card.
**Saw it in:** `frontend/src/components/shell/PageLayout/PageLayout.module.css:13`
**Context:** My profile puts both cards in one flex row; both overlap the band together, which is what the architecture asked for.

## CAND-022 [implement-task]
**Claim:** Keep "the last value the page committed" in a ref, not in state, when the address is written through react-router.
**Saw it in:** `frontend/src/pages/DirectoryPage/DirectoryPage.tsx:87`
**Context:** A state value set next to `setSearchParams` can render before the new location does, so a compare-in-render would undo the user's text.

## CAND-023 [implement-task]
**Claim:** Hide Pagination while a page loads, and focus a persistent element (the count line) from the parent's effect.
**Saw it in:** `frontend/src/pages/DirectoryPage/DirectoryPage.tsx:204`
**Context:** Pagination's own keep-focus ref then has nothing to fight; the clicked button is gone and focus lands on the count line, not the body.

## CAND-024 [implement-task]
**Claim:** When a shared component needs focus moved inside it and you may not edit it, wrap it in a plain div ref and query inside that ref, as AppShell does.
**Saw it in:** `frontend/src/pages/AlumniProfilePage/AlumniProfilePage.tsx:101`
**Context:** ProfileBand has no heading ref; TASK-015 could not touch it, so the retry focus uses `bandRef.current?.querySelector("h1")`.

## CAND-025 [implement-task]
**Claim:** A component that draws its own action button needs a prop to hide it before a page can put the same action somewhere else.
**Saw it in:** `frontend/src/components/alumni/DirectoryFilters/DirectoryFilters.tsx` (`showClear`)
**Context:** Without it TASK-008 dropped the empty state's Clear button to avoid two, missing AC11.

## CAND-026 [implement-task]
**Claim:** With no Playwright installed, drive the already-installed Chrome headless over the DevTools protocol with Node's built-in WebSocket; if input events stop arriving, open a fresh tab with `/json/new`.
**Saw it in:** scratchpad `cdp.mjs` (TASK-014 browser review)
**Context:** The first tab silently ignored mouse and key events after full-page screenshots; a new tab worked at once.

## CAND-027 [implement-task]
**Claim:** Prove a library-check case can fail with a copy outside the repo whose `../frontend/src/` imports are rewritten to full paths, so nothing in the repo is made or deleted.
**Saw it in:** `scripts/frontend-lib-check.ts:13`
**Context:** The owner forbids deleting files outside `.adlc/`; a scratch copy inside `scripts/` would have had to be deleted.

## CAND-028 [implement-task]
**Claim:** When a script looks for "the button with aria-expanded", scope it to its form: the header's phone menu button also has `aria-expanded` and comes first.
**Saw it in:** `frontend/src/components/alumni/DirectoryFilters/DirectoryFilters.tsx:160`
**Context:** A review script read the menu button and reported the Filters panel closed when it was open.

## From quality-reviewer (REQ-fs-005)
- A shared pure rule that cannot live in lib/ (needs a store type) escapes the library check; declare its own input shape in lib instead (as loadFailure.ts did). Evidence: saveFailureText.ts has no cases.
- "Compose to avoid drift" must cover every repeated block, not one: composes was used for .heading while .card/.form/border-row stayed copied across two CSS modules.
- Count of cases in docs (282) should exclude fixture self-checks and function-vs-itself cases.

## CAND-029 [review-corr]
**Claim:** Build a `mailto:` or other scheme link from user-stored text only after checking or encoding it, because the server does not validate the field.
**Saw it in:** `frontend/src/pages/AlumniProfilePage/AlumniProfilePage.tsx:173`
**Context:** The sign-up route accepts any non-empty email string, so `?cc=` and `&body=` can ride in the link.

## CAND-030 [review-corr]
**Claim:** A state that is keyed by id but set from an effect shows the previous visit's status for one frame; derive "loading" until this mount has asked.
**Saw it in:** `frontend/src/pages/AlumniProfilePage/AlumniProfilePage.tsx:88-92`
**Context:** The atom outlives the page, so `viewed.id === id` is true for an old error or not-found.

## CAND-031 [review-corr]
**Claim:** A once-per-key guard ("done for this address") must be cleared when the condition ends, or the same key cannot be fixed twice.
**Saw it in:** `frontend/src/pages/DirectoryPage/DirectoryPage.tsx:221-226`
**Context:** `clampedKey` keeps the last past-the-end address.

## CAND-032 [review-corr]
**Claim:** Give the shared API client a default timeout; a hung server otherwise leaves every loader and busy button with no error state.
**Saw it in:** `frontend/src/services/apiClient.ts`
**Context:** Only the logout call sets a timeout.

## CAND-029 [review-reflect]
**Claim:** Write a spec pointer in a code comment with the REQ id ("REQ-fs-005 AC7"); bare AC and ADV numbers repeat in every REQ.
**Saw it in:** `frontend/src/components/alumni/DirectoryFilters/DirectoryFilters.tsx:73`
**Context:** 75 comment lines cite AC or ADV numbers, 2 files name a REQ; conventions.md Comments (new in this REQ) allows the bare form.

## CAND-029 [review-arch]
**Claim:** A style-check rule for "lib has no React or services; store has no components" belongs next to rule d, or the layer rule is habit only.
**Saw it in:** `scripts/frontend-style-check.mjs:47`
**Context:** Rule d guards UI folders only; lib/store layering held by hand in REQ-fs-005.

## CAND-030 [review-arch]
**Claim:** Declare a failure/status shape once in lib and let services import it, not copy it by hand per layer.
**Saw it in:** `frontend/src/lib/loadFailure.ts:10`, `frontend/src/components/profile/saveFailureText.ts:1`
**Context:** Three declarations of the same shape plus HTTP status numbers repeated in three files.

## CAND-031 [review-arch]
**Claim:** When a deviation says "typing replaces history", check that every caller of the shared write function passes the right replace flag.
**Saw it in:** `frontend/src/pages/DirectoryPage/DirectoryPage.tsx:133`
**Context:** Enter and the Search button reuse the typing path, so they replace too.

## CAND-032 [review-arch]
**Claim:** Treating atom state as current because its key matches the address shows stale data for one frame before the reload sets loading.
**Saw it in:** `frontend/src/pages/DirectoryPage/DirectoryPage.tsx:207`
**Context:** Back from a profile renders the old list, then a skeleton.

## CAND-033 [review-arch]
**Claim:** Debounce/address-sync logic that needs refs and timers goes in a hook, so a second searchable list does not copy the page body.
**Saw it in:** `frontend/src/pages/DirectoryPage/DirectoryPage.tsx:63-218`
**Context:** Most bug-prone code of the REQ sits in the page and cannot be reached by the library check.

## CAND-034 [implement-task]
**Claim:** Before switching off a button that may hold focus (a clean save, Discard), move focus to a stable target such as the card heading; a disabled button drops focus to the page.
**Saw it in:** `frontend/src/components/profile/AlumniProfileCard/AlumniProfileCard.tsx` (keepFocusFrom)
**Context:** Button passes `disabled` through but overwrites a caller's `aria-disabled` with its busy flag, so the focusable aria-disabled route needs a Button change.

## CAND-035 [review-qual]
**Claim:** Do not cite review finding ids (CORR-004, UI-001) in code comments; state the reason in words.
**Saw it in:** `frontend/src/store/alumniAtoms.ts:237` (18 places)
**Context:** The ids live in one REQ's review-log with no REQ number; they dangle after archive.

## CAND-036 [review-qual]
**Claim:** When two forms need the same edge-case fix, extract it in the fix round; two mechanisms for one problem drift.
**Saw it in:** `AccountCard.tsx:298` and `AlumniProfileCard.tsx:98` (keep typing during save, focus hand-off)
**Context:** CORR-005 and UI-001 were fixed twice, differently.

## CAND-037 [review-qual]
**Claim:** Moving a rule into lib/ should bring its cases and a layer-check rule in the same round.
**Saw it in:** `scripts/frontend-style-check.mjs` rule k; `scripts/frontend-lib-check.ts:657`
**Context:** Q-1 and ARCH-001 closed together with 44 new cases.

## CAND-038 [review-qual]
**Claim:** After a fix round, grep the docs for case counts and open-point lists; they go stale first.
**Saw it in:** `docs/frontend-patterns.md:438`
**Context:** "282 cases" and an already-fixed focus gap still listed as open.

## CAND-035 [review-reflect]
**Claim:** When two forms share a rule (same-values, keep newer typing, focus move), write the rule once in lib or a hook with cases, not once per form.
**Saw it in:** `frontend/src/components/profile/AccountCard/AccountCard.tsx:140`, `frontend/src/components/profile/AlumniProfileCard/AlumniProfileCard.tsx:100`
**Context:** The fix round gave each card its own version; only the Alumni one has a lib function and cases.

## CAND-036 [review-reflect]
**Claim:** When constants move into a shared file, grep for the bare number across the layer and convert every local copy in the same change.
**Saw it in:** `frontend/src/store/alumniAtoms.ts:87`
**Context:** HTTP_NOT_FOUND now exists in lib/loadFailure.ts, yet the store keeps `NOT_FOUND = 404`.

## CAND-037 [review-reflect]
**Claim:** A layer rule in the style check should ban the full list of forbidden imports, not only the ones that were found by hand.
**Saw it in:** `scripts/frontend-style-check.mjs:53`
**Context:** Rule k bans react and store/ but not jotai, axios or components/ for lib/.


## CAND-041 [review-arch]
**Claim:** A layer check must encode every sentence of the layer rule, not only the one broken last.
**Saw it in:** `scripts/frontend-style-check.mjs:51-53,339-348`
**Context:** Rule k bans react, router, services, store from lib/ but not hooks, components, jotai; nothing checks services to store.

## CAND-042 [review-arch]
**Claim:** Move a shared type and its constants to a neutrally named lib file when a second rule starts reading them.
**Saw it in:** `frontend/src/lib/loadFailure.ts:12-18`
**Context:** CallFailure and the HTTP numbers live in the load-words file; saveFailure and a store file import them from there.

## CAND-043 [review-arch]
**Claim:** When two forms need "keep what was typed during a save", write the decision once in lib/, not twice in components.
**Saw it in:** `AccountCard.tsx` (latest ref) and `AlumniProfileCard.tsx` (sent state plus render reset)
**Context:** Two mechanisms for one rule (CORR-005).

## CAND-044 [review-arch]
**Claim:** Put CSS blocks shared by two components in a neutral module, not in one of the two components' files.
**Saw it in:** `frontend/src/components/profile/AlumniProfileCard/AlumniProfileCard.module.css:7-54`
**Context:** composes from a sibling card's module ties the two together by class name.

## CAND-045 [review-arch]
**Claim:** A clear-on-close action must also stop non-request writers (a save's set), or "starts from idle" is false.
**Saw it in:** `frontend/src/store/alumniAtoms.ts:229-264`
**Context:** setMyAlumniAtom after unmount restores ready; harmless here, a trap for a source with an error state.

## CAND-046 [review-arch]
**Claim:** When a fix changes why a store atom exists, update the architecture file's reason in the same round.
**Saw it in:** REQ architecture.md store rationale vs `docs/frontend-patterns.md` pattern 23
**Context:** "Kept when the user comes back" went away with clear-on-close.

## CAND-047 [review-corr]
**Claim:** When a form's save is disabled until a change, ask what the empty create case does: a new record's blank form equals "saved", so it can never be created.
**Saw it in:** `frontend/src/components/profile/AlumniProfileCard/AlumniProfileCard.tsx:624`
**Context:** `changed` compares to `alumniToForm(null)`, so a first create needs a typed value (AC24).

## CAND-048 [review-corr]
**Claim:** Every control that resets a form must also be off while a save runs, or the save's answer silently undoes it.
**Saw it in:** `frontend/src/components/profile/AlumniProfileCard/AlumniProfileCard.tsx:715`
**Context:** Discard during a running save: values reset, then the render-time reset refills them from the answer.

## CAND-049 [review-corr]
**Claim:** Move focus off a button before the render that disables it, and do it in the same tick as the state change that disables it.
**Saw it in:** `frontend/src/components/profile/AccountCard/AccountCard.tsx:322`
**Context:** The store answer renders while `busy` is still true, so the button is still enabled when the focus check runs; this order is what makes it work.
