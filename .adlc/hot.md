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
