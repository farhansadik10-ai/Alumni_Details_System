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
