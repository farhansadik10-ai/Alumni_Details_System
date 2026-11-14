# A rule that several guards must agree on lives in one function in `lib/`, where the check script can reach it ^L-REQ-fs-004-2

| Field | Value |
|---|---|
| ID | LESSON-REQ-fs-004-2 |
| Captured | 2026-10-07 |
| REQ | REQ-fs-004 |
| Component | `frontend/src/lib/`, `frontend/src/routes/`, `frontend/src/store/wireApi.ts` |
| Tags | guards, session, lib, checks |
| Severity | guideline (a rule to follow) |
| Supersedes | — |

## The lesson

Write a rule that two or more places must judge the same way ("is the session live", "is this return address safe", "which pages to show") once, as a pure function in `lib/`, and have every caller use it. Two benefits: the callers cannot drift apart (a guard that disagrees with its opposite makes a redirect loop), and the no-test-runner check script, which imports only `lib/`, can reach the logic.

## Saw it in

- `RequireAuth.tsx:23`, `PublicOnly.tsx:42`, `store/wireApi.ts:16` — the same expiry test three times (findings m9, QUAL-006, ARCH-001); now `isLiveSession` in `lib/token.ts`.
- `PublicOnly.tsx` (`readReturnAddress`, the open-redirect guard) and `Pagination.tsx` (`pageRange`) — real logic with no check, because it sat outside `lib/` (finding M2); moved to `lib/returnAddress.ts` and `lib/pageRange.ts`, 36 new check cases.


### Related

- See also: [[knowledge/lessons/LESSON-REQ-fs-002-3]] (the same drift, one level up), [[knowledge/lessons/LESSON-REQ-fs-003-2]]
