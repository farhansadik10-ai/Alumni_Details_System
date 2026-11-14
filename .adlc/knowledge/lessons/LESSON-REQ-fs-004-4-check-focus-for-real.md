# Check keyboard focus with a real Tab key, on every background it can sit on, and at the ends of a list ^L-REQ-fs-004-4

| Field | Value |
|---|---|
| ID | LESSON-REQ-fs-004-4 |
| Captured | 2026-10-07 |
| REQ | REQ-fs-004 |
| Component | `frontend/src/components/ui/`, `frontend/src/components/shell/` |
| Tags | accessibility, focus, ui, checks |
| Severity | trap (cost real time before) |
| Supersedes | — |

## The lesson

A script that calls `element.focus()` shows no focus ring on buttons, links, checkboxes or radios, so it proves nothing: press Tab for real (over the browser's debugging port if headless). Then look at each background the control can sit on (`--focus` on an `--action` surface is about 1.8:1 in dark), at full-width elements whose ring is cut at both edges, and at controls that disable themselves on activation (the focused "Next" turns disabled at the last page and focus falls to the page body).

## Saw it in

- `Pagination.tsx:80,105` — focus lost at the last or first page (UI-002, fixed).
- `ui/Toast/ToastViewport.module.css:58` — Dismiss ring drawn in `--on-action`; `PhoneMenu.module.css:98` — ring drawn inside a full-width link.
- TASK-005 to TASK-010 notes — scripted `focus()` read as "no ring"; TASK-010 pressed Tab for real, 68 stops.

