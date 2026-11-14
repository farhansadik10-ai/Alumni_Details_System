# ADR-14 — The session token and the theme choice are kept in the browser's localStorage ^ADR-14

| Field | Value |
|---|---|
| Status | accepted |
| Decided | 2026-10-07 |
| Author | farhansadik10-ai (owner); drafted by Claude |
| Supersedes | (none) |
| Superseded by | (none) |
| Based on | REQ-fs-004 (AC4, AC13 to AC15, AC37, AC42, AC43, AC50); [[context/design-system]] "Themes" ("the storage key and method: decide in the REQ that builds it") |

## Context

Log in answers `{ token }`. The token holds the user's id and role and lasts one hour; there is no refresh call and no cookie. The frontend must keep the token somewhere so that a reload does not log the user out (REQ-fs-004 AC42), attach it to every request, and log the user out when the server answers 401.

The theme choice (light, dark, system) must survive a reload and be applied before the first paint, so a dark-theme user never sees a light page flash (AC15). React starts too late for that.

No backend change is allowed in REQ-fs-004.

## Considered options

### Option 1 — localStorage for both, a boot script for the theme

- Keys, all in `frontend/src/config/storageKeys.ts`: `ua.token`, `ua.theme`, `ua.rememberedEmail`.
- The token is mirrored in a Jotai atom. A derived atom gives the session (`userId`, `role`, `expiresAt`) or nothing. A token past its expiry counts as no session.
- The API client attaches the token. A 401 on any call except log in, sign-up and log out clears the token and marks the session as ended; the log-in page then says so.
- A `storage` event keeps tabs in step: logging out in one tab logs out the others.
- A short classic script in the `<head>` of `index.html` reads `ua.theme` and sets `data-theme` on `<html>` before the stylesheet paints. Vite writes the key into the script at build time from the same constant the app uses.

**Pros:**
- Works with the API as it is.
- The user stays logged in after a reload and in a new tab.
- No flash, on any route.

**Cons:**
- A script injected into the page (XSS) could read the token.
- An inline script would be blocked by a strict Content-Security-Policy. There is none today.

### Option 2 — sessionStorage for the token

**Pros:**
- The token is gone when the tab closes.

**Cons:**
- Every new tab asks the user to log in again.
- A script injected into the page can read sessionStorage just the same, so the gain is small.

### Option 3 — An httpOnly cookie set by the server

**Pros:**
- Page scripts cannot read the token.

**Cons:**
- Needs backend work (set and clear the cookie, protect against cross-site requests). Out of scope for REQ-fs-004.

### Option 4 — Token in memory only

**Pros:**
- Nothing stored.

**Cons:**
- A reload logs the user out. Breaks AC42.

## Decision

**We chose Option 1.** (Accepted by the owner at the REQ-fs-004 design gate, 2026-10-07.)

It is the only option that meets "stay logged in after a reload" with no backend change. The risk is limited by the one-hour token life and by never putting untrusted HTML into the page. Option 3 stays open for a later REQ.

## Consequences

| Consequence | Type |
|---|---|
| Three storage keys with the prefix `ua.`, defined once | new work |
| No `dangerouslySetInnerHTML` in the frontend; links from user data (photo link) must start with `http://` or `https://` | new work |
| The frontend reads the token's payload but never trusts it for access: the server decides, and a refused token leads to log out | trade-off |
| A token that expires while a page is open is noticed at the next API call, not at the exact minute | trade-off |
| If a Content-Security-Policy is added, the boot script moves to a file under `public/` | follow-up |
| Moving the token to an httpOnly cookie is a possible later REQ, together with the backend | follow-up |

## Open questions

- [ ] Should the token move to an httpOnly cookie before the app is sold? Needs backend work.

## Related

- Concepts: (none yet)
- Components: [[knowledge/components/frontend-app]]
- Gotchas: [[knowledge/gotchas#^g41|G41]], [[knowledge/gotchas#^g42|G42]]
- Lessons: (none)
- ADRs: [[architecture/adr-07-design-direction-oak-ink-band|ADR-07]], [[architecture/adr-09-white-label-app-name-from-one-constant|ADR-09]], [[architecture/adr-13-frontend-structure-css-modules-on-tokens|ADR-13]]
- First built in: REQ-fs-004
