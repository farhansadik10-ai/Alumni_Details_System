# TASK-003 — Pure library, services, session store, the library check

| Field | Value |
|---|---|
| REQ | REQ-fs-004 |
| Tier | 1 |
| Status | complete |
| Repo | alumni-details-system |
| Depends on | TASK-001 |
| Blocks | TASK-008 |

## Goal

Logging in, signing up, loading the current user and logging out work as store actions over one API client, with the pure parts proven by a script.

## Files to touch

| Path | Action |
|---|---|
| `frontend/src/lib/token.ts` | create |
| `frontend/src/lib/validation.ts` | create |
| `frontend/src/lib/initials.ts` | create |
| `frontend/src/lib/browserStorage.ts` | create |
| `frontend/src/services/apiClient.ts` | create |
| `frontend/src/services/apiError.ts` | create |
| `frontend/src/services/authService.ts` | create |
| `frontend/src/services/userService.ts` | create |
| `frontend/src/store/appStore.ts` | create |
| `frontend/src/store/sessionAtoms.ts` | create |
| `frontend/src/store/sessionActions.ts` | create |
| `frontend/src/store/profileAtoms.ts` | create |
| `frontend/src/store/wireApi.ts` | create |
| `frontend/src/main.tsx` | edit (Jotai `Provider` with `appStore`; call `wireApi()` once) |
| `scripts/frontend-lib-check.ts` | create |

## Approach

- **`lib/token.ts`.** `readToken(token: string): Session | null` where `Session = { userId: number; role: Role | null; expiresAt: number | null }` and `Role = "student" | "alumni" | "admin"`. Decode the payload only (base64url, UTF-8). `sub` must be a whole number; a role that is not one of the three gives `role: null` and the session is still valid (G42). `exp` in seconds becomes `expiresAt` in milliseconds. Anything malformed gives `null`. `isExpired(session, now)`.
- **`lib/validation.ts`.** Each validator takes the raw string and returns a message or `null`. Messages are exported constants with the exact wording of AC46 and AC53: `validateEmail` ("Enter your email." / "Enter a valid email, like name@example.com."), `validateLoginPassword` ("Enter your password."), `validateName` ("Enter your full name."), `validateNewPassword` ("Use at least 8 characters."; counts characters as typed, no trim), `validatePhotoLink` (empty is fine; else must start with `http://` or `https://`: "Enter a link that starts with https://"). Email and name are judged after `trim()`.
- **`lib/initials.ts`.** `initialsOf(name: string | null): string`: first letters of the first and last word, upper case; one word gives one letter; empty or null gives `""`.
- **`lib/browserStorage.ts`.** `readStored`, `writeStored`, `removeStored` that wrap `localStorage` in `try`/`catch` and never throw.
- **`services/apiClient.ts`.** One `axios.create()` with no base URL (relative `/api` paths). `configureApiClient({ getToken, onUnauthorized })`. Request interceptor: add `Authorization: Bearer <token>` when `getToken()` returns one, and remember that token on the request config. Response interceptor: on 401, if the request is not marked `skipAuthHandling` and its remembered token equals `getToken()` now, call `onUnauthorized()`. Always reject with the error. Extend `AxiosRequestConfig` with `skipAuthHandling?: boolean`.
- **`services/apiError.ts`.** `ApiFailure = { kind: "network" } | { kind: "http"; status: number }` and `toApiFailure(error: unknown): ApiFailure`. No server text is passed on.
- **`services/authService.ts`:** `logIn(body: LoginUserDTO): Promise<LoginResponse>` → `POST /api/auth/login`, `skipAuthHandling`. **`services/userService.ts`:** `signUp(body: SignUpUserDTO): Promise<PublicUser>` → `POST /api/users` (`skipAuthHandling`); `getUser(id): Promise<PublicUser>` → `GET /api/users/:id`; `logOut(id): Promise<void>` → `PUT /api/users/:id/logout` (`skipAuthHandling`; the answer is an empty 200, G41). Types from `@alumni/shared` only.
- **Store.** `appStore = createStore()`. `sessionAtoms.ts`: `tokenAtom` (starts from storage; its setter writes or removes `ua.token`), `sessionAtom` (derived with `readToken`), `authNoticeAtom` (`null | "sessionEnded" | "loggedOut"`). `profileAtoms.ts`: `profileAtom` (`{ status: "idle" | "loading" | "ready" | "error"; user: PublicUser | null }`) and `loadProfileAtom` (write-only; ignores an answer that arrives for a user id that is no longer the session's). `sessionActions.ts`, write-only atoms that return a result and never throw: `logInAtom` → `{ ok: true } | { ok: false; failure: ApiFailure }`; `signUpAtom` → `{ ok: true; loggedIn: boolean } | { ok: false; failure: ApiFailure }` (create the user, then log in with the same email and password; a failed log in gives `loggedIn: false`); `logOutAtom` (call `logOut`, ignore failure, then in one store update clear token and profile and set notice `loggedOut`); `endSessionAtom` (clear token and profile, set notice `sessionEnded`; the only way a dead session is cleared). `logInAtom` takes `{ email, password, rememberEmail }`; on success it first writes the email to `ua.rememberedEmail` or removes that key, then clears the notice and sets the token last, because setting the token makes the `PublicOnly` guard navigate away. `loadProfileAtom` first sets `{ status: "loading", user: null }`.
- **`store/wireApi.ts`.** `wireApi()` calls `configureApiClient` with `getToken: () => appStore.get(tokenAtom)` and an `onUnauthorized` that dispatches `endSessionAtom`. At start-up, before the first render, it reads the stored token: if it cannot be read or is expired, it dispatches `endSessionAtom`. It also adds one `storage` event listener that copies a change of `ua.token` from another tab into `tokenAtom`.
- **`scripts/frontend-lib-check.ts`** (run: `npx tsx scripts/frontend-lib-check.ts`). Imports only from `frontend/src/lib/`. A tiny `check(name, got, want)` helper; exit 1 if any case fails; print passed and failed counts. Write the cases from the spec, not from the code: every message of AC46 and AC53; values that must pass (`a@b.co`, a name with spaces around it, an 8-character password, a password of 8 spaces, an empty photo link, `https://x.y/z.png`); values that must fail (`a@b`, `@b.co`, `a b@c.de`, 7 characters, `ftp://x`, `javascript:alert(1)`, `www.x.com`); tokens built in the script: valid, expired, no `exp`, role `""`, role `"teacher"`, `sub` as `"12"`, `sub` as `1.5`, two-part string, non-base64 payload, a name with non-ASCII letters in the payload; initials for `"Nadia Rahman"`, `"  nadia  "`, `"Anna Maria Berg"`, `""`, `null`.

## Acceptance

- [ ] AC3, AC5: services import their types from `@alumni/shared` and `frontend/src` has no copy of them
- [ ] AC4 (logic): a 401 on a normal call triggers `onUnauthorized`; a 401 on log in, sign-up or log out does not; a 401 that belongs to an older token does not
- [ ] AC42 (logic): `sessionAtom` is `null` for a broken token, and `isExpired` is true for an expired one; a stored expired token is ended at start-up with the notice `sessionEnded`
- [ ] No action in `sessionActions.ts` navigates, and nothing but `endSessionAtom` and `logOutAtom` clears the token
- [ ] `npx tsx scripts/frontend-lib-check.ts` exits 0. It can fail: change one expected message in the script, see exit 1, change it back. Record both runs
- [ ] `npm run build` exits 0

## Notes

- **Rules for every task of this REQ.** Never read or print any `.env` file. Never run `psql` or anything that changes the database. Never run `git push` or any git command that writes. Touch nothing under `backend/`, `shared/` or `db/`. Delete no file that this task's table does not list. Add no package that this task does not name. If the task cannot be done inside these rules, stop and write why in the implementation notes.
- Read `architecture.md` in this REQ folder first (layout, token names, the size-snapping table). Read `docs/design/README.md` and the screen files this task names. Do not copy inline styles from the screens; read the tokens.
- Compiler rules: `import type` for types, no enums, no unused locals or parameters. No barrel `index.ts` files for components.
- `lib/` files must not touch `window`, `document` or `localStorage` at import time, or the check script cannot load them. `browserStorage.ts` touches `localStorage` only inside its functions.
- Do not lower-case the email: the database treats letter case as different.
- `sub` as the string `"12"`: the backend always signs a number, so a string is refused (`null`). The check script expects that.
- `tsx` is already installed for the backend; do not add it to `frontend/package.json`. If `npx tsx` cannot resolve it from the repo root, say so in the notes and stop.

### Implementation notes (task-implementer, 2026-10-07)

**Checks run.**

- `npx tsx scripts/frontend-lib-check.ts` → `72 passed, 0 failed`, exit 0.
- Can it fail: changed the expected text to "Use at least 9 characters." → `70 passed, 2 failed`, exit 1. Changed back → `72 passed, 0 failed`, exit 0.
- `npm run build` from the repo root → exit 0 (TASK-002's files were already there; no retry was needed).
- `node scripts/frontend-style-check.mjs` (TASK-002's check) → PASS with these files in place.
- A scratch harness, not shipped (it lives in the session's temp folder), ran the real store and services against a fake `localStorage`, a fake `window` and a fake axios adapter: 69 cases, all passed. It proved the acceptance lines the lib-only script cannot reach: a 401 on a normal call ends the session; a 401 on log in, sign-up or log out does not; a 401 that belongs to an older token does not; a stored expired or unreadable token is ended in `wireApi()` with the notice `sessionEnded`; log in, sign-up, log out and the 401 each reach listeners as one state. Nothing was run against the real backend or a browser.

**Choices the task text left open.** Each is small; say so if any should change.

1. **A 401 on a call sent with no token does nothing.** The task says "remembered token equals `getToken()` now". With nobody logged in both are "nothing", so a visitor would get "Your session has ended". The client only acts when the request really carried a token.
2. **A 200 log in whose token cannot be read is a failure** (`{ kind: "network" }`), not a session. Example: a proxy answering `/api` with a web page.
3. **The actions trim, not the pages.** `logInAtom` trims the email. `signUpAtom` takes a `SignUpUserDTO`, trims email, name and photo link, and sends an empty name or photo link as `null`. The password is never trimmed and the email's case is kept. Pages may pass the raw field values.
4. **Sign-up does not touch the remembered email.** Its log in step shares the request code with `logInAtom` but skips the remember step; the sign-up form has no such checkbox.
5. **`loadProfileAtom` takes no argument.** It reads the user id from `sessionAtom`. With no session it sets the profile to `idle`.
6. **Starting a session also resets the profile to `idle`**, in the same update as the notice and the token (token last).
7. **Other tabs.** `wireApi` dispatches `tokenChangedElsewhereAtom` (in `sessionActions.ts`). It takes the other tab's token without writing storage again, and resets the profile when the user id changed. It does not set a notice. This is the one place besides `endSessionAtom` and `logOutAtom` where the token can become empty: it copies a log out that already happened in another tab, as the architecture asks. A cleared storage (event with no key) counts as logged out.
8. **Validators.** The new-password rule counts characters, not UTF-16 units (four emoji are four characters). The photo link check ignores letter case (`HTTPS://` passes) and is exported as `isWebLink`, so the Avatar (TASK-006) can use the same rule instead of a second one.
9. **Token reader.** `exp` that is present but not a number gives `null`. `isExpired` is true from the expiry moment on (`now >= expiresAt`), as the backend's library judges it. A token with no `exp` never expires on the frontend; the server still decides.
10. **`sessionAtom` does not judge expiry.** An atom has no clock. `wireApi` checks at start-up; `RequireAuth` (TASK-008) must call `isExpired(session, Date.now())` on each render and dispatch `endSessionAtom`.

**For later tasks.**

- TASK-008: `RequireAuth` and `PublicOnly` read `sessionAtom` and `authNoticeAtom`; both change in one update, so the guard can trust what it sees. Log out's "go to log in" is the guard's redirect; `logOutAtom` does not navigate.
- TASK-009: after `signUpAtom` answers `{ ok: true, loggedIn: true }` the page is already being replaced; push the "Account created" toast through the store, not page state. For `loggedIn: false` the page shows the success message on log in. Read the remembered email with `readStored(REMEMBERED_EMAIL_STORAGE_KEY)`.

**Follow-ups, not done here.**

- The API client has no timeout. Log out waits for the server before it clears the session, so a server that never answers leaves the user logged in until the browser gives up. A timeout constant in `apiClient.ts` would bound it. Needs a decision.
- A device clock more than an hour ahead makes every fresh token look expired. Not handled; the server's clock is not known to the frontend.
- The store checks above live in a scratch file. Shipping them as `scripts/frontend-store-check.ts` would need its own task (the lib check may import only from `lib/`).
- ESLint is not installed, so the one `eslint-disable` line in `apiClient.ts` (for the `any` that axios's own type parameters force) is untested.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-004-frontend-foundation-shell-auth/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-003-1]], [[knowledge/lessons/LESSON-REQ-fs-003-2]], [[knowledge/lessons/LESSON-REQ-fs-003-4]]
