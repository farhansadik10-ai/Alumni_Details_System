# TASK-003 — Pure library, services, session store, the library check

| Field | Value |
|---|---|
| REQ | REQ-fs-004 |
| Tier | 1 |
| Status | pending |
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

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-004-frontend-foundation-shell-auth/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-003-1]], [[knowledge/lessons/LESSON-REQ-fs-003-2]], [[knowledge/lessons/LESSON-REQ-fs-003-4]]
