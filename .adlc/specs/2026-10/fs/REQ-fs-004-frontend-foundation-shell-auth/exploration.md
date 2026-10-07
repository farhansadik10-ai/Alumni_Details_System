# REQ-fs-004 — Codebase exploration

| Field | Value |
|---|---|
| Generated | 2026-10-07 |
| By | codebase-explorer (tier: fast) |
| Repo(s) scanned | alumni-details-system |

## 1. Similar existing implementations

| Path | What it does | Recommended action |
|---|---|---|
| `frontend/src/store/authAtom.ts` | Jotai atoms for token, logged-in state, current user decoded from JWT | follow — same mechanism for token storage and decoding |
| `frontend/src/services/apiClient.ts` | axios client with interceptors to add Bearer token on every request; 401 → remove token and redirect to login | follow — same pattern for auth-related 401 handling; AC4 requires showing "Your session has ended" message on login page |
| `frontend/src/services/authApi.ts` | `login(email, password)` calls POST /api/auth/login with `skipAuthRedirect` to catch 401 as wrong credentials | follow — same shape for login service; reuse for sign-up calls too |
| `frontend/src/utils/jwt.ts` | `decodeJwt()` (payload only, not signature), `toCurrentUser()`, `isExpired()` for token expiry checks | follow — logic is correct; reuse these functions |
| `frontend/src/constants/validation.ts` | Form validation rules (email regex, password min length 8, MAX_LENGTH constants from schema) | follow — has form rules, but uses antd FormRule type; convert to plain validators |
| `frontend/src/hooks/useCurrentUser.ts`, `useLogout.ts` | Custom hooks wrapping Jotai atoms for user state | follow — same pattern for state management |
| `frontend/src/routes/RequireAuth.tsx`, `RequireRole.tsx` | Route guards checking token and role | follow — same pattern for route protection; AC37-AC39 match these rules |

**Note on deletion:** All 30 files that import `antd` or `@fontsource-variable/inter` must be replaced or deleted per AC1-AC2.

## 2. Blast radius

| Path | Why touched | Risk |
|---|---|---|
| `frontend/src/` (all .tsx, .ts files) | Complete rebuild; all 30 files with antd imports are removed or replaced | **high** — entire codebase changes |
| `frontend/package.json` | Remove `antd`, `@ant-design/icons`, `@fontsource-variable/inter`; keep axios, jotai, react-router-dom | **high** — deps change; build may fail if sizes/names differ |
| `frontend/vite.config.ts` | Dev proxy `/api` stays; only lint config may need CSS Module typing. `VITE_API_URL` stays unused per CLAUDE.md | **low** — no changes needed |
| `frontend/tsconfig.app.json` | No changes; already has `types: ["vite/client"]` for CSS Module typing and `allowArbitraryExtensions: true`. Compiler rules (`verbatimModuleSyntax`, `erasableSyntaxOnly`, `noUnusedLocals`) already set | **low** |
| `frontend/eslint.config.js` | No changes needed; does not mention antd or Inter font | **low** |
| `frontend/index.html` | Update `<title>` to use app name constant (AC62); remove any antd or font-related meta tags | **low** — title string only |
| `backend/src/api/routes/*.ts`, `backend/src/api/controllers/*.ts` | Frontend calls login, sign-up, get user, logout endpoints; no code changes needed; will be consumed by the frontend API service layer | **low** — API is already built (REQ-fs-003) |
| `shared/types/user.types.ts` | Frontend imports `LoginUserDTO`, `SignUpUserDTO`, `LoginResponse`, `PublicUser`, `ApiError` from `@alumni/shared` (AC5); no changes needed | **low** — types already exist; new frontend uses them correctly |
| `.adlc/context/design-system.md` | Needs update at wrap-up to record token names, token file path, config file path (AC64) | **medium** — vault maintenance, not source |
| `CLAUDE.md` (root) | Frontend section needs update at wrap-up to reflect new patterns (token/theme storage keys, page addresses; AC64) | **medium** — vault maintenance, not source |
| `docs/roadmap.md` | Mark F1 to F5 done at wrap-up (AC64) | **low** — vault only |
| `docs/frontend-patterns.md` | Create at wrap-up (AC63) to document each design pattern: where it lives, why chosen | **low** — new file, vault only |

## 3. Integration points

**API calls (from frontend to backend, no changes to backend):**

- `POST /api/auth/login` — exists, returns `{ token }` (type `LoginResponse` from shared); login call should set 401 message "The email or password is not correct." (AC47, G34), server error "Something went wrong. Try again." (AC48)
- `POST /api/users` — exists, sign-up with `SignUpUserDTO` (shared); answers 201 with `PublicUser` or 409 for duplicate email (AC54, message from G34: "This email is already registered.")
- `GET /api/users/:id` — exists, returns `PublicUser` (shared); called to load user's name and photo for the header (AC41)
- `PUT /api/users/:id/logout` — exists, answers 200 with `PublicUser` per G41 (gotcha: no token refresh, just record logout time); called on log out (AC43); fetch fails → still log out (AC43)

**Shared types to import (read-only):**

- `LoginUserDTO`, `SignUpUserDTO`, `LoginResponse`, `PublicUser`, `ApiError` from `@alumni/shared` (AC5); no `User` or `CreateUserDTO` (AC5)

**Styling and tokens:**

- 27 color tokens named in `.adlc/context/design-system.md` section "Color" (all used by components)
- Type, spacing, shape, radius, borders, control heights, header heights defined in README sections 3 and 4, not yet tokenized (to be named in this REQ); stored in CSS variables on root element, switched with `data-theme` attribute
- Font: Hanken Grotesk 400/500/600/700 via self-hosted or service (to be decided at design gate); fallback `'Segoe UI', Helvetica, sans-serif`

**State management (Jotai):**

- Token atom: stores JWT string from localStorage
- Current user atom: decoded token (id, role, expiry check)
- Logged-in atom: boolean derived from token presence
- Theme atom: light/dark/system, persisted to localStorage before first paint (AC15)

**Route guards:**

- Public routes: login, sign-up
- Logged-in routes: dashboard, directory, alumni profile, feed, my profile
- Admin-only routes: users
- Logged-in user opened login/sign-up → send to dashboard (AC38)
- Logged-out user opened protected page → send to login (AC37)
- Logged-in non-admin opened users → show "You do not have access" inside shell (AC39)

**Error handling (from G29, G34, fixed by REQ-fs-003):**

- All error responses now use `{ error: "<message>" }` shape (not `{ message }`)
- 401 (wrong credentials on login only) → form shows error, no redirect
- 401 (any other call) → log out and send to login with "Your session has ended" message (AC4)
- 409 duplicate email → "This email is already registered." (AC54)
- 400 validation errors → field-specific messages (AC46, AC53)
- 500 or no server → "Something went wrong. Try again." (AC48)

## 4. Test coverage

| Test file | Scenarios covered | Gaps for new code |
|---|---|---|
| None found in repo | — | No automated test runner configured (per CLAUDE.md "unimplemented placeholder"). Manual browser testing required. AC65 lists a manual checklist: sign up as Student and Graduate, log in, wrong password, taken email, theme switch and reload, phone menu, keyboard-only, log out, expired session. |

## Dependency sketch

```
├─ frontend/src/pages/LoginPage
│  ├─ LoginForm (form + validation)
│  │  └─ services/authApi.login()
│  │     └─ apiClient (adds token, handles 401)
│  │        └─ shared types: LoginUserDTO, LoginResponse, ApiError
│  └─ store/authAtom (set token on success)
│     └─ utils/jwt (decode token)
│
├─ frontend/src/pages/SignUpPage
│  ├─ SignUpForm (form + validation)
│  │  └─ services/usersApi (POST /api/users)
│  │     └─ apiClient
│  │        └─ shared types: SignUpUserDTO, PublicUser, ApiError
│  └─ store/authAtom (set token via login call)
│
├─ frontend/src/components/layout/AppShell
│  ├─ Header
│  │  ├─ Theme switch (toggle store)
│  │  ├─ User avatar + name (load from GET /api/users/:id)
│  │  └─ Logout (PUT /api/users/:id/logout, clear token)
│  ├─ Band (page heading)
│  ├─ Route-specific content
│  └─ Footer
│
├─ store/authAtom
│  ├─ tokenAtom (from localStorage)
│  ├─ isLoggedInAtom (derived)
│  └─ currentUserAtom (decoded + expiry check)
│
├─ store/themeAtom (new)
│  └─ localStorage persistence + system preference fallback
│
└─ routes (route guards)
   ├─ RequireAuth (logged in?)
   ├─ RequireRole (admin?)
   └─ route-level redirects
```

## Design file references

**Key measurements from `docs/design/screens/system.html` not in README:**

- Avatar sizes: 32px, 44px, 72px (all square, initials on `--accent-soft`)
- Button padding: primary 0 20px (h: 44px), secondary 0 20px (h: 44px), small 0 14px (h: 36px); quiet buttons 0 12px
- Input/textarea padding: 0 12px vertical 12px (h: 44px)
- Button sizes: 44px (default), 36px (small), 48px (login/phone) per AC60
- Theme switch: three icon buttons in header desktop, three text buttons (Light/Dark/System) in phone menu
- Phone menu structure: app name header, large navigation links, theme as text buttons, user block (name + avatar), Log out

**Colors to implement (27 total, all in `.adlc/context/design-system.md`):**

All listed; hex values provided for light and dark. `--band` and `--band-text` used by the band component. `--band-muted` for subheading. `--on-action`, `--on-accent`, `--on-danger` are contrast pairs.

## Vault references

- [[knowledge/gotchas#^g04|G04]] — alumni reads need joins; frontend will call the API, which is fixed in REQ-fs-003
- [[knowledge/gotchas#^g29|G29]], [[knowledge/gotchas#^g34|G34]] — error response shape is now `{ error }` everywhere (fixed by REQ-fs-003); frontend must match
- [[knowledge/gotchas#^g41|G41]] — logout response is 200 with the user record (no token refresh), per ADR-11
- [[knowledge/lessons/LESSON-REQ-fs-003-2]] — when code cannot be run, test the pure parts (validation, JWT decoding); applies to frontend validation rules
- [[architecture/adr-11-typed-errors-and-one-error-middleware|ADR-11]] — error middleware (backend) produces one shape; frontend must match

## Open questions

- **Font loading**: How is Hanken Grotesk loaded — self-hosted .woff2 files or a font service? (to decide at design gate)
- **Token storage key**: What localStorage key stores the JWT? (spec says `TOKEN_STORAGE_KEY` in legacy; new code may use a different key; to decide)
- **Theme storage key**: What localStorage key stores the theme choice (light/dark/system)? (to decide)
- **Token file path**: Where does `token.ts` live — `frontend/src/utils/token.ts` or `frontend/src/lib/token.ts`? (to decide)
- **Config file path**: Where does the app name and alumni office email constant live? (spec says "one config file"; to decide; proposed path `frontend/src/config/app.ts`)
- **Phone breakpoint width**: At which width does the phone layout start? (README shows 390px in pictures; "narrow screens" are undefined; to decide at design gate)
- **z-index scale**: Layer order (z-index) token names and values. (to decide)
- **Icon set**: Are line icons drawn in the repo or from a package? (to decide; spec says 2px stroke, `currentColor`, no emoji)
- **Page addresses**: Do login and sign-up stay at `/` or move to `/login` and `/signup`? (to decide)
- **Button pressed color**: A pressed (active) color for buttons beyond hover. (to decide; secondary button hover is `--sunken`)

## Open findings

None. All legacy code is accounted for (30 files to replace or delete, shown to owner per AC2). API is built and tested. Shared types exist. Design is approved. No test runner exists (expected per CLAUDE.md).
