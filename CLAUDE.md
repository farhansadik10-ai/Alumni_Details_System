@.adlc/CLAUDE.md

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
- Frontend checks: `npm run check:frontend` (the style check and the library check in `scripts/`; there is still no test runner)

There is no test runner configured anywhere in the repo (the `shared` package's `test` script is an unimplemented placeholder). `backend/src/businessLogic/src/TestManager.ts` and `backend/src/dal/TestDal.ts` are ad hoc, commented-out manual scratch scripts used during development, not an actual test suite — don't treat them as tests or try to run them as such.

### Environment

Backend config comes from a single root-level `.env` (not `backend/.env`), read via `dotenv` from multiple files with relative paths (`backend/src/server.ts`, `backend/src/dal/config/db.ts`, `backend/src/api/app.ts`). Required vars: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`. `db.ts` throws at import time if `DB_PASSWORD` is missing/empty, so the API process will not boot without a valid root `.env`.

The frontend calls the API with relative paths like `/api/auth/login`. In dev, `frontend/vite.config.ts` proxies `/api` to the backend at `http://localhost:3000`; in production Apache proxies `/api`. `VITE_API_URL` in `frontend/.env` is not used by any code — don't wire new API calls to it. If requests fail in dev, check that the API dev server is running on port 3000.

## Architecture

### Backend: layered monorepo packages under `backend/src/`

Three npm workspaces form a strict dependency chain, each with its own `package.json`/`tsconfig.json`:

1. **`dal`** (`@alumni/dal`) — data access layer. `query/*Query.ts` classes (`UserQuery`, `AlumniQuery`, `PostQuery`, `CommentQuery`) hold raw parameterized SQL against a shared `pg` `Pool` (`dal/config/db.ts`), returning/accepting `dto/*DTO.ts` classes that mirror DB rows (`UserDTO`, `AlumniDTO`, `PostDTO`, `CommentDTO`, all implementing `BaseDTO`). Everything is re-exported from `dal/index.ts`.
2. **`businessLogic`** (`@alumni/businesslogic`) — one Manager class per domain (`UserManager`, `AlumniManager`, `PostManager`, `CommentManager`) in `businessLogic/src/`, each wrapping the corresponding `*Query` class. Managers contain no SQL; they're a thin pass-through/validation layer between controllers and the DAL. Re-exported from `businessLogic/index.ts`.
3. **`api`** (`@alumni/api`) — Express app. `api/routes/*Routes.ts` wire URL paths to methods of the controller classes in `api/controllers/*Controller.ts` (through `handler(instance, "method")` from `api/utils/asyncHandler.ts`), which call into the Managers. `api/app.ts` mounts routes under `/api/auth`, `/api/users`, `/api/alumni`, `/api/posts`, `/api/comments`, `/api/stats`, plus a `/api/health` check, then a 404 handler and the one error middleware (`api/MiddleWare/errorMiddleware.ts`). Code refuses a request by throwing a typed error from `@alumni/businesslogic`; every error body is `{ "error": "<message>" }`. `backend/src/server.ts` is the actual process entrypoint (loads env, calls `app.listen`).

New backend features should follow this same Route → Controller → Manager → Query → DB flow rather than skipping layers.

Auth specifics: login is `AuthController.login`; the token code (`signToken`, `verifyToken`) is in `api/utils/token.ts`. There is no `AuthManager`. `api/MiddleWare/authMiddleware.ts` verifies the bearer token and sets `req.user = { sub, role }`; `api/MiddleWare/roleMiddleware.ts`'s `requireRole(...roles)` checks `req.user.role`. Route files compose these two middlewares per-route (see `AlumniRoutes.ts`) rather than applying auth globally.

### `shared` package (`@alumni/shared`)

Holds cross-cutting TypeScript types (`shared/types/*.types.ts`) consumed by workspace name. Compiled `.js`/`.d.ts` output is checked in alongside the `.ts` sources — if you edit a `.ts` file here, keep in mind consuming workspaces resolve `@alumni/shared` via the package's `main` (`index.ts`), so most day-to-day imports pull directly from source, not the compiled output.

### Frontend (`frontend/`, workspace `@alumni/frontend`)

React + TypeScript + Vite, with `jotai` for state, `react-router-dom` for routing and one `axios` client in `src/services/`. Styles are CSS Modules on the design tokens in `src/styles/tokens.css`; there is no UI library. Parts 1 and 2 of the rebuild (REQ-fs-004, REQ-fs-005) are done: foundation, theme, base components, app shell, log in, sign-up, the alumni directory, the alumni profile and My profile; the feed, dashboard and users pages are still "This page is being built" placeholders. The structure and the patterns are in `docs/frontend-patterns.md`; the rules are in "Conventions (redesign)" below.

### Ignored files

The root `.gitignore` ignores `node_modules/` (at any depth, including the nested `backend/src/api/node_modules` and `backend/src/dal/node_modules`), `.env`, `frontend/.env` and `dist/`. None of these are tracked in git: run `npm install` after cloning, and create the root `.env` and `frontend/.env` by hand (see Environment above). Never commit them. Earlier commits still contain `node_modules/` and the `.env` files, so their secrets must be treated as exposed and rotated.

## Other resources

- `postman/` and `.postman/` contain Postman collections/environments/specs for manually exercising the API.

## Conventions (redesign)

### Workflow
- Use the ADLC pipeline (/spec, /architect, /implement, /review, /wrapup).
- Never write code before the spec and architecture gates are approved.
- Roadmap and status live in docs/roadmap.md; update the status column at every wrap-up.

### Backend
- npm workspaces; layers stay routes -> controllers -> Managers -> Query classes.
- Controllers are classes; routes bind instance methods.
- One shared error middleware; no per-method try/catch for HTTP mapping.
- Every non-public route uses authMiddleware, plus requireRole and an owner check where needed.
- SQL uses the real names in db/schema.md ("User", alumni, posts, comment). No schema change without the owner's approval.
- No endpoint returns the password column.

### Frontend
- React + Vite + TypeScript, rebuilt from scratch in frontend/src.
- State: Jotai atoms in src/store/.
- No UI library; we build our own components on the design tokens. antd was removed in REQ-fs-004; do not add a UI library.
- Scandinavian design: neutral palette, generous whitespace, clean typography, few accents.
- White-label: no university logo; the app name is text from one constant.
- Theme: light, dark, system; toggle in header; choice persisted; follows prefers-color-scheme in system mode.
- All colors/spacing/type come from design tokens; no hardcoded values in components.
- Designs live in docs/design/; the written rules live in .adlc/context/design-system.md. Follow both.
- Screens show only fields that exist in db/schema.md.
- Every list and form has loading, empty and error states.
- Responsive from 360px up; no layout breaks at 200% zoom.
- Text contrast meets WCAG AA in both themes; keyboard focus is visible.
- API calls live in src/services/ and use relative /api paths; no API calls inside UI components. Types come from @alumni/shared.
