# Architecture Overview

High-level shape of the system. Updated when major architectural changes land (usually as part of an ADR).

## What this project is

> **STATUS: needs verification** — synthesized from `CLAUDE.md` on 2026-10-05. Review and edit; remove this banner when confirmed.

An npm workspaces monorepo with a layered Express + PostgreSQL backend, a `shared` types package, and a React + Vite frontend. See [[context/project-overview]] for the what-and-why.

## System diagram

> **STATUS: needs verification** — drawn from the prose in `CLAUDE.md` (Architecture) and `AIdlc/plan.md` (Decision Log: Apache) on 2026-10-05; the source has no diagram of its own. Review and edit; remove this banner when confirmed.

```
Browser
  │
  ▼
Apache (HTTPS) ── serves the built frontend
  │                 (in dev: Vite, with a /api proxy)
  │  /api/*
  ▼
api            Express: routes → controllers      (@alumni/api)
  │
  ▼
businessLogic  one Manager per domain, no SQL     (@alumni/businesslogic)
  │
  ▼
dal            *Query classes, DTOs, pg Pool      (@alumni/dal)
  │
  ▼
PostgreSQL

shared (@alumni/shared) — TypeScript types used across workspaces
```

## Major components

> **STATUS: needs verification** — synthesized from `CLAUDE.md` on 2026-10-05. Review and edit; remove this banner when confirmed.

| Component | Responsibility | Tech |
|---|---|---|
| `backend/src/dal` (`@alumni/dal`) | Data access. `query/*Query.ts` classes (`UserQuery`, `AlumniQuery`, `PostQuery`, `CommentQuery`) hold raw parameterized SQL and return/accept `dto/*DTO.ts` classes that mirror DB rows (all implement `BaseDTO`). Re-exported from `dal/index.ts`. | TypeScript, `pg` |
| `backend/src/businessLogic` (`@alumni/businesslogic`) | One Manager class per domain (`UserManager`, `AlumniManager`, `PostManager`, `CommentManager`), each wrapping its `*Query` class. No SQL — a thin pass-through/validation layer. Re-exported from `businessLogic/index.ts`. | TypeScript |
| `backend/src/api` (`@alumni/api`) | Express app. `routes/*Routes.ts` wire URL paths to `controllers/*Controller.ts`, which call the Managers. `app.ts` mounts `/api/auth`, `/api/users`, `/api/alumni`, `/api/posts`, `/api/comments`, and `/api/health`. | Express |
| `backend/src/server.ts` | Process entrypoint: loads env, calls `app.listen`. | Node, `tsx` |
| `shared` (`@alumni/shared`) | Cross-cutting types in `shared/types/*.types.ts`, consumed by workspace name. Compiled `.js`/`.d.ts` output is checked in beside the sources, but the package `main` is `index.ts`, so most imports resolve to source. | TypeScript |
| `frontend` (`@alumni/frontend`) | React app. `pages/` holds route-level containers, `components/` the presentational pieces, `services/*Api.ts` the axios call layer, `store/` the jotai atoms. | React 18, Vite, antd, axios, jotai, react-router-dom |

The frontend's full target folder structure and its reusable components are in `AIdlc/plan.md` → "UI Design and Code Structure" (sections b and c). `CLAUDE.md` still describes the frontend as it was before bolts B1–B7 (two routes, `LoginFrom.tsx`); the plan's Decision Log records what changed since.

## Data stores

> **STATUS: needs verification** — synthesized from `CLAUDE.md` and `AIdlc/plan.md` (Database schema) on 2026-10-05. Review and edit; remove this banner when confirmed.

| Store | Holds | Tech |
|---|---|---|
| PostgreSQL | Tables `"User"`, `alumni`, `posts`, `comment`. Real definitions are in `db/schema.md`. | `pg` `Pool` in `backend/src/dal/config/db.ts` |
| Browser `localStorage` | The login token, which seeds `tokenAtom` in `src/store/authAtom.ts`. | jotai |

## External integrations

| Integration | Purpose | Direction |
|---|---|---|
| _(none found in the source docs)_ | | |

## Layering rules

> **STATUS: needs verification** — synthesized from `CLAUDE.md` on 2026-10-05. Review and edit; remove this banner when confirmed.

- Backend flow is strictly **Route → Controller → Manager → Query → DB**. New backend features follow it and never skip a layer.
- The three backend workspaces form a one-way chain: `api` depends on `businessLogic`, which depends on `dal`.
- SQL lives only in `dal/query/*Query.ts`. Managers contain no SQL.
- Frontend: `pages/` are route-level containers; `components/` are the presentational implementation; HTTP goes through `src/services/*Api.ts`.

## Cross-cutting concerns

> **STATUS: needs verification** — synthesized from `CLAUDE.md` on 2026-10-05. Review and edit; remove this banner when confirmed.

- **Auth:** there is no `AuthController` or `AuthManager`. Login and JWT logic (`login`, `verifyToken`) live in `UserController.ts`. `api/MiddleWare/authMiddleware.ts` verifies the bearer token and sets `req.user = { sub, role }`. `api/MiddleWare/roleMiddleware.ts` exports `requireRole(...roles)`, which checks `req.user.role`. Route files compose the two per route (see `AlumniRoutes.ts`); auth is not applied globally.
- **Config:** one root-level `.env`, read with `dotenv` using relative paths from `backend/src/server.ts`, `backend/src/dal/config/db.ts` and `backend/src/api/app.ts`. `db.ts` throws at import time if `DB_PASSWORD` is missing or empty.
- **Frontend state:** `src/store/authAtom.ts` holds `tokenAtom` (seeded from `localStorage`) and the derived `isLoggedInAtom`.
- **Logging, error handling, observability:** _(not described in the source docs — fill in)_

## Related ADRs

_(populated as ADRs land)_
