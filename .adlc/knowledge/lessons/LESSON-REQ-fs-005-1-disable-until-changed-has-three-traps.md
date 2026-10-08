# A "Save is off until something changed" button has three traps: the create case, focus, and Discard ^L-REQ-fs-005-1

| Field | Value |
|---|---|
| ID | LESSON-REQ-fs-005-1 |
| Captured | 2026-10-08 |
| REQ | REQ-fs-005 |
| Component | `frontend/src/components/profile/`, `frontend/src/lib/alumniForm.ts` |
| Tags | forms, accessibility, focus, frontend |
| Severity | trap (cost real time before) |

## The lesson

When a form's Save button is disabled until a value differs from the saved one, check three cases before you call it done: (1) a **new** record, whose blank form equals "nothing saved", must still be saveable; (2) a button that has keyboard focus and is about to be disabled must hand focus to a stable target in the same step (a disabled button drops focus to the page); (3) every control that resets the form (Discard) must also be off while a save runs, or the save's answer silently undoes it.

## Saw it in

- `frontend/src/components/profile/AlumniProfileCard/AlumniProfileCard.tsx` — the first fix made a new alumnus unable to create a profile (review round 2, R2-001) and left Discard enabled during a save (R2-002); fixed with `canSaveAlumniForm(isNew, values, saved)` in `lib/alumniForm.ts`, `disabled={!changed || busy}`, and a focus hand-off to the card heading.
- `frontend/src/components/profile/AccountCard/AccountCard.tsx` — the same focus hand-off after a save that leaves nothing changed.
- Still open (review item n11): after a 409 on create the reload switches Save off with no focus move.

## Related

- Originating REQ: REQ-fs-005
- See also: [[knowledge/lessons/LESSON-REQ-fs-004-4-check-focus-for-real]], [[knowledge/gotchas#^g53|G53]]
