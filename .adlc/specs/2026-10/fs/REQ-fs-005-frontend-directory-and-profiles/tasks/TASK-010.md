# TASK-010 — Account card

| Field | Value |
|---|---|
| REQ | REQ-fs-005 |
| Tier | 2 |
| Status | complete |
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

Implementation notes (TASK-010, 2026-10-08):

- **`saveFailureText` for TASK-011.** `components/profile/saveFailureText.ts` exports:
  - `saveFailureReason(failure: ApiFailure): "noAnswer" | "server" | "gone" | "conflict" | "general"`: network → noAnswer; status 500 and up → server; 403/404 → gone; 409 → conflict; else general.
  - `saveFailureText(failure, words: SaveFailureWords): string`, where `SaveFailureWords = { noAnswer; server; gone; conflict?; general }`. With no `conflict` word, a 409 gets `general`.
  - TASK-011 passes `SAVE_FAILED_NO_ANSWER`, `SAVE_FAILED_SERVER`, `SAVE_FAILED_GONE`, `SAVE_FAILED_CONFLICT` and `GENERAL_ERROR_MESSAGE`. It shows the "Try again" button when `saveFailureReason(failure) === "gone"`, so the rule is not written twice.
- **The `primary` prop (for TASK-012).** `AccountCard` takes `primary?: boolean` (default `true`). The task asked for a primary "Save account". But the design has "Save account" as a secondary button next to the alumni card's primary "Save profile", and design-system.md says "One primary (accent) button per view". So TASK-012 passes `primary={false}` when the Alumni profile card is shown. A student's page keeps the default.
- **Account card words.** The card uses `SAVE_FAILED_GONE` for 403/404. It says "This profile…". That is close enough for a deleted account, but the gate may want a word for the account card. The card has no retry button for "gone"; the task did not ask for one.
- **Structure.** `AccountCard` handles the status (skeleton, `ErrorState` with retry, or the form). The form is an inner `AccountForm` with `key={user.id}`, so it starts from the loaded user and never keeps another user's values. After a save the profile atom changes but the id does not, so the form stays mounted and takes the saved values from the answer.
- **Load error words.** `profileAtom` keeps no failure, so the error state always says `FAILURE_NO_ANSWER_TEXT`.
- **No `maxLength` on the name.** A pasted 101-character name (or old stored data) shows the validator message (AC26), instead of being cut off without a word.
- **Not checked in a browser.** The ACs that need the mock (AC21, AC27, AC28, AC30 double click) are for the browser review in TASK-014. The code path: the `sending` ref plus `Button busy` stops a second submit.
- `npm run build` (with `tsc -b`) and `node scripts/frontend-style-check.mjs` pass.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-005-frontend-directory-and-profiles/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-004-2-one-rule-one-function-in-lib|L-REQ-fs-004-2]]

## Fix round 1 - batch C

- m7 (Q-1, ARCH-003): the save rule is now `frontend/src/lib/saveFailure.ts`; the shape (`CallFailure`, was `LoadFailure`) and 403/404/409/500 are named once in `lib/loadFailure.ts`. `components/profile/saveFailureText.ts` is no longer imported but still on disk: the owner deletes it (agents may not delete files). `store/alumniAtoms.ts:87` still writes its own 404 (batch A's file): follow-up.
- m9 (REFL-001): `presentText` (now also takes undefined) replaces `textOrNull` and the `.trim() || null` copies in alumniActions, sessionActions (sign-up: same meaning, an absent name or photo becomes null), Header and PhoneMenu. Search after: one definition.
- Library check: 12 save-words, 5 same-text/present and 7 same-form cases appended; one expectation flipped to prove a case fails, then put back.
