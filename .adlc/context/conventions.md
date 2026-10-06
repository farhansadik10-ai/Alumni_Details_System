# Conventions

Project-specific rules. The reviewer agents (`quality-reviewer`, `architecture-reviewer`) check code against this file. If a convention isn't documented here, it isn't enforced — write it down or accept that the code will drift.

> Sections marked "from the owner, 2026-10-05" are the redesign conventions the owner wrote in the root `CLAUDE.md` ("Conventions (redesign)"). They are confirmed. If this file and the root `CLAUDE.md` ever disagree, stop and ask.
>
> Sections with a **STATUS: needs verification** banner were synthesized by `/init` from `CLAUDE.md`, `tsconfig.json`, `frontend/tsconfig.app.json`, `frontend/eslint.config.js` and the retired AI-DLC plan (deleted 2026-10-05; in git history). Review each entry.

## Workflow

_From the owner, 2026-10-05._

- Use the ADLC pipeline (`/spec`, `/architect`, `/implement`, `/review`, `/wrapup`).
- Never write code before the spec and architecture gates are approved.

## Naming

> **STATUS: needs verification** — synthesized from `CLAUDE.md` on 2026-10-05. Review and edit; remove this banner when confirmed.

- **Files:**
  - Backend: PascalCase with a role suffix — `*Query.ts`, `*DTO.ts`, `*Manager.ts`, `*Controller.ts`, `*Routes.ts`.
  - Shared types: `shared/types/<name>.types.ts`.
  - Frontend file naming is not decided; the frontend is being rebuilt. For `/architect` to propose.
- **Variables:** _(not written down in the source docs)_
- **Constants:** the app name is text from one constant (white-label). Design values are tokens, not literals — see "Frontend".
- **Types/interfaces:** shared request/response types come from `@alumni/shared`.

## Logging

- **Library:** _(not written down in the source docs)_
- **Levels:** _(when to use debug, info, warn, error)_
- **Structured fields:** _(required fields on every log line)_
- **No `console.log` in production code.** _(template default — not confirmed for this project; the existing `*Query.ts` classes do call `console.log`)_

## Error handling

- Backend: one shared error middleware; no per-method `try`/`catch` for HTTP mapping. _(From the owner, 2026-10-05. Not built yet — today each controller function has its own `try`/`catch`.)_
- TypeScript `strict` is on for the whole repo (root `tsconfig.json`, and `frontend/tsconfig.app.json`). This includes `noImplicitAny` and `strictNullChecks`. _(STATUS: needs verification — read from the config files.)_
- Frontend: every list and form has loading, empty and error states. _(From the owner, 2026-10-05.)_

## Config

> **STATUS: needs verification** — synthesized from `CLAUDE.md` (Environment) on 2026-10-05. Review and edit; remove this banner when confirmed.

- **Source:** one root-level `.env` for the backend (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`). Never `backend/.env`.
- **Access pattern:** `dotenv`, loaded with relative paths from `backend/src/server.ts`, `backend/src/dal/config/db.ts` and `backend/src/api/app.ts`.
- **Frontend:** API calls use relative `/api` paths (confirmed by the owner, 2026-10-05). The Vite dev proxy forwards them locally and Apache does in production; `VITE_API_URL` is not used.
- **No magic strings or numbers** — named constants or config values.

## API conventions

_From the owner, 2026-10-05, except where marked._

- **Layering:** npm workspaces; layers stay routes → controllers → Managers → Query classes. No skipped layers.
- **Controllers** are classes; routes bind instance methods. _(Not built yet — today's controllers are exported functions.)_
- **Errors:** one shared error middleware; no per-method `try`/`catch` for HTTP mapping.
- **Auth:** every non-public route uses `authMiddleware`, plus `requireRole` and an owner check where needed. Route files compose them per route; auth is not applied globally.
- **SQL** uses the real names in `db/schema.md` (`"User"`, `alumni`, `posts`, `comment`), lives only in `dal/query/*Query.ts`, and is always parameterized. No schema change without the owner's approval.
- **No endpoint returns the `password` column.**
- **Response format:** _(not written down)_
- **Pagination:** _(not written down)_
- **Versioning:** none — routes are mounted directly under `/api/...`. _(STATUS: needs verification.)_

## Frontend

_From the owner, 2026-10-05. The frontend is rebuilt from scratch in `frontend/src`; the Ant Design (`antd`) code there now is legacy and is not a pattern to follow._

- React + Vite + TypeScript.
- State: Jotai atoms in `src/store/`.
- No UI library; we build our own components on the design tokens. `antd` is legacy and is removed screen by screen; no new `antd` imports ([[architecture/adr-07-design-direction-oak-ink-band|ADR-07]]).
- Scandinavian design: neutral palette, generous whitespace, clean typography, few accents.
- White-label: no university logo; the app name is text from one constant.
- Theme: light, dark, system; toggle in the header; the choice is persisted; system mode follows `prefers-color-scheme`.
- All colors, spacing and type come from design tokens; no hardcoded values in components.
- Designs live in `docs/design/`; the written rules live in `.adlc/context/design-system.md`. Follow both. _(Both exist since 2026-10-06: `docs/design/README.md` with `screens/`, and [[context/design-system]].)_
- Screens show only fields that exist in `db/schema.md`.
- Every list and form has loading, empty and error states.
- Responsive from 360px up; no layout breaks at 200% zoom.
- Text contrast meets WCAG AA in both themes; keyboard focus is visible.
- API calls live in `src/services/` and use relative `/api` paths; no API calls inside UI components. Types come from `@alumni/shared`.

## Testing

> **STATUS: needs verification** — synthesized from `CLAUDE.md` (Commands) on 2026-10-05. Review and edit; remove this banner when confirmed.

- **Frameworks:** none. There is no test runner configured anywhere in the repo.
- **Not tests:** `backend/src/businessLogic/src/TestManager.ts` and `backend/src/dal/TestDal.ts` are commented-out manual scratch scripts. Don't run them or treat them as a suite.
- **What stands in for tests:** `npm run build` must exit 0 (the frontend build runs `tsc -b`, so type errors fail it), plus a manual test checklist the owner runs.
- **Coverage expectations:** _(none written down)_
- **Mock policy:** _(none written down)_

## Comments

- _(When are comments expected? When are they noise?)_
- _(TODO/FIXME format — must include a tracking link?)_

## Git

> **STATUS: needs verification** — the commit format is read from `git log`, not from a written rule. Review and edit; remove this banner when confirmed.

- **Commit message format:** conventional commits, as seen in recent history — `feat(ui): …`, `docs: answer Q7`, `chore: add ADLC vault`.
- **Branch naming:** _(not written down; current work is on `redesign`)_
- **PR title format:** _(not written down)_
- What Claude may run in git is set by `config.yml` → `git.mode`.
- Never commit `node_modules/`, `.env`, `frontend/.env` or `dist/`.

## Anything else specific to this codebase

> **STATUS: needs verification** — synthesized from `frontend/tsconfig.app.json` and `frontend/eslint.config.js` on 2026-10-05. Review and edit; remove this banner when confirmed.

### Compiler and lint rules

- Frontend (`tsconfig.app.json`): `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `erasableSyntaxOnly` (no enums, namespaces or parameter properties), `verbatimModuleSyntax` (type-only imports must use `import type`).
- Frontend ESLint (`**/*.{ts,tsx}`): the recommended presets of `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks` and `eslint-plugin-react-refresh` (Vite). No project-specific rules. There is no `npm run lint` script.
- No ESLint, Prettier or `.editorconfig` covers the backend or `shared`.

### Known quirks

- `shared` has compiled `.js`/`.d.ts`/`.map` files checked in beside the `.ts` sources. Edit the `.ts`.
- Known backend problems are listed in [[knowledge/gotchas]] (G01–G24). Decisions in effect are in [[decisions]].
