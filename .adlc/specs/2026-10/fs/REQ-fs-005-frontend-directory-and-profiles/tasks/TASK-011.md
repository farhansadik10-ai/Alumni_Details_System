# TASK-011 — Alumni profile card (create or edit)

| Field | Value |
|---|---|
| REQ | REQ-fs-005 |
| Tier | 2 |
| Status | pending |
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

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-005-frontend-directory-and-profiles/architecture]]
- Lessons checked: [[knowledge/concepts/partial-update-sent-fields]]; gotchas G34, G37
