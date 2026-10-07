# A check must be able to fail: build the case the code could get wrong ^L-REQ-fs-003-4

| Field | Value |
|---|---|
| ID | LESSON-REQ-fs-003-4 |
| Captured | 2026-10-07 |
| REQ | REQ-fs-003 |
| Component | `scripts/api-check.mjs` |
| Tags | testing, check-script, deletes, concurrency |
| Severity | guideline (a rule to follow) |
| Supersedes | — |

## The lesson

Before trusting a passing check, ask what bug it would catch. For a recursive delete, build a chain at least three deep and delete from the top with every level still there. For a lock, send the two requests at the same moment. Expect one exact status, never "400 or 500". Run the wrong-input case before the valid one and assert afterwards that nothing was created.

## Saw it in

- `scripts/api-check.mjs` J11, J12 (first version) — deleted the deepest reply before the top comment, so the recursive delete was only proven for two levels (review finding M4).
- `scripts/api-check.mjs` E07 — sent the second profile create after the first had finished; the per-user lock was never raced until R01 was added (finding m3).
- `scripts/api-check.mjs` A07 — accepted 400 or 500 for a value the database refuses, the exact case the error mapping exists to prevent (finding m3).
