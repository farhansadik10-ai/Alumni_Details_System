# Before the architecture says "no change needed" to a reused part, check it can carry everything the design asks ^L-REQ-fs-005-5

| Field | Value |
|---|---|
| ID | LESSON-REQ-fs-005-5 |
| Captured | 2026-10-08 |
| REQ | REQ-fs-005 |
| Component | `frontend/src/components/ui/`, `components/shell/`, `architecture.md` |
| Tags | architecture, reuse, components, exploration |
| Severity | guideline (a rule to follow) |

## The lesson

"Reuse the part 1 component" is a claim to check, not a default. For each reused component, list what the screen needs from it (router state, a ref to the heading, a way to hide a built-in action, a size, a primary/secondary choice) and read the component to see whether it can. Do the same for an exploration report: it said `apiClient` could not cancel a request (axios already takes a `signal`) and that `Link` and `Band` needed no change (they did). Each wrong "no change" cost an edge-of-radius question mid-implementation.

## Saw it in

- `frontend/src/components/ui/Link/Link.tsx` — took only `to`, so the card link could not carry the directory filters (AC17); a two-line change, asked of the owner.
- `frontend/src/components/alumni/DirectoryFilters/DirectoryFilters.tsx` — had no way to hide its own Clear button, so the empty state's Clear (AC11) was missed until review (`showClear`).
- `frontend/src/components/shell/ProfileBand/ProfileBand.tsx` — no heading ref, so the profile page queries `h1` inside a wrapper div.
- `frontend/src/components/profile/AccountCard/AccountCard.tsx` — `Button` replaces a caller's `aria-disabled`; the design wants one primary button per view, so the card needed a `primary` prop.

## Related

- Originating REQ: REQ-fs-005
- See also: [[knowledge/lessons/LESSON-REQ-fs-002-3-new-helper-convert-every-sibling]]
