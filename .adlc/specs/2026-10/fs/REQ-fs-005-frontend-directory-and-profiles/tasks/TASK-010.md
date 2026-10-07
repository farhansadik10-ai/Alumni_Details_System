# TASK-010 — Account card

| Field | Value |
|---|---|
| REQ | REQ-fs-005 |
| Tier | 2 |
| Status | pending |
| Repo | alumni-details-system |
| Depends on | TASK-001, TASK-002, TASK-005 |
| Blocks | TASK-011, TASK-012 |

## Goal

The Account card works for every role: edit the name and photo link, see the email and role, save, log out (AC21, AC27, AC28, AC30, AC33).

## Files to touch

| Path | Action |
|---|---|
| `frontend/src/components/profile/AccountCard/AccountCard.tsx` | create |
| `frontend/src/components/profile/AccountCard/AccountCard.module.css` | create |
| `frontend/src/components/profile/saveFailureText.ts` | create |

## Approach

- Reads `profileAtom`: idle/loading → skeleton; error → `ErrorState` with retry through `loadProfileAtom`; ready → the form. Fields: "Full name" `TextInput`, "Email" disabled `TextInput` with help "Ask an admin to change your email.", read-only "Role" row with `RoleTag`, "Photo link (optional)" `TextInput` with help. Buttons: "Save account" (primary, busy while saving) and "Log out" (secondary). Log out calls `logOutAtom` and sets its own busy state; the page does not navigate (pattern 11).
- Submit: `noValidate`; trim; `validateName` and `validatePhotoLink`; on errors show them under the fields and focus the first; no request. Save → `saveAccountAtom`; success → toast `showToastAtom("Account saved")` and the form shows the saved values; failure → a `Message` in the card (focus moves to it via `useFormError`), everything typed stays, buttons re-enable. A second click while sending does nothing (`sending` ref).
- `saveFailureText(failure, words)`: one function choosing the card-level message from `kind` / `status` (no answer; server error; 403 / 404 "can no longer be saved"; otherwise the general message). The same function is used by `AlumniProfileCard` (TASK-011), so it takes the words as an argument and holds none.

## Acceptance

- [ ] AC21, AC27, AC28 on the mock: header name/photo change at once after a save
- [ ] AC26: a 101-character name, a `ftp://` photo link and an empty name each show a message in words under the field; focus moves to the first
- [ ] AC30: a 500 keeps the typed values; a double click sends one request
- [ ] No hard-coded text; `npm run build` and style check exit 0

## Notes

Rules for every task of this REQ: see TASK-001. The email is disabled and never sent.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-005-frontend-directory-and-profiles/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-004-2-one-rule-one-function-in-lib|L-REQ-fs-004-2]]
