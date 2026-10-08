# TASK-007 — useListAddress hook; the Directory uses it

| Field | Value |
|---|---|
| REQ | REQ-fs-007 |
| Tier | 1 |
| Status | pending |
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

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-007-frontend-users-about-polish-perf/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-002-3-new-helper-convert-every-sibling|L-REQ-fs-002-3]], [[knowledge/gotchas#^g50|G50]], [[knowledge/gotchas#^g51|G51]]
