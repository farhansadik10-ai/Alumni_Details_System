# TASK-001 — DAL helper buildUpdateSet

| Field | Value |
|---|---|
| REQ | REQ-fs-002 |
| Tier | 0 |
| Status | complete |
| Repo | alumni-details-system |
| Depends on | — |
| Blocks | TASK-003, TASK-004, TASK-005 |

## Goal

One function in the DAL turns "the fields that were sent" into a parameterized `SET` list, using a fixed column list.

## Files to touch

| Path | Action |
|---|---|
| `backend/src/dal/query/updateSet.ts` | create |

## Approach

- Export `buildUpdateSet(data: Record<string, unknown>, columns: readonly string[]): { assignments: string[]; values: unknown[] }`.
- Loop over `columns` (never over the keys of `data`). For each column where `data[column] !== undefined`, push the text `<column> = $<n>` (n = `values.length + 1`) and push the value. `null` is a value and is kept.
- No import from `pg`. The caller adds `updated_at = NOW()`, `WHERE` and `RETURNING`, and binds the id as the next parameter.
- Not exported from `dal/index.ts`: it is internal to the Query classes.

## Acceptance

- [x] `buildUpdateSet({}, ["a","b"])` returns empty `assignments` and `values`
- [x] `buildUpdateSet({ b: null, x: 1 }, ["a","b"])` returns `["b = $1"]` and `[null]` — `x` is ignored, `a` is absent
- [x] A key in `data` that is not in `columns` can never appear in `assignments`
- [x] `npm run build` exits 0

## Notes

Implementation notes (task-implementer, 2026-10-06):

- `npm run build` exited 0, but it does not compile `updateSet.ts` yet: the API `tsconfig.json` includes only `backend/src/api`, and no file imports the helper until TASK-003 to TASK-005. So the file was also type-checked on its own (`tsc --noEmit --strict`, exit 0).
- The first three acceptance lines were run with a throwaway `tsx` script in the session scratch folder (not in the repo): empty data, `null` kept, `undefined` skipped, both columns sent in reverse key order (output follows `columns` order), and a hostile key name. All five passed.
- The return type is also exported as the interface `UpdateSet`, so a Query class can name it. Same shape as the task's signature.
- The check is `data[column] !== undefined`, as the task says. It reads inherited properties too, so a column list must never hold a name like `constructor` or `toString`. No real column has such a name.

Import style inside `dal/query/` is mixed (`../config/db.js` in two files, `../config/db` in two). Each importing file keeps its own style.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-002-backend-security-data-loss-gaps/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-001-1]]
