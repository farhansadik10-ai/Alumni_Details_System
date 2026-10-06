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
