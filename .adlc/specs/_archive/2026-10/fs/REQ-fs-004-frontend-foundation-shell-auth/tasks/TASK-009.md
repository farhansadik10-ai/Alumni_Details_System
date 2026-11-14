# TASK-009 — Log in and sign-up pages

| Field | Value |
|---|---|
| REQ | REQ-fs-004 |
| Tier | 5 |
| Status | complete |
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

### Implementation notes (task-implementer, 2026-10-07)

**Built.** `components/auth/AuthLayout/AuthLayout.tsx` + `.module.css` (new); `pages/LoginPage/LoginPage.tsx` and `pages/SignUpPage/SignUpPage.tsx` rewritten, each with a new `.module.css`. Two tokens appended to `tokens.css`: `--auth-headline-max` (520px) and `--auth-sub-max` (460px), the widths the pictures give the headline and the sub text. `App.tsx` was not touched.

**Checks.** `npm run build` exit 0; `node scripts/frontend-style-check.mjs` exit 0 (no findings); `npx tsx scripts/frontend-lib-check.ts` 72 passed, exit 0.

**How it was looked at: a mock, never the real API.** Something listens on port 3000 on this machine. No request of this task went there. A throwaway Vite dev server (port 5199, started from a script in the session's temp folder, with **no proxy at all**) answered `/api` itself and kept a list of what it was sent. Headless Chrome was driven over the debugging port with real Tab, Enter, Space and arrow keys. The script, the screenshots, the browser profile and the Vite cache are deleted; the server and Chrome are stopped. Port 3000 was not started, stopped or called.

**Seen in the browser against the mock** (no console error or warning in any pass):

- AC44, AC45: the page at 1440px in light and dark beside `login.html` / `login-dark.html`. Columns 720 + 720; headline 60px; inputs, password box and button 48px high, 420px wide; one `<h1>`; tab title "Log in · University Alumni"; the forgot-password line with a `mailto:` link.
- AC46: empty submit → both messages, focus on Email, 0 requests. `abc` → the shape message, focus on Email. Good email, empty password → focus on Password, 0 requests. The field has `aria-invalid` and `aria-describedby` on the message.
- AC47: mock 401 → "The email or password is not correct." above the fields, focus on it, values kept. The body the mock got: password `"  pass word  "` exactly as typed. The server's own text was not shown.
- AC48: mock 500 and a cut connection → "Something went wrong. Try again.", focus on it, values kept.
- AC49: Enter twice, then a click on the button, then `requestSubmit()`, while a 1.5-second request ran → the button read "Logging in…" with `aria-busy`, and the mock got one log-in request. Same on sign-up ("Creating account…", one `POST /api/users`).
- AC50: ticked → after log in `ua.rememberedEmail` holds the email; after Log out and on a reload the field is filled and the box ticked. Unticked → the key is gone after the next log in. Storage never held the password.
- Landing: log in from `/login` → `/dashboard`; asked for `/feed?x=1` first → back to `/feed?x=1`. The page itself made no navigation.
- Notices: an expired token at load → `/login` with "Your session has ended. Log in again." After Log out: no notice.
- AC51, AC52: sign-up at 1440px beside `signup.html`, and in dark. A real `<fieldset>` with the legend "I am a", two radios named `role` with the values `student` and `alumni`, Student chosen at first. Bodies the mock got: `role: "alumni"` after choosing Graduate, `role: "student"` otherwise.
- AC53: empty submit → three messages, focus on Full name. Then one by one: focus went to Email, then Password (7 characters), then Photo link (`ftp://x/y.png`), with 0 requests. A photo link of only spaces was sent as `photo_url: null`; `" https://example.com/p.png "` was sent trimmed; the name was sent trimmed; the password with its spaces.
- AC54: mock 409 → "This email is already registered." under Email, focus on Email, no general message.
- AC55: success → `/dashboard` with one toast "Account created". Account made but log in failing (mock 500 on the log in) → `/login` with the success message "Account created. Log in to continue."
- AC56: at 360px (and 720px, which is 1440px at 200% zoom, and 800px) the panel sits above the form; `scrollWidth` equals the window in both themes, also with all the error messages showing.
- Keyboard: Tab order on log in is Light, Dark, System, Email, Password, Show, the checkbox, Log in, Create an account. On sign-up: the three theme buttons, Full name, Email, Password, Show, the chosen radio, Photo link, Create account, Log in. Space ticks the checkbox; arrow right / left / down change the role; Enter in a field sends the form. A button reached by Tab has the 3px `--focus` ring.

**Left for the owner's checklist against the real backend.** Everything above was against answers the mock made up, so these are not proven: that the real server answers 401 for a wrong log in and 409 for a taken email; that a real token is accepted by `readToken`; that a real sign-up writes the row with the right role; the header showing the real name after log in. Also not seen: the production build in a browser, Firefox, Safari, a real screen reader, a touch screen, a browser's own password manager and autofill.

**Differences from the pictures that are not in the snapping table.**

- **Phone (360px).** The pictures have no phone rule: the headline stays 64px and the paddings 56px. Built: the headline is the band heading token, so it is 36px below 768px (README, "band heading drops to 36px"), and the paddings are 32px top and bottom and the gutter (16px) at the sides. Between 768px and 840px the two columns are already stacked but the headline is still 60px.
- **Checkbox.** Drawn ticked. Built: ticked only when an email is remembered (the task says so).
- **Show button on sign-up.** The picture shows it on log in only. `PasswordInput` is used on both on purpose: one password control everywhere (task note).
- **Forgot-password line.** Not in the picture (design-system.md says so). Built as the sentence followed by the address itself as the link, so a user with no mail program can still read it. If the sentence should be the link instead, change one line in `LoginPage.tsx`.
- **Gaps.** Form gap 20px → 24px on log in and 18px → 16px on sign-up (nearest step). The 6px above the sign-up button is dropped (`Button` takes no class). The gap under the theme switch is 32px on both pages (drawn 32px and 24px). Panel padding 56px → 48px and theme switch 40px → 36px are in the table.

**Choices the task text left open.** Say so if any should change.

1. **A field's error goes away when the user edits that field.** Validation still runs only on submit.
2. **The two notices on log in leave once a request has been sent**, so "Your session has ended" never stands beside "The email or password is not correct."
3. **The notices sit at the top of the form, above the `<h1>`; a request error sits under the title, above the fields.**
4. **Sign-up → `/login` uses `replace`**, so Back does not return to a form for an account that already exists.
5. **`{ accountCreated: true }` is written in `SignUpPage.tsx` and read in `LoginPage.tsx`** with a comment on each side. A shared constant would need a file no task names.
6. **The shared form styles** (title, the block under the rule) are classes in `AuthLayout.module.css` that the two page stylesheets take with `composes`, as `TextInput` does with `Field`.
7. **The pages pass trimmed values** although the actions trim again; the photo link is left out of the object when empty and the action turns that into `null`.
8. **After a success the button stays busy.** The page sets no state then (task rule). If the guard ever failed to move the user, the form would stay locked until a reload.
9. **`type="email"` inputs drop spaces at both ends by themselves** in Chrome, so the email trim could not be seen in the browser. TASK-003's store harness checked the action's trim.

**One probe oddity, for honesty.** In one run, key and mouse events stopped reaching the page after a synthetic mouse press, and a Space on the Graduate radio did nothing. A fresh browser showed Space, the arrows and Tab all working, three runs in a row. It was the driver, not the page.

**Follow-ups, not done here.**

- No `autoFocus` on the first field of either page. Not asked for.
- The log-in page does not fill in the email after "Account created. Log in to continue."; the user types it again.
- `GENERAL_ERROR_MESSAGE` is written in both page files. One shared constant would need a new file.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-004-frontend-foundation-shell-auth/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-003-4]]
