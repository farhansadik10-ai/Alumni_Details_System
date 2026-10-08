# Load more by the aligned page

| Field | Value |
|---|---|
| Concept | A feed that appends pages with a "Load more" button over a page-numbered API, without showing a post twice or skipping one |
| Status | current as of REQ-fs-006 (2026-10-08) |
| Introduced by | REQ-fs-006 |

## The idea

The API pages by number (`page`, `limit`, ADR-12) and a create or delete moves posts between pages. Asking for "page + 1" after a delete would skip a post for good. So the next page is worked out from how many posts are *held*: `nextFeedPage(held, limit) = floor(held / limit) + 1` (`frontend/src/lib/feedPaging.ts`), and the answer is merged by id, newest first (`mergePosts`). Deleted ids are remembered for the visit (`removedIds`) so a late answer cannot bring a deleted post back, and the total is corrected with a log of this browser's own +1/-1 changes (`totalAfterAnswer`, `store/postAtoms.ts`).

## Limits

- A post that **another user** deletes while the feed is open can make one post be missed until the page is opened again (ADV-001, accepted).
- The total can read one off when a Load more races a write; the next load corrects it (CORR-004, UI-004).

## Related

- Lessons: [[knowledge/lessons/LESSON-REQ-fs-006-3-patched-list-total-needs-a-log-of-local-changes]]
- Concepts: [[knowledge/concepts/paged-list-query]], [[knowledge/concepts/latest-request-wins]]
- Components: [[knowledge/components/frontend-app]]
- Patterns: `docs/frontend-patterns.md` pattern 29
