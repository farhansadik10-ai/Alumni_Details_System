# Project Overview

The plain-English what-and-why of this project. Read by every Claude session so context doesn't have to be re-derived.

## What this is

The Alumni Details System is an npm workspaces monorepo: an Express API over PostgreSQL (users, alumni profiles, posts, comments) and a React frontend.

The current goal (owner, 2026-10-05): rebuild the frontend from scratch with a Scandinavian design and a light / dark / system theme, on top of the existing backend, database, Apache, HTTPS and deployment setup. The Ant Design frontend was replaced in REQ-fs-004 (part 1 of 4). All work goes through the ADLC pipeline; the earlier AI-DLC "bolt" plan is retired.

The design was approved by the owner on 2026-10-06. Its name is "Oak, ink band" ([[architecture/adr-07-design-direction-oak-ink-band|ADR-07]]). The pictures and rules are in `docs/design/`; the vault copy of the rules is [[context/design-system]].

`README.md` holds only a folder tree (and an outdated one), so it contributed nothing here.

## Who uses it

> **STATUS: needs verification** — synthesized from the retired AI-DLC plan (Screens by role) on 2026-10-05. Review and edit; remove this banner when confirmed.

Three roles, taken from the routes and role middleware: **student**, **alumni**, **admin**.

- Students browse the alumni directory and the posts feed, and comment.
- Alumni also create and edit their own alumni profile and their own posts.
- Admins also manage users and can delete any post.

The app is white-label: no university logo. The app name is "University Alumni", text from one constant ([[architecture/adr-09-white-label-app-name-from-one-constant|ADR-09]]).

_(Who the real-world audience is — which institution, how many users — is not written down anywhere in the repo.)_

## Core flows

> **STATUS: needs verification** — synthesized from the retired AI-DLC plan (Screens by role) on 2026-10-05. Review and edit; remove this banner when confirmed.

1. Sign up as student or alumni (the form calls the alumni role "Graduate"), log in, and land on a role-based dashboard.
2. Browse the alumni directory and open an alumni profile; alumni create and edit their own profile. The directory can be filtered by department, graduation year, field and mentoring; the two `alumni` columns for field and mentoring exist since 2026-10-06 ([[architecture/adr-08-mentoring-and-field-stay-two-new-alumni-columns|ADR-08]]).
3. Read the posts feed and comment on posts; alumni and admins create posts.

## Stack snapshot

> **STATUS: needs verification** — the backend, database, auth and deploy rows were synthesized from `CLAUDE.md` and the retired AI-DLC plan on 2026-10-05. The frontend row is from the owner (2026-10-05).

| Layer | Tech |
|---|---|
| Frontend | React + Vite + TypeScript, rebuilt from scratch; Jotai for state. Design: "Oak, ink band", light / dark / system themes with system as the default, font Hanken Grotesk ([[context/design-system]]). No UI library: we build our own components on the design tokens ([[architecture/adr-07-design-direction-oak-ink-band\|ADR-07]]). The Ant Design app was deleted in REQ-fs-004; foundation, shell, log in, sign-up, the alumni directory, the alumni profile, My profile, the feed, the dashboard, the admin Users page and the About page are built ([[knowledge/components/frontend-app]]). |
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

- Not branded for one university: no logo.
- Not an Ant Design app any more.
- No Privacy page and no password reset in the redesign; both are later work. Until reset exists, the log-in page tells the user to contact the alumni office. The About page was built last (REQ-fs-007) and the footer links to it ([[architecture/adr-10-about-page-last-privacy-and-password-reset-later|ADR-10]]).

_(nothing else written down — fill in)_

## Constraints

- Backend config comes from one root-level `.env` (not `backend/.env`). Required: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`. The API will not boot if `DB_PASSWORD` is missing or empty.
- `.env`, `frontend/.env`, `node_modules/` and `dist/` are gitignored and must never be committed. Earlier commits still contain `node_modules/` and the `.env` files, so those secrets count as exposed and need rotating.
- All work goes through the ADLC pipeline. No code is written before the spec and architecture gates are approved.
- No schema change without the owner's approval. SQL uses the real names in `db/schema.md`.
- No database migration for deletes: delete behaviour is handled in the backend and the UI, not by changing foreign keys ([[architecture/adr-06-deleting-rows-that-other-rows-reference|ADR-06]]).
- Screens show only fields that exist in `db/schema.md`. The approved design shows mentoring and field, which need two new `alumni` columns: `mentorship_available` (boolean, default `false`) and `field` (text, nullable). The owner added them on 2026-10-06 ([[architecture/adr-08-mentoring-and-field-stay-two-new-alumni-columns|ADR-08]]); the backend reads and writes them since REQ-fs-003.

## Status

| Field | Value |
|---|---|
| Phase | building |
| Started | 2026-10-05 |
| Repo | C:/Users/Lenovo/Alumni_Details_System |

_"Started" is the date this vault was created, not the date the project began. As of 2026-10-09 the backend is finished for the redesign (REQ-fs-001 to REQ-fs-003, roadmap B1 to B5) and the frontend is built through part 4 of 4 (REQ-fs-004: roadmap F1 to F5, foundation to log in and sign-up; REQ-fs-005: F6 and F7, the alumni directory, the alumni profile and My profile; REQ-fs-006: F8 and the Dashboard half of F9, the feed and the dashboard; REQ-fs-007: the admin Users page, the About page, phone polish and performance, F9 rest, F10 and F11). Next is the pull request to main._
