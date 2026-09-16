# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

This is an npm workspaces monorepo. Run all commands from the repo root.

- Install deps: `npm install` (installs for every workspace)
- Run both API and frontend dev servers: `npm run dev`
- Run only the API dev server: `npm run dev:api` (runs `tsx watch` on `backend/src/server.ts`, workspace `@alumni/api`)
- Run only the frontend dev server: `npm run dev:frontend` (Vite, workspace `@alumni/frontend`)
- Build everything: `npm run build` (builds `@alumni/api` then `@alumni/frontend`)
- Frontend-only build/preview: `npm run build --workspace=@alumni/frontend`, `npm run preview --workspace=@alumni/frontend`
- Frontend lint: `npm run lint --workspace=@alumni/frontend` (flat ESLint config with typescript-eslint + react-hooks/react-refresh)

There is no test runner configured anywhere in the repo (the `shared` package's `test` script is an unimplemented placeholder). `backend/src/businessLogic/src/TestManager.ts` and `backend/src/dal/TestDal.ts` are ad hoc, commented-out manual scratch scripts used during development, not an actual test suite — don't treat them as tests or try to run them as such.

### Environment

Backend config comes from a single root-level `.env` (not `backend/.env`), read via `dotenv` from multiple files with relative paths (`backend/src/server.ts`, `backend/src/dal/config/db.ts`, `backend/src/api/app.ts`). Required vars: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`. `db.ts` throws at import time if `DB_PASSWORD` is missing/empty, so the API process will not boot without a valid root `.env`.

The frontend reads `frontend/.env` (`VITE_API_URL`), but `frontend/src/services/authApi.ts` currently calls relative paths like `/api/auth/login` directly via axios rather than using that env var, and `vite.config.ts` has no dev-server proxy configured — keep this in mind when wiring up new frontend API calls or debugging why requests 404 in dev.

## Architecture

### Backend: layered monorepo packages under `backend/src/`

Three npm workspaces form a strict dependency chain, each with its own `package.json`/`tsconfig.json`:

1. **`dal`** (`@alumni/dal`) — data access layer. `query/*Query.ts` classes (`UserQuery`, `AlumniQuery`, `PostQuery`, `CommentQuery`) hold raw parameterized SQL against a shared `pg` `Pool` (`dal/config/db.ts`), returning/accepting `dto/*DTO.ts` classes that mirror DB rows (`UserDTO`, `AlumniDTO`, `PostDTO`, `CommentDTO`, all implementing `BaseDTO`). Everything is re-exported from `dal/index.ts`.
2. **`businessLogic`** (`@alumni/businesslogic`) — one Manager class per domain (`UserManager`, `AlumniManager`, `PostManager`, `CommentManager`) in `businessLogic/src/`, each wrapping the corresponding `*Query` class. Managers contain no SQL; they're a thin pass-through/validation layer between controllers and the DAL. Re-exported from `businessLogic/index.ts`.
3. **`api`** (`@alumni/api`) — Express app. `api/routes/*Routes.ts` wire URL paths to `api/controllers/*Controller.ts` functions, which call into the Managers. `api/app.ts` mounts routes under `/api/auth`, `/api/users`, `/api/alumni`, `/api/posts`, `/api/comments`, plus a `/api/health` check. `backend/src/server.ts` is the actual process entrypoint (loads env, calls `app.listen`).

New backend features should follow this same Route → Controller → Manager → Query → DB flow rather than skipping layers.

Auth specifics: there is no dedicated `AuthController`/`AuthManager` — login and JWT logic (`login`, `verifyToken`) live directly in `UserController.ts`. `api/MiddleWare/authMiddleware.ts` verifies the bearer token and sets `req.user = { sub, role }`; `api/MiddleWare/roleMiddleware.ts`'s `requireRole(...roles)` checks `req.user.role`. Route files compose these two middlewares per-route (see `AlumniRoutes.ts`) rather than applying auth globally.

### `shared` package (`@alumni/shared`)

Holds cross-cutting TypeScript types (`shared/types/*.types.ts`) consumed by workspace name. Compiled `.js`/`.d.ts` output is checked in alongside the `.ts` sources — if you edit a `.ts` file here, keep in mind consuming workspaces resolve `@alumni/shared` via the package's `main` (`index.ts`), so most day-to-day imports pull directly from source, not the compiled output.

### Frontend (`frontend/`, workspace `@alumni/frontend`)

React 18 + TypeScript + Vite, using `antd` for UI components, `axios` for HTTP, `jotai` for state, and `react-router-dom` for routing.

- `src/App.tsx` defines the two current routes: `/` → `pages/LoginPage.tsx`, `/dashboard` → `pages/Dashboard.tsx`.
- `pages/` holds route-level containers; `components/` holds the actual presentational implementation used by the matching page (e.g. `pages/LoginPage.tsx` renders `components/LoginFrom.tsx` — note the existing typo in that filename, "From" not "Form"; don't "fix" it as an unrelated rename without checking all imports).
- `src/store/authAtom.ts` holds jotai atoms: `tokenAtom` (seeded from `localStorage`) and the derived `isLoggedInAtom`.
- `src/services/*Api.ts` is the axios call layer (see the env caveat above).

### Root-level oddity

There is no root `.gitignore`, so the root `node_modules/` (including the `node_modules/@alumni/*` workspace-linked copies) is tracked in git on this repo/platform. Diffs under `node_modules/` are install artifacts mirroring the real source in `backend/`/`frontend`/`shared` — don't hand-edit files there, and don't be alarmed by them showing up in `git status`.

## Other resources

- `postman/` and `.postman/` contain Postman collections/environments/specs for manually exercising the API.
