# TASK-003 — Directory address, display and return-state rules

| Field | Value |
|---|---|
| REQ | REQ-fs-005 |
| Tier | 1 |
| Status | pending |
| Repo | alumni-details-system |
| Depends on | TASK-001, TASK-002 |
| Blocks | TASK-007, TASK-009 |

## Goal

Reading and writing the directory address, the lines a card shows and the "came from the directory" state are pure functions with cases (AC5, AC7, AC17, AC2, AC15).

## Files to touch

| Path | Action |
|---|---|
| `frontend/src/lib/directoryQuery.ts` | create |
| `frontend/src/lib/alumniDisplay.ts` | create |
| `frontend/src/lib/directoryReturn.ts` | create |
| `scripts/frontend-lib-check.ts` | edit |

## Approach

- `directoryQuery.ts`: `DirectoryQuery = { q; department; graduationYear: number | null; field; mentoring; page }`, `DEFAULT_DIRECTORY_QUERY`. `readDirectoryQuery(params: URLSearchParams)`: `q` trimmed with the usual JavaScript trim and never dropped for length (ADV-004: the backend accepts any length); `department` and `field` stripped of **spaces only**, because the server compares them with `btrim` and the options it sends must round-trip (a tab in an option stays); none of the three is dropped for length; a key sent twice counts as absent; `page` must be digits `1`–`9999999` without leading zero, else 1; `graduation_year` exactly four digits, else `null`; `mentoring` only the exact text `true`. `writeDirectoryQuery(query)` returns `URLSearchParams` with only non-default values, in a fixed key order (so the same query gives the same string), page 1 left out. `toListParams(query)` is the object for the API (`q`, `department`, `graduation_year`, `field`, `mentoring: "true"`, `page` when above 1); `limit` is never sent. `activeFilterCount(query)` counts department, year, field, mentoring (not the search text). `hasCriteria(query)` is true when the search text or any filter is set. `lastPage(total, limit)` is at least 1.
- `alumniDisplay.ts`: `displayName(name | null)` → trimmed name or the `NAME_NOT_GIVEN` word; `jobLine(title, company)` → "Title at Company", only the part that exists, or `null`; `classLabel(year | null)` → "Class of 2019" or `null`; `orNotGiven(text | null)` → trimmed text or `NOT_GIVEN`; `firstName(name | null)`. Words come from `config/text.ts`.
- `directoryReturn.ts`: `readDirectorySearch(state: unknown): string` returns the saved query string only if it is a string that is empty or starts with `?`, has no `#`, no line break and is at most 500 characters; anything else is `""` (router state survives a reload and is untrusted, L-REQ-fs-004-1). `directoryReturnState(search)` builds the state object the card link sets.
- Cases written from the spec (see architecture, Test strategy): absent / empty / `page=0` / `-1` / `abc` / `1.5` / `007` / `99999999`; repeated `q`; `mentoring=true|yes|TRUE|""`; `graduation_year=2019|abc|20199|201`; write defaults away, round trip `read(write(q))` equals `q`, same query gives the same string; `activeFilterCount`; `lastPage(0, 12)=1`, `(12,12)=1`, `(13,12)=2`; display lines with each part missing and with spaces only; hostile router state (`null`, a number, `{ directorySearch: "//evil" }`, `"?a#b"`, a 600-character string).

## Acceptance

- [ ] AC5, AC7 (rules), AC17 (state), AC2 and AC15 (lines) hold in the cases
- [ ] `npx tsx scripts/frontend-lib-check.ts` exits 0
- [ ] `npm run build` exits 0

## Notes

Rules for every task of this REQ: see TASK-001. No page logic here; these files import no React and touch no `window`.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-005-frontend-directory-and-profiles/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-004-1-router-state-survives-a-reload|L-REQ-fs-004-1]], [[knowledge/lessons/LESSON-REQ-fs-004-2-one-rule-one-function-in-lib|L-REQ-fs-004-2]], [[knowledge/concepts/paged-list-query]]
