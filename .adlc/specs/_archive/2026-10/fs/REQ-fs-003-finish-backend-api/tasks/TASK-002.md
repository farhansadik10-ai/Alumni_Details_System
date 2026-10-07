# TASK-002 — DAL helpers: database error kinds, transaction, list helpers, update input type

| Field | Value |
|---|---|
| REQ | REQ-fs-003 |
| Tier | 0 |
| Status | implemented (one Approach line open, see Notes) |
| Repo | alumni-details-system |
| Depends on | — |
| Blocks | TASK-004, TASK-005, TASK-006, TASK-007 |

## Goal

The DAL offers four small building blocks the later tasks share, exported from `dal/index.ts`.

## Files to touch

| Path | Action |
|---|---|
| `backend/src/dal/errors.ts` | create |
| `backend/src/dal/query/transaction.ts` | create |
| `backend/src/dal/query/listHelpers.ts` | create |
| `backend/src/dal/query/updateSet.ts` | edit |
| `backend/src/dal/index.ts` | edit |

## Approach

- **`errors.ts`.**
  ```ts
  export type DbErrorKind = "unique" | "foreign_key" | "not_null" | "bad_value";
  export interface DbErrorInfo { kind: DbErrorKind; constraint?: string }
  export function classifyDbError(err: unknown): DbErrorInfo | undefined
  ```
  Reads only `code` (a five-character string) and `constraint` from the error object: `23505` → `unique`, `23503` → `foreign_key`, `23502` → `not_null`, any other code starting `23` or `22` → `bad_value`; everything else (and anything that is not an object with a string `code`) → `undefined`. Named constants for the codes. It never returns the error's message.
- **`query/transaction.ts`** (in `query/` because it holds SQL text: `BEGIN`, `COMMIT`, `ROLLBACK`; AC35). `export async function withTransaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T>`: `pool.connect()`, `BEGIN`, run `work`, `COMMIT`; on a throw `ROLLBACK` then rethrow; always `client.release()` in `finally`.
- **`query/listHelpers.ts`.**
  ```ts
  export interface PageRequest { limit: number; offset: number }
  export interface PageRows<T> { rows: T[]; total: number }
  export function likePattern(text: string): string
  ```
  `likePattern` escapes `\`, `%` and `_` with a backslash and wraps the result in `%…%`. The SQL that uses it writes plain `ILIKE $n` with **no `ESCAPE` clause**: backslash is already PostgreSQL's default escape for `LIKE`, and an `ESCAPE` clause with a backslash typed inside a JavaScript template string loses the backslash and breaks the statement. Say this in a comment on the function.
- **`updateSet.ts`.** Add `export type UpdateValue = string | number | boolean | null;` and `export type UpdateFields<K extends string = string> = Partial<Record<K, UpdateValue>>;`. Change `buildUpdateSet`'s first parameter to `UpdateFields`. Behaviour is unchanged.
- **`index.ts`.** Export `classifyDbError` and its types, `withTransaction`, the list helper types, and `UpdateFields` / `UpdateValue`. Keep the `.js` suffix style this file already uses.

## Acceptance

- [ ] `npx tsc --noEmit -p backend/src/dal` passes
- [ ] `classifyDbError` has no code path that returns or logs `err.message`
- [ ] `withTransaction` releases the client on success and on failure, and rolls back on failure
- [ ] `likePattern("50%_a\\b")` would give `%50\%\_a\\b%` (check by reading the code)
- [ ] No existing Query file is edited in this task

## Notes

- `db.ts` must not be edited and `.env` must not be read. Import `pool` the way the Query files do.
- A new DAL file that nothing imports is not compiled by `npm run build` (G28): prove this task with the `tsc` command above.
- Import suffix: follow the neighbouring file in the same folder.

### Implementation notes (task-implementer, 2026-10-06)

- **Not done, on purpose: `buildUpdateSet`'s first parameter is still `Record<string, unknown>`.** The Approach says to change it to `UpdateFields`. Tried it: `tsc -p backend/src/dal` then fails in three files this task may not edit — `AlumniQuery.ts:56` (`Partial<AlumniDTO>`; `created_at: Date` does not fit `UpdateValue`), `PostQuery.ts:50` and `UserQuery.ts:81` (both pass `Record<string, unknown>`). The Approach line, "No existing Query file is edited" and "`tsc` passes" cannot all hold. `UpdateValue` and `UpdateFields` are added and exported; the parameter was put back so the tier stays green.
- **Who finishes it:** the one-line change (`data: UpdateFields`) has to land together with the caller changes in TASK-005 (`updateUser`), TASK-006 (`updateAlumni`) and TASK-007 (`updatePost`). Those three run in parallel and none of them names `updateSet.ts`, so the orchestrator must give the line to one of them, or to a small step after all three. Until then the helper accepts any value type, as it did before this REQ.
- `withTransaction`: when `ROLLBACK` itself fails, the first error is still the one thrown, and the client is released with `release(true)` so the pool closes that connection instead of reusing it. Not asked for by the task; it is the only safe answer to a failed rollback.
- `classifyDbError` also returns `undefined` for a `code` that is not exactly five characters, so a Node system error code such as `ECONNREFUSED` or `22` on some other error object is never read as a database kind.
- Checks run: `npx tsc --noEmit -p backend/src/dal` exit 0; `npx tsc --noEmit -p backend/src/api` exit 0 (run while TASK-001 and TASK-003 were in progress). `likePattern("50%_a\\b")` read by hand: the regex `/[\\%_]/g` with replacement `"\\$&"` puts one backslash before each of `\`, `%`, `_`, giving `%50\%\_a\\b%`. Nothing was executed, because running would import `db.ts`.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-003-finish-backend-api/architecture]]
- Lessons checked: LESSON-REQ-fs-001-1
