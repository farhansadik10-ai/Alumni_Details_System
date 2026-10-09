# Hot Log

Append-only chronological log of significant events. One line per entry. Newest at the top.

**Committed and shared.** Only ever add entries — never rewrite or reorder old ones. Git is configured (`merge=union` via `.adlc/.gitattributes`) so that when two branches both add entries, it keeps both instead of raising a conflict — the team keeps one shared history with no merge pain. Only ever *append*; never rewrite or reorder existing lines (that defeats the union merge).

Grep-friendly format: `## [YYYY-MM-DD] kind | description` with optional metadata after.

```
## [2026-05-13] req-merged | REQ-042 added Firestore composite indexes for query path
## [2026-05-13] lesson | L-REQ-012-1 — declare composite indexes before deploy
## [2026-05-12] adr-accepted | ADR-003 chose direct SignalR client over BFF translation
## [2026-05-12] gotcha | G05 noted — Login.aspx URL-substring branching
```

## Entries

<!-- Newest entries below this line, newest first. Each entry is a level-2 heading. -->

## [2026-10-09] ship-gate-cleared | REQ-fs-007-frontend-users-about-polish-perf | wrap-up committed on the feature branch (no push); owner runs the merge checklist and the manual checklist

## [2026-10-09] req-ready-to-merge | REQ-fs-007-frontend-users-about-polish-perf | frontend part 4 (roadmap F9 rest, F10, F11): admin Users page, About page and footer link, phone audit and fixes, performance; 2 review rounds, 14 tasks, 11 commits; library check 565 cases

## [2026-10-09] lesson | L-REQ-fs-007-7 — when a spec or screen departs from words an accepted ADR fixes, write the deviation in the ADR at that gate

## [2026-10-09] lesson | L-REQ-fs-007-6 — memo only skips a row whose props are stable: count renders first

## [2026-10-09] lesson | L-REQ-fs-007-5 — a reserved picture box and hide-on-error must be decided together

## [2026-10-09] lesson | L-REQ-fs-007-4 — a delete can empty page one: reload from the store action

## [2026-10-09] lesson | L-REQ-fs-007-3 — one dialog for many rows: track the row, clear the flag on unmount

## [2026-10-09] lesson | L-REQ-fs-007-2 — re-read old review items against the code before carrying them

## [2026-10-09] lesson | L-REQ-fs-007-1 — measure build size one way and compare by group

## [2026-10-09] gotcha | G59 — throwaway checks outside the repo; G60 — phone UI traps from part 4; update lines on G50 and G54

## [2026-10-09] concept | address-as-state — "Shared hook" section added (useListAddress)

## [2026-10-09] adr-updated | ADR-06 (409 words) and ADR-10 (About content, version) deviation lines

## [2026-10-09] verify-gate-cleared | REQ-fs-007-frontend-users-about-polish-perf | findings: C0/M0/m4 (2 review rounds, fix all done; BeingBuilt.tsx deleted by owner yes; ADR-06 and ADR-10 deviation lines to be added at wrap-up)

## [2026-10-09] implement-gate-cleared | REQ-fs-007-frontend-users-about-polish-perf | 14 tasks done, 536 library cases, build and style pass; browser checks in headless Chrome against a mock API; broken post picture stays hidden (option A); one scratch file made and removed inside frontend/src by a task agent (rule slip, told to the owner)

## [2026-10-08] architect-gate-cleared | REQ-fs-007-frontend-users-about-polish-perf | 14 tasks, no ADR; owner approved: Directory moves to a shared useListAddress hook, post pictures in a fixed 4:3 box, no list reload after a delete; n2 skipped

## [2026-10-08] work-path-set | REQ-fs-007-frontend-users-about-polish-perf | branch at C:/Users/Lenovo/Alumni_Details_System (feat/REQ-fs-007-frontend-users-about-polish-perf, off redesign)

## [2026-10-08] spec-gate-cleared | REQ-fs-007-frontend-users-about-polish-perf | calls taken: 409 text names alumni profile too (A3), About for logged-in only (A5), no toast on unchanged save (A7)

## [2026-10-08] req-archived | REQ-fs-006-frontend-feed-and-dashboard

## [2026-10-08] req-merged | REQ-fs-006-frontend-feed-and-dashboard | merge commit b4c31a97 on redesign (the feature branch was deleted by the owner)

## [2026-10-08] ship-gate-cleared | REQ-fs-006-frontend-feed-and-dashboard | roadmap F8 Done and F9 in progress; root CLAUDE.md frontend line and conventions (G56) updated; owner runs the merge checklist

## [2026-10-08] req-ready-to-merge | REQ-fs-006-frontend-feed-and-dashboard | frontend part 3 (roadmap F8 and the Dashboard half of F9): feed, dashboard, Recent posts on the alumni profile, optional user_id filter on GET /api/posts; 3 review rounds, 14 tasks, 12 commits; library check 469 cases

## [2026-10-08] lesson | L-REQ-fs-006-5 — build a component so the dev page can show every state without copying it

## [2026-10-08] lesson | L-REQ-fs-006-4 — when a fix moves or removes a rule, grep the docs and header comments for the old wording

## [2026-10-08] lesson | L-REQ-fs-006-3 — a list total patched locally and also reloaded needs a log of the local changes

## [2026-10-08] lesson | L-REQ-fs-006-2 — an async answer may only change the state it was sent from, in every branch

## [2026-10-08] lesson | L-REQ-fs-006-1 — a guard that refuses before any call returns its own result kind, not a borrowed status

## [2026-10-08] lesson-updated | L-REQ-fs-002-3 — sixth sighting (REQ-fs-006)

## [2026-10-08] gotcha | G58 — small traps: Date.parse("1"), config/text.ts importing lib, saveFailureText folds 403 and 404

## [2026-10-08] gotcha | G57 — UI part traps from the feed: Button's aria-disabled, a:hover over a composed class, an unimported stylesheet, EmptyState in a Card

## [2026-10-08] gotcha | G56 — throwaway checks that import app code can load .env, reach the database or open a socket

## [2026-10-08] concept | aligned-load-more — first captured

## [2026-10-08] verify-gate-cleared | REQ-fs-006-frontend-feed-and-dashboard | findings: C0/M1/m7 open (M1 is a process decision for wrap-up); 16 fixes held over 3 review rounds; library check 469 cases

## [2026-10-08] implement-gate-cleared | REQ-fs-006-frontend-feed-and-dashboard | 14 tasks, build/style/library checks pass (434 cases); isWriter x4 and mentoring address x2 left for review; browser checks left to review

## [2026-10-08] tier-complete | REQ-fs-006 TASK-007, 008, 010, 011 and the owner-approved TASK-014 (lib/writeFailure.ts) done; build, style check and library check (434 cases) pass; TASK-009 and 012 next

## [2026-10-08] tier-complete | REQ-fs-006 tier 1 (TASK-005 store, TASK-006 shared components) done; build, style check and library check (420 cases) pass
## [2026-10-08] near-miss | REQ-fs-006 TASK-005 store check first loaded real axios and started one listPosts call per run; sockets and fetch were patched to throw first so nothing left the machine; harness fixed (CommonJS resolver hooked too)

## [2026-10-08] rule-break | REQ-fs-006 TASK-001 test script loaded the root .env through dotenv (printed DB_HOST/DB_NAME, not the password) and ran 4 read-only SELECTs on the local database; nothing written; owner chose to continue with tighter rules (no script may import backend code or load pg/dotenv)
## [2026-10-08] tier-complete | REQ-fs-006 tier 0 (TASK-001 to 004) done; build, style check and library check (420 cases) pass

## [2026-10-08] architect-gate-cleared | REQ-fs-006-frontend-feed-and-dashboard | 13 tasks in 5 stages, no ADR; stress-test 0 critical (ADV-001 accepted: other-user delete can hide a post in Load more); AC30 and the Postman example amended

## [2026-10-08] work-path-set | REQ-fs-006-frontend-feed-and-dashboard | branch at C:/Users/Lenovo/Alumni_Details_System (feat/REQ-fs-006-frontend-feed-and-dashboard, off redesign)

## [2026-10-08] spec-gate-cleared | REQ-fs-006-frontend-feed-and-dashboard | owner chose to add the user_id filter on GET /api/posts for profile Recent posts (AC26-28 stay)

## [2026-10-08] req-archived | REQ-fs-005-frontend-directory-and-profiles

## [2026-10-08] req-merged | REQ-fs-005-frontend-directory-and-profiles | merge commit ca693ce2 on redesign (the feature branch was deleted by the owner)

## [2026-10-08] ship-gate-cleared | REQ-fs-005-frontend-directory-and-profiles | roadmap F6 and F7 marked Done; root CLAUDE.md frontend line, docs/frontend-patterns.md (patterns 25 and 28, counts, open points) and the vault pages (frontend-app, design-system, project-overview) brought up to date

## [2026-10-08] req-ready-to-merge | REQ-fs-005-frontend-directory-and-profiles | frontend part 2 (roadmap F6 and F7): alumni directory, alumni profile, My profile; 2 review rounds of 5 reviewers; build, style check (11 rules) and library check (333 cases) pass; browser-checked on a mock API only, not yet against the real backend
## [2026-10-08] lesson | L-REQ-fs-005-5 — before the architecture says "no change needed" to a reused part, check it can carry everything the design asks
## [2026-10-08] lesson | L-REQ-fs-005-4 — a layer check must encode every sentence of the layer rule, and a rule moved into lib/ brings its cases
## [2026-10-08] lesson | L-REQ-fs-005-3 — build a mailto: or other link from stored text only after checking and encoding it
## [2026-10-08] lesson | L-REQ-fs-005-2 — state kept in a store atom outlives the page: clear it on close and never trust a matching key
## [2026-10-08] lesson | L-REQ-fs-005-1 — a "Save is off until something changed" button has three traps: the create case, focus, and Discard
## [2026-10-08] gotcha | G55 — library check traps: JSON-text compare, no type-check, and proving it can fail
## [2026-10-08] gotcha | G54 — work-tree files are CRLF: a scripted rewrite flips every line ending
## [2026-10-08] gotcha | G53 — form control traps: Button overwrites aria-disabled, and maxLength hides the message
## [2026-10-08] gotcha | G52 — CSS traps from the profile band: token order, Tag colour, composes order, first-child overlap
## [2026-10-08] gotcha | G51 — directory address traps: a repeated key and the spaces-only trim
## [2026-10-08] gotcha-status | G38, G42, G47, G50 got update lines (comments rewritten, email now shown on the profile page, axios error test, headless Chrome tab)
## [2026-10-08] concept | address-as-state, latest-request-wins — first captured

## [2026-10-08] verify-gate-cleared | REQ-fs-005-frontend-directory-and-profiles | findings: C0/M1/m15 open (M1 is a stale vault page, decided at wrapup); 2 review rounds, 5 reviewers each; fix rounds resolved the bugs and the regression found in round 2; library check 333 cases

## [2026-10-08] implement-gate-cleared | REQ-fs-005-frontend-directory-and-profiles | 15 tasks done (14 planned plus a cleanup task); build, style check and library check (282 cases) pass; browser review on a mock API only (the real backend on port 3000 was never called); 5 findings go to review

## [2026-10-08] architect-gate-cleared | REQ-fs-005-frontend-directory-and-profiles | 14 tasks in 5 stages, no ADR; stress test found 0 critical, 3 major, 5 minor, all fixed in the plan; 7 small deviations accepted by the owner

## [2026-10-08] work-path-set | REQ-fs-005-frontend-directory-and-profiles | branch at C:/Users/Lenovo/Alumni_Details_System (feat/REQ-fs-005-frontend-directory-and-profiles, off redesign); the only uncommitted files were this REQ's own vault records

## [2026-10-08] spec-gate-cleared | REQ-fs-005-frontend-directory-and-profiles | roadmap F6 and F7 (request said F6 to F8; F8 is the feed, left out); 52 criteria, 25 standard choices listed in the spec

## [2026-10-07] req-archived | REQ-fs-004-frontend-foundation-shell-auth

## [2026-10-07] req-merged | REQ-fs-004-frontend-foundation-shell-auth | merge commit 3f636a36 on redesign

## [2026-10-07] ship-gate-cleared | REQ-fs-004-frontend-foundation-shell-auth | roadmap F1 to F5 marked done; root CLAUDE.md frontend lines and the patterns doc updated; frontend/README.md, the stale comments in shared/types/user.types.ts and conventions.md Comments left for the owner

## [2026-10-07] req-ready-to-merge | REQ-fs-004-frontend-foundation-shell-auth | new frontend part 1 of 4 (roadmap F1 to F5): foundation, tokens and theme, base components, app shell, log in and sign-up; legacy Ant Design app deleted; run in a browser against a mock API only, not yet against the real backend
## [2026-10-07] lesson | L-REQ-fs-004-7 — when a REQ deletes a module, close every mention of it in the same REQ
## [2026-10-07] lesson | L-REQ-fs-004-6 — a check that reads only tracked files, or only the output, can pass for the wrong reason
## [2026-10-07] lesson | L-REQ-fs-004-5 — before any browser check, find out what listens on the API port
## [2026-10-07] lesson | L-REQ-fs-004-4 — check keyboard focus with a real Tab key, on every background, at the ends of a list
## [2026-10-07] lesson | L-REQ-fs-004-3 — separate flags for "a 401 is not a session end" and "send no token"; a time limit on a call whose failure is the only exit
## [2026-10-07] lesson | L-REQ-fs-004-2 — a rule several guards must agree on lives in one function in lib/
## [2026-10-07] lesson | L-REQ-fs-004-1 — router state is not one-shot: it survives a reload
## [2026-10-07] lesson-recurred | L-REQ-fs-002-3 — small copies left beside new shared code, fourth sighting (dialog logic, form constants, session test)
## [2026-10-07] gotcha | G43 to G50 — index.html placeholders and the twice-written theme rule; style-check traps; native dialog; table and fieldset; API client; store; shell; headless Chrome
## [2026-10-07] gotcha-status | G34, G38 updated: the legacy frontend is deleted (REQ-fs-004)
## [2026-10-07] adr-updated | ADR-07 antd removed whole in REQ-fs-004; ADR-13 and ADR-14 already accepted at the design gate
## [2026-10-07] concept | frontend-session-flow — first captured
## [2026-10-07] component | frontend-app — rewritten for REQ-fs-004
## [2026-10-07] design-system | component paths, token file, token names, phone breakpoint 768px, font, z-index, theme key filled in from what REQ-fs-004 built; one exception recorded (sizes snapped to the README scale)

## [2026-10-07] verify-gate-cleared | REQ-fs-004-frontend-foundation-shell-auth | findings: C0/M0/m12 open after round 2 (16 fixed in round 1: both majors); 8 left for the owner (m2, m5, m13, m15, m16, m17, m18, t3), 7 small new ones carried to wrap-up (n1 to n5, t5, t6)
## [2026-10-07] verify-round | REQ-fs-004-frontend-foundation-shell-auth | round 2: all five reviewers re-ran on sonnet; the 16 fixes hold; 7 new small findings
## [2026-10-07] verified | REQ-fs-004-frontend-foundation-shell-auth | build, style check (10 rules) and library check (108 of 108) pass; UI seen in headless Chrome on a mock API (dev and production build); nothing sent to port 3000; real backend, real screen reader and Firefox/Safari left to the owner's checklist

## [2026-10-07] implement-gate-cleared | REQ-fs-004-frontend-foundation-shell-auth | 11 tasks done; build, style check and library check (72 cases) pass; owner checked log in, sign-up, theme, shell and phone menu in a browser; 11 decide items open in check-notes.md

## [2026-10-07] architect-gate-cleared | REQ-fs-004-frontend-foundation-shell-auth | 11 tasks in 7 tiers; stress-test 0 critical, 1 major, 3 minor (all fixed); owner approved the legacy delete list and snapping picture sizes to the README scale
## [2026-10-07] adr-accepted | ADR-14 the session token and the theme choice are kept in the browser's localStorage
## [2026-10-07] adr-accepted | ADR-13 frontend structure: four layers, CSS Modules on one token file, own icons, self-hosted font
## [2026-10-07] component | frontend-app — stub created

## [2026-10-07] work-path-set | REQ-fs-004-frontend-foundation-shell-auth | branch at C:/Users/Lenovo/Alumni_Details_System (feat/REQ-fs-004-frontend-foundation-shell-auth, off redesign)

## [2026-10-07] spec-gate-cleared | REQ-fs-004-frontend-foundation-shell-auth | 65 criteria in 7 parts (roadmap F1 to F5); owner chose: remove all legacy frontend code now, sign-up logs the user in, contact email is a placeholder

## [2026-10-07] req-archived | REQ-fs-003-finish-backend-api
## [2026-10-07] req-merged | REQ-fs-003-finish-backend-api | merge commit ce5cb8ff on redesign

## [2026-10-07] ship-gate-cleared | REQ-fs-003-finish-backend-api | roadmap B3, B3a, B4, B5 marked done; root CLAUDE.md auth and api lines updated; G42 (who may see an alumni email) left open by the owner

## [2026-10-07] req-ready-to-merge | REQ-fs-003-finish-backend-api | class controllers and one error middleware, two alumni columns, search and paged lists, stats, feed data with authors and counted comments, deletes that take replies; run against the real database by the owner
## [2026-10-07] lesson | L-REQ-fs-003-7 — plan a tighter helper signature in the same task as its callers
## [2026-10-07] lesson | L-REQ-fs-003-6 — when an endpoint changes, change its shared request and response types in the same change
## [2026-10-07] lesson | L-REQ-fs-003-5 — never log a whole database error: its detail can hold the failing row
## [2026-10-07] lesson | L-REQ-fs-003-4 — a check must be able to fail: build the case the code could get wrong
## [2026-10-07] lesson | L-REQ-fs-003-3 — one resource, one answer shape: every write and read through the same joined query
## [2026-10-07] lesson | L-REQ-fs-003-2 — when the code cannot be run here, run its pure expressions alone
## [2026-10-07] lesson | L-REQ-fs-003-1 — write the API check from the spec and the schema, not from the code
## [2026-10-07] lesson-recurred | L-REQ-fs-002-3 — small copies left beside new helpers, seen again twice in REQ-fs-003
## [2026-10-07] gotcha | G42 — not decided: every logged-in user can read every alumni's email; a user with no role still gets a token
## [2026-10-07] gotcha | G41 — a DTO built with new carries made-up timestamps; logout answers an empty 200
## [2026-10-07] gotcha | G40 — importing @alumni/businesslogic or the app connects to the database
## [2026-10-07] gotcha | G39 — list order and filter rules differ per endpoint
## [2026-10-07] gotcha | G38 — the compiled .js / .d.ts files in shared/ are older than the .ts sources
## [2026-10-07] gotcha | G37 — duplicate alumni profiles made before the lock are still there; /me returns the lowest id
## [2026-10-07] gotcha | G36 — fixed paths must be registered above /:id in a router
## [2026-10-07] gotcha | G35 — checkFields passes on only the keys that have a rule, and always says "has the wrong type"
## [2026-10-07] gotcha-status | G08, G13, G16, G24, G25, G26, G27, G29, G31, G34 fixed; G11 closed (count worked out when read); G32 partly fixed; G30 still open with more copies (REQ-fs-003)
## [2026-10-07] adr-updated | ADR-03, ADR-05, ADR-06, ADR-08, ADR-11, ADR-12 — what REQ-fs-003 built; ADR-06 and ADR-11 wording brought in line with the code
## [2026-10-07] concept | paged-list-query — first captured
## [2026-10-07] component | api-controllers-and-routes, dal-query-classes — rewritten for REQ-fs-003; records where each rule lives (owner's decision on M3)

## [2026-10-07] verify-gate-cleared | REQ-fs-003-finish-backend-api | findings: C0/M0/m4 open after round 3 (12 fixed; M3 decided: record, no code change); owner reports both scripts pass on the final code
## [2026-10-07] verify-round | REQ-fs-003-finish-backend-api | round 3: n1, n2, n4, m6 fixed and re-checked
## [2026-10-07] verify-round | REQ-fs-003-finish-backend-api | round 2: M1, M2, M4, m2, m3, m5 fixed and re-checked; 4 new minors

## [2026-10-07] verified | REQ-fs-003-finish-backend-api | owner ran against the real database, round 2: own script 91 of 91 passed (14 admin checks); scripts/api-check.mjs with the admin account 0 failed

## [2026-10-07] implement-gate-cleared | REQ-fs-003-finish-backend-api | 12 tasks done, build passes; owner ran his own script and scripts/api-check.mjs against the real database, both pass after round 2; owner decided: comment body key is posts_id, a new comment needs content

## [2026-10-06] architect-gate-cleared | REQ-fs-003-finish-backend-api | 12 tasks in 4 tiers; stress-test 0 critical, 2 major, 7 minor (8 fixed, 1 accepted)
## [2026-10-06] adr-accepted | ADR-12 list endpoints answer { items, total, page, limit }
## [2026-10-06] adr-accepted | ADR-11 code throws typed errors; one middleware turns them into { error }

## [2026-10-06] work-path-set | REQ-fs-003-finish-backend-api | branch at C:/Users/Lenovo/Alumni_Details_System (feat/REQ-fs-003-finish-backend-api, off redesign)

## [2026-10-06] spec-gate-cleared | REQ-fs-003-finish-backend-api | 38 criteria in 4 parts (roadmap B3, B3a, B4, B5); owner kept 404 on empty lookups, 409 on a second alumni profile, alumni list newest first

## [2026-10-06] req-archived | REQ-fs-002-backend-security-data-loss-gaps
## [2026-10-06] req-merged | REQ-fs-002-backend-security-data-loss-gaps | merge commit a2d805e0 on redesign

## [2026-10-06] verified | REQ-fs-002-backend-security-data-loss-gaps | owner ran 39 checks against the real database, twice (before review and after round 2): 39 passed; admin paths and deleting a user not tested
## [2026-10-06] gotcha-status | G01, G02, G09, G10, G14, G17, G20, G22 confirmed fixed; G18, G19, G21, G23 confirmed for non-admin paths, admin path still needs verification

## [2026-10-06] ship-gate-cleared | REQ-fs-002-backend-security-data-loss-gaps

## [2026-10-06] req-ready-to-merge | REQ-fs-002-backend-security-data-loss-gaps | partial updates, no password in responses, sign-up roles, owner checks, author from token, login-stamp route removed; manual database check still to run
## [2026-10-06] lesson | L-REQ-fs-002-4 — refuse null and empty values before turning an id into a number
## [2026-10-06] lesson | L-REQ-fs-002-3 — when a change adds a shared helper, convert every existing inline copy
## [2026-10-06] lesson | L-REQ-fs-002-2 — a secret column is kept out of responses by the SQL column list, not by a type
## [2026-10-06] lesson | L-REQ-fs-002-1 — type a Query method that returns rows[0] as row or undefined
## [2026-10-06] gotcha | G34 — raw database messages still reach the client on bad ids and duplicate emails
## [2026-10-06] gotcha | G33 — there is no GET /api/posts/:id route
## [2026-10-06] gotcha | G32 — an alumni profile belongs to whoever created it; a second one is not stopped
## [2026-10-06] gotcha | G31 — DTO types do not allow null, but the database sends it and updates accept it
## [2026-10-06] gotcha | G30 — each update allowed-field list is written twice
## [2026-10-06] gotcha | G29 — error responses use two keys: error and message
## [2026-10-06] gotcha | G28 — npm run build does not compile a DAL file that nothing imports
## [2026-10-06] gotcha-status | G02, G09, G10, G14, G15, G17–G23 fixed; G27 partly fixed (REQ-fs-002) — needs verification until the manual check
## [2026-10-06] concept | partial-update-sent-fields — first captured
## [2026-10-06] component | api-controllers-and-routes — first captured
## [2026-10-06] verify-round | REQ-fs-002-backend-security-data-loss-gaps | round 2: m1, m2, m5, t1 fixed and re-checked

## [2026-10-06] verify-gate-cleared | REQ-fs-002-backend-security-data-loss-gaps | findings: C0/M2/m5 open after round 2 (m1, m2, m5, t1 fixed); both majors are vault updates for wrap-up

## [2026-10-06] implement-gate-cleared | REQ-fs-002-backend-security-data-loss-gaps | 7 tasks done, build passes; AC1-AC24 wait for the owner's manual checklist; spaces-only values count as empty

## [2026-10-06] architect-gate-cleared | REQ-fs-002-backend-security-data-loss-gaps | 7 tasks, no ADR; owner chose 403 before 404 on PUT /api/users/:id and 400 for an empty update

## [2026-10-06] work-path-set | REQ-fs-002-backend-security-data-loss-gaps | branch at C:/Users/Lenovo/Alumni_Details_System (feat/REQ-fs-002-backend-security-data-loss-gaps, off redesign)

## [2026-10-06] spec-gate-cleared | REQ-fs-002-backend-security-data-loss-gaps | owner added post-edit owner check (G21), alumni user_id from token, logout owner check; login route to be removed

## [2026-10-06] docs-aligned | docs/design/README.md (About link, forgot-password line) and root CLAUDE.md (no UI library) now match ADR-07 and ADR-10

## [2026-10-06] design-system | remaining questions answered by the owner; anything still open is "decide in the REQ that builds it"
## [2026-10-06] adr-updated | ADR-10 footer About link not rendered until the page exists; About content set; log-in page shows "Forgot your password? Contact the alumni office."
## [2026-10-06] adr-updated | ADR-09 the app-name config file also holds one contact email for the alumni office
## [2026-10-06] adr-updated | ADR-08 Field is free text; Field, Department and Graduation year filters list distinct non-empty values, A to Z

## [2026-10-06] design-system | open items filled by the owner: skeleton loading, hover colors, Small and Caption weight 400, contrast checked, no UI library
## [2026-10-06] adr-updated | ADR-09 wording is "one constant" (a single exported constant in one config file); file renamed to adr-09-white-label-app-name-from-one-constant
## [2026-10-06] adr-updated | ADR-08 column names final: mentorship_available (boolean, default false), field (text, nullable); owner runs the migration in a later REQ
## [2026-10-06] adr-updated | ADR-07 records the three directions drawn (Fjord, Academy, Oak) and "no UI library"

## [2026-10-06] adr-accepted | ADR-10 About page built last; Privacy page and password reset are later work
## [2026-10-06] adr-accepted | ADR-09 white-label app name "University Alumni" from one config value
## [2026-10-06] adr-accepted | ADR-08 mentoring and field stay; alumni gets mentorship_available (boolean) and field (text)
## [2026-10-06] adr-accepted | ADR-07 design direction "Oak, ink band" with light, dark and system themes
## [2026-10-06] design-system | context/design-system.md written from docs/design/README.md (status: agreed)
## [2026-10-06] design-approved | "Oak, ink band" approved by the owner; docs/design/ added (README.md + 15 screens)

## [2026-10-05] req-archived | REQ-fs-001-fix-alumni-comment-queries
## [2026-10-05] req-merged | REQ-fs-001-fix-alumni-comment-queries | merge commit 2f51e18f on redesign
## [2026-10-05] ship-gate-cleared | REQ-fs-001-fix-alumni-comment-queries
## [2026-10-05] req-ready-to-merge | REQ-fs-001-fix-alumni-comment-queries | AlumniQuery and CommentQuery SQL match db/schema.md; graduation_year; alumni reads join "User"
## [2026-10-05] lesson | L-REQ-fs-001-4 — before adding joined columns to a read, check whether the method logs its rows
## [2026-10-05] lesson | L-REQ-fs-001-3 — after renaming a DTO field, check every req.body pass-through
## [2026-10-05] lesson | L-REQ-fs-001-2 — before fixing code that never ran, list what it was hiding
## [2026-10-05] lesson | L-REQ-fs-001-1 — a passing build says nothing about SQL strings
## [2026-10-05] gotcha | G27 — updating or deleting a row that does not exist reports success
## [2026-10-05] gotcha | G26 — getAllAlumni returns rows in no fixed order
## [2026-10-05] gotcha | G25 — alumni reads and alumni writes return different shapes
## [2026-10-05] gotcha-status | G01, G03–G07, G12 fixed; G02 partly fixed; G19 and G23 now live (REQ-fs-001)
## [2026-10-05] concept | user-join-read-shape — first captured
## [2026-10-05] verify-gate-cleared | REQ-fs-001-fix-alumni-comment-queries | findings: C0/M0/m7
## [2026-10-05] implement-gate-cleared | REQ-fs-001-fix-alumni-comment-queries | 3 tasks done, build passes; console.log removed from getAllAlumni by owner decision
## [2026-10-05] architect-gate-cleared | REQ-fs-001-fix-alumni-comment-queries | 3 tasks, no ADR; owner chose LEFT JOIN and optional fields on AlumniDTO
## [2026-10-05] work-path-set | REQ-fs-001-fix-alumni-comment-queries | branch at C:/Users/Lenovo/Alumni_Details_System (feat/REQ-fs-001-fix-alumni-comment-queries, off redesign)
## [2026-10-05] spec-gate-cleared | REQ-fs-001-fix-alumni-comment-queries | owner checks (G19, G23) and updateAlumni NULL overwrite (G02) left out by owner decision

## [2026-10-05] vault-cleanup | AI-DLC bolt plan retired; AIdlc/ deleted; frontend to be rebuilt from scratch (Scandinavian design, no Ant Design); bolt table, bolt protocol, antd theme/UI rules and Q1 removed from context/
## [2026-10-05] gotcha | G01–G24 — SQL problems and backend hardening L.1–L.15, carried over from the retired plan
## [2026-10-05] adr-accepted | ADR-06 deleting rows that other rows reference (retired plan Q7, decided 2026-10-03)
## [2026-10-05] adr-accepted | ADR-05 GET /api/posts returns author name and photo (retired plan Q6, decided 2026-10-02)
## [2026-10-05] adr-accepted | ADR-04 profile photo is a URL field (retired plan Q5, decided 2026-10-02)
## [2026-10-05] adr-accepted | ADR-03 one alumni profile per user, created by that user (retired plan Q4, decided 2026-10-02)
## [2026-10-05] adr-accepted | ADR-02 admin deletes any post, edits only own (retired plan Q3, decided 2026-10-02)
## [2026-10-05] adr-accepted | ADR-01 sign-up role is student or alumni (retired plan Q2, decided 2026-10-02)

## [2026-10-05] config | git.mode=commit

## [2026-10-05] init-import | frontend/eslint.config.js → context/conventions.md
## [2026-10-05] init-import | tsconfig.json + frontend/tsconfig.app.json → context/conventions.md
## [2026-10-05] init-import | AIdlc/plan.md → context/conventions.md
## [2026-10-05] init-import | AIdlc/plan.md → context/project-overview.md
## [2026-10-05] init-import | CLAUDE.md → context/conventions.md
## [2026-10-05] init-import | CLAUDE.md → context/architecture.md
## [2026-10-05] init-import | CLAUDE.md → context/project-overview.md
## [2026-10-05] init-import | README.md → context/project-overview.md (folder tree only; nothing usable)
## [2026-10-05] init | Vault initialized
