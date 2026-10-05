# Conventions

Project-specific rules. The reviewer agents (`quality-reviewer`, `architecture-reviewer`) check code against this file. If a convention isn't documented here, it isn't enforced — write it down or accept that the code will drift.

> The Naming, Error handling and "Anything else" sections below were partly synthesized from:
> - `tsconfig.json` and `frontend/tsconfig.app.json` (compiler flags)
> - `frontend/eslint.config.js` (recommended presets only; no custom rules)
>
> STATUS: needs verification — review each entry; the source configs may have rules I didn't translate.

## Naming

> **STATUS: needs verification** — synthesized from `CLAUDE.md` and `AIdlc/plan.md` (Reuse rules 3, 4, 8) on 2026-10-05. Review and edit; remove this banner when confirmed.

- **Files:**
  - Frontend components: one component per file; file name = component name, PascalCase; default export.
  - Backend: PascalCase with a role suffix — `*Query.ts`, `*DTO.ts`, `*Manager.ts`, `*Controller.ts`, `*Routes.ts`.
  - Shared types: `shared/types/<name>.types.ts`.
  - Frontend API layer: `src/services/<name>Api.ts`.
- **Variables:** _(not written down in the source docs)_
- **Constants:** role names, route paths and role colors are constants, never string literals in components.
- **Types/interfaces:** every component that takes props declares a typed `interface XxxProps`. API request/response types live in `frontend/src/types/` or come from `@alumni/shared`.

## Logging

- **Library:** _(not written down in the source docs)_
- **Levels:** _(when to use debug, info, warn, error)_
- **Structured fields:** _(required fields on every log line)_
- **No `console.log` in production code.** _(template default — not confirmed for this project)_

## Error handling

> **STATUS: needs verification** — synthesized from `tsconfig.json`, `frontend/tsconfig.app.json` and `AIdlc/plan.md` (Reuse rules 4, 10) on 2026-10-05. Review and edit; remove this banner when confirmed.

- TypeScript `strict` is on for the whole repo (root `tsconfig.json`, and `frontend/tsconfig.app.json`). This includes `noImplicitAny` and `strictNullChecks`.
- No `any` in the frontend (`: any` and `as any` are both checked by the plan's acceptance greps).
- Frontend user feedback goes through `App.useApp()` (`message`, `modal`), not static `message.*` calls.
- _(How backend errors propagate and what gets logged vs. returned is not written down in the source docs.)_

## Config

> **STATUS: needs verification** — synthesized from `CLAUDE.md` (Environment) and `AIdlc/plan.md` (Reuse rule 2) on 2026-10-05. Review and edit; remove this banner when confirmed.

- **Source:** one root-level `.env` for the backend (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`). Never `backend/.env`.
- **Access pattern:** `dotenv`, loaded with relative paths from `backend/src/server.ts`, `backend/src/dal/config/db.ts` and `backend/src/api/app.ts`.
- **Frontend:** `VITE_API_URL` is not used. All API paths are relative `/api/...`; the Vite dev proxy forwards them locally and Apache does in production.
- **No magic strings or numbers** — named constants or config values. Form validation rules come from `frontend/src/constants/validation.ts`; forms don't redefine them.

## API conventions

> **STATUS: needs verification** — synthesized from `CLAUDE.md` (Auth specifics) on 2026-10-05. Review and edit; remove this banner when confirmed.

- **Response format:** _(not written down in the source docs)_
- **Pagination:** _(not written down in the source docs)_
- **Versioning:** none — routes are mounted directly under `/api/...`.
- **Auth:** JWT bearer token. Route files compose `authMiddleware` and `requireRole(...roles)` per route; auth is not applied globally.
- **Layering:** every backend feature goes Route → Controller → Manager → Query → DB. No skipped layers; SQL only in `dal/query/*Query.ts`, always parameterized.

## Testing

> **STATUS: needs verification** — synthesized from `CLAUDE.md` (Commands) and `AIdlc/plan.md` (Bolt protocol, Acceptance Criteria) on 2026-10-05. Review and edit; remove this banner when confirmed.

- **Frameworks:** none. There is no test runner configured anywhere in the repo.
- **Not tests:** `backend/src/businessLogic/src/TestManager.ts` and `backend/src/dal/TestDal.ts` are commented-out manual scratch scripts. Don't run them or treat them as a suite.
- **What stands in for tests:** `npm run build` must exit 0 (the frontend build runs `tsc -b`, so type errors fail it), plus a manual test checklist the owner runs at the end of each bolt.
- **Coverage expectations:** _(none written down)_
- **Mock policy:** _(none written down)_

## Comments

- _(When are comments expected? When are they noise?)_
- _(TODO/FIXME format — must include a tracking link?)_

## Git

> **STATUS: needs verification** — the commit format is read from `git log` (the last five commits), not from a written rule; the rest is from `CLAUDE.md` and `AIdlc/plan.md` (Bolt protocol) on 2026-10-05. Review and edit; remove this banner when confirmed.

- **Commit message format:** conventional commits, as seen in recent history — `feat(ui): bolt B7 - sign up`, `chore: bolt B2.1 - type-check in the build`, `docs: answer Q7`.
- **Branch naming:** _(not written down; current work is on `redesign`)_
- **PR title format:** _(not written down)_
- No commit, and no next bolt, until the owner approves the current bolt.
- Never commit `node_modules/`, `.env`, `frontend/.env` or `dist/`.

## Anything else specific to this codebase

> **STATUS: needs verification** — synthesized from `AIdlc/plan.md` (Theme, Reuse rules, Rules, Bolt protocol, Acceptance Criteria), `CLAUDE.md` (UI Rules), `frontend/tsconfig.app.json` and `frontend/eslint.config.js` on 2026-10-05. Review and edit; remove this banner when confirmed.

### Frontend structure and reuse

1. HTTP only in `services/*Api.ts` through the shared `apiClient`. Components and pages never import axios.
2. `components/common` and `components/layout` are presentational: no API calls, no page-specific logic. Components never import from `services/`.
3. Pages own data loading (through `useRequest`) and pass data down. Feature components receive data and callbacks through props.
4. Create and edit share one form component (`AlumniForm`, `PostForm`, `CommentForm`), switched by `initialValues`.
5. Reuse existing services and components where possible.

### UI and theme

- Ant Design is the only UI or styling library.
- Colors, spacing and radius come from the theme (tokens or CSS variables such as `var(--ant-color-primary)`) only. No hard-coded colors (hex, rgb, named) outside `frontend/src/theme`.
- No inline `style={{...}}` objects in pages. Lay out with antd components (`Flex`, `Space`, `Row`/`Col`, `Grid.useBreakpoint`); anything left goes in a co-located `*.module.css` that uses only theme CSS variables.
- Every screen is checked at 360, 768 and 1280 px wide, with no horizontal scroll and no browser console errors.

### Working protocol (bolts)

- All frontend work follows `AIdlc/plan.md`. A "bolt" is one unit of work in that plan's Work Plan.
- One bolt at a time. Change only the files listed in that bolt's Deliverables; raise anything extra with the owner first.
- A bolt does not start while one of its Open Questions is unanswered.
- End of a bolt: show `git status` and `git diff`, give a test checklist, then wait for approval.

### Compiler and lint rules

- Frontend (`tsconfig.app.json`): `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `erasableSyntaxOnly` (no enums, namespaces or parameter properties), `verbatimModuleSyntax` (type-only imports must use `import type`).
- Frontend ESLint (`**/*.{ts,tsx}`): the recommended presets of `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks` and `eslint-plugin-react-refresh` (Vite). No project-specific rules. There is no `npm run lint` script.
- No ESLint, Prettier or `.editorconfig` covers the backend or `shared`.

### Known quirks

- `shared` has compiled `.js`/`.d.ts`/`.map` files checked in beside the `.ts` sources. Edit the `.ts`.
