# TASK-011 — Alumni profile card (create or edit)

| Field | Value |
|---|---|
| REQ | REQ-fs-005 |
| Tier | 2 |
| Status | complete |
| Repo | alumni-details-system |
| Depends on | TASK-001, TASK-002, TASK-005, TASK-010 |
| Blocks | TASK-012 |

## Goal

An alumnus or admin can create their alumni profile the first time and edit it after, with every state handled (AC23 to AC25, AC27, AC29 to AC31).

## Files to touch

| Path | Action |
|---|---|
| `frontend/src/components/profile/AlumniProfileCard/AlumniProfileCard.tsx` | create |
| `frontend/src/components/profile/AlumniProfileCard/AlumniProfileCard.module.css` | create |

## Approach

- On mount call `loadMyAlumniAtom`. `loading`/`idle` → skeleton; `error` → `ErrorState` with retry and no form (AC31); `none` → the form empty (create); `ready` → the form filled (edit). The form is **not** remounted when the profile appears after a first save or a 409 (ADV-002): `useFormError`, the message and the focus target live in the outer card, which stays mounted; the values are reset in place with `setValues(alumniToForm(...))`. The card is keyed only on the session's user id, so another user (another tab, ADV-001) always gets a fresh card. A 409 therefore keeps the conflict message on screen, and after the first create focus stays on the Save button.
- Fields: Department, Graduation year, Field, Company, Job title, Experience (`TextInput`s; year is a text input with numeric input mode), LinkedIn link (optional), Bio (`Textarea`), and the boxed `Checkbox` "I am open to mentoring students". Buttons "Save profile" (primary, busy) and "Discard changes" (secondary). The card has an intro line "This is what other people see in the directory."
- Submit: `noValidate`; `validateAlumniForm(values, new Date().getFullYear())`; show each message under its field and focus the first (`firstInvalidField`); no request while an error stands; an error clears when that field is edited. Save → `saveAlumniProfileAtom`: success → toast "Profile saved", form set to `alumniToForm(saved)`; failure → `Message` in the card by `saveFailureText`; 409 → the conflict wording (the profile was reloaded and the form shows it); 403 / 404 on edit → the "can no longer be saved" wording with a "Try again" button that calls `loadMyAlumniAtom`.
- "Discard changes": values back to the last saved (or empty), errors cleared, no confirmation, no request.
- Uses its own `useFormError`, so a failure here never touches the Account card.

- Data already stored may break the new limits (a bio over 2000, a year out of range, a non-web LinkedIn link, a null name). The form still opens; on Save each such field gets its own message in words (not a generic one), so the user can fix it (ADV-008).

## Acceptance

- [ ] ADV-002: after the first create, keyboard focus is still on "Save profile"; after a 409 the conflict message stays visible with the existing profile in the form

- [ ] AC24: with no profile the first save is a POST and the next is a PUT (mock request log); a 409 shows the conflict wording and the form now holds the existing profile
- [ ] AC25: clearing "Company" and saving sends `current_company: null`; no `user_id` in any body
- [ ] AC29 / AC30 / AC31 on the mock: discard, a 500 keeps typed values, a failed load shows no form
- [ ] A student's page never renders this card (checked in TASK-012)
- [ ] No hard-coded text; `npm run build` and style check exit 0

## Notes

Rules for every task of this REQ: see TASK-001. G37: duplicates are not handled. Admin has the same card (POST allowed for the alumni and admin roles).

Implementation notes (TASK-011, 2026-10-08):

- **For TASK-012: how to render it.** `<AlumniProfileCard key={session.userId} />`, only for the alumni and admin roles. Key it on the session user id and on nothing else (not on the profile, not on its status): another user gets a fresh card (ADV-001), and the same user keeps one mounted card (ADV-002). The card takes no props and calls `loadMyAlumniAtom` itself on mount. Pass `primary={false}` to `AccountCard` next to it: "Save profile" is the view's one primary button.
- **One card, one form element.** All state (values, field errors, `useFormError`, the `gone` flag, busy) lives in `AlumniProfileCard`; there is no inner keyed form. `none` and `ready` render the same `<form>` at the same place, so the first create (none to ready) and the 409 reload do not remount it.
- **Values follow the store.** The card remembers the `Alumni` object it was filled from (`filledFrom`). When `myAlumniAtom.alumni` is a different object (a load, a save, the quiet reload after a 409), values and field errors are reset during render, so no frame shows the old values. A failed save leaves the store alone, so typed values stay (AC30).
- **409.** The store reloads quietly before it returns, so the form already shows the existing profile when the conflict message is set; the message stays until the next submit, Discard, or reload.
- **403 / 404 on edit.** `saveFailureReason(failure) === "gone"` adds a secondary "Try again" under the message; it clears the message and calls `loadMyAlumniAtom` (not quiet: skeleton, then the reloaded form, or the load error with no form).
- **ADV-008.** No `maxLength` on any field, so old long values show in full and `validateAlumniForm` gives each its own message on Save.
- **Load error text.** `loadFailureText` is a local copy of the two-line rule `AlumniProfilePage` also has (CAND-016 already asks for one shared helper; making it would touch a file no task names).
- **Design.** Department is a text input as the task says; the picture draws a select. The short fields sit in an auto-fit grid (min 256px, from `--space-8 * 4`), so the card itself decides one or two columns.
- **Not checked in a browser.** AC24, AC25, AC29 to AC31 and ADV-002 need the mock API (TASK-014). `npm run build` (with `tsc -b`), `node scripts/frontend-style-check.mjs` and `npm run check:frontend` pass.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-005-frontend-directory-and-profiles/architecture]]
- Lessons checked: [[knowledge/concepts/partial-update-sent-fields]]; gotchas G34, G37

## Fix round 1 - batch C

- M1 (UI-001): `changed = !sameAlumniForm(values, saved)` (Account: `sameText` on name and photo link). Save and Discard changes use the native `disabled` (Button overwrites `aria-disabled` with its busy flag, and `components/ui` is out of this batch). While busy the save stays enabled-and-busy. Enter in a field cannot submit, and the submit also returns early when nothing changed. Spaces around text do not count as a change.
- A switched-off button would drop focus to the page: after a clean save, or Discard, focus moves to the card heading (`tabIndex={-1}`, `align-self: flex-start` so the ring hugs the words).
- m5 (CORR-005): AlumniProfileCard keeps `sent`; the render-time reset from the store applies only if the form still equals `sent`. AccountCard resets each field only if it still equals what was sent.
- m16: "Try again" on both load errors focuses the card heading, as AlumniProfilePage does with its h1.
- m8 (Q-2): AccountCard.module.css owns card, heading, form and a new `ruled` block; AlumniProfileCard composes all four; `.logOut` composes `ruled`.
- Not checked in a browser in this batch (build, style check and library check only).

## Fix round 2 - batch F

- n1 (R2-001): `canSaveAlumniForm(isNew, values, saved)` in `lib/alumniForm.ts` is `isNew || !sameAlumniForm(values, saved)`. The card passes `mine.status === "none"`. Save's `disabled` and the early return in `handleSubmit` both use it; Discard keeps `changed`. An empty first save sends the nine keys (null / false) as before. After the create the store is `ready`, the form equals the saved one, Save goes off and focus moves to the heading as before.
- n2 (R2-002): Discard is `disabled={!changed || busy}`. It cannot hold focus when a save starts (Enter on it discards, it does not submit), so no focus handling was needed. AccountCard has no Discard button: nothing to fix there.
- Kept: native `disabled`, heading focus after a clean save and after Discard, error focus after a failed save, typing during a save, the key on the session user id.
- Checks: 8 new lib-check cases (333 pass); flipping "new profile, empty form" to false fails as expected, restored. `npm run build` and the style check pass. Not checked in a browser in this batch.
