# Project Overview

The plain-English what-and-why of this project. Read by every Claude session so context doesn't have to be re-derived.

## What this is

> **STATUS: needs verification** — synthesized from `AIdlc/plan.md` (Project Goal) and `CLAUDE.md` on 2026-10-05. Review and edit; remove this banner when confirmed.

The Alumni Details System is an npm workspaces monorepo: an Express API over PostgreSQL (users, alumni profiles, posts, comments) and a React frontend.

The current goal, from the plan: complete the frontend and properly integrate it with the existing backend, database, Apache, HTTPS, and deployment setup.

`README.md` holds only a folder tree (and an outdated one), so it contributed nothing here. Rewriting it is planned in bolt B15 of `AIdlc/plan.md`.

## Who uses it

> **STATUS: needs verification** — synthesized from `AIdlc/plan.md` (Screens by role) on 2026-10-05. Review and edit; remove this banner when confirmed.

Three roles, taken from the routes and role middleware: **student**, **alumni**, **admin**.

- Students browse the alumni directory and the posts feed, and comment.
- Alumni also create and edit their own alumni profile and their own posts.
- Admins also manage users and can delete any post.

_(Who the real-world audience is — which institution, how many users — is not written down anywhere in the repo.)_

## Core flows

> **STATUS: needs verification** — synthesized from `AIdlc/plan.md` (Screens by role) on 2026-10-05. Review and edit; remove this banner when confirmed.

1. Sign up as student or alumni, log in, and land on a role-based dashboard.
2. Browse the alumni directory and open an alumni profile; alumni create and edit their own profile.
3. Read the posts feed and comment on posts; alumni and admins create posts.

## Stack snapshot

> **STATUS: needs verification** — synthesized from `CLAUDE.md` and `AIdlc/plan.md` (Technology, Scripts) on 2026-10-05. Review and edit; remove this banner when confirmed.

| Layer | Tech |
|---|---|
| Frontend | React 18 + TypeScript + Vite; Ant Design (`antd`), `axios`, `jotai`, `react-router-dom` |
| Backend | Node.js + Express, TypeScript, run with `tsx watch` in dev; three workspaces: `@alumni/api`, `@alumni/businesslogic`, `@alumni/dal` |
| Shared | `@alumni/shared` — cross-cutting TypeScript types |
| Database | PostgreSQL through a shared `pg` `Pool` |
| Auth | JWT bearer token (`JWT_SECRET`); passwords hashed with `bcrypt` |
| Deploy | Apache serves the built frontend and proxies `/api` to the Node backend; HTTPS with mkcert; Bash scripts (`scripts/build.sh`, `start.sh`, `deploy.sh`) |

### Commands

Run from the repo root.

| Task | Command |
|---|---|
| Install | `npm install` |
| API + frontend dev servers | `npm run dev` |
| API only | `npm run dev:api` |
| Frontend only | `npm run dev:frontend` |
| Build everything | `npm run build` (API, then frontend) |

There is no test runner anywhere in the repo.

## What this project is **not**

Out-of-scope adjacencies. Worth listing because they recur as suggestions.

_(nothing written down in the source docs — fill in)_

## Constraints

> **STATUS: needs verification** — synthesized from `CLAUDE.md` (Environment, UI Rules, Ignored files) and `AIdlc/plan.md` (Work Plan rules, Q7) on 2026-10-05. Review and edit; remove this banner when confirmed.

- Backend config comes from one root-level `.env` (not `backend/.env`). Required: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`. The API will not boot if `DB_PASSWORD` is missing or empty.
- `.env`, `frontend/.env`, `node_modules/` and `dist/` are gitignored and must never be committed. Earlier commits still contain `node_modules/` and the `.env` files, so those secrets count as exposed and need rotating.
- All frontend work follows the approved plan in `AIdlc/plan.md`: one bolt at a time, only that bolt's listed deliverables, and the owner's approval before committing or starting the next bolt.
- No database migration: delete behaviour is handled in the backend and the UI, not by changing foreign keys (plan Q7, answered 2026-10-03).
- No SQL is changed without the real table definitions in `db/schema.md`.

## Status

| Field | Value |
|---|---|
| Phase | building |
| Started | 2026-10-05 |
| Repo | C:/Users/Lenovo/Alumni_Details_System |

_"Started" is the date this vault was created, not the date the project began. "Phase" is from `AIdlc/plan.md` ("Construction: B7 done; B5 next", last updated 2026-10-03) — STATUS: needs verification._
