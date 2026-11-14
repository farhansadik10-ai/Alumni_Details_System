# Measure build size with one fixed command and compare by content group, not by chunk name ^L-REQ-fs-007-1

| Field | Value |
|---|---|
| ID | LESSON-REQ-fs-007-1 |
| Captured | 2026-10-09 |
| REQ | REQ-fs-007 |
| Component | `frontend/dist`, `build-size.md` |
| Tags | performance, build, vite, process |
| Severity | guideline (a rule to follow) |

## The lesson

Measure the "before" and the "after" with the same commands (`wc -c`, `gzip -c` at its default level) and never mix in the gzip kB that Vite prints. Compare by group (entry, pages, shared chunks, fonts), not by file name: Vite names a shared chunk after whichever module lands in it, so one identical file can appear under two names.

## Saw it in

- `build-size.md` in the REQ-fs-007 folder: Vite printed 98.14 kB for the entry script, `gzip -c` gave 98,078 bytes and `gzip -9` 97,819 bytes. Mixing them would have shown a change that never happened.
- `saveFailure-qy1Ih9V_.css` became `Textarea-qy1Ih9V_.css` with the same hash. `gzip -c` also stores the file name, so a renamed but identical file differs by a few bytes.
- Take the "before" number before any task changes code: TASK-001 depended-on by every code task for that reason.

## Related

- Originating REQ: REQ-fs-007
