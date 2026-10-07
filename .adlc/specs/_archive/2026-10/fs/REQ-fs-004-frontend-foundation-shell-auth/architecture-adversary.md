# Architecture adversary — REQ-fs-004-frontend-foundation-shell-auth

Written by: architecture-adversary (tier: balanced), dispatched sub-agent.

| Field | Value |
|---|---|
| Generated | 2026-10-07 |
| Trigger | new-adr, large-blast-radius, sensitive-surface, ui-surface |
| Verdict | found problems |

**Summary:** Read the spec (65 ACs), architecture, ADR-13/14, 11 tasks, the backend routes and token code, shared exports and tsconfigs. 4 findings: 1 major, 3 minor. Biggest: the guard `PublicOnly` and the log-in page both navigate after a successful log in, so "land on the page you asked for" (AC37) depends on a race. Dispatch questions: the backend contract (public sign-up, self-only logout, any user readable by id, `sub` numeric) matches the plan, checked, nothing. `@alumni/shared` resolves to `index.ts` source and exports every needed type, checked, nothing.

## Findings

### ADV-001: two parts both navigate after log in, and the "from" decision reads cleared state

| Field | Value |
|---|---|
| Severity | major |
| Confidence | medium |
| Lens | contradiction |
| Where | `architecture.md` §Session + §Routes; `tasks/TASK-008.md` Guards; `tasks/TASK-009.md` "Log in behaviour" |

**What:** `logInAtom` sets the token, so `PublicOnly` immediately redirects a live session to the Dashboard. TASK-009 then has the page navigate to `state.from` after `await`. Also, a successful log in clears the auth notice, but the page is told to ignore `from` "when the notice was `loggedOut`", and that check runs after the clear.
**Break scenario:** Visitor opens `/feed`, is sent to `/login` (from=/feed), logs in. The token write re-renders `PublicOnly` (Navigate to `/dashboard`) and the handler's continuation calls `navigate('/feed')`. Which runs last depends on React's flush timing, so the user sometimes lands on the Dashboard, failing AC37. Second case: user logs out from `/profile`, notice is `loggedOut`, RequireAuth sets from=/profile; on the next log in the notice is already null when read, so they land on `/profile`, not the Dashboard, which is the case the notice was meant to prevent.
**Why this holds up:** I tried to find a guard. TASK-009 notes only worry about "toast once, navigate once" for sign-up, and never say how the two redirects are ordered. Nothing reads the notice before dispatch.
**Recommendation:** Have one owner of the post-login destination. Let `PublicOnly` compute it (`state.from` unless notice was `loggedOut`, else Dashboard) and make the pages not navigate on success. Or capture `from` and the notice in locals before dispatching. Add a manual-checklist step: open `/feed` logged out, log in, expect `/feed`; log out from `/profile`, log in, expect Dashboard.

### ADV-002: expiry caught by the guard skips the teardown and the message

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | medium |
| Lens | omission |
| Where | `architecture.md` §Session "Expiry"; `tasks/TASK-008.md` RequireAuth; `tasks/TASK-011.md` checklist |

**What:** Only a 401 runs `onUnauthorized` (clear token, clear profile, set `sessionEnded`). A token found expired by the guard only redirects. The token stays in storage and `tokenAtom`, `profileAtom` keeps the old user, and no notice is set.
**Break scenario:** User A leaves the app open for over an hour, then clicks a nav link. The guard redirects to `/login` with no message. User B logs in on the same machine. `profileAtom` may still hold A's name until the reload finishes, and AppShell only reloads "when the session's user id changes", with no stated reset to `loading`. The checklist (TASK-011) expects "the message that follows" an expired session, but a token edited by hand or expired at load shows none.
**Why this holds up:** AC4 only names 401, so the missing message is not a spec breach, but the checklist contradicts the design. I could not find any clearing step on the expiry path.
**Recommendation:** Route the guard's expiry find through the same `onUnauthorized` teardown (in an effect, not in render), and say in the spec whether an expired-at-load token shows the notice. State that `loadProfileAtom` sets `loading` and `user: null` on a user id change.

### ADV-003: "each page in its own file" has no page files for six routes

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | medium |
| Lens | testability |
| Where | spec AC6; `tasks/TASK-008.md` (files table and AC6 line) |

**What:** TASK-008 creates one `BeingBuiltPage` for Dashboard, Directory, Alumni profile, Feed, My profile and Users, and creates no per-page files. Props can't make one lazy import into six chunks. The check "each page is a separate file in `dist/assets`" cannot pass or fail meaningfully.
**Why this holds up:** Rollup emits one chunk per distinct dynamic import target, so one `BeingBuiltPage` is one chunk. Parts 2 to 4 would change this, but they are not this REQ's proof.
**Recommendation:** Either add thin lazy page files (`DashboardPage.tsx` and so on) that render `BeingBuiltPage`, so the file-per-page rule is true now, or reword TASK-008's check to "LoginPage, SignUpPage, the shell pages' chunk and the components page are separate files, and the log-in entry chunk lists no other page".

### ADV-004: user-supplied photo links load from any host with the referrer sent

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | low |
| Lens | omission |
| Where | `architecture.md` §Components "Avatar"; spec AC21, AC53 |

**What:** Avatar renders any `http(s)://` link in an `<img>`. Nothing sets `referrerPolicy`, and `http://` links are allowed on an https site.
**Break scenario:** A user signs up with a photo link to a host they control; every colleague who opens a page showing that avatar sends their IP and the page URL to that host. An `http://` link is also blocked or downgraded as mixed content.
**Why this holds up:** The backend stores the string unchanged and `javascript:` is already blocked by the prefix rule, but the privacy leak is not covered by the "token in localStorage" risk row.
**Recommendation:** Add `referrerPolicy="no-referrer"` and `loading="lazy"` to the Avatar `<img>` in TASK-006; note the `http://` mixed-content fallback to initials as intended.

## Coverage

- **Lenses run:** omission, failure-mode, hidden-coupling, rollback, contradiction, testability, UX and design consistency.
- **Lenses skipped:** cross-repo (single repo). Rollback found nothing: the change is a revertable commit set, with no schema or data change.
- **Acceptance-criteria coverage:** AC1 to AC65 each mapped to a task and read; AC4, AC6, AC37, AC42 produced findings (ADV-001, 002, 003); the rest checked, nothing.
