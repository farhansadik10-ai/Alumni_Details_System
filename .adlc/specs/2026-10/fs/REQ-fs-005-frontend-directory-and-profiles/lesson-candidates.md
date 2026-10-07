
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
