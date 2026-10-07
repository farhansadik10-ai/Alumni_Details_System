# TASK-008 — Directory page

| Field | Value |
|---|---|
| REQ | REQ-fs-005 |
| Tier | 3 |
| Status | pending |
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

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-005-frontend-directory-and-profiles/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-004-1-router-state-survives-a-reload|L-REQ-fs-004-1]], [[knowledge/lessons/LESSON-REQ-fs-004-4-check-focus-for-real|L-REQ-fs-004-4]], [[knowledge/concepts/paged-list-query]]; gotchas G48, G49
