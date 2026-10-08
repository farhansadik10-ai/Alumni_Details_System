# A list total that is patched locally and also reloaded needs a log of the local changes ^L-REQ-fs-006-3

| Field | Value |
|---|---|
| ID | LESSON-REQ-fs-006-3 |
| Captured | 2026-10-08 |
| REQ | REQ-fs-006 |
| Component | `frontend/src/store/postAtoms.ts`, `frontend/src/lib/feedPaging.ts` |
| Tags | store, paging, state, frontend |
| Severity | guideline (a rule to follow) |

## The lesson

If a page of a list is patched in place (+1 on publish, -1 on delete) and also loaded from the server, a late "load more" answer overwrites the patched total with an older number. Log each local change with its id, apply the ones made during the call to the answer, and skip an id the answer already holds. That rule is exact for page 1 only: a later page's answer can never hold a page-1 post, so a write made during the call stays ambiguous (accepted, one off until the next load).

## Saw it in

- `frontend/src/store/postAtoms.ts` (`totalAfterAnswer`) — "Showing 21 of 20" in round 1 (CORR-001); fixed in round 2; the page-2 edge remains (CORR-004, UI-004, n2).
- `frontend/src/lib/feedPaging.ts` — the "aligned page" rule (`nextFeedPage`) keeps the *requests* right after this browser's own deletes; another user's delete is invisible to it (ADV-001).

## Related

- Originating REQ: REQ-fs-006
- Concepts: [[knowledge/concepts/aligned-load-more]], [[knowledge/concepts/paged-list-query]]
