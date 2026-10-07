# REQ-fs-004-frontend-foundation-shell-auth — Review log

Full reviewer narratives. The consolidated verdict lives in `verification.md` —
read that first; come here for the long form behind a finding ID.

## Correctness findings

Written by: correctness-reviewer (tier: balanced), dispatched sub-agent.

**Summary:** Checked session/token, guards, login/sign-up submit, theme boot, dialog/phone menu against the backend contract (AuthController, UserController, UserRoutes, token.ts match the client) and AC37-43, AC46-55. Ran `frontend-lib-check` (72/0) and style check (PASS). 0 critical, 0 major, 5 minor. Biggest: a log in with a token that is already expired by the browser's clock leaves the form busy forever (CORR-001).
**Dispatch answers:** Token leak / HTML injection: checked, nothing (no `dangerouslySetInnerHTML`, photo link only reaches `<img src>` after the http(s) test, error text is never the server's). Open redirect in `readReturnAddress`: checked, nothing (`//x` refused; `/\x` passes but `pushState` refuses a cross-origin address and only same-origin code can set `state.from`). Double submit, stale profile answers, other-tab token: checked, nothing (ref guard; `isStillCurrent`; adopt-without-write). Theme script vs `themeAtoms.ts`: checked, nothing (same rule). Focus in dialog / phone menu: checked, nothing.

### CORR-001: Log in stays busy forever when the new token is already expired on this clock

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `frontend/src/store/sessionActions.ts` (`requestToken`, packet L5692); `frontend/src/pages/LoginPage/LoginPage.tsx` (`handleSubmit`, packet L4701-4705); same in `SignUpPage.tsx` (L5040-5045) |
| Category | logic |

**What:** `requestToken` accepts any readable token; `PublicOnly` then judges it by `Date.now()`. If the PC clock is ahead of the server by more than the token's hour, the guard sees a dead session and keeps the login page, while the page returned early on `result.ok` and never clears `busy` or `sending`.
**Why it matters:** The button shows "Logging in…" forever and cannot be pressed; the expired token sits in storage. Sign-up has the same trap after the toast "Account created". A reload recovers.
**Recommendation:** In `requestToken`, treat a token for which `isExpired(session, Date.now())` is true as `UNREADABLE_ANSWER` (so the form shows "Something went wrong"), and add a case to `frontend-lib-check`.
**References:** [[knowledge/lessons/LESSON-REQ-fs-003-4]] (inputs the code could get wrong)

### CORR-002: Nothing ends an idle page when the token runs out

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `frontend/src/routes/RequireAuth.tsx:5315-5318` (packet) |
| Category | logic |

**What:** The old guard had a timer that re-rendered at `expiresAt`; the new one judges expiry only when it renders, and `sessionAtom` has no clock.
**Why it matters:** A tab left open past one hour keeps showing the shell and the user's name until a click causes an API call and a 401. Not wrong in AC42 (reload case), but weaker than before.
**Recommendation:** Either accept it and say so in the patterns doc, or restore a timeout in `RequireAuth` set to `expiresAt - now` (capped at 2147483647 ms) that bumps a state counter.

### CORR-003: Log out has no time limit, so a hung server keeps the user logged in

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `frontend/src/services/userService.ts:5556-5559`, `store/sessionActions.ts:5761-5771` (packet) |
| Category | error-handling |

**What:** `logOutAtom` awaits the server call before clearing the session; axios has no timeout by default.
**Why it matters:** AC43 says a failed call still logs the user out, but a call that never answers is neither a failure nor a success. The button stays busy and the token stays in storage, on a shared PC too.
**Recommendation:** Pass `timeout` (for example 5000 ms) in `logOut`, so the catch runs and the session is cleared.

### CORR-004: Login and sign-up requests carry an old token

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `frontend/src/services/apiClient.ts:5443-5446` (packet) |
| Category | security |

**What:** The request interceptor adds `Authorization` to every call, including `/api/auth/login` and `POST /api/users`; the old code skipped the header on those (`skipAuthRedirect`). The new `skipAuthHandling` only stops the 401 handling.
**Why it matters:** When a dead token is still stored (login page reached after expiry), it is sent to endpoints that never need it. The backend ignores it, so no harm today; it is needless exposure.
**Recommendation:** In the interceptor, skip the header and `sentToken` when `config.skipAuthHandling` is true, except for `logOut`, which needs the token (give it its own flag or leave `skipAuthHandling` off and handle its 401 in the action).

### CORR-005: A photo link of just "https://" is accepted

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `frontend/src/lib/validation.ts:4398-4403` (packet, `WEB_LINK_START`, `validatePhotoLink`) |
| Category | input-validation |

**What:** The rule only tests the start of the text, and the input's placeholder is `https://`. A user who types the prefix and stops sends it to the server as the photo link.
**Why it matters:** A useless value is stored; `Avatar` falls back to initials only after the image fails. This matches AC53 as written, so it is the spec's gap, not a code slip.
**Recommendation:** Require at least one character after `//` (`/^https?:\/\/\S/i`) and add `"https://"` as an invalid case in `frontend-lib-check`.

(0 trivials not listed.)

### Round 2 re-review

Written by: correctness-reviewer (tier: balanced), dispatched sub-agent.

**Summary:** Round 1: CORR-001, CORR-003, CORR-004 resolved; CORR-002 and CORR-005 still open (owner's call, code unchanged). I read the changed files in the work tree and ran `frontend-lib-check` (108/0), the style check (PASS) and `npm run build` (ok). The fixes introduced 0 critical, 0 major, 2 minor findings (R2-1, R2-2). The 401 rules, token helpers, dialog hook and form hook hold up.

**Round 1 status.** CORR-001 resolved: `requestToken` (sessionActions.ts:67) now treats an expired token as unreadable for both log in and sign-up; sign-up then falls to `loggedIn:false` and the login page. CORR-003 resolved: `logOut` has a 5000 ms timeout (userService.ts:27) and the catch clears the session. CORR-004 resolved: `withoutToken` skips the header and `sentToken` on log in and sign-up. CORR-002, CORR-005: still open, not touched.

**Checked, nothing found.** The 401 rules: log in, sign-up and log out carry `skipAuthHandling`, so their 401 never ends the session; log out has no `withoutToken`, so it still sends the token; any other call with the current token ends the session (apiClient.ts:57-68). `isLiveSession` and `isAdmin` match the old inline tests (null session, null role). Log in and sign-up pages set no state after success (the `return` precedes any setter). `readReturnAddress` now refuses `/\`; a tab inside the path (`/<tab>/x`) is still passed, but `pushState` refuses a cross-origin address and only same-origin code sets `state.from`, so it is not an open redirect. `pageRange` and `clampPage` handle NaN, Infinity and fractions. `useModalDialog`: the app's own close does not call `onClose` again (the `latest.current.open` test); an unmount while open closes first. Dev double-run of effects is harmless for a dialog that starts closed (both users do). `useFormError`: the ref guard still stops a double submit; focus moves on each new error object.

### R2-1: The "after log in" focus flag survives a reload

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `frontend/src/routes/paths.ts:22`, `frontend/src/components/shell/AppShell/AppShell.tsx:58` |
| Category | logic |

**What:** `AFTER_LOG_IN_STATE` is router state, which the browser keeps in `history.state` for that entry. `AppShell` reads it once at mount, so reloading (or returning to) the first page after a log in mounts the shell with the flag still true.
**Why it matters:** Focus jumps to the page heading on a reload, which the "not on the first load" rule (AppShell.tsx:73) is meant to prevent. Also, when the return address is `/`, `Navigate` to the Dashboard drops the state and `FocusHeading` runs before any heading exists, so that case gets no focus at all.
**Recommendation:** Cheapest: accept both and say so in the patterns doc. Fix: `FocusHeading` clears the flag with `window.history.replaceState({ ...window.history.state, usr: null }, "")` after it focuses (no router navigation, so PublicOnly stays the only navigator), and `PublicOnly` sends `PATHS.dashboard` instead of `/`.

### R2-2: Pagination can keep a stale "keep focus" flag

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `frontend/src/components/ui/Pagination/Pagination.tsx:17, 44, 75` |
| Category | logic |

**What:** `keepFocus` is set on click and cleared only in the effect that runs when `page` changes. If the parent does not change `page` after `onChange` (it refuses, or it is slow), the flag stays true.
**Why it matters:** The next page change from any source then pulls focus to the current page number, even when the user was somewhere else (for example typing in a filter that resets the page). Nothing calls this yet; the directory and feed pages will.
**Recommendation:** Set the flag, and in the same click handler schedule a clear (`queueMicrotask` is too early for an async parent). Simplest: store the target page (`keepFocusFor.current = current - 1`) and compare it with `page` in the effect, resetting it on any other value.

(0 trivials not listed.)

## Quality findings

Written by: quality-reviewer (tier: balanced), dispatched sub-agent.

**Summary:** Checked 114 files in the packet against `conventions.md` and the architecture. I ran the build (passes), `frontend-style-check.mjs` (PASS, 0 findings) and `frontend-lib-check.ts` (72 passed). 7 findings: 2 major, 4 minor, 1 convention-gap (minor); 3 trivials not listed. Biggest: about 60 lines of native-dialog logic are copied between `Dialog.tsx` and `PhoneMenu.tsx`, and the open-redirect guard `readReturnAddress` and `pageRange` have no check at all.
**Dispatch answers:** Folder/naming/no barrels: checked, nothing (PascalCase folders, camelCase files, no barrels). No axios/API in components: checked, nothing (rule d passes; I also grepped). Types from `@alumni/shared`: checked, nothing. Magic strings for addresses and storage keys: checked, nothing in code, but no script enforces it (QUAL-005). Two form pages: QUAL-002. PhoneMenu vs Dialog: QUAL-001. Repeated messages: QUAL-003. Dead code: trivial only. Comment quality: checked, nothing (explain why, no commented-out code, no TODO). Check scripts: QUAL-005. Test strategy: QUAL-004. I do not disagree with how D1 to D11 were handled (I did not re-report them).

### QUAL-001: Native-dialog logic is copied between Dialog and PhoneMenu

| Field | Value |
|---|---|
| Severity | major |
| Effort | small |
| File | `frontend/src/components/ui/Dialog/Dialog.tsx` (latest ref to layout-effect cleanup) and `frontend/src/components/shell/PhoneMenu/PhoneMenu.tsx` (same block) |
| Category | duplication |
| Rule | conventions.md "Frontend" (own components); no rule on duplication, general quality |

**What:** The `latest` ref, the open/close effect, the `cancel` and `close` listeners and the layout-effect cleanup are the same code in both files. Only the styling differs.
**Why it matters:** This is the subtle part (showModal throws if already open, Escape held back, focus return). A fix in one file will be missed in the other. The "own look" comment explains the CSS split, not why the logic is copied.
**Recommendation:** Extract `hooks/useModalDialog.ts` taking `{ open, onClose }` and returning `dialogRef`. Both components call it and keep their own markup and CSS.

### QUAL-002: LoginPage and SignUpPage repeat the same form plumbing and constants

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `frontend/src/pages/LoginPage/LoginPage.tsx:39,47,91` and `frontend/src/pages/SignUpPage/SignUpPage.tsx:34,46,54,93` |
| Category | duplication |
| Rule | conventions.md "Config" (no magic strings or numbers) |

**What:** Both pages define `GENERAL_ERROR_MESSAGE` ("Something went wrong. Try again."), `MAX_EMAIL_LENGTH = 100`, the `{ text }` form-error object and its focus-on-error effect, and the `sending` ref guard. SignUpPage writes "At least 8 characters." and "Use at least 8 characters." as text while `MIN_PASSWORD_LENGTH` exists in `lib/validation.ts`.
**Why it matters:** The next two forms (profile, posts) will copy it a third and fourth time. Changing the 8 later means editing three places.
**Recommendation:** Move `GENERAL_ERROR_MESSAGE` and `MAX_EMAIL_LENGTH` to `lib/validation.ts` (or `config/`). Build the help text from `MIN_PASSWORD_LENGTH`. Consider one `useFormError()` hook (message state plus focus ref).

### QUAL-003: Repeated literals that should be one constant

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `App.tsx:44`, `routes/PublicOnly.tsx:49`, `Skeleton.tsx:33`, `AppShell.tsx:20`; `Header.tsx:81` and `RequireAdmin.tsx:17`; Header, PhoneMenu ("My profile", "Main") |
| Category | convention |
| Rule | conventions.md "Config" ("No magic strings or numbers") |

**What:** The word "Loading" is written four times; "Main" (nav label) twice; "My profile" in Header, PhoneMenu and MyProfilePage; the role `"admin"` as a bare string in Header and RequireAdmin (a typed `Role` exists in `lib/token.ts`); the name derivation `user.name?.trim() || null` in Header and PhoneMenu.
**Why it matters:** Wording or role-rule changes need several edits, and the admin check can drift between the menu and the guard.
**Recommendation:** Add `LOADING_TEXT` to `config/` (or a `<VisuallyHiddenLoading />` used by the two Suspense fallbacks), a shared `isAdmin(session)` in `lib/token.ts`, and `NAV_LABEL` / `MY_PROFILE_LABEL` constants beside `PhoneMenuLink`.

### QUAL-004: No check covers the redirect guard, pageRange or the route logic

| Field | Value |
|---|---|
| Severity | major |
| Effort | small |
| File | `frontend/src/routes/PublicOnly.tsx:13` (`readReturnAddress`); `frontend/src/components/ui/Pagination/Pagination.tsx:23` (`pageRange`); `scripts/frontend-lib-check.ts:15-17` (imports) |
| Category | test-coverage |
| Rule | conventions.md "Testing" (build plus checks stand in for tests) |

**What:** `frontend-lib-check.ts` imports only from `lib/`. `readReturnAddress` (rejects `//evil.com`, non-strings, off-site addresses) and `pageRange` (with its "a gap never hides one page" rule and documented examples) are pure functions with real edge cases, but live in components or routes and so sit outside the check. The cases in `pageRange`'s doc comment are exactly the test table.
**Why it matters:** The redirect guard is the only protection against an attacker-chosen `state.from` after login; a regression passes the build and style check silently. The manual checklist cannot reach router state.
**Recommendation:** Move `readReturnAddress` to `lib/returnAddress.ts` and `pageRange` to `lib/pageRange.ts` (components then import them). Add cases to `frontend-lib-check.ts`: `//x`, `/\x`, missing pathname, object with non-string search; and the four documented `pageRange` outputs plus 0, NaN and out-of-range pages.

### QUAL-005: Check scripts are not wired in and have gaps

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `package.json:12-17`; `scripts/frontend-style-check.mjs:11-18` (rule list) |
| Category | convention |
| Rule | conventions.md "Config" (no magic strings), "Testing" |

**What:** Both scripts can fail (exit 1, tested paths for empty src and missing config), but no npm script runs them; they exist only as commands in prose. The style check has no rule for the thing the REQ cares about most after tokens: a path like `"/login"` or a key like `"ua.token"` written outside `routes/paths.ts` and `config/storageKeys.ts`. Rule f misses `role="button"` on a div and `onClick` spread through props.
**Why it matters:** An unwired check is skipped in the next REQ, and the "no magic strings" rule is only enforced by reviewers.
**Recommendation:** Add root scripts `check:frontend` (runs both) and mention them in CLAUDE.md "Commands". Add rule i: any string literal starting with `"/` that equals a `PATHS` value, or starting with `"ua.`, outside the two config files. I found no false positive in the current run (0 findings, 0 suspicious matches by hand).

### QUAL-006: The "is the session still live" test is written three times

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `frontend/src/routes/PublicOnly.tsx:42`, `frontend/src/routes/RequireAuth.tsx:23`, `frontend/src/store/wireApi.ts:16` |
| Category | duplication |
| Rule | none (general quality) |

**What:** `session !== null && !isExpired(session, Date.now())` appears in the two guards; `wireApi` has a third form. PublicOnly's comment says it must agree with RequireAuth ("would send it straight back").
**Why it matters:** If the two guards ever disagree you get a redirect loop between login and the shell.
**Recommendation:** Add `isLiveSession(session: Session | null, now: number): boolean` to `lib/token.ts`, use it in all three, and add a case to `frontend-lib-check.ts`.

### QUAL-007: Frontend conventions the REQ relies on are not written down

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `.adlc/context/conventions.md` "Naming" (line 23) and "Comments" (lines 92-95) |
| Category | convention-gap |
| Rule | n/a: convention-gap |

**What:** conventions.md still says "Frontend file naming is not decided" and the Comments section is empty, yet this REQ settled both: PascalCase folder per component with `.module.css`, camelCase elsewhere, no barrel files, default export only for lazy pages, named exports otherwise, comments explain why in plain words, no TODO. `docs/frontend-patterns.md` holds some of it, but the reviewers' source of truth is conventions.md.
**Why it matters:** Reviewers cannot cite a rule, so the next REQ's drift is invisible.
**Recommendation:** The owner decides: copy the settled rules into conventions.md (Naming and Comments), or link it to `docs/frontend-patterns.md`.

(3 trivials not listed: unused `export` on `MIN_PASSWORD_LENGTH`, the `*_MESSAGE` constants and `MAX_TOASTS`; the `"light" | "dark" | "system"` strings repeated in `toThemeChoice`.)

**Packet-gap:** none. I read `package.json` (root), `frontend/src` greps and the log file; those are outside the diff and within my reading mandate.

### Round 2 re-review

**Summary:** `npm run check:frontend` works (style PASS, 10 rules, 118 files; lib check 108 passed) and the frontend build passes. QUAL-001, 002, 004, 005, 006 resolved; QUAL-003 resolved except one literal; QUAL-007 left for the owner as agreed. 4 new findings, all minor or trivial, none blocking. I could not run a deliberate-failure test of rules i and j (read-only); I judged them by reading.

| Round 1 | Status |
|---|---|
| QUAL-001 dialog logic copied | Resolved: `hooks/useModalDialog.ts` holds it once; Dialog and PhoneMenu call it. |
| QUAL-002 form plumbing | Resolved: `useFormError`, `MAX_EMAIL_LENGTH`, `GENERAL_ERROR_MESSAGE` in `lib/validation.ts`; help text built from `MIN_PASSWORD_LENGTH`. No local copies left. |
| QUAL-003 literals | Mostly resolved: `LOADING_TEXT`, `MAIN_NAV_LABEL`, `MY_PROFILE_LABEL`, `isAdmin` used. One left, see QUAL-R2-1. |
| QUAL-004 no check | Resolved: `lib/returnAddress.ts`, `lib/pageRange.ts` plus 36 cases (see QUAL-R2-3). |
| QUAL-005 unwired checks | Resolved: `check:frontend` wired; rules i, j added; f now reads `role`. One gap remains (QUAL-R2-3). |
| QUAL-006 live-session test | Resolved: `isLiveSession` is used in all five places (guards, `wireApi`, `requestToken`). |
| QUAL-007 conventions gap | Not applicable now; owner's call. |

Rules i and j: both can fail (i reports on a PATHS value or "ua." string; j on any `@media ... max-width` line that is not the layout line, and the script exits 1 if `PHONE_LAYOUT_QUERY` or PATHS cannot be read). No false positive found: the bare "/" is excluded on purpose, strings with `${` are skipped, comments are blanked, and the API paths `/api/...` do not equal any PATHS value. Rule f: the blanked-string offsets line up with the file, so `role="button"` and `role={"button"}` are found.

### QUAL-R2-1: Comment names the wrong rule; one "My profile" literal left

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `frontend/src/config/layout.ts:3`; `frontend/src/pages/MyProfilePage/MyProfilePage.tsx:22` |
| Category | comment / convention |
| Rule | conventions.md "Config", "Comments" |

**What:** layout.ts says the style check "(rule i)" fails when a stylesheet differs; that is rule j (rule i is addresses and keys). MyProfilePage still writes `heading="My profile"` while `MY_PROFILE_LABEL` exists.
**Why it matters:** A reader who follows the wrong rule letter finds nothing; the label can drift from the menu link.
**Recommendation:** Change to "rule j" and use `MY_PROFILE_LABEL`. Also stale: untracked `scripts/_tmpfail.ts` (a scratch file from a fail test) should be removed by the owner before commit.

### QUAL-R2-2: `isLiveSession` is a type predicate, so its false branch is typed wrong

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `frontend/src/lib/token.ts` (`isLiveSession`) |
| Category | correctness-of-types |
| Rule | none (general quality) |

**What:** `session is Session` also narrows the false branch: after `if (!isLiveSession(s, now))`, TypeScript treats `s` as `null`, although an expired `Session` lands there too. All five current callers only use the true branch or ignore the value, so nothing is wrong today.
**Why it matters:** The first caller that reads the expired session (for a message such as "your session ended at ...") gets a wrong type with no warning.
**Recommendation:** Return plain `boolean`, or keep the predicate and document the trap in one line.

### QUAL-R2-3: New check cases are from the documented behaviour; two boundary gaps

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `scripts/frontend-lib-check.ts` (pageRange and style rule i/j areas) |
| Category | test-coverage |
| Rule | conventions.md "Testing" |

**What:** The 36 cases follow the doc comments (the four `pageRange` examples, the "nearest page" rule, "//" and "/\" refusals, "not text becomes empty"), not a copy of the code's branches. Gaps: no 8-page case (the first count above the "show all" limit of 7), no case near the last page (`pageRange(22, 25)`), and none where a one-page gap must be filled on the right side (`pageRange(5, 8)` gives 7). Rule f still does not see a handler spread through `{...props}`.
**Why it matters:** The "a gap never hides one page" rule is the part most likely to break at the edges.
**Recommendation:** Add those three `pageRange` cases. The spread gap is acceptable; note it in the script header.

### QUAL-R2-4: Focus-after-log-in flag survives a reload; Pagination flag can go stale

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `frontend/src/components/shell/AppShell/AppShell.tsx:58`; `frontend/src/components/ui/Pagination/Pagination.tsx:19` |
| Category | behaviour |
| Rule | none |

**What:** Router state `afterLogIn` stays in the history entry, so a reload or a return to that entry moves focus to the heading ("Not on the first load" is then not true). In Pagination, `keepFocus` stays true if `onChange` does not change `page`, and the next page change then moves focus.
**Why it matters:** Both are small surprises for keyboard users, not breakages.
**Recommendation:** Owner's call; a one-line comment is enough.

**New duplication / unused exports:** none found. Names and folders follow conventions.md and the architecture (PascalCase component folders, camelCase files, no barrels; `hooks/`, `lib/`, `config/` hold the new files). `clampPage` and the exported hook types (`ModalDialogOptions`, `FormErrorState`, `FormError`) are used only inside their own file, so the `export` is unneeded (trivial). The header decision (name shrinks to an ellipsis, avatar still reads) is a UI call; I have no quality objection. Comments added in this round explain why, with the one wrong rule letter above.

## Architecture findings

Written by: architecture-reviewer (tier: balanced), dispatched sub-agent.

**Summary:** Checked 114 files against architecture.md and ADR-07/09/10/11/13/14. Build, style check (PASS) and lib check (72/0) run clean. Nothing under backend/, shared/ or db/ changed; the login, sign-up, get-user and logout calls match the backend routes and `shared/types/user.types.ts`. 0 critical, 0 major, 2 minor, 1 trivial. Biggest: the "is this session still live" rule is written out three times.
- Layers: components/pages import no `services/` (not even types); services/lib import no store; one `endSessionAtom` used by wireApi, RequireAuth only: checked, nothing. PublicOnly is the only post-login navigator; SignUpPage's one `navigate` is the planned no-session case (TASK-009:50): checked, nothing.
- Storage keys, app name, contact email: each defined once, Vite plugin writes index.html; one file per page in dist; ComponentsPage absent from build; every `var(--x)` is defined in tokens.css; phone block and size table match the plan: checked, nothing.
- D1-D11 handling: agree, no objection (D3 type-import ban matches the architecture's rule).

### ARCH-001: The "session is live" rule is copied in three places

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `frontend/src/routes/RequireAuth.tsx:23`, `routes/PublicOnly.tsx:42`, `store/wireApi.ts:16` |
| Category | pattern |
| Rule broken | architecture.md "Session" (one decider for ending a session); ADR-14 |

**What:** Each of the three files writes its own `session !== null && !isExpired(session, Date.now())` check.
**Why it matters:** The guards must agree (PublicOnly's own comment says RequireAuth would bounce it back). Part 2 will add more guards or token refresh and one copy will be missed, giving a redirect loop.
**Recommendation:** Add `isLive(session, now)` (or `isLiveSession`) to `lib/token.ts` and use it in the three places.
**References:** [[architecture/adr-14-session-and-theme]], architecture.md "Session".

### ARCH-002: Phone breakpoint is a separate literal in TypeScript

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `frontend/src/components/shell/PhoneMenu/PhoneMenu.tsx:33` |
| Category | pattern |
| Rule broken | architecture.md "Tokens and styles": the breakpoint is one literal written the same way |

**What:** `PHONE_LAYOUT_QUERY` repeats `767.98px` in a `.tsx` file; the style check (`scripts/frontend-style-check.mjs:33`) only pins the CSS copies, so the two can drift apart silently.
**Why it matters:** If the CSS breakpoint changes, the phone menu would close or stay open at the wrong width.
**Recommendation:** Export the query string once from `config/` (or a small `lib/layout.ts`) and add a style-check rule that the TSX copy equals the CSS one; or add a comment in both pointing at each other.
**References:** architecture.md "Tokens and styles" (phone layout bullet), ADR-13.

### ARCH-003: Route table comment says no page navigates

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `frontend/src/App.tsx:36` |
| Category | pattern |
| Rule broken | accuracy of the layer note in architecture.md "Session" |

**What:** The comment "no page navigates after a log in or a log out" is true, but `SignUpPage.tsx:156` navigates in the account-created-but-login-failed case. Say so in the comment so the next page author knows the one exception.
**Why it matters:** A future page may copy the navigate and race PublicOnly.
**Recommendation:** Reword the comment to name the exception.
**References:** TASK-009.md line 50, ADR-14.

### Round 2 re-review

**Summary:** ARCH-001, ARCH-002, ARCH-003 all resolved. Build passes, style check PASS (rules i, j live), lib check 108/0. No layer rule broken by the fixes. 0 critical, 0 major, 0 minor, 2 trivial (architecture.md folder list is out of date; one stale comment). `package.json` diff is the one `check:frontend` script line; nothing under backend/, shared/ or db/ changed.

- ARCH-001 resolved: `isLiveSession` and `isAdmin` in `lib/token.ts`, used by RequireAuth, PublicOnly, RequireAdmin, wireApi, sessionActions and Header. No inline copy is left.
- ARCH-002 resolved: `PHONE_LAYOUT_QUERY` is in `config/layout.ts` (plain constant, no DOM), PhoneMenu imports it, and style-check rule j pins every CSS copy to it.
- ARCH-003 resolved: the App.tsx comment now names SignUpPage's one navigate and says PublicOnly is the only navigator after a successful log in. True: grep finds only that `navigate` plus the two `<Navigate>` guards.
- Checked, nothing: no `services/` import (not even types) in components, pages, hooks, routes, lib or config; services and lib import no store; lib and config touch no browser global at import (`window.matchMedia` is in PhoneMenu, inside an effect); hooks import only react and config. `endSessionAtom` is still set only by RequireAuth and wireApi (one decider). `withoutToken` is a per-call flag on the request config that the client reads itself, beside `skipAuthHandling`; the client still knows nothing about the store and `getToken`/`onUnauthorized` stay injected, so the design holds. The stale-401 check still compares `sentToken`, and log out still sends the token. `AFTER_LOG_IN_STATE` is attached only by PublicOnly and read by AppShell through `isAfterLogIn`, so PublicOnly remains the sole post-login navigator. Constants: `LOADING_TEXT`, nav labels and the breakpoint are each defined once.

### ARCH-004: architecture.md folder list does not name the new files

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `architecture.md` "Folder layout" (lines 61-92) |
| Category | docs |
| Rule broken | the architecture is the contract for where files live |

**What:** The list stops at `useDocumentTitle.ts` under hooks/ and `app.ts`, `storageKeys.ts` under config/. It omits `hooks/useModalDialog.ts`, `hooks/useFormError.ts`, `config/layout.ts`, `config/text.ts`, `lib/returnAddress.ts`, `lib/pageRange.ts` and `components/shell/navLabels.ts`. The "no magic strings" line (312) also says messages sit beside the form, while `config/text.ts` now holds shared words.
**Why it matters:** Part 2 authors read this list to decide where a new helper goes; `lib/` and `config/` here are the "pure, no browser global" folders, which the new files respect, but the list does not say so.
**Recommendation:** Add the seven files to the list at wrap-up and note that `config/text.ts` is for words used in more than one place. Placement of all seven is consistent with the layer rules, so no code change.

### ARCH-005: sessionAtoms comment still says the guard calls `isExpired`

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `frontend/src/store/sessionAtoms.ts:42` |
| Category | pattern |

**What:** The comment says the start-up check and RequireAuth call `isExpired`; they now call `isLiveSession`. Reword so the next author is not sent to the wrong helper.


## Reflection findings

Written by: reflector (tier: balanced), dispatched sub-agent.

**Summary:** Checked 15 lessons (0 skipped as superseded), all 42 gotchas against the diff (G29, G34, G38, G41, G42 in depth), 14 ADRs (07, 09, 11, 13, 14 in depth), and the frontend-patterns doc (paths, claims; I ran the style check and lib check, both pass: 111 files, 72 cases). 5 findings: 0 critical, 0 major, 3 minor, 2 trivial. Biggest: the vault and the shared types still say "legacy frontend" after this REQ deleted it (REFL-003). `docs likely affected:` none beyond the wrap-up list; `frontend/README.md` is the untouched Vite template (REFL-005).
**Dispatch answers:** Lesson 003-1 (check from spec): respected, lib-check header says cases come from the ACs. 003-2 (prove pure parts): partly, REFL-002. 003-4 (can fail): respected, check-notes 1.2/1.3 show a probe that fails. 002-3 (convert every copy): repeated, REFL-001. G34/G38/G41/G42: respected (error handling reads `status` only, role `null` handled in `lib/token.ts`, no `User`/`CreateUserDTO` import, no alumni email shown). Exploration's two mistakes: both corrected (`userService.logOut` returns void and cites G41; no legacy file remains in `git ls-files frontend/src`, `package.json` has no antd). Doc-drift of `docs/frontend-patterns.md`: every real path exists; one small claim is off (REFL-004).

### REFL-001: Third sighting of "new shared thing, old copies left" (cross-reference)

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `frontend/src/pages/LoginPage/LoginPage.tsx:39,47`, `frontend/src/pages/SignUpPage/SignUpPage.tsx:46,54`; `Dialog.tsx` vs `PhoneMenu.tsx` |
| Category | repeated-mistake |
| Vault reference | [[knowledge/lessons/LESSON-REQ-fs-002-3-new-helper-convert-every-sibling]] |

**What:** `GENERAL_ERROR_MESSAGE` and `MAX_EMAIL_LENGTH` are written in both form pages, and the dialog code is copied into PhoneMenu; this is QUAL-001/QUAL-002 seen through the lesson.
**Why it matters:** The lesson already has two sightings; the patterns doc lists both as "open points" on purpose, which is the "write down why it stays" path, but the next three forms will copy them again.
**Recommendation:** Fix as QUAL-001/002 say; if the owner defers, keep the open-points lines and add this REQ as a third sighting to the lesson at wrap-up.

### REFL-002: The store logic, the riskiest part, is proven only by a scratch file that is not shipped

| Field | Value |
|---|---|
| Severity | minor |
| Effort | medium |
| File | `frontend/src/services/apiClient.ts:54`, `frontend/src/store/wireApi.ts`, `frontend/src/store/sessionActions.ts` |
| Category | repeated-mistake |
| Vault reference | [[knowledge/lessons/LESSON-REQ-fs-003-2-prove-the-pure-parts-you-cannot-run]] |

**What:** The 401 rule, the start-up expiry check and the "one update" rule were run in a scratch harness (69 cases, CAND-013) that was deleted; `scripts/frontend-lib-check.ts` covers only `lib/`.
**Why it matters:** The lesson says run the expression, and it was run, but nobody can re-run it. These are the rules a later REQ is most likely to break while editing the client. The patterns doc admits it (Open points, last-but-one line).
**Recommendation:** Owner decides: add a follow-up task to ship the harness as `scripts/frontend-store-check.ts` (fake `localStorage`, fake axios `adapter`), or record it as accepted. Not a blocker for this REQ.

### REFL-003: "Kept for the legacy frontend" is now false in the shared types, G34, G38 and ADR-07

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `shared/types/user.types.ts:1,16,32`; `.adlc/knowledge/gotchas.md` G34 ("legacy sign-up form matches `User_email_key`"), G38 Don't line; `.adlc/architecture/adr-07-design-direction-oak-ink-band.md:49,65` |
| Category | vault-stale |
| Vault reference | [[knowledge/gotchas#^g38|G38]], [[knowledge/gotchas#^g34|G34]], [[architecture/adr-07-design-direction-oak-ink-band|ADR-07]] |

**What:** This REQ deleted the antd frontend and nothing under `frontend/src` imports `User` or `CreateUserDTO`, yet four places still say the legacy frontend needs them or that antd stays installed.
**Why it matters:** The next REQ will keep dead types "because the legacy frontend needs them", and ADR-07's "antd stays until the last legacy screen" is already done (decision-in-effect text that is no longer true).
**Recommendation:** At wrap-up: add a one-line "Update (REQ-fs-004): legacy frontend deleted" to G34 and G38 and to ADR-07's consequences; decide with the owner whether to delete `User`/`CreateUserDTO` and the stale comments in `user.types.ts` (shared code, so a small task, not a drive-by).

### REFL-004: Two statements about the code are not true

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `frontend/src/store/themeAtoms.ts:73-74`; `docs/frontend-patterns.md` pattern 7 |
| Category | concept-drift |
| Vault reference | [[architecture/adr-14-session-and-theme-kept-in-the-browser|ADR-14]] |

**What:** (1) The comment at `themeAtoms.ts:73` says every page has a ThemeSwitch so no start-up call is needed; `main.tsx:9-11` now imports the file for exactly that reason and log in has no switch (this is CAND-045, still open). (2) Pattern 7 says "the actions also do the trimming", but `LoginPage.tsx:128` and `SignUpPage.tsx:133-136` trim again before calling the action.
**Why it matters:** A comment that contradicts `main.tsx` invites someone to remove the import and break system-follow on the log-in page.
**Recommendation:** Reword the comment to match `main.tsx`; drop the page-side `.trim()` calls or change the doc sentence to "the pages and the actions both trim".

### REFL-005: `frontend/README.md` and `eslint.config.js` describe things this project does not have

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `frontend/README.md`, `frontend/eslint.config.js`, `frontend/package.json` |
| Category | vault-stale |
| Vault reference | [[knowledge/gotchas#^g28|G28]] (same "build passes, thing is dead" shape) |

**What:** The README is the Vite template (it says the React plugin uses Oxc; `package.json` has `@vitejs/plugin-react` 4). `eslint.config.js` imports `@eslint/js`, `typescript-eslint` and others, none installed, and there is no lint script.
**Why it matters:** Pre-existing, but this REQ rebuilt the frontend and left both; a newcomer will try `npx eslint` and fail. Patterns doc already says "ESLint is not installed".
**Recommendation:** Wrap-up: replace the README with five lines (dev, build, the two checks, link to `docs/frontend-patterns.md`); the owner decides whether to delete the unused ESLint config or install ESLint.

### Round 2 re-review

**Summary:** Round-1 status: REFL-001 resolved, REFL-004 resolved, REFL-002, REFL-003, REFL-005 still open (left for the owner, as agreed). Grep of `frontend/src` found no old copy left of the live-session test, form constants, dialog logic, breakpoint query, "Loading" text or `"admin"` literal. Both checks pass (style check no findings, library check 108 cases). 0 new code findings; 3 doc-drift findings in `docs/frontend-patterns.md` (REFL-006 to 008), all trivial.

**Round-1 status**
- REFL-001: resolved. `useFormError`, `validation.ts` constants, `useModalDialog` each exist once; `showModal` and the cancel/close listeners are only in the hook.
- REFL-002: still open (owner's call). The store rules still have no shipped check. The patterns doc still says so in Open points, which is true.
- REFL-003: still open (owner's call; wrap-up and shared types).
- REFL-004: resolved. The `themeAtoms.ts` comment now says main.tsx imports it and "not every page has a ThemeSwitch". The doc now says "Trimming happens twice, on purpose", which matches the pages' `.trim()` calls.
- REFL-005: still open (owner's call).

**Past-mistakes re-check**
- LESSON-REQ-fs-002-3 (convert every copy): not repeated. Grep results: `Date.now()` with the live test only inside `isLiveSession` callers (PublicOnly, RequireAuth, sessionActions, wireApi); `"admin"` only in `token.ts` (role list, `isAdmin`) and demo data on the dev page; "Loading" only as `LOADING_TEXT` (the other hits are a CSS class and a caption); `767.98px` only in CSS (nine copies, now guarded by rule j) and `config/layout.ts`; `MAX_NAME_LENGTH` is used by one form only, so local is right.
- LESSON-REQ-fs-003-4 (can the checks fail): respected. Rules i and j report findings in code (`report("i"...)`, `report("j"...)`), rule f gained a `role="button"` branch, and `scripts/_tmpfail.ts` is the leftover of a failing probe. I did not re-run probes (read-only).
- LESSON-REQ-fs-003-1 (expected values from spec): respected. The new `returnAddress` cases type out the expected objects (`//x`, `/\x` refused, non-text parts become ""), not computed from the code.
- Behaviour of the fixes: `AFTER_LOG_IN_STATE` and `isAfterLogIn` in `paths.ts` are used by PublicOnly and AppShell, one definition. No lost behaviour seen. The header-name shrink tradeoff (about 10px at worst) is a design call for the owner; I have no objection if the avatar and a title/aria-label carry the name.

### REFL-006: `frontend-patterns.md` says the style check has "eight rules, a to h" (trivial, small)

| Field | Value |
|---|---|
| File | `docs/frontend-patterns.md:111-120` and `:577` |
| Category | concept-drift |

**What:** The script now has rules a to j (i: address or storage key written outside `paths.ts`/`storageKeys.ts`; j: a max-width media query that differs from `config/layout.ts`), and rule f also refuses `role="button"` on a div or span. The doc lists only a to h and says f is only `onClick`.
**Recommendation:** Say "ten rules, a to j", add the two lines, and extend f. Also `:427` says 72 cases; it is 108 now.

### REFL-007: Doc still lists the Dialog/PhoneMenu duplication as known and open (trivial, small)

| Field | Value |
|---|---|
| File | `docs/frontend-patterns.md:455` and Open points (the PhoneMenu line and the "constant in both form pages" line) |
| Category | concept-drift |

**What:** `hooks/useModalDialog.ts` now holds the dialog logic once and `useFormError`/`validation.ts` hold the form constants once, so "Known duplication: PhoneMenu repeats about 40 lines" and the two Open points lines are false. The doc also does not name the new files (`hooks/useModalDialog.ts`, `hooks/useFormError.ts`, `config/text.ts`, `config/layout.ts`, `components/shell/navLabels.ts`); `isLiveSession` is named, the rest only partly (pageRange and returnAddress are).
**Recommendation:** Replace the duplication paragraph with a pointer to the hook, delete the two Open points lines, and add the new files to the pattern that owns each. Lesson 002-3 applies to docs too: the "old copy" here is the prose.

### REFL-008: "A file named after each page" is no longer exact (trivial, small)

| Field | Value |
|---|---|
| File | `docs/frontend-patterns.md:363` (and the App.tsx comment "Every page is its own file") |
| Category | concept-drift |

**What:** The build now also has a shared chunk `useFormError-*.js` (used by both form pages), as the implementer noted. Pages are still lazy and separate, so the claim about not downloading the directory holds.
**Recommendation:** Reword to "each page has its own file, plus small shared chunks"; the check is "a file for each page exists", which is still true. Also tell the owner `scripts/_tmpfail.ts` is still present and should be deleted before commit.

## UI/UX findings

Written by: ui-reviewer (tier: balanced). Evidence: `ui-evidence/ui-*.png` (6 of ~60 shots kept; the rest are in the session scratchpad).

**Summary.** Tier: headless Chrome over its DevTools port, against a throwaway Vite config and mock API (no request went to port 3000; the dev server on 5320 and the production build, built into the scratchpad and served by `vite preview` on 5321). Seen against the mock: log in (empty, bad email, 401, 500, slow/triple-submit, success), sign-up (empty, short password, bad photo link, 409, 500, success), expired and garbage token, student at `/users`, phone menu, all 10 routes in both themes at 360, 640 (200% zoom of 1280), 320 and 1280. 0 critical, 0 major, 5 minor, 3 trivial. Contrast measured: all token pairs pass AA in both themes except dark `--edge` on `--sunken` at 2.87:1 (UI-005); a DOM scan of computed text colors on 6 screens x 2 themes found no failing text (only disabled buttons, which are exempt). The biggest one is UI-001: the header wraps to a 145px two-row bar from 768 to about 850px.

**Dispatch questions.** Focus ring on Tab: solid 3px `--focus` on every control kind on login, sign-up, shell (UI-006 for the header clip), nothing else. Contrast: UI-005. 200% zoom at 1280: no sideways scroll, no break (it becomes the phone layout); 200% of a 1536 screen is 768px, see UI-001. 360px: no sideways scroll on any page, both themes. Theme boot script: `data-theme=dark` and dark body color already at DOMContentLoaded on a hard reload, dev and production; junk saved value falls back to light; System follows the OS live; checked, nothing. Reduced motion: the CSS has no animation or transition at all, so nothing moves; checked, nothing. Production build: same results as dev; `/dev/components` is absent there (redirects to log in). Firefox: installed but its headless screenshot never produced a file, so not verified (owner). Screen-reader names: dialog "Delete this post?" modal with description; phone menu dialog "Menu" with "Close menu", nav "Main", pressed Light/Dark/System; toast is a polite status region present at load, toast has "Dismiss"; Pagination nav "Pages" with `aria-current="page"`; password button, see UI-003.

### UI-001: Header wraps to two rows between 768px and about 850px

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| Route / flow | any logged-in page at 768 to 850px (a tablet held upright, or 200% zoom of a 1536px laptop) |
| Lens | responsive |
| Evidence | `ui-evidence/ui-admin-768.png`; measured header height 145px at 768 and 800, 73px from 860 |

**What:** `Header.module.css:12-13` lets the header wrap by design. At 768 the links and the user block do not fit on one row, so the theme switch and user fall to a second row, left-aligned, and the bar is twice the 72px the README gives. **Why it matters:** the README states a 72px header; the second row looks accidental and pushes the band down. **Recommendation:** keep the wrap as a safety net, but move the phone-layout breakpoint up (about 900px) or hide the user name text between 768 and 900 so the bar stays one row.

### UI-002: Pagination drops keyboard focus on the first or last page

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| Route / flow | `/dev/components`, Pagination: activate Next until the last page |
| Lens | interaction-state |
| Evidence | scripted: focus on Next, activate it to reach the last page; `document.activeElement` becomes `BODY` |

**What:** `Pagination.tsx:80` and `:105` use native `disabled`, so the button that has focus becomes disabled and the browser sends focus to the page top. Same for Previous at page 1. **Why it matters:** a keyboard or screen-reader user clicking through pages loses their place at the very last step; Directory and Feed (parts 2 and 4) will inherit it. **Recommendation:** use `aria-disabled="true"` with a click guard (as `Button` already does for busy), or move focus to the current page button when the focused arrow becomes disabled.

### UI-003: Password Show/Hide button says its state twice

| Field | Value |
|---|---|
| Severity | minor |
| Effort | trivial |
| Route / flow | `/login` and `/signup`, password field |
| Lens | a11y |
| Evidence | accessibility tree: `button "Show password" pressed=false`, then `button "Hide password" pressed=true` |

**What:** `PasswordInput.tsx:56` sets `aria-pressed` while the visible and accessible name also flips between Show and Hide. **Why it matters:** a screen reader says "Hide password, toggle button, pressed", which reads as a contradiction (is it hidden or shown?). A toggle should keep one fixed name with `aria-pressed`, or change the name and drop `aria-pressed`. **Recommendation:** remove `aria-pressed` from this button; the name already says what the next press does.

### UI-004: Focus is left on the page top after a log in or sign-up

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| Route / flow | `/login` or `/signup` submit, then arrival at `/dashboard` |
| Lens | a11y |
| Evidence | after success `document.activeElement` is `BODY`; moving between pages with the header links does put focus on the new H1 |

**What:** the redirect from `PublicOnly` leaves focus on the body. Sign-up announces "Account created" through the toast; log in announces nothing. **Why it matters:** a screen-reader user hears no sign that log in worked, and keyboard focus restarts at the Skip link. In-app navigation already focuses the H1, so this is the one gap. **Recommendation:** run the same focus-the-H1 step after the first landing on a shell page.

### UI-005: Dark-theme `--edge` on `--sunken` is 2.87:1

| Field | Value |
|---|---|
| Severity | minor |
| Effort | trivial |
| Route / flow | hover state of inputs, checkbox, Table rows in dark theme |
| Lens | a11y |
| Evidence | computed from `tokens.css`: dark `--edge` #6B6A64 on `--sunken` #242422 = 2.87 (needs 3:1 for a control border); on `--ground` 3.45, on `--surface` 3.18 |

**What:** the 1.5px control border sits on `--sunken` when a field is hovered (`Field.module.css:64`) and on sunken table rows. **Why it matters:** just under the 3:1 non-text rule, hover only, and the README gave this value. **Recommendation:** lighten dark `--edge` by one step (about #74736C gives 3.2) in `tokens.css`, or tell the owner this is a known README deviation.

### UI-006: Focus ring on the header links is clipped at the top of the window

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | trivial |
| Route / flow | desktop header, Tab to Dashboard / Directory / Feed / Users |
| Lens | a11y |
| Evidence | `ui-evidence/ui-focus-dash-2.png` |

**What:** the links are 72px tall and flush with the top of the page, so the ring's top edge (3px plus 2px offset) falls outside the window. Three sides show. **Recommendation:** use `outline-offset` of 0 or a negative value on header links.

(2 more trivials not listed: the contact address on the log-in page breaks at its hyphen; the theme switch is the first Tab stop on log in and sign-up, before the form.)

**Not defects, checked:** double submit sends one request (aria-disabled busy button stays focusable); validation blocks submit and moves focus to the first bad field or the error banner; 401 and 500 show distinct banners; 409 shows a field error on Email; expired and unreadable tokens go to log in with "Your session has ended"; student sees No access at `/users`; phone menu traps focus, closes on Escape and on link choice, restores focus to Open menu, and closes if the window widens; dialog traps focus and Escape closes it; toasts auto-leave after 5s. At 640x320 the phone menu scrolls (Log out is below the fold but reachable).

**Left for the owner's manual checklist:** Firefox (and Safari) rendering; a real screen reader (NVDA/VoiceOver) pass on the dialog, phone menu and toast; a real mid-session 401 against the live API; the real network sign-up and log in; visual comparison to the pictures was by eye only.

**UI review tier:** headless (Chrome, DevTools protocol) - login, signup, 6 being-built pages, 404, no-access, `/dev/components`, phone menu, dialog, toast, pagination; dev and production build; ~60 screenshots; 0 critical / 0 major / 5 minor (plus 3 trivial).

### Round 2 re-review

Written by: ui-reviewer (tier: balanced). Tier used: headless Chrome over DevTools, plain Node. Against a throwaway Vite config and a mock API in the scratchpad (port 5330 dev, 5331 `vite preview`); the owner's port 3000 was never touched. Mock paths seen: POST /api/auth/login (200, 401, 500, slow), POST /api/users (201, 409, 500, slow), GET /api/users/:id, logout not exercised.

**Summary:** UI-001, UI-002, UI-004, UI-006 are fixed. No regression in the phone menu, dialog, log-in and sign-up forms, or the production build (no dev page chunk in the build). 0 critical / 0 major / 1 new minor (UI-007). The 10px name at 768px for an admin is acceptable: one row, the avatar stays, and the link still has its full accessible name; a tooltip would be nicer (UI-008, trivial).

| Check | Result |
|---|---|
| UI-001 header one row | Fixed. 73px high, one row, no page overflow, at 768/800/850/1280 for student (long name), admin (short and long name). Name box: student 74/106/156/192px; admin 10/42/79-92/79-192px. Font stays 14px (the box shrinks, not the text). Evidence: `ui-evidence/ui-r2-header-admin-long-768.png` |
| UI-002 pagination focus | Fixed. With the keyboard, Next to the last page and Previous to page 1 leave focus on the current page button (3-page and 25-page lists). Mid-list Next keeps focus on Next. |
| UI-004 focus after log in | Fixed for log in, log in via a return address (`/feed` gives h1 "Feed") and sign-up (h1 "Dashboard"). See UI-007 for the reload. |
| UI-006 focus ring | Fixed. Ring is whole inside the 72px link (offset -7px), the gold marker still shows under the current link (`ui-evidence/ui-r2-nav-focus-ring.png`); same outline in dark theme. |
| Phone menu, dialog | Both on `useModalDialog`: focus goes in, Tab stays in the menu, Escape closes and returns focus to Open menu, link choice and a wider window close it. Dialog: Cancel and Escape (single and double) close it and return focus to the opener. Tab past the last button reaches the browser's own controls, which is native modal behaviour, not a trap leak. |
| Forms | Empty submit focuses the first wrong field; 401, 500 and 409 messages unchanged; double submit sent one request each (log in and sign-up); busy button is aria-disabled and aria-busy. No console errors besides the expected 4xx/5xx network lines. Same results in the dev server and the production preview. |

### UI-007: A reload after log in puts focus on the page heading again

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| Route / flow | `/dashboard` after log in, then reload |
| Lens | a11y |
| Evidence | `history.state.usr` is still `{afterLogIn:true}`; after `Page.reload` the active element is the `h1` |

**What:** the log-in marker lives in the browser history entry, which survives a reload and Back/Forward. `AppShell` reads it at mount (`AppShell.tsx` `focusAfterLogIn`) and focuses the heading again, so a reload does not start at the top and the first Tab skips the skip link and header.
**Why it matters:** small, keyboard users only; no crash, no loop.
**Recommendation:** clear the marker once used (`navigate(location.pathname, {replace:true, state:null})` after the first focus), or accept it and note it in the checklist.

### UI-008: The shrunk header name has no tooltip (trivial)

At 768-800px with a long name the name reads "B." (or only the avatar). Optional: a `title={name}` on the link in `Header.tsx` `UserBlock`. UI-003 and UI-005 untouched, as agreed.

**Left for the owner's checklist (manual-checklist.md):** a real screen reader on the heading focus after log in and on pagination at the ends; header at 768px in Firefox/Safari with an admin who has a long name; the real log in and sign-up against the live API.

**UI review tier (round 2):** headless; 12 header cases, 2 pagination lists, log in, sign-up, phone menu, dialog on dev and production preview; 2 screenshots (`ui-r2-*.png`); 0 critical / 0 major / 1 minor (plus 1 trivial).
