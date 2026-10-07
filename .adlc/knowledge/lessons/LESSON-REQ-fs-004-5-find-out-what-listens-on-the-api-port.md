# Before any browser check, find out what listens on the API port; check against a mock with no proxy ^L-REQ-fs-004-5

| Field | Value |
|---|---|
| ID | LESSON-REQ-fs-004-5 |
| Captured | 2026-10-07 |
| REQ | REQ-fs-004 |
| Component | `frontend/vite.config.ts` (the `/api` proxy), review and implement phases |
| Tags | browser-checks, proxy, database, safety |
| Severity | critical (must never repeat) |
| Supersedes | — |

## The lesson

The dev server proxies `/api` to port 3000. Before an agent or a person opens a browser, check whether something already answers on 3000 (`/api/health`): if it does, it is the real API on the real database, and a sign-up, log out or hand-made token would write real rows. Run Vite from a throwaway config with `configFile: false`, no proxy, and a mock that answers `/api` itself, and add `configurePreviewServer` too or the production preview answers nothing.

## Saw it in

- REQ-fs-004 TASK-008: told "no backend is running"; a Node process was answering `/api/health` on 3000. The look included `PUT /api/users/1/logout`. The agent used a throwaway config with a dead port; later agents used mocks (CAND-030, CAND-040, CAND-R2-UI2). No request reached 3000.
- The owner's session rule (never change the database) is why this matters: a normal `npm run dev` plus a sign-up form test writes a row.

