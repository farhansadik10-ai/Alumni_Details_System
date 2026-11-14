# Frontend

The web app for the alumni system: React, TypeScript and Vite, with Jotai for state, React Router for pages and CSS Modules on our own design tokens (no UI library).

## Run it

Run every command from the repo root, not from this folder. Run `npm install` once first.

| Command | What it does |
|---|---|
| `npm run dev` | Starts the API and the frontend dev servers together |
| `npm run dev:frontend` | Starts only the frontend dev server (Vite) |
| `npm run build` | Builds the API, then the frontend (the frontend build runs `tsc -b`, so a type error fails it) |
| `npm run check:frontend` | Runs the style check and the library check in `scripts/` |

In development, Vite sends every `/api` request to the API at `http://localhost:3000` (see `vite.config.ts`). If requests fail, check that the API dev server is running.

## Folders under `src/`

| Folder | What it holds |
|---|---|
| `config/` | Constants: the app name, layout breakpoints, storage keys and every word the pages show |
| `lib/` | Small helpers with no React in them |
| `services/` | The one API client and the calls to the API; all requests use relative `/api` paths |
| `store/` | Jotai atoms and the actions that change them |
| `hooks/` | Shared React hooks |
| `routes/` | Every address in one object, and the route guards |
| `icons/` | The icon components |
| `styles/` | The design tokens (`tokens.css`) and the base styles |
| `components/ui/` | The base components every page builds on |
| `components/shell/` | The app shell: header, navigation, page frame |
| `components/auth/` | Parts of the log in and sign-up pages |
| `components/alumni/` | Parts of the alumni directory |
| `components/profile/` | Parts of the alumni profile and My profile pages |
| `pages/` | One folder per page |

## How the code is written

The patterns (layers, tokens, store, API client, failure handling, routes) are in [`docs/frontend-patterns.md`](../docs/frontend-patterns.md). Read it before adding a page or a component.
