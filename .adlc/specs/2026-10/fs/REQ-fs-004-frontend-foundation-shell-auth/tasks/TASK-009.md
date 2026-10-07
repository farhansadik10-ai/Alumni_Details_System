# TASK-009 — Log in and sign-up pages

| Field | Value |
|---|---|
| REQ | REQ-fs-004 |
| Tier | 5 |
| Status | pending |
| Repo | alumni-details-system |
| Depends on | TASK-008 |
| Blocks | TASK-011 |

## Goal

A visitor can sign up as Student or Graduate and log in, with every validation and error case of the spec, on pages that match `login.html`, `login-dark.html` and `signup.html`.

## Files to touch

| Path | Action |
|---|---|
| `frontend/src/components/auth/AuthLayout/AuthLayout.tsx + AuthLayout.module.css` | create |
| `frontend/src/pages/LoginPage/LoginPage.tsx + LoginPage.module.css` | rewrite |
| `frontend/src/pages/SignUpPage/SignUpPage.tsx + SignUpPage.module.css` | rewrite |

## Approach

- **`AuthLayout`.** Props: `headline`, `sub`, `children`. Two flexible columns that wrap, as in `login.html` (`flex: 1 1` with a basis token, so they stack on narrow screens without a media query). Left, a `<section>` on `--band`: the app name (`APP_NAME`), then the accent bar, the headline (band heading size) and the sub text (`--band-muted`), then the line "For students, alumni and university staff." Right, `<main>`: `ThemeSwitch variant="icons"` at the top right, then the form centered with max width `--form-max`. The headline on the band is a `<p>`, not a heading; the page's one `<h1>` is the form title.
- **Log in.** Headline "Stay close to the people you studied with.", sub "Find graduates, follow their news and ask for advice." Form (`noValidate`): `<h1>` "Log in" (Display size), the line "Use the email you signed up with.", `TextInput` Email (`type="email"`, `autoComplete="email"`, `size="lg"`, `maxLength={100}`), `PasswordInput` Password (`autoComplete="current-password"`), `Checkbox` "Remember my email on this device", primary `lg` full-width `Button type="submit"` "Log in" (`busyLabel` "Logging in…"), then under a 1px `--line` rule: "New here? " + strong `Link` "Create an account", and the line "Forgot your password? Contact the alumni office." with `CONTACT_EMAIL` as a `mailto:` link (AC45).
- **Log in behaviour.** On submit run `validateEmail` and `validateLoginPassword`; show each message under its field; focus the first field with an error; send nothing while there is one. Otherwise dispatch `logInAtom` with the trimmed email, the password as typed and `rememberEmail` (the checkbox). Failure 401 → an error `Message` above the fields, "The email or password is not correct.", and focus moves to it. Any other failure → "Something went wrong. Try again." Values stay in the fields. Success → the page does nothing more: the action has saved or removed the remembered email, and the `PublicOnly` guard sends the user to the page they asked for or to the Dashboard. The page never calls `navigate` after a log in, and it must not set state after a successful dispatch (it may be unmounted). The checkbox starts ticked when an email is remembered, and the field starts filled with it.
- **Notices on the log-in page.** Auth notice `sessionEnded` → an error-tone `Message` "Your session has ended. Log in again." above the form. Router state `{ accountCreated: true }` → a success `Message` "Account created. Log in to continue."
- **Sign-up.** Headline "Join your alumni network.", sub "Students can look up graduates and ask for advice. Alumni can share news and offer mentoring." Form: `<h1>` "Create an account"; Full name (`autoComplete="name"`, `maxLength={100}`); Email; Password (`PasswordInput`, `autoComplete="new-password"`, help "At least 8 characters."); `RadioCards` legend "I am a" with Student (value `student`, chosen at first) and Graduate (value `alumni`); Photo link with the `(optional)` note (`type="url"`, placeholder `https://`); primary `lg` "Create account" (`busyLabel` "Creating account…"); under the rule: "Already have an account? " + strong `Link` "Log in".
- **Sign-up behaviour.** On submit run the four validators (AC53); same error display and focus rule. Dispatch `signUpAtom` with a `SignUpUserDTO`: trimmed `name` and `email`, `password` as typed, `role` from the radio, `photo_url` only when the trimmed link is not empty. Failure 409 → "This email is already registered." under Email, focus on Email. Other failure → the general error `Message`. Success with `loggedIn: true` → `showToastAtom("Account created")`, once; the `PublicOnly` guard does the navigation (to the Dashboard), the page does not. Success with `loggedIn: false` → go to `/login` with state `{ accountCreated: true }`.
- Each page calls `useDocumentTitle` ("Log in", "Create an account"). Messages that are not in `lib/validation.ts` are named constants at the top of the page file.

## Acceptance

- [ ] AC44 to AC56: each as written in the spec
- [ ] AC52: the request body's `role` is exactly `student` or `alumni`; check by reading the code path and, if a backend is running, the network tab
- [ ] Compared in a browser with `login.html`, `login-dark.html` and `signup.html` at 1440px and at 360px, in both themes; differences that are not in the architecture's snapping table are listed in the notes
- [ ] Keyboard only: both forms can be filled and sent; an error moves focus to the first wrong field; the role choice changes with the arrow keys
- [ ] `node scripts/frontend-style-check.mjs` exits 0 and `npm run build` exits 0

## Notes

- **Rules for every task of this REQ.** Never read or print any `.env` file. Never run `psql` or anything that changes the database. Never run `git push` or any git command that writes. Touch nothing under `backend/`, `shared/` or `db/`. Delete no file that this task's table does not list. Add no package that this task does not name. If the task cannot be done inside these rules, stop and write why in the implementation notes.
- Read `architecture.md` in this REQ folder first (layout, token names, the size-snapping table). Read `docs/design/README.md` and the screen files this task names. Do not copy inline styles from the screens; read the tokens.
- Compiler rules: `import type` for types, no enums, no unused locals or parameters. No barrel `index.ts` files for components.
- The pictures show the Show button on log in only. Using `PasswordInput` on sign-up too is deliberate: one password control everywhere. Say so in the notes so the reviewer does not flag it as drift.
- Do not show the server's error text. Do not say whether the email or the password was wrong.
- A double press must not send two requests: the button is busy and the submit handler returns early while a request runs.
- `PublicOnly` is the only code that navigates after a log in (architecture.md, "Where the user lands after log in"). A page that also navigates would race with it. The one page navigation that remains is sign-up → `/login` when the account was created but the log in failed, because then there is no session.
- No backend may be running here. Then the 401, 409 and success paths cannot be seen; say exactly which paths were exercised and which are left for the owner's checklist.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-004-frontend-foundation-shell-auth/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-003-4]]
