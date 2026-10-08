# Frontend patterns

This file lists the patterns the new frontend uses. A pattern is a way of doing one thing that we do the same way everywhere.

It was written at the end of part 1 of the redesign (REQ-fs-004: foundation, theme, base components, app shell, log in and sign-up). It describes the code as it was built. Parts 2 to 4 add to it; see "How to add to this file" at the end.

Every pattern has the same three parts:

- **What it is**: the rule, in a few sentences.
- **Where it lives**: the real files. Open them; they are short.
- **Why we chose it**: the reason, and what we did not choose.

Two decision records hold the longer reasoning: `.adlc/architecture/adr-13-frontend-structure-css-modules-on-tokens.md` (structure and styles) and `.adlc/architecture/adr-14-session-and-theme-kept-in-the-browser.md` (session and theme). The look itself is in `docs/design/README.md` and `.adlc/context/design-system.md`.

## Contents

1. [Layers that depend one way](#1-layers-that-depend-one-way)
2. [Design tokens as CSS variables, with two theme blocks](#2-design-tokens-as-css-variables-with-two-theme-blocks)
3. [CSS Modules with no literals, guarded by a script](#3-css-modules-with-no-literals-guarded-by-a-script)
4. [Theme applied before the first paint](#4-theme-applied-before-the-first-paint)
5. [One config file for the app name and the contact email](#5-one-config-file-for-the-app-name-and-the-contact-email)
6. [One Jotai store that code outside React can reach](#6-one-jotai-store-that-code-outside-react-can-reach)
7. [Actions are write-only atoms that return a result](#7-actions-are-write-only-atoms-that-return-a-result)
8. [One API client that is handed its two hooks](#8-one-api-client-that-is-handed-its-two-hooks)
9. [One failure shape; each screen chooses its own words](#9-one-failure-shape-each-screen-chooses-its-own-words)
10. [One way to end a session](#10-one-way-to-end-a-session)
11. [Route guards as layout routes; one decider after a log in](#11-route-guards-as-layout-routes-one-decider-after-a-log-in)
12. [Every address in one object](#12-every-address-in-one-object)
13. [Pages loaded on demand](#13-pages-loaded-on-demand)
14. [The page frame: PageLayout, PageNote and the being-built page](#14-the-page-frame-pagelayout-pagenote-and-the-being-built-page)
15. [Field wires the label, the help text and the error](#15-field-wires-the-label-the-help-text-and-the-error)
16. [Forms without a form library; validators are pure functions](#16-forms-without-a-form-library-validators-are-pure-functions)
17. [The native dialog element for the dialog and the phone menu](#17-the-native-dialog-element-for-the-dialog-and-the-phone-menu)
18. [A table that turns into cards on a phone](#18-a-table-that-turns-into-cards-on-a-phone)
19. [Toasts: a list in the store and one live region](#19-toasts-a-list-in-the-store-and-one-live-region)
20. [Icons as small components](#20-icons-as-small-components)
21. [Browser storage that never throws](#21-browser-storage-that-never-throws)
22. [A components page for development only](#22-a-components-page-for-development-only)
23. [A list loaded into an atom; the latest request wins](#23-a-list-loaded-into-an-atom-the-latest-request-wins)
24. [Search, filters and page kept in the address](#24-search-filters-and-page-kept-in-the-address)
25. [A form that loads first, then creates or edits](#25-a-form-that-loads-first-then-creates-or-edits)
26. [The person band](#26-the-person-band)
27. [The profile address and the "came from the directory" state](#27-the-profile-address-and-the-came-from-the-directory-state)
28. [One rule, one function in lib](#28-one-rule-one-function-in-lib)
29. [A feed that loads more by the aligned page and merges by id](#29-a-feed-that-loads-more-by-the-aligned-page-and-merges-by-id)
30. [One open comment thread, patched from the server's answers](#30-one-open-comment-thread-patched-from-the-servers-answers)
31. [One owner rule for posts and comments](#31-one-owner-rule-for-posts-and-comments)
32. [Shared forms for create and edit: PostForm and CommentForm](#32-shared-forms-for-create-and-edit-postform-and-commentform)
33. [Small blocks that fail on their own, one atom per kind with a key](#33-small-blocks-that-fail-on-their-own-one-atom-per-kind-with-a-key)

---

## 1. Layers that depend one way

**What it is.** The code is in layers, and a layer only imports from the layers below it:

```
pages, components, routes  ->  store (atoms and actions)  ->  services  ->  the API
pages, components, store   ->  lib (pure functions)
```

A page or a component never imports `axios` and never imports anything from `services/`, not even a type. It reads atoms and calls actions. `services/` knows nothing about the store. `lib/` knows nothing about React or the browser at import time.

**Where it lives.**

- Pages: `frontend/src/pages/`. Components: `frontend/src/components/`. Guards: `frontend/src/routes/`.
- Store: `frontend/src/store/`. Services: `frontend/src/services/`. Pure functions: `frontend/src/lib/`.
- The guard: rule d of `scripts/frontend-style-check.mjs` fails the check when a file under `components/`, `pages/`, `routes/`, `hooks/` or `icons/` imports `axios` or `services/`. Rule k fails it when a file under `lib/` imports React, the router, `services/` or `store/`.
- An example of the rule being followed: `frontend/src/pages/SignUpPage/SignUpPage.tsx` takes its failure type through the result of an action in `frontend/src/store/sessionActions.ts`, not from `services/`.

**Why we chose it.** A screen that calls the API itself has to deal with the token, the 401 and the error words on its own, and soon two screens do it in two ways. With layers, that work is written once. It also mirrors the backend (routes, controllers, Managers, Query classes), so there is one idea to learn.

We did not allow type-only imports from `services/` in UI code. It would be harmless today, but "no import from `services/` at all" is a rule a script can check and a person can remember. If a screen needs a type, the store exports it or re-exports it.

---

## 2. Design tokens as CSS variables, with two theme blocks

**What it is.** Every color, size, weight and space is a named CSS variable, for example `--surface`, `--space-4`, `--control-h`. They all live in one file with four blocks, plus one block for later additions:

1. Colors, light. On `:root` and `[data-theme="light"]`.
2. Colors, dark. On `[data-theme="dark"]`.
3. Everything that is not a color (type, spacing, shape, control sizes, layout, layers). The same in both themes.
4. The few tokens that change on a phone (below 768px), redefined once inside one media query.
5. "Added by later tasks": sizes that later work needed, each with a comment that says where it comes from.

Both color blocks also set `color-scheme`, so the browser's own parts (scroll bars, the date picker) match.

A component never asks which theme is on. It reads `var(--surface)` and gets the right value.

**Where it lives.**

- `frontend/src/styles/tokens.css` (all tokens)
- `frontend/src/styles/base.css` (reset, body, headings, the focus ring, reduced motion, the `visuallyHidden` helper)
- Both are imported once, in `frontend/src/main.tsx`.
- The 27 color names and values come from `docs/design/README.md`, section 2.

**Why we chose it.** One switch (`data-theme` on `<html>`) changes the whole app, and no component can get a theme wrong because no component knows about themes. A buyer who wants another accent color changes one file.

We did not use a UI library (antd was removed), a CSS framework, or a theme object in JavaScript. A theme in JavaScript needs React to run before the page has colors, which gives a flash on load (see pattern 4). We did not add a new token for every size in the design pictures either: a size that is off the scale was moved to the nearest step, and the list of those moves is in the architecture file of REQ-fs-004.

**To add a token:** append it to the "Added by later tasks" block of `frontend/src/styles/tokens.css` with a comment. Do not add a color without asking the owner; the 27 are the design.

---

## 3. CSS Modules with no literals, guarded by a script

**What it is.** Each component has its own stylesheet next to it, named after it: `Button.tsx` and `Button.module.css`. Class names are local to the file, so two components can both have `.title`.

A component stylesheet holds no color value and no `px`, `em` or `rem` number. Every value is a token. There is one exception, always written the same way, because CSS variables do not work inside a media query:

```css
@media (max-width: 767.98px) {
```

When two stylesheets need the same block, one owns it and the other takes it with `composes`. Nothing is copied.

**Where it lives.**

- An ordinary pair: `frontend/src/components/ui/Button/Button.tsx` and `frontend/src/components/ui/Button/Button.module.css`.
- `composes` in use: `frontend/src/components/ui/TextInput/TextInput.module.css` takes the shared control box from `frontend/src/components/ui/Field/Field.module.css`. `frontend/src/pages/LoginPage/LoginPage.module.css` takes the shared form styles from `frontend/src/components/auth/AuthLayout/AuthLayout.module.css`.
- The guard: `scripts/frontend-style-check.mjs`. It has eleven rules, a to k:
  - a: no color literal outside `tokens.css`
  - b: no `px`, `em` or `rem` number in a module stylesheet or in `base.css`
  - c: no import of `antd`, `@ant-design` or `@fontsource-variable/inter`
  - d: no import of `axios` or `services/` from UI folders (pattern 1)
  - e: the app name and the contact email are written only in the config file (pattern 5)
  - f: no `onClick` on a `<div>` or a `<span>`, and no `role="button"` on either
  - g: no `dangerouslySetInnerHTML`
  - h: no `box-shadow`, no gradient, no `outline: none`
  - i: no address from `routes/paths.ts` and no storage key (`ua.…`) written as a string outside their config files
  - j: every `@media (max-width: …)` line in a stylesheet equals the phone query in `config/layout.ts`
  - k: no import of `react`, `react-dom`, `react-router-dom`, `services/` or `store/` from `lib/` (pattern 1; type imports of `@alumni/shared` are fine)

**Why we chose it.** "All values come from tokens" is easy to agree on and easy to break by accident. A script that fails makes the rule real. CSS Modules come with Vite, so they cost no package.

We did not choose inline styles (they cannot use hover, focus or media queries, and they hide values from the check), CSS-in-JS (a package, and styles that need JavaScript to run), or one big global stylesheet (names clash as the app grows).

Known limits of the check: it does not read `frontend/index.html`; a string such as `"#feed"` reads as a hex color; `text-shadow` and `drop-shadow` are not in rule h.

---

## 4. Theme applied before the first paint

**What it is.** The theme choice is `light`, `dark` or `system`. It is saved in the browser under the key `ua.theme`. Nothing saved means `system`.

Two pieces of code set `data-theme` on `<html>`, and they must agree:

1. A short plain script in the `<head>` of the page. It runs before any stylesheet or app code. It reads the saved choice, asks the system when the choice is `system`, and sets `data-theme`. If storage cannot be read, it uses the system's answer; if that fails too, light.
2. The theme store, once the app runs. It holds the choice, saves it, applies it, follows a live change of the system setting while the choice is `system`, and follows a change made in another tab.

The listeners in the store are added once, when the file is first loaded. `main.tsx` imports the file for that reason, so every page follows the system, also a page with no theme switch on it.

**Where it lives.**

- The head script: `frontend/index.html` (look for the comment that starts with `THEME-SCRIPT`)
- The store: `frontend/src/store/themeAtoms.ts`
- The import that loads the listeners: `frontend/src/main.tsx`
- The switch: `frontend/src/components/shell/ThemeSwitch/ThemeSwitch.tsx` (two looks: icon buttons and text buttons)
- The key: `frontend/src/config/storageKeys.ts`

**Why we chose it.** If React sets the theme, the page is first drawn light and then turns dark. A user with dark saved sees a white flash on every reload. A script in the head runs before anything is drawn, so there is no flash.

We did not put the theme in a cookie read by the server (there is no server-side rendering here), and we did not write the key by hand in `index.html` (see pattern 5 for how it gets there).

If a strict Content-Security-Policy is ever added, an inline script is blocked. Then move the script to a file in `frontend/public/` (noted in ADR-14).

---

## 5. One config file for the app name and the contact email

**What it is.** The app is white-label: a buyer gives it their own name. So the name is written in exactly one place, and so is the alumni office's email. Everything else imports the two constants.

`index.html` cannot import anything. So it holds two placeholders, `%APP_NAME%` and `%THEME_STORAGE_KEY%`, and a small Vite plugin replaces them when the page is served or built. The plugin escapes `&`, `<` and `>` in the name, so a name like "Smith & Sons" is still valid HTML.

The two config files hold plain constants only. No DOM and no imports, because the Vite config (which runs in Node) imports them.

**Where it lives.**

- `frontend/src/config/app.ts` (`APP_NAME`, `CONTACT_EMAIL`)
- `frontend/src/config/storageKeys.ts` (the three browser storage keys)
- The plugin: `frontend/vite.config.ts` (`indexHtmlConstants`)
- The tab title: `frontend/src/hooks/useDocumentTitle.ts` sets "Page · App name"
- The guard: rule e of `scripts/frontend-style-check.mjs` reads the two values from the config file and fails if either appears in any other file under `frontend/src`.

**Why we chose it.** A rename is one edit, and a script proves nobody typed the name a second time.

We did not use a `.env` variable. `VITE_API_URL` already sits unused in `frontend/.env`, and an env file is one more thing to get wrong at deploy time. We did not hard-code the name in `index.html` either; the fallback (write it there and let the check compare) was not needed because the plugin works.

`CONTACT_EMAIL` is still the placeholder `alumni-office@example.com`. The owner replaces it.

---

## 6. One Jotai store that code outside React can reach

**What it is.** All shared state is in Jotai atoms. There is one store, made by hand, and given to React's `Provider`. Because it is a plain object, code that is not a component can read and write it too: the 401 handler, the start-up check, the listeners for other tabs.

Atoms are grouped by topic, one file per topic. State that belongs to one screen (the text in a form field, "is this menu open") stays in that component with `useState`.

**Where it lives.**

- The store: `frontend/src/store/appStore.ts`
- Given to React in `frontend/src/main.tsx`
- Topics: `frontend/src/store/sessionAtoms.ts`, `frontend/src/store/sessionActions.ts`, `frontend/src/store/profileAtoms.ts`, `frontend/src/store/themeAtoms.ts`, `frontend/src/store/toastAtoms.ts`, and from part 2 `frontend/src/store/alumniAtoms.ts`, `frontend/src/store/alumniActions.ts`, `frontend/src/store/latestRequest.ts`
- Used from outside React in `frontend/src/store/wireApi.ts` and `frontend/src/store/themeAtoms.ts`

**Why we chose it.** The project rule is "state in Jotai atoms". Jotai's default store is hidden inside React, so the API client could not tell it "this user is logged out". With our own store, one line does it.

We did not choose Redux or a React context per topic. Atoms are small, and a component re-renders only for the atoms it reads.

Two details that matter when you add atoms:

- An atom has no clock. `sessionAtom` says who the token is for; it does not say whether the token has run out. Code that needs the time calls `isLiveSession(session, Date.now())` (in `lib/token.ts`, with `isAdmin`) itself.
- Storage is written by the atom that owns the value (`tokenAtom`, `themeChoiceAtom`). A change that comes from another tab is taken into memory without writing storage again, so two tabs cannot keep answering each other.

---

## 7. Actions are write-only atoms that return a result

**What it is.** Anything that changes shared state through a rule is an action: log in, sign up, log out, end a session, load the profile, show a toast. An action is an atom with no value to read, only a write function. A component gets it with `useSetAtom` and calls it.

Three rules for actions:

1. **They return a result and never throw.** `logInAtom` answers `{ ok: true }` or `{ ok: false, failure }`. The page needs no `try`/`catch`.
2. **They do not navigate.** They change the session; the route guards see the change and move the user (pattern 11).
3. **A change of several atoms happens in one step.** After an `await`, each `set` would tell React on its own, and a guard could see a half-changed session. So the token, the profile and the notice change together inside one small helper atom (`startSessionAtom`, `clearSessionAtom`). The token is set last.

Trimming happens twice, on purpose. The pages trim the email, name and photo link before they call an action (and SignUpPage leaves an empty photo link out); the actions trim them again, so a caller that skips a page still sends clean values. The password is never trimmed; the email keeps its letter case. The actions send an empty name or photo link as `null`.

**Where it lives.**

- `frontend/src/store/sessionActions.ts` (`logInAtom`, `signUpAtom`, `logOutAtom`, `endSessionAtom`, `tokenChangedElsewhereAtom`)
- `frontend/src/store/profileAtoms.ts` (`loadProfileAtom`)
- `frontend/src/store/toastAtoms.ts` (`showToastAtom`, `dismissToastAtom`)
- A caller: `frontend/src/pages/LoginPage/LoginPage.tsx`
- From part 3, the writes of the feed: `frontend/src/store/postActions.ts` (`publishPostAtom`, `savePostAtom`, `deletePostAtom`, `addCommentAtom`, `saveCommentAtom`, `deleteCommentAtom`). Each returns `{ ok: true }` or `{ ok: false, failure }`. The page or the component shows the toast and moves focus; the action does neither. A write remembers the user and the visit when it starts, and patches nothing if either changed before the answer came (pattern 30).

**Why we chose it.** When a log in works, the log-in page may be gone before the action returns. Work that must happen (save the remembered email, set the token) is therefore inside the action, not in the page. A result object makes every outcome visible in the type, so a screen cannot forget one.

We did not choose custom hooks that hold the logic (they die with the component) or actions that throw (every caller would need the same `try`/`catch`).

---

## 8. One API client that is handed its two hooks

**What it is.** There is one axios client. It adds the token to each request. It does not know where the token is kept or what "logged out" means. At start-up it is handed two functions:

- `getToken`: how to read the current token.
- `onUnauthorized`: what to do when the server refuses that token.

The client calls `onUnauthorized` only when all of these are true: the answer is 401; the request was not marked `skipAuthHandling`; the request really carried a token; and that token is still the current one. Log in, sign-up and log out are marked `skipAuthHandling`, because a 401 there means something else (a wrong password, for example). Log in and sign-up are also marked `withoutToken`, so an old token is not sent with them; log out still sends it.

Each service file is a thin list of calls: one function per endpoint, relative `/api` paths, types from `@alumni/shared`.

**Where it lives.**

- The client: `frontend/src/services/apiClient.ts`
- The hand-over, called once before the first render: `frontend/src/store/wireApi.ts`
- Services: `frontend/src/services/authService.ts`, `frontend/src/services/userService.ts`, `frontend/src/services/alumniService.ts` (part 2; the three loaders that can be cancelled take a `signal`, see pattern 23; from part 3 its list takes an optional `limit`, so the small lists ask for 3)
- From part 3: `frontend/src/services/postService.ts` (list, create, edit, delete a post; it owns `POSTS_PATH`), `frontend/src/services/commentService.ts` (a post's comments, create, edit, delete; it imports `POSTS_PATH` for `/api/posts/:id/comments`), `frontend/src/services/statsService.ts` (`GET /api/stats`). The list loaders take a `signal`; the deletes return nothing.
- The dev proxy that sends `/api` to the backend: `frontend/vite.config.ts`

**Why we chose it.** If the client imported the store, and the store imports the services, the two would import each other. Handing the functions in keeps the arrow pointing one way (pattern 1) and lets the client be tried with a fake token and a fake handler.

We did not choose a base URL from an env variable (paths stay relative; Vite in development and Apache in production forward them), and we did not let each service add the token itself.

The only timeout is on log out (5 seconds), so a hung server cannot keep the user logged in. See "Open points" at the end.

**To add an endpoint in parts 2 to 4:** add a function to a service file (or a new `somethingService.ts`), call it from an action or a loading atom in `frontend/src/store/`, and read the atom in the page.

---

## 9. One failure shape; each screen chooses its own words

**What it is.** Whatever goes wrong in a call becomes one of two shapes:

```ts
type ApiFailure = { kind: "network" } | { kind: "http"; status: number };
```

`network` means no answer came (server down, no connection, or an answer that made no sense). `http` means the server answered with an error status.

The server's own error text is never shown. Each screen picks its words from `kind` and `status`. On log in, 401 becomes "The email or password is not correct." On sign-up, 409 becomes "This email is already registered." under the Email field. Everything else is "Something went wrong. Try again." Messages are named constants at the top of the page file.

**Where it lives.**

- `frontend/src/services/apiError.ts` (`ApiFailure`, `toApiFailure`, and `isCancelled`: a call this app cancelled is not a failure and shows nothing, pattern 23)
- From part 2, two shared word rules, both pure and both with cases in `scripts/frontend-lib-check.ts`: `frontend/src/lib/loadFailure.ts` (a failed load; it also owns the failure shape `CallFailure` and the status numbers 403, 404, 409 and 500) and `frontend/src/lib/saveFailure.ts` (a failed save: `saveFailureReason` and `saveFailureText`; each card passes its own words)
- From part 3, a third word rule: `frontend/src/lib/writeFailure.ts` (a failed edit, delete or publish in the feed). `writeFailureText` checks 403 first, then 404, then hands the rest to `saveFailureText`; `isGone` is the one "the server said 404" test. A new comment or reply has its own rule in the same file: `commentAddFailureText` reads a 400 on a reply as "the comment replied to is gone" (`isReplyTargetGone`), then 404 as "the post is gone", then 403, then hands the rest to `saveFailureText`. The caller passes its own words. Callers: `FeedPost`, `CommentItem`, `CommentsPanel`, `FeedPage` and `frontend/src/store/postActions.ts`.
- Turned into results in `frontend/src/store/sessionActions.ts`
- Words chosen in `frontend/src/pages/LoginPage/LoginPage.tsx` and `frontend/src/pages/SignUpPage/SignUpPage.tsx`

**Why we chose it.** The same status means different things on different screens, so the words belong to the screen. The server's text is written for developers, may change, and may say more than a user should read (for example which of email or password was wrong).

We did not pass the axios error up to the pages (see pattern 1), and we did not build a table of status-to-message for the whole app.

---

## 10. One way to end a session

**What it is.** A session can die in three ways: the server answers 401, the token's time runs out, or the stored token cannot be read. All three go through one action, `endSessionAtom`. It removes the token, resets the profile and sets the notice `sessionEnded`. The log-in page then shows "Your session has ended. Log in again."

Who calls it:

- the 401 handler (pattern 8);
- the start-up check, before the first render, for a stored token that is expired or broken;
- the `RequireAuth` guard, which checks the clock on every render of a guarded page.

Two other things can empty the token, and neither sets that notice: `logOutAtom` (notice `loggedOut`, no message shown) and `tokenChangedElsewhereAtom` (another tab logged in or out; this tab follows).

The token is kept in `localStorage` under `ua.token`. The frontend reads only the middle part of the token (user id, role, expiry). It cannot check the signature; the server does.

**Where it lives.**

- The action: `frontend/src/store/sessionActions.ts`
- Token, session and notice atoms: `frontend/src/store/sessionAtoms.ts`
- Start-up check and other tabs: `frontend/src/store/wireApi.ts`
- The guard: `frontend/src/routes/RequireAuth.tsx`
- Reading the token: `frontend/src/lib/token.ts`
- The message: `frontend/src/pages/LoginPage/LoginPage.tsx`

**Why we chose it.** An early version of the plan only redirected when the guard found an expired token: nothing was cleared and no message was shown. With one action, an ended session looks the same however it was found, and the profile of the old user is always dropped before the next user logs in.

We did not keep the token in a cookie that scripts cannot read. That is safer against an injected script, but it needs a backend change, and this part does not touch the backend. The risk and the things that limit it (no `dangerouslySetInnerHTML`, a one-hour token) are in ADR-14.

---

## 11. Route guards as layout routes; one decider after a log in

**What it is.** A guard is a route with no address of its own. It wraps other routes and either shows them or does something else. There are three:

- `RequireAuth`: no live session, so go to log in. It hands over the address the user asked for (`state.from`), except right after a log out.
- `PublicOnly`: wraps log in and sign-up. A logged-in user is sent on: to `state.from` when it is an address inside the app, otherwise to the Dashboard.
- `RequireAdmin`: anyone who is not an admin sees the no-access page inside the shell. The admin page is never rendered for them, so it sends no request.

**`PublicOnly` is the only code that navigates after a log in.** The log-in and sign-up pages do nothing on success; the session appears and the guard moves the user. The same goes for log out: `logOutAtom` clears the session and `RequireAuth` does the redirect.

One page navigation is left on purpose: sign-up goes to log in when the account was created but the log in after it failed. There is no session then, so no guard would act.

**Where it lives.**

- `frontend/src/routes/RequireAuth.tsx`, `frontend/src/routes/PublicOnly.tsx`, `frontend/src/routes/RequireAdmin.tsx`
- The route table: `frontend/src/App.tsx`
- The no-access page: `frontend/src/pages/NoAccessPage/NoAccessPage.tsx`

**Why we chose it.** In the first plan both the log-in page and the guard navigated after a log in. Which one won depended on timing, so the user sometimes landed on the Dashboard and sometimes on the page they had asked for. One decider removes the race.

We did not check the session inside each page (easy to forget on a new page), and we did not write a wrapper component around every route element.

**To add a page in parts 2 to 4:** put its route inside `RequireAuth` and `AppShell` in `App.tsx`. Put it inside `RequireAdmin` as well if only an admin may see it. Do not call `navigate` after a log in or a log out.

---

## 12. Every address in one object

**What it is.** Every address of the app is a field of one object, `PATHS`. The route table, the links and the guards all read it. The pattern for "any other address" is a constant beside it. No address is typed as text anywhere else.

**Where it lives.** `frontend/src/routes/paths.ts`

**Why we chose it.** Renaming `/profile` is one edit, and a typo in an address is a compile error instead of a dead link. We did not generate addresses from the folder names; the list is short and reading it is useful.

A link to one alumni profile needs the id filled in (`/directory/:id`). `alumniProfilePath(id)`, next to `PATHS`, builds it (pattern 27).

---

## 13. Pages loaded on demand

**What it is.** Each page is its own file and is fetched the first time it is shown. In the route table every page is a `React.lazy` import. A page file has a default export; components have named exports.

While a page's file is fetched, the shell stays on screen: the header and footer do not move, and the page area shows a skeleton. The public pages (log in, sign-up) have their own plain waiting state.

Every route has its own page file, even the pages that only say "being built". So the build really has one file per page, and a later part replaces one file.

**Where it lives.**

- The lazy imports: `frontend/src/App.tsx` (and `frontend/src/routes/RequireAdmin.tsx` for the no-access page)
- The waiting state inside the shell: `frontend/src/components/shell/AppShell/AppShell.tsx`
- The waiting state for the public pages: `frontend/src/routes/PublicOnly.tsx`
- A page file: `frontend/src/pages/DashboardPage/DashboardPage.tsx`

**Why we chose it.** A visitor who only logs in should not download the directory, the feed and the admin screens. The check is simple: after `npm run build`, `frontend/dist/assets` has a file for each page, plus a few shared files.

We did not split by hand in the Vite config, and we did not preload every page after log in. That can come in the polish part (F10) if moving between pages feels slow.

---

## 14. The page frame: PageLayout, PageNote and the being-built page

**What it is.** Every page inside the shell is built from the same frame:

- `AppShell`: skip link, header, the page, footer. It loads the user's own profile for the header and moves focus to the new page's heading when the address changes.
- `PageLayout`: the band (accent bar, the one `<h1>`, a line of sub text) and a content column. The first child of the column overlaps the band. It also sets the browser tab title from the heading.
- `PageNote`: a card that says one thing about the page, with an optional link or button under it.

The being-built page, the no-access page and the not-found page are all `PageLayout` with one `PageNote`. `BeingBuilt` is that pair with fixed words; each unbuilt route has a thin page file that gives it a heading and a sub text.

Log in and sign-up do not use the shell. They share `AuthLayout`: the band panel beside the form, two columns that wrap into one on a narrow screen.

**Where it lives.**

- `frontend/src/components/shell/AppShell/AppShell.tsx`
- `frontend/src/components/shell/PageLayout/PageLayout.tsx` (holds both `PageLayout` and `PageNote`) and `frontend/src/components/shell/PageLayout/PageLayout.module.css`
- `frontend/src/components/shell/Band/Band.tsx`, `frontend/src/components/shell/Header/Header.tsx`, `frontend/src/components/shell/Footer/Footer.tsx`, `frontend/src/components/shell/SkipLink/SkipLink.tsx`, `frontend/src/components/shell/PhoneMenu/PhoneMenu.tsx`
- `frontend/src/components/shell/BeingBuilt/BeingBuilt.tsx`
- `frontend/src/pages/NotFoundPage/NotFoundPage.tsx`, `frontend/src/pages/NoAccessPage/NoAccessPage.tsx`, `frontend/src/pages/UsersPage/UsersPage.tsx` (still being built after part 3)
- Real pages built in part 3 on the same frame: `frontend/src/pages/FeedPage/FeedPage.tsx` and `frontend/src/pages/DashboardPage/DashboardPage.tsx`. Both put one row as the frame's first child, so the row overlaps the band.
- A link drawn as a button, for "Write a post" and the empty states: `frontend/src/components/ui/ButtonLink/ButtonLink.tsx` (takes its look from `Button.module.css` with `composes`). `frontend/src/components/ui/EmptyState/EmptyState.tsx` takes an optional `actionTo` that it draws with `ButtonLink`, so an empty state can lead to another page without a button that navigates.
- A page that replaces the band with its own: `PageLayout`'s `band` slot, used with `ProfileBand` (pattern 26)
- `frontend/src/components/auth/AuthLayout/AuthLayout.tsx`

**Why we chose it.** The plan gave `BeingBuilt` its own stylesheet. While building, three pages turned out to need the same card (a statement, a line, a link). So the card became `PageNote` inside `PageLayout`, and `BeingBuilt` has nothing of its own to style. One frame also means the tab title, the single `<h1>` and the band overlap are right on every page without each page thinking about them.

We did not make one shared page file for all six unbuilt routes (the build could then not show one file per page).

**To build a real page in parts 2 to 4:** replace the thin page file. Keep `PageLayout` as the outer element and put your cards inside it. Delete `BeingBuilt` when the last unbuilt page is gone. Log out lives in the Account card of My profile (`frontend/src/components/profile/AccountCard/AccountCard.tsx`) and in the phone menu.

---

## 15. Field wires the label, the help text and the error

**What it is.** `Field` lays out a label, a control, and the help or error text under it. It makes the ids and hands the control three things: its `id`, what describes it (`aria-describedby`), and whether it is invalid. So the label is tied to the control, and a screen reader reads the error with the field.

When there is an error, it replaces the help text. `TextInput`, `PasswordInput`, `Select` and `Textarea` are all built on `Field`. A caller cannot pass its own `id`, `aria-describedby`, `aria-invalid` or `className` to them; `Field` owns those. A page reaches the control through `ref` (to move focus to it).

**Where it lives.**

- `frontend/src/components/ui/Field/Field.tsx` and `frontend/src/components/ui/Field/Field.module.css`
- Built on it: `frontend/src/components/ui/TextInput/TextInput.tsx`, `frontend/src/components/ui/PasswordInput/PasswordInput.tsx`, `frontend/src/components/ui/Select/Select.tsx`, `frontend/src/components/ui/Textarea/Textarea.tsx`
- Groups have their own wiring with `<fieldset>` and `<legend>`: `frontend/src/components/ui/RadioCards/RadioCards.tsx`. A single checkbox sits inside its own label: `frontend/src/components/ui/Checkbox/Checkbox.tsx`.

**Why we chose it.** Tying a label and an error to a control takes four attributes, and one missing attribute is invisible on screen. Doing it in one component means no form can get it wrong.

We did not rely on placeholders as labels, and we did not let each page write its own ids.

---

## 16. Forms without a form library; validators are pure functions

**What it is.** A form page holds its values in `useState`. On submit it runs the validators, shows each message under its field, and moves focus to the first field with an error. No request is sent while there is an error. A field's error goes away when the user edits that field. Forms carry `noValidate`, so the browser's own bubbles do not appear.

A validator is a plain function: it takes the text as typed and returns the message to show, or `null`. The messages are exported constants. The validators judge email and name after trimming; they never trim a password.

A double submit is stopped twice: the button is busy (it stays focusable and ignores presses), and the submit handler returns early while a request runs.

**Where it lives.**

- Validators and messages: `frontend/src/lib/validation.ts`
- The check that runs them without a browser: `scripts/frontend-lib-check.ts` (333 cases after part 2, 469 after part 3; the expected messages are typed out in the script on purpose, so the code is not compared with itself)
- Forms: `frontend/src/pages/LoginPage/LoginPage.tsx`, `frontend/src/pages/SignUpPage/SignUpPage.tsx`
- The busy button: `frontend/src/components/ui/Button/Button.tsx`
- Other pure functions checked the same way: `frontend/src/lib/token.ts`, `frontend/src/lib/initials.ts`

**Why we chose it.** There is no test runner in this repo. A pure function can still be run from the command line, so the rules that are easiest to get wrong (what counts as an email, how long a password is) have a real check. Two forms with five fields do not need a library.

We did not add a form library or a schema library. If part 3's profile form grows large, raise it then; adding a package needs the owner's yes.

One rule is used in two places on purpose: `isWebLink` in `validation.ts` decides both whether a photo link is accepted in the form and whether `frontend/src/components/ui/Avatar/Avatar.tsx` will load it.

---

## 17. The native dialog element for the dialog and the phone menu

**What it is.** The confirm dialog and the full-screen phone menu are both a real `<dialog>` element opened with `showModal()`. The browser then does the hard parts: it moves focus inside, keeps Tab inside, makes the page behind unusable, closes on Escape, and gives focus back to the button that opened it.

The caller owns `open`. On Escape the dialog asks to be closed (`onClose`); it closes when the caller sets `open` to false. Focus lands on Cancel first, so Enter alone never deletes anything. The backdrop is the band color mixed with transparent, so no new color was needed.

**Where it lives.**

- `frontend/src/components/ui/Dialog/Dialog.tsx`, `frontend/src/components/ui/Dialog/ConfirmDialog.tsx`, `frontend/src/components/ui/Dialog/Dialog.module.css`
- `frontend/src/components/shell/PhoneMenu/PhoneMenu.tsx` (also closes when the address changes or the window grows past the phone width)

**Why we chose it.** A focus trap written by hand is the most common place for keyboard bugs. The browser's own is tested by the browser makers and costs no code.

We did not use a `<div role="dialog">` with our own trap, and we did not add a dialog package. The price is that the element needs a browser from 2023 or later; that was accepted.

The open, close, Escape and close-before-unmount logic is held once in `frontend/src/hooks/useModalDialog.ts`. `Dialog.tsx` and `PhoneMenu.tsx` both use it and keep their own markup.

---

## 18. A table that turns into cards on a phone

**What it is.** `Table` takes a list of columns and a list of rows. Each cell carries its column name in a `data-label` attribute. On a wide screen it is an ordinary table. Below 768px the stylesheet hides the head row from the eye (a screen reader still reads it), turns each row into a card, and shows the label before each value with `content: attr(data-label)`.

The table elements keep explicit roles (`role="table"`, `row`, `cell`), because some browsers stop treating them as a table once CSS changes their layout. With no rows the table shows only its head; the caller shows `EmptyState` instead.

**Where it lives.**

- `frontend/src/components/ui/Table/Table.tsx` and `frontend/src/components/ui/Table/Table.module.css`
- Goes with it: `frontend/src/components/ui/Pagination/Pagination.tsx` (its `pageRange` function is pure and lives in `frontend/src/lib/pageRange.ts`; the return-address guard `readReturnAddress` lives in `lib/returnAddress.ts`; both are in the library check), `frontend/src/components/ui/EmptyState/EmptyState.tsx`, `frontend/src/components/ui/ErrorState/ErrorState.tsx`, `frontend/src/components/ui/Skeleton/Skeleton.tsx`

**Why we chose it.** One component and one set of data give both layouts, and the switch is pure CSS. A page does not need to know how wide the screen is.

We did not render two different trees (a table and a card list) and pick one in JavaScript, and we did not let the table scroll sideways on a phone.

Every list in parts 2 to 4 needs its three states: `Skeleton` while loading, `EmptyState` when there is nothing, `ErrorState` with "Try again" when the call failed.

---

## 19. Toasts: a list in the store and one live region

**What it is.** A toast is a short text in the bottom corner that says an action worked. The list of toasts is an atom. Any code that can reach the store adds one with `showToastAtom("Account created")`. One component, mounted once for the whole app, shows the list.

A toast leaves after 5 seconds. The timer pauses while the toast is hovered or has focus, and continues with the time that was left. At most three show at once. Each has a Dismiss button.

The list sits in a region that screen readers watch (`role="status"`). The region is always in the page, also when empty, because a screen reader only reads what is added to a region that was already there. It is set to read only the new toast, not the whole list again.

**Where it lives.**

- `frontend/src/store/toastAtoms.ts` (the list, the two actions, the two numbers)
- `frontend/src/components/ui/Toast/ToastViewport.tsx`
- Mounted in `frontend/src/App.tsx`, after the routes, so the skip link stays the first stop for the keyboard
- A caller: `frontend/src/pages/SignUpPage/SignUpPage.tsx`
- For a message that belongs to one form and must stay, use `frontend/src/components/ui/Message/Message.tsx` instead.

**Why we chose it.** After a sign-up the page that caused the toast is replaced at once. A toast kept in that page's state would vanish with it. In the store it outlives the page.

We did not build a `toast()` function that reaches into the DOM, and we did not give each page its own toast area.

---

## 20. Icons as small components

**What it is.** Each icon is a small React component that draws an SVG. All of them share one frame: line icon, 2px stroke, round ends, `stroke="currentColor"` so the icon takes the color of the text around it, and `aria-hidden` because an icon is decoration. The button or link around it carries the name (`aria-label`, or hidden text). Sizes are `sm`, `md` and `lg`, from tokens.

Each icon is imported by its own path. There is no file that lists them all.

**Where it lives.**

- The frame: `frontend/src/icons/IconBase.tsx` and `frontend/src/icons/Icon.module.css`
- The icons: `frontend/src/icons/SunIcon.tsx`, `frontend/src/icons/MoonIcon.tsx`, `frontend/src/icons/MonitorIcon.tsx`, `frontend/src/icons/MenuIcon.tsx`, `frontend/src/icons/CloseIcon.tsx`, `frontend/src/icons/ChevronDownIcon.tsx`, `frontend/src/icons/CheckIcon.tsx`, `frontend/src/icons/AlertIcon.tsx`

**Why we chose it.** We need eight icons. A package would add hundreds and a dependency to keep up to date. `currentColor` means an icon is right in both themes with no work.

We did not use an icon font, an image sprite (the old `icons.svg` was deleted) or emoji.

**To add an icon:** copy one icon file, change the paths inside, keep the 24 by 24 view box.

The same "no list file" rule holds for all components: import a component by its path. There is no `index.ts` that re-exports them, so two people adding components never edit the same file.

---

## 21. Browser storage that never throws

**What it is.** A browser can refuse storage: private mode, a full disk, a setting. So `localStorage` is touched in one file only, through three functions that catch the error: `readStored`, `writeStored`, `removeStored`. A refused write is ignored and the value lives in memory for that visit.

The app uses three keys, all named in one file: `ua.token`, `ua.theme`, `ua.rememberedEmail`. The password is never stored.

**Where it lives.**

- `frontend/src/lib/browserStorage.ts`
- The keys: `frontend/src/config/storageKeys.ts`
- The one other reader: the head script in `frontend/index.html`, which cannot import anything and has its own `try`/`catch`.

**Why we chose it.** Without the wrapper, a user in a locked-down browser gets a blank page because one line threw at start-up. With it, they get a working app that forgets its theme.

We did not use `sessionStorage` (the user would be logged out in every new tab) or a storage package.

---

## 22. A components page for development only

**What it is.** One page shows every base component in every state, in the current theme: colors, type, buttons, form controls, tags, avatars, dialog, pagination, cards, table, messages and the loading, empty and error states. It is where a component is compared with the design pictures.

It exists only in development, at `/dev/components`. In `App.tsx` its import sits behind `import.meta.env.DEV`. In a production build that is `false` when the code is built, so the page's file is dropped and none of its text is in `frontend/dist`.

**Where it lives.**

- `frontend/src/pages/dev/ComponentsPage/ComponentsPage.tsx`
- The condition and the route: `frontend/src/App.tsx`
- The pictures to compare with: `docs/design/screens/system.html` and `docs/design/screens/system-dark.html`

**Why we chose it.** There is no test runner and no Storybook. A plain page costs no package and shows the real components with the real tokens.

- From part 3, the page's own styles: `frontend/src/pages/dev/ComponentsPage/ComponentsPage.module.css`

**To add a component in parts 2 to 4:** add a section for it to this page, in every state it has. Part 2 added the alumni card and its loading card, the directory search and filters, and the profile band.

Part 3 added button links, the post byline and text, the post and comment forms, feed posts, comments, the people lists, recent posts, counts and "Your profile". Two things about those sections:

- **No request can start from them.** A small wrapper on the page, `NoRequests`, stops every click, middle click and submit in the capture phase, before it reaches a post, a comment or a block's link or retry. The keyboard is stopped too, because Enter and Space on a button fire a click. The two form samples are not wrapped: their submit is a function on the page that only shows a toast or a fixed failure.
- **Some states are drawn from parts, not from the live component.** `FeedPost` keeps its editing state and its delete dialog in its own `useState`, so a prop cannot switch them on. The page draws them from the same parts (card, byline, `PostForm`, `ConfirmDialog` with FeedPost's words). `CommentsPanel` reads the comment thread from the store, so it is not rendered at all; its loading, error, empty and thread states are drawn from `CommentItem`, `CommentForm` and `buildThreads`. For that, the page's stylesheet takes the thread's look from `frontend/src/components/posts/CommentsPanel/CommentsPanel.module.css` with `composes` (its `panel`, `threads`, `replies` and `reply` classes, so the phone indent comes too). Nothing is copied (pattern 3).

---

## 23. A list loaded into an atom; the latest request wins

**What it is.** Data a page shows from the API lives in an atom, with a status: `idle`, `loading`, `ready` or `error` (a profile also has `notFound`, and My profile has `none` for "no profile yet"). A write-only loader atom (pattern 7) fills it. The page reads the atom and starts the loader in an effect; it never calls a service.

Each loader goes through its own `createLatestRequest()`. Starting a call asks for a ticket: the call before it is aborted (axios takes the `signal`), and an answer that still arrives for an old ticket is dropped. A cancelled call changes nothing and shows no error, because `isCancelled` is checked before the failure is stored.

The state also says whose it is. The directory state keeps the address it was loaded for (`queryKey`) and the profile state keeps its `id`. A page that finds another key in the atom treats it as loading, so the results of the last search or the last person never show for a frame. While loading, the atom holds no items.

When a session starts or ends, `resetAlumniAtom` cancels all four loaders and empties the atoms, so one user's data is never shown to the next.

When a page closes, it clears its own atom: the directory calls `clearDirectoryAtom`, a profile calls `clearViewedAlumniAtom` and My profile calls `clearMyAlumniAtom`, each from the cleanup of an effect. Each cancels its loader and puts the atom back to idle, so the next visit never shows the last visit's error or data for a frame. My profile clears only on close, never while open: the band's "See my public profile" link reads the saved profile from the atom.

**Where it lives.**

- The helper: `frontend/src/store/latestRequest.ts`
- The atoms and loaders: `frontend/src/store/alumniAtoms.ts` (`directoryAtom`, `filtersAtom`, `viewedAlumniAtom`, `myAlumniAtom`)
- The reset: `frontend/src/store/sessionActions.ts`
- `isCancelled`: `frontend/src/services/apiError.ts`
- Readers: `frontend/src/pages/DirectoryPage/DirectoryPage.tsx`, `frontend/src/pages/AlumniProfilePage/AlumniProfilePage.tsx`, `frontend/src/pages/MyProfilePage/MyProfilePage.tsx`
- The clear on close: `clearDirectoryAtom`, `clearViewedAlumniAtom`, `clearMyAlumniAtom` in `frontend/src/store/alumniAtoms.ts`
- From part 3: `frontend/src/store/postAtoms.ts` holds five more atoms with their own loaders and clears (`feedAtom`, `commentsAtom`, `recentPostsAtom`, `peopleAtom`, `statsAtom`), each with its own `createLatestRequest()`. Its `resetPostsAtom` is called in the same three places as `resetAlumniAtom` in `frontend/src/store/sessionActions.ts`. The keys are `postId` (comments), `authorId` (recent posts) and `kind` (people); see patterns 30 and 33.

**Why we chose it.** A search box fires several calls in a row, and the network does not answer in order. Without a ticket, a slow answer for "ab" can arrive after the answer for "abc" and replace it. React's StrictMode also starts every effect twice in development, which starts two calls. The ticket makes both harmless, and the abort saves the server the work.

We did not add a data-fetching library (it would be a new package and a second place for state), and we did not keep the list in the page's `useState` (the list, its status and its failure are read by the page, the count line and the retry together, and the store's reset on logout and on a user switch reaches an atom but not a component's state). The atom is cleared when the page closes, so a new visit never shows the last visit's list. We did not rely on the abort alone: `getMyAlumni` takes no signal, so for it only the ticket protects.

---

## 24. Search, filters and page kept in the address

**What it is.** The directory's search text, its three filters, the mentoring checkbox and the page number are in the address (`/directory?q=ab&department=Computer+Science&page=2`). The address is the truth. The page reads it with `readDirectoryQuery`, which turns every bad value into its default, so the page never sees a bad query. It writes it with `writeDirectoryQuery`, which leaves out defaults and page 1. The list loads in an effect keyed on that written text.

How writes are made:

- A filter, the checkbox or a page change adds a history entry, and a filter change goes back to page 1.
- Typing waits for a 300 ms pause, then replaces the current entry, so Back does not step through every pause. Enter or the Search button sends it at once.
- The typed text is the component's own state. The box takes the address's value only when the address changed by itself (Back, a pasted link) and differs from what the user last sent. Every write starts from the address as it is now (a ref), so a timer never writes an old copy.
- A page past the end (the list answered and the page is above the last one) replaces the address with the last page.
- After the user changes page, focus goes to the count line, which is a polite live region that is always on the page.

On a phone the filters sit in a panel behind a "Filters" button. The panel is `display: none` while closed, so Tab skips it. There is no JavaScript media query.

**Where it lives.**

- The rules: `frontend/src/lib/directoryQuery.ts` (`readDirectoryQuery`, `writeDirectoryQuery`, `toListParams`, `activeFilterCount`, `hasCriteria`, `lastPage`), with cases in `scripts/frontend-lib-check.ts`
- The page: `frontend/src/pages/DirectoryPage/DirectoryPage.tsx`
- The controls: `frontend/src/components/alumni/DirectoryFilters/DirectoryFilters.tsx` (controlled; it holds only the panel's open state)

**Why we chose it.** A search kept in the address can be shared as a link, survives a reload, and Back works as people expect. Because the reader cleans every value, an edited or old link cannot break the page.

We did not keep the filters in an atom (a reload or a shared link would lose them). We did not push a history entry for every pause in typing (Back would replay the typing); this narrows the spec's "every new filter state is an entry" for the search text only, and is listed as a deviation in the REQ-fs-005 architecture.

---

## 25. A form that loads first, then creates or edits

**What it is.** The Alumni profile card on My profile is one form for two jobs. It is not drawn until the user's profile has answered: `ready` (a profile exists, the form edits it) or `none` (a 404, the form creates one). While it loads there is a skeleton, and a failed load shows an error with "Try again" and no form, so an empty form can never overwrite a saved profile.

The rules of the form are in `lib/`: `alumniToForm` (a profile into text values), `validateAlumniForm(values, thisYear)` (one message per field, in screen order), `firstInvalidField`, and `alumniFormToBody` (trimmed, an empty field becomes `null`, all nine fields always sent so that clearing works, `user_id` never sent).

`saveAlumniProfileAtom` creates when the state is `none` and edits when it is `ready`. It returns `{ ok: true }` or `{ ok: false, failure }`. On a 409 while creating (a profile appeared in the meantime) it first reloads quietly, without `loading`, so the next render is already the edit form with the message still shown.

The form element stays mounted across the first create and the 409 reload. The card remembers which profile it was filled from; when the store holds another one, the values are reset in place during render. The page keys the card on the session's user id, so another user always gets a fresh card. The Account card follows the same skeleton, with its own error message, so one card's failure never touches the other.

Save profile and Discard changes are off until a value differs from the saved one (`canSaveAlumniForm` and `sameAlumniForm` in `frontend/src/lib/alumniForm.ts`; spaces around text do not count as a change). A profile that does not exist yet can always be saved, so a new alumnus is not locked out by an empty form. Discard is also off while a save runs, or the save's answer would undo it. Text typed during a save is kept: the form takes the saved values only if it still holds what was sent. A button that holds keyboard focus and is about to switch itself off first hands focus to the card heading, because a disabled button drops focus to the page. Known gap: after a 409 on create the focus is not moved.

**Where it lives.**

- The rules: `frontend/src/lib/alumniForm.ts`, the validators in `frontend/src/lib/validation.ts`
- The actions: `frontend/src/store/alumniActions.ts` (`saveAlumniProfileAtom`, `saveAccountAtom`); the header update after "Save account" goes through `setProfileUserAtom` in `frontend/src/store/profileAtoms.ts`
- The cards: `frontend/src/components/profile/AlumniProfileCard/AlumniProfileCard.tsx`, `frontend/src/components/profile/AccountCard/AccountCard.tsx`
- The page: `frontend/src/pages/MyProfilePage/MyProfilePage.tsx`

**Why we chose it.** One form means one set of fields, one layout and one validation for both jobs. Waiting for the load means the form never guesses. Keeping the element mounted means keyboard focus and the failure message survive the switch from create to edit.

We did not build two forms (create and edit) or a separate "create profile" page. We did not remount the form with a `key` on the profile (focus was lost and the 409 message vanished). We did not add a form library (pattern 16).

---

## 26. The person band

**What it is.** A profile page has a bigger band than other pages: a back link, a large avatar, a tag, the name as the one `<h1>`, a sub line, a row of tags and links drawn as buttons. `ProfileBand` draws it, and `PageLayout`'s `band` slot puts it where the ordinary band would be, so the content column still overlaps it.

The band is rendered in every status of the page at the same place. While the data loads, the avatar and the sub line are still blocks and the rest is left out, but the `<h1>` is the same element, so keyboard focus on it is not lost when the data arrives. `ProfileBandAction` is a link drawn as a button in the band's colors; with `newTab` it opens a new tab with `rel="noopener noreferrer"`, and the caller adds the hidden "(opens in a new tab)".

**Where it lives.**

- `frontend/src/components/shell/ProfileBand/ProfileBand.tsx` and `frontend/src/components/shell/ProfileBand/ProfileBand.module.css` (it takes the band look from `frontend/src/components/shell/Band/Band.module.css` with `composes`)
- The slot: `frontend/src/components/shell/PageLayout/PageLayout.tsx`
- The large avatar: size `xl` in `frontend/src/components/ui/Avatar/Avatar.tsx` (`--avatar-xl` in `frontend/src/styles/tokens.css`: 120, 96 on a phone)
- Users: `frontend/src/pages/AlumniProfilePage/AlumniProfilePage.tsx`, `frontend/src/pages/MyProfilePage/MyProfilePage.tsx`

**Why we chose it.** Two pages draw the same band. One component keeps them the same, and `composes` keeps it the same as the ordinary band.

We did not give `Band` more and more optional parts (most pages need none of them), and we did not swap the band for a skeleton while loading (the heading would be replaced and focus lost).

---

## 27. The profile address and the "came from the directory" state

**What it is.** A link to one profile is built with `alumniProfilePath(id)`, never by gluing text. The directory card's link also hands the profile page the directory's query string as router state (`directoryReturnState`). "Back to directory" reads it with `readDirectorySearch` and returns to the same search, filters and page. Router state survives a reload and can hold anything, so the reader accepts only text that is empty or starts with `?`, has no `#` and no line break, and is at most 500 characters; anything else gives the plain directory.

The profile page reads `:id` with `readProfileId`: digits only, from 1 to the largest id the server accepts. Anything else shows the not-found state with no request.

**Where it lives.**

- `frontend/src/routes/paths.ts` (`alumniProfilePath`, next to `PATHS`)
- `frontend/src/lib/directoryReturn.ts` (`directoryReturnState`, `readDirectorySearch`)
- `frontend/src/lib/profileId.ts` (`readProfileId`)
- The link carries state through `state` on `frontend/src/components/ui/Link/Link.tsx`
- Used by `frontend/src/components/alumni/AlumniCard/AlumniCard.tsx`, `frontend/src/pages/AlumniProfilePage/AlumniProfilePage.tsx`, `frontend/src/pages/MyProfilePage/MyProfilePage.tsx`

**Why we chose it.** Router state keeps the profile's own address clean (`/directory/7`), and the back link still knows the way. Treating it as untrusted follows the part 1 lesson on `state.from` (`frontend/src/lib/returnAddress.ts`).

We did not put the directory query into the profile's address (it would make every profile link long and different), and we did not use `navigate(-1)` for "Back" (a profile opened from a pasted link has no directory behind it).

---

## 28. One rule, one function in lib

**What it is.** A rule used in two places is written once, as a pure function in `lib/`, with cases in the library check. Part 2 found three copies of small rules while building and moved each into one function:

- "trimmed text, or null when empty": `presentText` in `frontend/src/lib/alumniDisplay.ts` (with `displayName`, `jobLine`, `classLabel`, `orNotGiven`, `firstName`)
- "which words for a failed load": `loadFailureText` in `frontend/src/lib/loadFailure.ts`. It declares its own failure shape, so `lib/` does not import `services/`.
- "is this a profile id": `readProfileId` in `frontend/src/lib/profileId.ts`
- "is this email a safe link": `mailtoHref` in `frontend/src/lib/mailtoLink.ts` (a plain address is encoded into a `mailto:` link; anything else is shown as text, because the server accepts any email string)

The validators are shared the same way: sign-up and the two My profile cards use the same `validateName` and `validatePhotoLink` from `frontend/src/lib/validation.ts`. Validator messages stay there as exported constants (pattern 16); page words are in `frontend/src/config/text.ts`, grouped by page.

**Where it lives.** `frontend/src/lib/` and `scripts/frontend-lib-check.ts`. The rule for a failed save is there too: `saveFailureText` in `frontend/src/lib/saveFailure.ts`. It reads the failure shape `CallFailure` declared in `frontend/src/lib/loadFailure.ts`, not the store's type, so it needs nothing outside `lib/` and the library check covers it.

**Why we chose it.** Two copies of a rule drift apart, and only one gets the fix. A function in `lib/` can be checked from the command line, which a rule inside a component cannot.

We did not make a general "utils" file (a file named for no rule grows without limit), and we did not move the words into the functions: the caller still chooses what to say (pattern 9).

---

## 29. A feed that loads more by the aligned page and merges by id

**What it is.** The feed shows the newest posts and a "Load more" button. The API pages by number, but this browser's own writes move posts between pages: a delete pulls every later post up by one, a new post pushes them down by one. Asking for "the page after the last one" would then skip or repeat a post.

So the next page is worked out from how many posts the feed holds: `nextFeedPage(held, limit)` is `floor(held / limit) + 1`. The answer is merged into the list with `mergePosts`: newest first, no id twice, and for an id in both lists the new copy wins. `total` is taken from each answer. "Load more" shows while the feed holds fewer posts than `total`.

With no writes this is plain "page + 1". After one delete (11 held, limit 12) it asks for page 1 again and gets the one post it did not have; the next press is aligned again. After one new post (13 held) it asks for page 2 and drops the one post it already holds.

Three more rules in the store:

- Page 1 and "Load more" share one latest-request ticket, so a retry or leaving the page cancels a "Load more", and the other way round.
- A failed "Load more" keeps the posts already shown. The same button then reads "Try again", so keyboard focus stays on it.
- The posts this browser deleted during the visit are remembered (`removedIds`). A load that was already running when the delete finished drops them, and takes them off `total`.

A visually hidden status line above the list says "Showing N of M posts" after a load, a "Load more", a publish and a delete.

**Where it lives.**

- The rule: `frontend/src/lib/feedPaging.ts` (`nextFeedPage`, `mergePosts`), with cases in `scripts/frontend-lib-check.ts`
- The state and the two loaders: `feedAtom`, `loadFeedAtom`, `loadMoreFeedAtom`, `removePostLocallyAtom` and `clearFeedAtom` in `frontend/src/store/postAtoms.ts`
- The page: `frontend/src/pages/FeedPage/FeedPage.tsx`

**Why we chose it.** The rule is two lines, has cases, and gives the right list after any of this browser's own writes. It needs no change to the API.

We did not ask for "page + 1" (a delete skips a post for good). We did not reload page 1 after every write (the user loses their place). We did not ask the backend for a cursor ("posts older than this one"): that would be a new API shape, and the spec allowed only one small backend change.

The known limit: a post that **another user** deletes while this feed is open is not seen. The list keeps it, and one post can be missed by "Load more" until the page is opened again. This was accepted at the architecture gate (ADV-001). A real fix needs two requests per press and still leaves the deleted post on screen.

---

## 30. One open comment thread, patched from the server's answers

**What it is.** Only one post's comments are open at a time, so there is one atom for them, `commentsAtom`, with the post id as its key. A post whose id is not the key treats its thread as closed. Opening another post's comments closes the first. The toggle button carries `aria-expanded`, and focus stays on it.

After a write, the list is patched from what the server answered. Nothing is loaded again:

- a new post goes on top and `total` goes up by one; an edited post replaces its copy; a deleted post is taken out and `total` goes down by one;
- a new comment is added at the end; an edited one replaces its copy; a deleted one is taken out **with all its replies**.

Then the post's comment count is set to the length of the comment list. The count is never worked out a second way, so the number on the toggle and the list cannot disagree. When the write ends and that post's thread is no longer the open one, the count moves by the number added or removed (for a delete, the comment and its replies, counted when the delete started).

A comment write changes the thread and the count in one store update (`patchCommentsAtom`), so React never draws one without the other. A 404 on an edit or a delete removes the post or comment on this screen, because the server says it is gone.

A write only patches if the same user and the same visit are still there when the answer comes. Leaving the feed or logging out starts a new visit, so a late answer patches nothing.

Threads are shaped by pure functions. `buildThreads` returns the top-level comments, oldest first, each with all its replies flat under it, oldest first. A comment whose parent is not in the list is shown as top level, so it can never be hidden. A reply to a reply is sent with that reply's id and drawn under the top-level comment.

**Where it lives.**

- The thread rules: `frontend/src/lib/commentThread.ts` (`buildThreads`, `appendComment`, `replaceComment`, `removeWithReplies`, `countReplies`), with cases in the library check
- The date and count words: `frontend/src/lib/postDisplay.ts` (`dateText`, `countText`, `commentCountText`)
- The state: `commentsAtom`, `openCommentsAtom`, `closeCommentsAtom` in `frontend/src/store/postAtoms.ts`
- The writes and the patching: `frontend/src/store/postActions.ts`
- The parts: `frontend/src/components/posts/FeedPost/FeedPost.tsx` (the toggle), `frontend/src/components/posts/CommentsPanel/CommentsPanel.tsx` (the open thread; one reply or edit at a time), `frontend/src/components/posts/CommentItem/CommentItem.tsx`

**Why we chose it.** One open thread means one request at a time, one latest-request ticket, and no answers for two posts that arrive in the wrong order. Patching from the answer is quick and keeps the user's place. Taking the count from the list means the count is right after every add and delete, also when replies go with a comment.

We did not keep a thread per post (more state, more answers to keep apart, and the design opens one). We did not reload the post or its thread after a write (slower, and there is no `GET /api/posts/:id` route, G33). We did not trust the stored `posts.comment_count` column (G11).

---

## 31. One owner rule for posts and comments

**What it is.** Two pure functions decide which buttons a post or a comment shows:

- `canEditContent(session, userId)`: true only for the author.
- `canDeleteContent(session, userId)`: true for the author or an admin (ADR-02).

No session, or content with no author, gives false. Posts and comments both call them; nothing else asks "is this mine". The server still decides. When it refuses (403), the user reads words for that, chosen by `writeFailureText` (pattern 9).

**Where it lives.**

- `frontend/src/lib/contentOwner.ts`, with cases for the author, another user, an admin, a student and no session in the library check
- Callers: `frontend/src/components/posts/FeedPost/FeedPost.tsx`, `frontend/src/components/posts/CommentItem/CommentItem.tsx`

**Why we chose it.** The rule is small, but it is easy to write slightly differently in two places (for example, letting an admin edit in one). One function with cases means both lists follow the same rule.

We did not show every button and let the server refuse (a user should not be offered what they cannot do). We did not put the rule in the store (it decides what to draw, not what to save).

---

## 32. Shared forms for create and edit: PostForm and CommentForm

**What it is.** One `PostForm` serves "Write a post" and "Edit post" (caption, image link, submit, an optional Cancel). One `CommentForm` serves a new comment, a reply and an edit. Both follow pattern 16: values in `useState`, the validators from `lib/validation.ts`, messages under the field through `Field`, focus to the first field with a message, a busy button, and an early return against a double submit.

The forms do not know the API. The caller gives them an `onSubmit` that answers a `FormResult`: `{ ok: true }`, `{ ok: true, reset: true }` (empty the form after a new post or comment) or `{ ok: false, text }` (show these words). On a reset a field is emptied only if it still holds what was sent, so text typed during the request is kept. A failure keeps what was typed, and its message takes focus.

Each form hands its text field to the caller through a ref, so the caller can move focus back there after a publish or a comment.

Edit has no "Save stays off until something changed" rule: a post is never new, and the form closes on Save or Cancel, so traps 1 and 2 of LESSON-REQ-fs-005-1 do not arise. Trap 3 does (a control that closes or resets the form must be off while a save runs): Cancel gets the same `busy` as the submit, so while the request runs it ignores presses and keeps focus (`aria-disabled`), and the answer never lands on an edit or reply that Cancel already closed.

The validators: `validateCaption` (a visible character, at most 2000) and `validateComment` (a visible character, at most 1000). The image link uses the existing `validatePhotoLink`.

**Where it lives.**

- `frontend/src/components/posts/PostForm/PostForm.tsx` (it exports `FormResult`) and `frontend/src/components/posts/CommentForm/CommentForm.tsx`
- The validators: `frontend/src/lib/validation.ts`
- The callers: `frontend/src/pages/FeedPage/FeedPage.tsx` (publish), `frontend/src/components/posts/FeedPost/FeedPost.tsx` (edit post), `frontend/src/components/posts/CommentsPanel/CommentsPanel.tsx` (add and reply), `frontend/src/components/posts/CommentItem/CommentItem.tsx` (edit comment)
- The words of a failure: `frontend/src/lib/writeFailure.ts` (pattern 9)

**Why we chose it.** Create and edit have the same fields and the same rules. One form keeps them the same and means one place to fix. Leaving the API to the caller keeps the forms in the components layer (pattern 1) and lets the dev page show them with a fake submit.

We did not build separate create and edit forms, and we did not add a form library (pattern 16).

---

## 33. Small blocks that fail on their own, one atom per kind with a key

**What it is.** The Dashboard is four blocks: counts, recent posts, "New in the directory" and "Your profile". The Feed has a side list ("Open to mentoring"), and an alumni profile has "Recent posts". Each block has its own loading, empty, error and ready states and its own "Try again". One block that fails never hides another.

The blocks take props only; none reads an atom. Each exports its own state type with the status `loading`, `ready` or `error`. The page maps the atom to it.

Lists of the same kind share one atom, with a key that says whose it is:

- `recentPostsAtom` with `authorId`: `null` for everyone's newest (the Dashboard), a user id for one person (the profile).
- `peopleAtom` with `kind`: `"newest"` (Dashboard) or `"mentoring"` (Feed).

As in pattern 23, a page that finds `idle` or another key treats the state as loading, so one page never shows the other's list for a frame. The small lists ask for 3 items.

The page starts its loads in one effect keyed on the user and clears them in the cleanup. "Your profile" chooses by role: a student gets a prompt and sends **no** request; alumni and admin load the existing `myAlumniAtom`.

The retry buttons in the blocks are secondary, so a page with several failed blocks still has one primary action.

**Where it lives.**

- The blocks: `frontend/src/components/alumni/PeopleBlock/PeopleBlock.tsx`, `frontend/src/components/dashboard/CountsBlock/CountsBlock.tsx`, `frontend/src/components/dashboard/RecentPostsBlock/RecentPostsBlock.tsx`, `frontend/src/components/dashboard/YourProfileBlock/YourProfileBlock.tsx`, and the card inside the recent posts list, `frontend/src/components/posts/PostSummaryCard/PostSummaryCard.tsx`
- The atoms and loaders: `recentPostsAtom`, `peopleAtom`, `statsAtom` and their loaders and clears in `frontend/src/store/postAtoms.ts`
- The mapping from atom to block state: `toCountsState` and `toRecentPostsState` in `frontend/src/pages/DashboardPage/DashboardPage.tsx`; the same idea in `frontend/src/pages/AlumniProfilePage/AlumniProfilePage.tsx`. The people list has one shared mapper for both pages, `toPeopleBlockState(state, kind)` in `frontend/src/store/peopleBlockState.ts`. That file is the one store file that points up at `components/`: it imports the `PeopleBlockState` type from `PeopleBlock` with `import type`, so there is no runtime link and no loop. It could not go in `lib/`, because style rule k forbids `lib/` to import the store, and it needs the store's `PeopleState`. Do not copy this for other mappers; if they move out of the pages (m14), the block-state types should move next to the atoms
- Who may write posts and has an alumni profile (alumni or admin): `canWritePosts` in `frontend/src/lib/token.ts`, used by the Feed, the Dashboard, `YourProfileBlock` and My profile
- The "open to mentoring" directory address of the Feed's and the Dashboard's links: `mentoringDirectoryAddress` in `frontend/src/lib/directoryQuery.ts`
- The backend filter the profile uses: `GET /api/posts?user_id=<id>&limit=3`, in `backend/src/dal/query/PostQuery.ts` and `backend/src/api/controllers/PostController.ts`

**Why we chose it.** A dashboard that waits for four calls, and fails when one fails, is slow and fragile. Blocks that take props can be shown in every state on the dev page without the store. One atom per kind with a key keeps the store small, and the key rule is already known from pattern 23.

We did not load the dashboard in one request (there is no such endpoint, and the backend change was kept to one filter). We did not give each page its own copy of the same atom (more state to reset on log out). We did not let the blocks read atoms themselves (then the dev page could not show them).

---

## How to add to this file

For parts 2 to 4 (directory and profiles, My profile, feed, dashboard, users):

1. **A new pattern gets a new numbered section** at the end of the list, with the same three parts: What it is, Where it lives, Why we chose it. Add it to "Contents". Write it after the code works, from the code.
2. **Use real paths**, written in full from the repo root (starting with `frontend/`, `scripts/` or `docs/`), and check that each one exists before you finish.
3. **If you change a pattern, change its section** in the same piece of work. If the change is a real decision (for example "we now use a form library"), it also needs a decision record (ADR) and the owner's yes.
4. **If you extend a pattern, add to "Where it lives"**. A new service file, a new store file or a new guard is a line there, not a new section.
5. **Say what you did not choose.** That sentence is what stops the next person from trying it again.
6. **Plain words, short sentences.** The reader is the owner and whoever builds the next part.

Part 2 wrote sections 23 to 28. Part 3 (the feed and the dashboard) wrote sections 29 to 33; the owner check expected here became pattern 31, and dates written as "3 October 2026" are `dateText` in `frontend/src/lib/postDisplay.ts` (pattern 30). Likely new sections in part 4 (the users page), so nobody is surprised: an admin-only list with role changes.

## Checks to run

Run all four from the repo root before you say a piece of work is done. All must exit 0. `npm run check:frontend` runs the style check and the library check in one go.

| Command | What it proves |
|---|---|
| `npm run build` | The code compiles (type errors fail it) and the production build works. |
| `node scripts/frontend-style-check.mjs` | The eleven style and layer rules of pattern 3. |
| `npx tsx scripts/frontend-lib-check.ts` | The pure functions in `frontend/src/lib/` give the right answers (469 cases after part 3). |
| `git grep -n --untracked "antd" -- frontend/src frontend/package.json` | Prints nothing: the old UI library is gone. Keep `--untracked`; without it git skips files that are not committed yet. |

After the build, two looks at the output:

- `ls frontend/dist/assets` shows one `.js` file for each page, plus a few shared files.
- `grep -rlF "Compare each section with" frontend/dist` prints nothing: the components page is not in the build.

When you add a validator or another pure function, add its cases to `scripts/frontend-lib-check.ts`. Write the expected answer from the spec, not from the code. Prove once that a new case can fail: run a copy of the script with one wrong expectation and see `FAIL` and exit 1. Make the copy outside the repo (rewrite its `../frontend/src/` imports to full paths), so nothing has to be deleted from the repo after.

The build type-checks `frontend/src` only. The library check runs through `tsx`, which strips types without checking them, so a type error in `scripts/` is not caught.

Screens are checked in a browser against a mock API: a throwaway script outside the repo, and a throwaway Vite config that points the `/api` proxy at it. Before you start, find out what listens on port 3000; it may be the real backend on a real database. Never point anything at it for a review.

What these checks cannot prove (how a screen looks, a real log in, a screen reader) goes on a manual checklist for the owner. Part 1's is `manual-checklist.md` in the REQ-fs-004 folder of the vault; part 2's is in the REQ-fs-005 folder; part 3's is in the REQ-fs-006 folder.

## Files added in review round 1

Seven files were added after the first draft of this document. All paths are under `frontend/src/`: `hooks/useModalDialog.ts` (the native-dialog logic of Dialog and PhoneMenu), `hooks/useFormError.ts` (the form error message, its focus and the double-submit guard of both auth pages), `config/layout.ts` (the phone-layout query), `config/text.ts` (`LOADING_TEXT`), `lib/returnAddress.ts` (the open-redirect guard), `lib/pageRange.ts` (the page numbers) and `components/shell/navLabels.ts` (the shared navigation labels).

## Open points

Known gaps left by part 1. None blocks parts 2 to 4. The full list is in `check-notes.md` in the REQ-fs-004 folder.

- The API client has no general timeout. Only log out has one (5 seconds); other calls wait for the server.
- The checks on the store (401 handling, start-up check, and in part 2 the latest-request and save actions) were run from scratch files and are not in `scripts/`.
- ESLint is not installed, so nothing lints the code.
- Part 2: `ProfileBand` takes no heading ref, so the profile page reaches its `<h1>` through a wrapper element. After a 409 on create the focused Save button switches off with no focus move. Other review items left open are listed in the REQ-fs-005 `verification.md`.
- Part 3 (REQ-fs-006), known gaps after the implement phase:
  - Saving or deleting a comment that is not in the open thread patches nothing on this screen: the store cannot tell which post it belongs to. Today a comment's buttons are only shown inside the open thread, so this cannot happen from the screen.
  - The browser checks (focus rings by a real Tab key, 360px and 200% zoom, screenshots in both themes) were done in the review phase of REQ-fs-006 against a mock API; the screenshots are in the `ui-evidence/` folder of that REQ.
  - ADV-001: a post that another user deletes while the feed is open can make "Load more" miss one post until the page is opened again (pattern 29).
