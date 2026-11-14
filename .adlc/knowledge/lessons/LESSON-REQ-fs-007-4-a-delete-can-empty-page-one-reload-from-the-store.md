# A list patched locally after a delete can reach zero rows on page 1 while the total is above zero: reload from the store action ^L-REQ-fs-007-4

| Field | Value |
|---|---|
| ID | LESSON-REQ-fs-007-4 |
| Captured | 2026-10-09 |
| REQ | REQ-fs-007 |
| Component | `frontend/src/store/usersAtoms.ts`, `useListAddress` |
| Tags | store, paging, delete, frontend |
| Severity | trap (cost real time before) |

## The lesson

When a delete removes rows from a paged list locally, page 1 can end with zero rows while `total` is still above zero. The shared past-the-end rule only covers page 2 and later (`page > lastPage`), so the page would wrongly say "No users found". Reload in that case, and put the decision in the store action (`refillEmptiedUsersPageAtom`, called by `deleteUserAtom` under the same-user, same-visit guard), not in the page: a page that reads store state and re-parses the query key to decide a reload has the wrong layer.

## Saw it in

- `UsersPage.tsx` first held `refillEmptiedPage` (CAND-014); review ARCH-002 moved it into `store/usersAtoms.ts`. The browser check deleted all 12 rows of a page and saw exactly one reload.

## Related

- Originating REQ: REQ-fs-007
- See also: [[knowledge/lessons/LESSON-REQ-fs-006-3-patched-list-total-needs-a-log-of-local-changes]], [[knowledge/concepts/paged-list-query]]
