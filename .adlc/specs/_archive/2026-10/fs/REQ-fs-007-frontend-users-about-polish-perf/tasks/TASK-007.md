# TASK-007 — useListAddress hook; the Directory uses it

| Field | Value |
|---|---|
| REQ | REQ-fs-007 |
| Tier | 1 |
| Status | implemented |
| Repo | alumni-details-system |
| Depends on | TASK-002 |
| Blocks | TASK-008 |

## Goal

The Directory's search, timer, page change, clear and past-the-end code is one hook, the Directory page behaves exactly as before, and the Users page can use the same hook.

## Files to touch

| Path | Action |
|---|---|
| `frontend/src/hooks/useListAddress.ts` | create |
| `frontend/src/pages/DirectoryPage/DirectoryPage.tsx` | edit: use the hook; keep the load effect, the filter-options effect, the clear on close and the views |

## Approach

- Generic over a query type with `q: string` and `page: number`. Input: `{ read(params): Q; write(query): URLSearchParams; defaultQuery: Q; list: { queryKey, status, total, limit } or null }`. Output: `query`, `queryKey`, `searchText`, `searchRef`, `countRef`, `onSearchTextChange`, `searchNow`, `changeFilter(patch)`, `changePage(page)`, `clear()`, `retryFocus()`, and the two values the pages draw from, `pageCount` (from `lastPage(total, limit)`) and `pastTheEnd` (the list is ready, `total > 0`, and `query.page > pageCount`). The hook works out `current` (the list only when its `queryKey` is this address's) once, so neither page repeats that rule.
- Move the code, its comments and its ids (`ADV-003`, `CORR-002`, `CORR-003`, `AC7`) as they stand in `DirectoryPage.tsx` today: `liveQuery`, `setParams`, `lastCommitted`, `pendingText`, `timer`, `focusCountOnPage`, `clampedKey`, `stopTimer`, `writeAddress`, `writeControl`, `commitSearch`, the layout effect, the `q` sync effect, the unmount timer cleanup, the focus-count effect and the past-the-end effect. Do not rewrite their logic.
- `hooks/` may not import `services/` or `store/` (style rule d), so the hook gets the list state as a plain argument.
- Keep the Directory's own words and views. No visible change.

## Acceptance

- [ ] `DirectoryPage.tsx` no longer holds the timer refs or `writeAddress`.
- [ ] `npm run build`, the style check and the library check exit 0.
- [ ] Browser check (headless Chrome, mock API, a port that is not 3000; repeated in TASK-012 and in review): typing and waiting 300 ms writes `?q=` and replaces the entry; a filter pushes an entry and goes to page 1; Back restores the search box; a page past the end moves to the last page once; after Next the count line has focus; Clear puts focus in the search box.
- [ ] If any of these differ and cannot be fixed, stop and report. The fallback is a copy, and that is the owner's call.

## Notes

Highest-risk task of the REQ. Commit it on its own so it can be reverted alone.

**Done 2026-10-08 (task-implementer).** `npm run build`, style check (188 files, 0 findings) and library check (529 passed) exit 0. Browser check not run here (no browser in this agent); TASK-012 runs it.

What moved, unchanged in logic, comments and ids: `SEARCH_DELAY_MS`, `liveQuery`, `setParams`, `lastCommitted`, `pendingText`, `timer`, `focusCountOnPage`, `clampedKey`, `stopTimer`, `writeAddress`, `writeControl`, `commitSearch`, the layout effect, the `q` sync effect, the unmount timer cleanup, the focus-count effect, the `current` / `pageCount` / `pastTheEnd` rule and the past-the-end effect. `queryKeyOf(q)` became `write(q).toString()` (same text). Handlers renamed only: `handleSearchTextChange` -> `onSearchTextChange`, `() => commitSearch(searchText)` -> `searchNow`, `handleFilterChange` -> `changeFilter` (adds `page: 1` as before), `handlePageChange` -> `changePage`, `handleClear` -> `clear` (writes `defaultQuery`), the focus half of `retryList` -> `retryFocus`.

Small additions to the listed interface: the hook also returns `current` (the list, or null when its `queryKey` is not this address's), so the page draws items and failure from it without repeating the key rule; `list` is typed generic (`L extends {queryKey, status, total, limit}`), so `current` keeps the page's own state type. `changePage` needs `{ page } as Partial<Q>` (TypeScript cannot narrow a generic spread).

One ordering change: the hook's effects are now declared before the page's load, filter-options and clear-on-close effects (they used to sit between and after them). Checked: none of them reads what another writes in the same commit. The load effect runs only when `queryKey` changes, and in that commit `current` is null, so `pastTheEnd` is false and the clamp does nothing.

Where each Directory behaviour lives now:
- Search timer (300 ms, replaces the history entry): hook, `onSearchTextChange` -> `commitSearch` -> `writeAddress(..., true)`.
- Enter / Search button sends now: hook, `searchNow`.
- A filter pushes an entry and goes to page 1; a waiting search goes with it (CORR-002): hook, `changeFilter` -> `writeControl` -> `writeAddress(..., false)`.
- Back / Forward / pasted link restores the search box: hook, the `query.q` sync effect with `lastCommitted`.
- Past the end moves to the last page once per episode (AC7, CORR-003): hook, the effect with `clampedKey`; the page shows the skeleton while `pastTheEnd` (page's `view`).
- Focus on the count line only after Pagination (AC8, ADV-007): hook, `changePage` sets `focusCountOnPage`; the `query.page` effect focuses `countRef`.
- Clear focuses the search box: hook, `clear` -> `searchRef.focus()`.
- Retry focuses the count line: page `retryList` starts the load, then hook `retryFocus`.
- Timer stopped on unmount: hook. List cleared on close, list load, filter options: page.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-007-frontend-users-about-polish-perf/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-002-3-new-helper-convert-every-sibling|L-REQ-fs-002-3]], [[knowledge/gotchas#^g50|G50]], [[knowledge/gotchas#^g51|G51]]
