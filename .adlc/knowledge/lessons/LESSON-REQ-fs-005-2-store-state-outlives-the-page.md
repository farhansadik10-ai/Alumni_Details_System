# State kept in a store atom outlives the page: clear it on close and never trust a matching key ^L-REQ-fs-005-2

| Field | Value |
|---|---|
| ID | LESSON-REQ-fs-005-2 |
| Captured | 2026-10-08 |
| REQ | REQ-fs-005 |
| Component | `frontend/src/store/alumniAtoms.ts`, the three pages |
| Tags | state, jotai, frontend, stale-data |
| Severity | trap (cost real time before) |

## The lesson

A page that reads a store atom keyed by an id or an address will show the **last visit's** list, error or "not found" for one frame when the key happens to match. Do not decide "this state is current" from the key alone: clear the atom when the page closes (and cancel its request), and treat "idle" as loading. A once-per-key guard ("I already fixed this address") must be cleared when the condition ends, or the same key can never be fixed twice. A clear action must also stop writers that are not requests (a save that finishes after the page closed can put "ready" back).

## Saw it in

- `frontend/src/pages/AlumniProfilePage/AlumniProfilePage.tsx` — an old error or not-found shown for a frame (review CORR-004 / ARCH-005); fixed with `clearViewedAlumniAtom` on close.
- `frontend/src/pages/DirectoryPage/DirectoryPage.tsx` — the `clampedKey` guard kept the last past-the-end address and left an endless skeleton (CORR-003); the list showed for a frame on Back.
- `frontend/src/store/alumniAtoms.ts` — `clearMyAlumniAtom`; open trivial: a save that ends after close can restore "ready".

## Related

- Originating REQ: REQ-fs-005
- Concepts: [[knowledge/concepts/latest-request-wins]]
- See also: [[knowledge/gotchas#^g48|G48]]
