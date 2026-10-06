# Architecture Overview

High-level shape of the system. Updated when major architectural changes land (usually as part of an ADR).

## What this project is

> **STATUS: needs verification** — synthesized from `CLAUDE.md` on 2026-10-05. Review and edit; remove this banner when confirmed.

An npm workspaces monorepo with a layered Express + PostgreSQL backend, a `shared` types package, and a React + Vite frontend. See [[context/project-overview]] for the what-and-why.

## System diagram

> **STATUS: needs verification** — drawn from the prose in `CLAUDE.md` (Architecture) and the retired AI-DLC plan's Decision Log (Apache) on 2026-10-05; the sources have no diagram of their own. Review and edit; remove this banner when confirmed.

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
| `frontend` (`@alumni/frontend`) | React app, **being rebuilt from scratch** in `frontend/src`. What is there now is the legacy Ant Design (`antd`) app; the redesign replaces it. The new structure is decided at the architect gate, not here. No UI library: components are built in the repo on the design tokens ([[architecture/adr-07-design-direction-oak-ink-band|ADR-07]]). | React, Vite, TypeScript, jotai |

## Data stores

| Store | Holds | Tech |
|---|---|---|
| PostgreSQL | Tables `"User"`, `alumni`, `posts`, `comment`. See "Database schema" below. | `pg` `Pool` in `backend/src/dal/config/db.ts` |
| Browser `localStorage` | The login token (legacy frontend: seeds `tokenAtom` in `src/store/authAtom.ts`). | jotai |

## Database schema

Confirmed against the real database by the owner on 2026-10-02. The raw `psql` output is in `db/schema.md`, which is the source of truth; this section is a summary of it.

Real tables: `"User"`, `alumni`, `posts`, `comment`. There is **no** `users` table and **no** `comments` table. `"User"` must be double-quoted in SQL.

| Table | Columns (type) | Constraints |
|---|---|---|
| `"User"` | `id` serial, `name` varchar(100), `email` varchar(100) NOT NULL, `password` varchar(255) NOT NULL, `role` varchar(50), `photo_url` text, `login_at`, `logout_at` timestamp, `created_at`, `updated_at` timestamp default now | PK `id`; `email` UNIQUE |
| `alumni` | `id` serial, `user_id` int, `graduation_year` **integer**, `department` varchar(100), `current_company` varchar(100), `job_title` varchar(100), `experience` varchar(100), `bio` text, `linkedin_url` text, `updated_at` timestamp default now | PK `id`; FK `user_id` → `"User"(id)`; **no UNIQUE on `user_id`**; no `email` column, no `created_at` |
| `posts` | `id` serial, `user_id` int, `caption` text, `media_url` text, `comment_count` int default 0, `created_at`, `updated_at` timestamp default now | PK `id`; FK `user_id` → `"User"(id)` |
| `comment` | `id` serial, `user_id` int, `posts_id` int, `parent_id` int, `content` text, `created_at`, `updated_at` timestamp default now | PK `id`; FK `user_id` → `"User"(id)`, `posts_id` → `posts(id)`, `parent_id` → `comment(id)` |

What follows from it:

- The alumni column is `graduation_year` (integer). The backend used `graduation_yr` until REQ-fs-001 (2026-10-05) renamed it ([[knowledge/gotchas#^g12|G12]], fixed).
- The comment → post column is `posts_id`, not `post_id` ([[knowledge/gotchas#^g13|G13]]).
- Length limits for forms: `name`, `email`, `department`, `current_company`, `job_title` and `experience` are varchar(100).
- **No foreign key has `ON DELETE CASCADE`.** Deleting a row that other rows point to fails ([[knowledge/gotchas#^g08|G08]]); the decided handling is [[architecture/adr-06-deleting-rows-that-other-rows-reference|ADR-06]].
- `alumni.user_id` has no UNIQUE constraint, so "one profile per user" ([[architecture/adr-03-one-alumni-profile-per-user-created-by-that-user|ADR-03]]) is not enforced by the database.
- The `"User".email` UNIQUE constraint is case-sensitive, so the same email in different letter case can register twice.
- No schema change without the owner's approval.
- **Decided, not in the database yet (2026-10-06):** `alumni` gets `mentorship_available` (boolean, default `false`) and `field` (text, nullable) ([[architecture/adr-08-mentoring-and-field-stay-two-new-alumni-columns|ADR-08]]). The table above shows the database as it is today; do not write SQL against the two columns until `db/schema.md` lists them.

## External integrations

| Integration | Purpose | Direction |
|---|---|---|
| _(none found in the source docs)_ | | |

## Layering rules

- Backend flow is strictly **Route → Controller → Manager → Query → DB**. New backend features follow it and never skip a layer.
- The three backend workspaces form a one-way chain: `api` depends on `businessLogic`, which depends on `dal`.
- SQL lives only in `dal/query/*Query.ts`, always parameterized, and uses the real names above. Managers contain no SQL.
- Controllers are classes; routes bind instance methods. _(Target rule from the owner, 2026-10-05. Today's controllers are exported functions.)_
- One shared error middleware maps errors to HTTP responses; no per-method `try`/`catch` for that. _(Target rule from the owner, 2026-10-05. Today every controller function has its own `try`/`catch` and there is no error middleware.)_
- Every non-public route uses `authMiddleware`, plus `requireRole` and an owner check where needed. The owner checks were added in REQ-fs-002 and live in the controllers; who may do what is listed in [[knowledge/components/api-controllers-and-routes]].
- No endpoint returns the `password` column. Since REQ-fs-002 only the login read selects it ([[knowledge/gotchas#^g17|G17]], [[knowledge/lessons/LESSON-REQ-fs-002-2]]).
- An update writes only the fields that were sent ([[knowledge/concepts/partial-update-sent-fields]]).
- Frontend: API calls live in `src/services/` and use relative `/api` paths; no API calls inside UI components. State is Jotai atoms in `src/store/`. Types come from `@alumni/shared`.

## Cross-cutting concerns

> **STATUS: needs verification** — synthesized from `CLAUDE.md` on 2026-10-05. Review and edit; remove this banner when confirmed.

- **Auth:** there is no `AuthController` or `AuthManager`. Login and JWT logic (`login`, `verifyToken`) live in `UserController.ts`. `api/MiddleWare/authMiddleware.ts` verifies the bearer token and sets `req.user = { sub, role }`. `api/MiddleWare/roleMiddleware.ts` exports `requireRole(...roles)`, which checks `req.user.role`. Route files compose the two per route (see `AlumniRoutes.ts`); auth is not applied globally. The token lasts 1 hour.
- **Config:** one root-level `.env`, read with `dotenv` using relative paths from `backend/src/server.ts`, `backend/src/dal/config/db.ts` and `backend/src/api/app.ts`. `db.ts` throws at import time if `DB_PASSWORD` is missing or empty.
- **Error handling:** see the two target rules under "Layering rules". Until they are built, each controller catches its own errors and returns `{ error: <message> }`. Checks added in REQ-fs-002 answer 400 / 403 / 404 with their own messages; anything the database rejects still comes back as its raw message ([[knowledge/gotchas#^g34|G34]]), and the middlewares answer `{ message }` instead ([[knowledge/gotchas#^g29|G29]]).
- **Logging, observability:** _(not described in the source docs — fill in)_

## Related ADRs

- [[architecture/adr-01-sign-up-role-is-student-or-alumni|ADR-01]] — Sign-up role is student or alumni; admin is never selectable
- [[architecture/adr-02-admin-deletes-any-post-edits-only-own|ADR-02]] — An admin can delete any post but edit only their own
- [[architecture/adr-03-one-alumni-profile-per-user-created-by-that-user|ADR-03]] — One alumni profile per user, created only by that user
- [[architecture/adr-04-profile-photo-is-a-url-field|ADR-04]] — A profile photo is a URL field, with an initials avatar as fallback
- [[architecture/adr-05-post-list-returns-author-name-and-photo|ADR-05]] — `GET /api/posts` returns each post's author name and photo
- [[architecture/adr-06-deleting-rows-that-other-rows-reference|ADR-06]] — Deleting rows that other rows reference
- [[architecture/adr-07-design-direction-oak-ink-band|ADR-07]] — Design direction is "Oak, ink band", with light, dark and system themes
- [[architecture/adr-08-mentoring-and-field-stay-two-new-alumni-columns|ADR-08]] — Mentoring and field stay in the design; `alumni` gets two new columns
- [[architecture/adr-09-white-label-app-name-from-one-constant|ADR-09]] — The app is white-label; its name "University Alumni" is text from one constant
- [[architecture/adr-10-about-page-last-privacy-and-password-reset-later|ADR-10]] — The About page is built last; the Privacy page and password reset are later work

Known backend problems are in [[knowledge/gotchas]] (G01–G34; each entry's Status row says whether it is still open).
