---
kind: task
---

# Restore https for the local Vite dev server

| Field | Value |
|---|---|
| REQ | REQ-fs-008 |
| Kind | task |
| Status | merged (d1c3a298, pull request #55, 2026-11-14) |
| Phase | review and ship (gate cleared 2026-11-14) |
| Created | 2026-11-14 |
| Primary repo | alumni-details-system |
| Touched repos | alumni-details-system (frontend dev config, docs and vault only) |
| Related | [[knowledge/lessons/LESSON-REQ-fs-004-5]], [[context/project-overview]] (Deploy row: HTTPS with mkcert) |

## Why it runs on http now (what was found)

- No commit on any branch ever turned on https in `frontend/vite.config.ts`. Checked: the full history of the file, `frontend/package.json` and the root `package.json`, the stash, and unreachable objects. No ssl or mkcert plugin was ever a dependency.
- The redesign (REQ-fs-004, commit f4bd348f) rewrote `vite.config.ts`. The version before it had the same `server` block as today: the `/api` proxy and nothing else.
- So the earlier https was never in git. It was a setup on this machine only. A mkcert certificate pair for `localhost`, `127.0.0.1` and `::1` exists outside the repo in `C:\Users\Lenovo\tools\` (made 2026-09-16, valid until 2028-12-16), and the mkcert root certificate is installed.
- STATUS: needs verification — the most likely cause is an uncommitted local edit of `vite.config.ts` that pointed at those files and was lost when the file was replaced. This cannot be proved from git. The other possibility is that the remembered https address was Apache (`https://localhost`, port 443), which still uses mkcert certificates.

## Goal

After this ships, `npm run dev` on this machine serves the frontend at `https://localhost:5173` with a certificate the browser trusts. The setup is written in the repo, so a later rewrite of the config cannot lose it without a visible diff. A machine with no certificate still starts, on http.

## Acceptance criteria

- **AC1.** With the certificate file and the key file in place, `npm run dev:frontend` prints `https://localhost:5173/`, and a request to that address answers 200 with no certificate error.
- **AC2.** With either file missing, the dev server starts on http and prints one line that says https is off and where the two files go. `npm run build` and `npm run check:frontend` exit 0 in both cases.
- **AC3.** No certificate or key file is tracked or can be staged: `git check-ignore` matches both files, and `git status` shows neither.

## Scope / non-goals

- In scope: `frontend/vite.config.ts` (dev server only), `.gitignore`, the docs that describe the dev server.
- Not touched: any `.env` file (not read, not written). The `/api` proxy target stays `http://localhost:3000`. Apache, `scripts/`, the backend and `vite preview` stay as they are.
- No new package. No certificate is created; the existing mkcert pair is reused.
- No key content is printed, logged or committed at any step.

## Approach

- `frontend/vite.config.ts`: a small function looks for `frontend/.cert/localhost.pem` and `frontend/.cert/localhost-key.pem`, with paths taken from the config file's own folder, not the working directory. Both present: `server.https = { cert, key }`. Otherwise: no `https` key, and one `console.info` line in dev (`command === 'serve'`), none in a build.
- `.gitignore`: add `frontend/.cert/`. This line goes in before the files are copied.
- Copy the two existing files from `C:\Users\Lenovo\tools\` into `frontend/.cert/` under the fixed names. Copy only; the originals stay. (Open decision at the gate: this folder, or read the files in place through a machine path.)
- Docs: `CLAUDE.md` (Environment, Ignored files), `frontend/README.md`, `docs/frontend-patterns.md` (the dev proxy line), `.adlc/context/project-overview.md` (dev row). About 6 files, one module.
- Checking AC1 follows [[knowledge/lessons/LESSON-REQ-fs-004-5]]: request `/` only; no `/api` request goes through the proxy to the real database.

## Related

- [[knowledge/lessons/LESSON-REQ-fs-004-5]] — the dev proxy reaches the real API on port 3000.
- REQ-fs-004 — rewrote `vite.config.ts`.
