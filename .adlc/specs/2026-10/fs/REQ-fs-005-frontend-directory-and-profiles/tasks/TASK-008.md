# TASK-008 — Directory page

| Field | Value |
|---|---|
| REQ | REQ-fs-005 |
| Tier | 3 |
| Status | complete |
| Repo | alumni-details-system |
| Depends on | TASK-005, TASK-007 |
| Blocks | TASK-014 |

## Goal

`/directory` is the real directory: search, filters, count, cards, pagination, and every state, driven by the address (AC1 to AC14, AC34, AC35, AC38, AC44).

## Files to touch

| Path | Action |
|---|---|
| `frontend/src/pages/DirectoryPage/DirectoryPage.tsx` | edit (replace the placeholder) |
| `frontend/src/pages/DirectoryPage/DirectoryPage.module.css` | create |

## Approach

- `PageLayout` with the directory heading and sub line. Inside, one `Card` (first child, overlaps the band) holding `DirectoryFilters`, then the count line, the list and `Pagination`.
- `useSearchParams` → `readDirectoryQuery`. Controls write through `writeDirectoryQuery`: filter, checkbox and page changes push (a filter change also resets the page); search-text changes replace (listed deviation). Search text has its own state and a 300 ms timer (cleared on unmount); Enter or the Search button writes at once. When the address changes by itself and differs from the last value the user committed, the box takes the address value.
- Debounce rules (ADV-003). The address is always built from the *live* params at the moment of writing, never from a copy captured when the timer started. A change to a filter, the checkbox or the page cancels a pending timer, and a pending search text is committed together with that change. The box compares trimmed values against a `lastCommitted` ref (the last text this page wrote or read), never the raw box text against the address, so a typed trailing space ("John ") is not erased.
- Showing state (ADV-007). The page treats the list as `loading` whenever `directoryAtom.query` differs from the address, so old results are never shown for a new address, also for the first frame after a Back or a return to the page.
- Focus (ADV-007). The count-line focus is triggered by a ref that only `Pagination`'s `onChange` sets, not by any change of `query.page`; so Back, a pasted link and the past-the-end replace never move focus.
- Effects: on the canonical address string call `loadDirectoryAtom(query)`; on mount call `loadFiltersAtom`. A ready answer with `total > 0` and `page > lastPage` replaces the address with the last page (once).
- Count line: always rendered, `role="status"`, `tabIndex={-1}`; words from the state (loading, `N alumni`, none, could not load). After a page change by the user, an effect on `query.page` focuses it and scrolls it into view (this runs after `Pagination`'s own focus effect and wins).
- States: loading → one `SkeletonGroup` of twelve `AlumniCardSkeleton`; ready → a list (`<ul>`) of `AlumniCard`; empty with criteria → `EmptyState` with "Clear search and filters"; empty without → `EmptyState` with no button; error → `ErrorState` (words by `failure.kind`, never the server text) whose retry reloads the same query. The filters stay on screen in every state.
- Layout: a responsive grid, one column from 360px, more columns on wide screens, by tokens and `auto-fill`/`minmax` with a token width (no literals); no horizontal scroll at 200% zoom.

## Acceptance

- [ ] AC3: one request per pause; Enter sends at once (watch the mock's request log)
- [ ] AC5 / AC6 / AC7: a pasted address shows the same page and controls; Back steps back; `?page=0`, `?page=abc` and `?page=999` behave as written
- [ ] AC10: slow answer for "ab" arriving after "abc" is ignored, and the aborted call shows no error
- [ ] AC8 / AC42 with a real Tab key: after "Next" focus is on the count line; after "Next" to the last page focus is not lost
- [ ] AC9, AC11, AC12 on the mock: skeleton, both empty states, both error words, retry
- [ ] No hard-coded text in the page file (grep for a quoted sentence); `npm run build` and style check exit 0

## Notes

Rules for every task of this REQ: see TASK-001. React StrictMode starts the load effect twice in dev; `latestRequest` makes that harmless (G48). Keep page-only state (typed text, panel open, timer) in the component; the list is an atom.

Implementation notes (TASK-008, 2026-10-08):

- **One Clear button (AC11).** `DirectoryFilters` always draws its quiet "Clear search and filters" when criteria are set, and it has no prop to hide it (TASK-007's file, not edited). So the empty state with criteria has no button; the search card's Clear is the one next step, right above the empty state, and outside the phone panel so it is visible on a phone. If the owner wants the bigger button in the empty state, add a `showClear` prop to `DirectoryFilters` and pass `false` while the result is empty (a file this task does not own).
- **Address writes (ADV-003).** `liveQuery` (a ref synced in a layout effect, and set at once on every write) is what each write starts from, so a timer never writes an old copy. `setSearchParams` is also kept in a ref. Filter, checkbox and page changes stop a waiting timer and send its trimmed text with them. `lastCommitted` is a ref, not state: a state value set next to `setSearchParams` could render before the new location and undo the user's text. The box follows the address only when `query.q` differs from it, so "John " keeps its space.
- **A page click with typed text waiting** sends both the new text and the clicked page (the rule says "commit together"); if that page does not exist for the new search, the past-the-end rule moves to the last page.
- **Showing state (ADV-007).** The list is `loading` whenever `directoryAtom.queryKey` is not this address's key, and also while a past-the-end answer waits for its replace, so an empty page never flashes.
- **Focus.** Pagination is drawn only when the list is ready, so after a click it is gone while the page loads; the page's effect on `query.page` then focuses the count line (`preventScroll`, then `scrollIntoView` to the top). The flag is set only from `onChange`, and only when the address really changed. Two more moves the task does not name, because the clicked button disappears: "Try again" focuses the count line; Clear focuses the search box (found with `querySelector("input")` in a wrapper, as `DirectoryFilters` takes no ref).
- **Filter options** load on mount only when `filtersAtom` is not already `ready` (no flicker and no extra call when coming back from a profile). A log out resets the atom, so the next user loads them again.
- The canonical key is `writeDirectoryQuery(query).toString()`; the load effect rebuilds the query from the key, so it depends on the key only. `toListParams` returns `DirectoryListParams`, passed to `loadDirectoryAtom` with no cast.
- The card grid is `auto-fill` with `minmax(min(calc(var(--space-8) * 5), 100%), 1fr)`: 320px as drawn, from tokens, as `DirectoryFilters` and `AlumniProfileCard` already do. One column at 360px and at 200% zoom.
- The error retry uses the `secondary` variant: the Search button is the page's primary.
- Proof: `npm run build`, `node scripts/frontend-style-check.mjs` (0 findings) and `npx tsx scripts/frontend-lib-check.ts` (262 passed) pass. Not checked in a browser: the mock-API checks of AC3, AC5 to AC10, AC12 and the real Tab-key focus (AC8, AC42) are TASK-014's browser review. ESLint is not installed in the repo, so lint was not run.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-005-frontend-directory-and-profiles/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-004-1-router-state-survives-a-reload|L-REQ-fs-004-1]], [[knowledge/lessons/LESSON-REQ-fs-004-4-check-focus-for-real|L-REQ-fs-004-4]], [[knowledge/concepts/paged-list-query]]; gotchas G48, G49

## Fix round 1 - batch A

- m2 (CORR-002): `writeControl` sets `page: 1` whenever it sends a waiting search text that differs from the address, so a page click within 300 ms of typing lands on page 1 (AC6). ADV-003 is kept: the live query is still read at write time.
- m3 (CORR-003): the clamp effect clears `clampedKey` whenever the page is not past the end, and marks the key only when `writeAddress` actually moved it, so each past-the-end episode is fixed and the skeleton cannot stay.
- m4 (CORR-004, ARCH-005): new `clearDirectoryAtom` (store/alumniAtoms.ts) cancels the list call and sets the list to idle; the page calls it on unmount. A Back from a profile now shows the skeleton from the first frame instead of one frame of the old list, then the skeleton (no extra skeleton; the old frame is gone). Filter options are kept.
