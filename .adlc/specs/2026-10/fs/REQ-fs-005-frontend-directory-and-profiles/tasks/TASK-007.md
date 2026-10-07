# TASK-007 — Result card, its loading card and the directory filters

| Field | Value |
|---|---|
| REQ | REQ-fs-005 |
| Tier | 2 |
| Status | pending |
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

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-005-frontend-directory-and-profiles/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-004-4-check-focus-for-real|L-REQ-fs-004-4]]; gotchas G46, G49
