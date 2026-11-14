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

### https in development

The dev server runs on `https://localhost:5173` when these two files exist, and on `http://localhost:5173` when either is missing (it then prints one line that says so):

| File | What it is |
|---|---|
| `frontend/.cert/localhost.pem` | A certificate for `localhost` |
| `frontend/.cert/localhost-key.pem` | Its private key |

The folder is gitignored. The files are per machine: never commit them and never send the key to anyone. To make a pair, install [mkcert](https://github.com/FiloSottile/mkcert), run `mkcert -install` once, then from the repo root:

```
mkcert -cert-file frontend/.cert/localhost.pem -key-file frontend/.cert/localhost-key.pem localhost 127.0.0.1 ::1
```

Restart the dev server after adding or removing the files. The API stays on plain http at port 3000; only the browser's connection to Vite is https. A build and `vite preview` do not use the files.

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
