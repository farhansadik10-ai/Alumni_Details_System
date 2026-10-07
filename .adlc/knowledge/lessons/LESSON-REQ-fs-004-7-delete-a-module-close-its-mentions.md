# When a REQ deletes a module, close every mention of it in the same REQ ^L-REQ-fs-004-7

| Field | Value |
|---|---|
| ID | LESSON-REQ-fs-004-7 |
| Captured | 2026-10-07 |
| REQ | REQ-fs-004 |
| Component | `shared/types/user.types.ts`, vault gotchas and ADRs, root `CLAUDE.md` |
| Tags | vault, legacy, cleanup, docs |
| Severity | guideline (a rule to follow) |
| Supersedes | — |

## The lesson

After removing a whole old module (here the Ant Design frontend), grep the code, the shared types, the vault and the docs for "legacy", "kept for" and the module's name, and settle each hit in that REQ: reword it, or write down why it stays. The words outlive the code and later REQs build on a false statement.

## Saw it in

- `shared/types/user.types.ts` lines 1, 16, 32 (`User`, `CreateUserDTO` "kept for the legacy frontend"), G34, G38, ADR-07 (lines 49, 65), root `CLAUDE.md` lines 46 and 74 — all still said the legacy frontend exists after REQ-fs-004 deleted it (REFL-003; the vault and doc lines are fixed at wrap-up; the shared types comments are shared code and wait for the owner).

