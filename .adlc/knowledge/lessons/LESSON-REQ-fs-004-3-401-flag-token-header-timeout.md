# Give a call separate flags for "a 401 here is not a session end" and "send no token", and a time limit when its failure path is the only way out ^L-REQ-fs-004-3

| Field | Value |
|---|---|
| ID | LESSON-REQ-fs-004-3 |
| Captured | 2026-10-07 |
| REQ | REQ-fs-004 |
| Component | `frontend/src/services/apiClient.ts`, `frontend/src/services/userService.ts` |
| Tags | api-client, auth, axios, session |
| Severity | trap (cost real time before) |
| Supersedes | — |

## The lesson

A flag that turns off 401 handling does not turn off the `Authorization` header: name and build each separately. Count a 401 as "session ended" only when the request carried a token and that token is still the current one (a visitor's 401 would otherwise say "your session has ended"). And give every call whose failure is the only exit a timeout: axios has none, so a hung server on log out keeps the user logged in.

## Saw it in

- `apiClient.ts` — `skipAuthHandling` was reused for "no header" on log in and sign-up (CORR-004); now the separate `withoutToken` flag. The "was sent with a token and it is still current" rule is in the response interceptor (CAND-010).
- `userService.ts` (`logOut`) — no timeout (CORR-003, owner item D11); now 5000 ms.

