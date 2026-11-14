# Router state is not one-shot: it survives a reload, so clear it after you use it ^L-REQ-fs-004-1

| Field | Value |
|---|---|
| ID | LESSON-REQ-fs-004-1 |
| Captured | 2026-10-07 |
| REQ | REQ-fs-004 |
| Component | `frontend/src/routes/`, `frontend/src/components/shell/AppShell/` |
| Tags | routing, react-router, focus, state |
| Severity | guideline (a rule to follow) |
| Supersedes | — |

## The lesson

Router state (`navigate(to, { state })`) stays in `history.state` until the entry is replaced, so a reload or Back brings it back. A flag meant to act once ("focus the heading after a log in") must be cleared by the code that reads it, or act only on a navigation that is really new. Test it by reloading the page you land on.

## Saw it in

- `frontend/src/routes/paths.ts:22` (`AFTER_LOG_IN_STATE`) and `AppShell.tsx` (`focusAfterLogIn`) — a reload right after a log in moves focus to the heading again, and a log in that returns to `/` sets no focus. Found by three reviewers (CORR R2-1, UI-007, QUAL-R2-4); left open as finding n1 for wrap-up.
- Mock servers: see also [[knowledge/gotchas#^g49|G49]].

