# TASK-002 — API helpers pickSent, isAdmin, isSelf

| Field | Value |
|---|---|
| REQ | REQ-fs-002 |
| Tier | 0 |
| Status | complete |
| Repo | alumni-details-system |
| Depends on | — |
| Blocks | TASK-003, TASK-004, TASK-005, TASK-006 |

## Goal

The controllers share one way to read "which allowed fields were sent" and one way to ask "is the caller an admin / this user".

## Files to touch

| Path | Action |
|---|---|
| `backend/src/api/utils/requestHelpers.ts` | create |

## Approach

- `pickSent<K extends string>(body: unknown, keys: readonly K[]): Partial<Record<K, unknown>>` — returns a new object with each key from `keys` that is an own property of `body` with a value other than `undefined`. A missing or non-object body gives `{}`. `null` values are kept.
- `ADMIN_ROLE = "admin"`; `isAdmin(req: Request): boolean` — `req.user.role === ADMIN_ROLE`.
- `isSelf(req: Request, userId: unknown): boolean` — compares `Number(userId)` with `Number(req.user.sub)`; false when either is `NaN`, `null` or `undefined`.
- `isNonEmptyString(value: unknown): value is string`.
- `isStringOrNull(value: unknown): boolean` and `isIntegerOrNull(value: unknown): boolean` (`Number.isInteger`; a numeric string is not an integer).
- `findWrongType(fields, check): string | undefined` — returns the first key in `fields` whose value fails `check`, so a controller can answer 400 `{ error: "<key> has the wrong type" }`.

## Acceptance

- [x] `pickSent({ a: 1, b: undefined, c: null, z: 9 }, ["a","b","c"])` returns `{ a: 1, c: null }`
- [x] `pickSent(undefined, ["a"])` returns `{}`
- [x] `isSelf` is false for `NaN`, `null` and a different id
- [x] No controller is changed in this task
- [x] `npm run build` exits 0

## Notes

`req.user` is typed in `backend/src/api/types/express.d.ts` as `{ sub: number; role: string }`.

### Implementation notes (task-implementer, 2026-10-06)

Checked with a throwaway `tsx` script in the session scratch folder (not committed): 30 assertions, all passed, including the three acceptance cases. `npm run build` exited 0.

Choices the task text left open, all on the strict side:

- `isNonEmptyString` trims first, so `"   "` counts as empty. A blank email, password or comment is refused. If spaces-only must be allowed, change `value.trim().length` to `value.length`.
- `isSelf` accepts only a number or a non-blank string as an id. `""`, `true`, `[]` and objects are refused before `Number()` runs, because `Number("")`, `Number(null)` and `Number([])` are all 0.
- `pickSent` gives `{}` for an array body and ignores inherited keys such as `constructor`.
- `isAdmin` and `isSelf` read `req.user?.` so a route that forgot `authMiddleware` gets `false`, not a crash. The type says `req.user` is always there; at run time it is only there after `authMiddleware`.
- `findWrongType(fields, check)` takes one check for all the fields given. Alumni has two kinds (strings and `graduation_year`), so TASK-005 calls it twice: once on the string fields, once on `{ graduation_year }`.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-002-backend-security-data-loss-gaps/architecture]]
- Lessons checked: (none apply)
