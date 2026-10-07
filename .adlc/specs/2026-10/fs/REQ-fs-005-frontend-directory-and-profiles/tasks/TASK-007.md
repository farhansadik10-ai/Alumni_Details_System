# TASK-007 — Result card, its loading card and the directory filters

| Field | Value |
|---|---|
| REQ | REQ-fs-005 |
| Tier | 2 |
| Status | complete |
| Repo | alumni-details-system |
| Depends on | TASK-001, TASK-003, TASK-006 |
| Blocks | TASK-008 |

## Goal

The two parts of the directory that are not the page itself exist as controlled components: the card (and its skeleton) and the search-and-filters block with its phone panel (AC2, AC3, AC4, AC13, AC9).

## Files to touch

| Path | Action |
|---|---|
| `frontend/src/components/alumni/AlumniCard/AlumniCard.tsx` | create |
| `frontend/src/components/alumni/AlumniCard/AlumniCardSkeleton.tsx` | create |
| `frontend/src/components/alumni/AlumniCard/AlumniCard.module.css` | create |
| `frontend/src/components/alumni/DirectoryFilters/DirectoryFilters.tsx` | create |
| `frontend/src/components/alumni/DirectoryFilters/DirectoryFilters.module.css` | create |

## Approach

- `AlumniCard`: props `alumni: Alumni`, `directorySearch: string`. A `Card as="article"` with `Avatar` (md), name (`displayName`), `jobLine`, a plain `Tag` for department, `classLabel` and field (each only if present), the mentoring `Tag` when true, and a `Link` "View profile" to `alumniProfilePath(id)` with `state = directoryReturnState(directorySearch)`. The link's accessible name includes the person's name (hidden suffix). Long words wrap.
- `AlumniCardSkeleton`: one `Card` with `Skeleton` blocks only (`aria-hidden`); the page wraps twelve of them in one `SkeletonGroup`.
- `DirectoryFilters`: controlled. Props: the current `DirectoryQuery`, the typed search text and its change handler, `onSearchNow`, `onFilterChange(patch)`, the filter options state (`ready | loading | error`) and `onRetryOptions`, `onClear`. It renders a `role="search"` form with `TextInput` (label Search, the Search `Button`), then the three `Select`s (first option placeholder) and the boxed `Checkbox` "Only show alumni open to mentoring". Phone: a "Filters" `Button` (`aria-expanded`, `aria-controls`, the active count from `activeFilterCount`) is drawn only under the phone query; the panel holding the selects and checkbox is hidden with `display: none` there while closed; the open state is `useState` here. On a wide screen the button is `display: none` and the panel is always shown. A value in the address that is not among the options (the options are still loading, or the options call failed, or an old link) is added to its select as an extra option so the select shows what is really filtering the list; it is never silently shown as "All" (ADV-005). A filter-options error shows a `Message` with a "Try again" `Button` and leaves the selects usable with their first option.
- Selecting the same value does not write the address again. Enter in the search box submits at once.
- Tokens only; media query exactly the phone query (rule j).

## Acceptance

- [ ] AC2: empty fields are left out, not blank; mentoring tag only when true
- [ ] AC13: with a real Tab key on a 360px window the closed panel is skipped, the open panel is reached in screen order, the button says `Filters (2)` with two active
- [ ] No second copy of Card, Tag, Select or Checkbox; no color or pixel literal
- [ ] `npm run build` and `node scripts/frontend-style-check.mjs` exit 0

## Notes

Rules for every task of this REQ: see TASK-001. The page (TASK-008) owns the address, the debounce timer and the data; these components hold no data and call no store action.

Implementation notes (TASK-007, 2026-10-08):

- **Gap, needs a decision (AC17).** `ui/Link/Link.tsx` takes only `to` (a path), so it cannot carry router state. The card's link therefore goes to `alumniProfilePath(id)` without `directoryReturnState(directorySearch)`. Fix (2 lines, a file no task names, so not edited): add `state?: unknown` to `InAppLinkProps` in `Link.tsx` and pass it to `RouterLink`; then in `AlumniCard` destructure `directorySearch` and add `state={directoryReturnState(directorySearch)}`. The `directorySearch` prop is already in the card's props, so TASK-008 can pass it now.
- **Wide layout differs from directory.html.** The picture puts the three selects between the search box and the Search button, but the phone picture puts the panel after the Search button. One DOM order cannot match both without CSS `order`, which makes Tab jump. The DOM is: search box, Filters button (phone only), Search button, panel (selects, checkbox). Wide: row 1 is the search box with Search on its right; row 2 the three selects; row 3 the boxed checkbox. Tab order equals screen order on both.
- **Props of DirectoryFilters:** `query`, `searchText`, `onSearchTextChange`, `onSearchNow`, `onFilterChange(patch: DirectoryFilterPatch)`, `options: AlumniFilters | null`, `optionsStatus: FiltersState["status"]` (idle is treated like loading), `onRetryOptions`, `onClear`.
- **Clear button.** `onClear` is in the props, so the form shows a quiet "Clear search and filters" when `hasCriteria(query)`. The empty state (TASK-008, AC11) has the same button; if both show at once on an empty result, TASK-008 may want only one. Not in the pictures.
- The card shows `jobLine` ("Title at Company") on one line, as this task says; the picture draws title and company on two lines.
- The card name is an `<h2>` at the `--text-h3` size (picture 20px; nearest token). Avatar `md` (44px), as the architecture says.
- `tagText` in the card is a third copy of "trimmed or null" (`present` in `lib/alumniDisplay.ts` is private; `AlumniProfilePage` has `presentText`). Follow-up: export one from `alumniDisplay.ts` and use it in both (CAND-018).
- The design's filter icon on the phone button is left out: no such icon exists and no task names a new icon file.
- `npm run build` and `node scripts/frontend-style-check.mjs` pass. Not checked in a browser yet (TASK-008 renders these; TASK-014 does the real Tab-key check of AC13).

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-005-frontend-directory-and-profiles/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-004-4-check-focus-for-real|L-REQ-fs-004-4]]; gotchas G46, G49
