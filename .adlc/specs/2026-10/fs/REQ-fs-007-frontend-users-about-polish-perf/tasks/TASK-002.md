# TASK-002 — Address helpers shared; lastPage moves

| Field | Value |
|---|---|
| REQ | REQ-fs-007 |
| Tier | 0 |
| Status | pending |
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

- [ ] `npx tsx scripts/frontend-lib-check.ts` passes; the old `readDirectoryQuery` and `lastPage` cases all still pass.
- [ ] `git grep -n "lastPage" -- frontend scripts` shows one definition, in `pageRange.ts`.
- [ ] `npm run build` and `node scripts/frontend-style-check.mjs` exit 0.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-007-frontend-users-about-polish-perf/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-002-3-new-helper-convert-every-sibling|L-REQ-fs-002-3]]
