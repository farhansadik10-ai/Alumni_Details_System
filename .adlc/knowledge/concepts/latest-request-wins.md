# Latest request wins: abort the older call, ignore its late answer, clear on close

| Field | Value |
|---|---|
| Concept | latest-request-wins |
| Status | built in REQ-fs-005 (2026-10-08); browser-checked on a mock API, not yet against the real backend |
| Created | 2026-10-08 |
| Decided by | no ADR (a pattern, not a library or backend decision); written up as pattern 23 in `docs/frontend-patterns.md` |

## The rule

A screen that loads data from several requests in a row (typing in a search box, moving between profiles) must show the answer to the **last** request it sent, never an older one that arrives late, and must show no error for a call it cancelled itself.

## How it is built

1. **One helper.** \`frontend/src/store/latestRequest.ts\` gives \`begin()\` a ticket and an \`AbortSignal\`; it aborts the previous call and retires its ticket. \`cancel()\` retires the ticket too, so a call that takes no signal (\`getMyAlumni\`) is still dropped when it answers.
2. **Every loader uses it.** The directory list, the filter options, one viewed profile and my own profile (\`frontend/src/store/alumniAtoms.ts\`). A loader checks \`isCancelled(error)\` (\`services/apiError.ts\`) before \`toApiFailure\`, so a cancelled call is not an error.
3. **A save cancels the load of the same atom** before it stores its answer, or the older load can overwrite the save.
4. **Clear on close.** A page clears its atom (and cancels its call) when it closes, so a new visit never shows the last visit's list, error or "not found" (see the lesson below).
5. **StrictMode** runs effects twice in development; abort plus ticket make the first call harmless.

## Related

- Lessons: [[knowledge/lessons/LESSON-REQ-fs-005-2-store-state-outlives-the-page|L-REQ-fs-005-2]]
- Gotchas: [[knowledge/gotchas#^g48|G48]]
- Components: [[knowledge/components/frontend-app]]
- Concepts: [[knowledge/concepts/address-as-state]], [[knowledge/concepts/paged-list-query]]
