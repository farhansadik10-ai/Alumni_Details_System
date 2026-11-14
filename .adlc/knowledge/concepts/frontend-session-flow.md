# Frontend session flow: one token, one way to end a session, one place that navigates

| Field | Value |
|---|---|
| Concept | frontend-session-flow |
| Status | built in REQ-fs-004 (2026-10-07); seen in a browser against a mock API only, not yet against the real backend |
| Created | 2026-10-07 |
| Decided by | [[architecture/adr-14-session-and-theme-kept-in-the-browser|ADR-14]] |

## The rule

- **One token, kept in `localStorage` under `ua.token`** and mirrored in `tokenAtom`. `sessionAtom` (user id, role, expiry) is derived from it by `lib/token.ts` (`readToken`, `isLiveSession`, `isAdmin`). The frontend reads the payload only; the server checks the signature. A role it does not know gives `role: null` and the user is still logged in ([[knowledge/gotchas#^g42|G42]]).
- **One way to end a dead session:** `endSessionAtom` (clear token and profile, set the notice `sessionEnded`). The 401 handler, the route guard and the start-up check all use it. Log out is the other exit and sets the notice `loggedOut`.
- **One place that navigates after a log in:** the `PublicOnly` guard. It sends the user to the page they asked for (`state.from`, checked by `lib/returnAddress.ts`) or the Dashboard. The log-in and sign-up pages never navigate on success; the one exception is sign-up → `/login` when the account was created but the log in failed.
- **One API client**, which learns about the store only through two injected functions (`getToken`, `onUnauthorized`, set by `store/wireApi.ts`). Per-call flags: `skipAuthHandling` (a 401 here is not a session end: log in, sign-up, log out) and `withoutToken` (log in and sign-up send no header). Log out has a 5 s timeout.
- **Errors:** `services/apiError.ts` turns anything into `{ kind: "network" }` or `{ kind: "http", status }`; each screen chooses its own words and never shows the server's text.

## Why

A session that can end in three ways, with three guards that each judge expiry, loops or leaves a stale name on screen. One action and one decider remove both.

## Open

- Router state `AFTER_LOG_IN_STATE` survives a reload (finding n1).
- The store logic is proven only by a scratch harness that is not shipped (finding m17).
- An idle open page is not ended at the minute the token runs out; the next API call ends it (finding m2).

## Related

- Lessons: [[knowledge/lessons/LESSON-REQ-fs-004-1-router-state-survives-a-reload]], [[knowledge/lessons/LESSON-REQ-fs-004-2-one-rule-one-function-in-lib]], [[knowledge/lessons/LESSON-REQ-fs-004-3-401-flag-token-header-timeout]]
- Gotchas: [[knowledge/gotchas#^g47|G47]], [[knowledge/gotchas#^g48|G48]], [[knowledge/gotchas#^g49|G49]]
- Component: [[knowledge/components/frontend-app]]
