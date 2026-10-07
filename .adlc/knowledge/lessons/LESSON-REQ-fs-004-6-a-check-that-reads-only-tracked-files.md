# A check that reads only tracked files, or only the output, can pass for the wrong reason: prove it finds something ^L-REQ-fs-004-6

| Field | Value |
|---|---|
| ID | LESSON-REQ-fs-004-6 |
| Captured | 2026-10-07 |
| REQ | REQ-fs-004 |
| Component | `.adlc/specs/` check notes, `scripts/frontend-style-check.mjs` |
| Tags | checks, git, verification, build |
| Severity | guideline (a rule to follow) |
| Supersedes | — |

## The lesson

`git grep` reads only tracked files, so on a tree of new uncommitted files it exits "no match" without reading them: add `--untracked`. A search of the build output for "not in the bundle" needs the same search on the source, or a typo in the search string passes as "not found". An approved delete list is approved by its names, not by its count.

## Saw it in

- `check-notes.md` section 1.4 — AC1's `git grep -n antd -- frontend/src` found nothing while 106 files in `frontend/src` were untracked (CAND-044); re-run with `--untracked`.
- TASK-010 — four page-only strings: 0 files in `dist`, 1 in `src` (CAND-038).
- TASK-001 — the plan said 57 legacy files, the real number was 51; the names matched, so the delete was safe (CAND-001).


### Related

- See also: [[knowledge/lessons/LESSON-REQ-fs-003-4]] (a check must be able to fail)
