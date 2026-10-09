# TASK-002 — Address helpers shared; lastPage moves

| Field | Value |
|---|---|
| REQ | REQ-fs-007 |
| Tier | 0 |
| Status | implemented |
| Repo | alumni-details-system |
| Depends on | TASK-001 |
| Blocks | TASK-003, TASK-007 |

## Goal

The two address-reading helpers and `lastPage` each have one home, and the Directory still reads its address exactly as before.

## Files to touch

| Path | Action |
|---|---|
| `frontend/src/lib/addressParams.ts` | create: `singleParam(params, key)` (the one value of a key, or null when absent or repeated) and `readPageParam(params)` (digits 1 to 9999999 without a leading zero, else 1) |
| `frontend/src/lib/directoryQuery.ts` | edit: use the two helpers; remove `single`, `PAGE_PATTERN` and `lastPage` |
| `frontend/src/lib/pageRange.ts` | edit: add `lastPage` (same body) |
| `frontend/src/pages/DirectoryPage/DirectoryPage.tsx` | edit: import `lastPage` from its new home |
| `scripts/frontend-lib-check.ts` | edit: `lastPage` cases import from `pageRange`; add cases for the two helpers |

## Approach

- Move code, do not change it. The page rule and the single-value rule stay as they are in `directoryQuery.ts` today.
- grep the whole repo for `lastPage` and `single(` after the move; every importer is converted (L-REQ-fs-002-3). `lib/` imports nothing from React, the router, `services/` or `store/` (rule k).
- New cases are typed from the rules above, not copied from the code.

## Acceptance

- [x] `npx tsx scripts/frontend-lib-check.ts` passes; the old `readDirectoryQuery` and `lastPage` cases all still pass.
- [x] `git grep -n "lastPage" -- frontend scripts` shows one definition, in `pageRange.ts`.
- [x] `npm run build` and `node scripts/frontend-style-check.mjs` exit 0.

## Notes

- 2026-10-08, task-implementer. `addressParams.ts` holds `singleParam` and `readPageParam` (with `PAGE_PATTERN` and the `"page"` key private to it). `directoryQuery.ts` keeps its own `PAGE_KEY`, still used by `writeDirectoryQuery`. The bodies were moved unchanged.
- Lib check: 493 passed, 0 failed (24 new cases: 7 `singleParam`, 17 `readPageParam`, typed from the rules in "Files to touch"). The helper in the script is named `addressOf` (not `params`) to avoid clashing with names other parallel tasks may add.
- Proof it can fail: a copy in the session scratchpad (imports rewritten to absolute paths, two expectations flipped: `page=05` gives 5, repeated `role` gives "admin") printed both FAIL lines and exited 1. Nothing was created in `scripts/`.
- Style check: PASS, no findings (rule k holds: `addressParams.ts` imports nothing). `npm run build` exit 0.
- `git grep "single("` over frontend and scripts: no hits. `lastPage`: one definition (`pageRange.ts:60`), importers are `DirectoryPage.tsx` and the lib check.
- Left for TASK-014: `docs/frontend-patterns.md:629` still lists `lastPage` under `directoryQuery.ts`.
- No database or manual checks needed for this task.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-007-frontend-users-about-polish-perf/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-002-3-new-helper-convert-every-sibling|L-REQ-fs-002-3]]
