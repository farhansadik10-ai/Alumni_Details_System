# TASK-004 — Services and the profile address helper

| Field | Value |
|---|---|
| REQ | REQ-fs-005 |
| Tier | 0 |
| Status | pending |
| Repo | alumni-details-system |
| Depends on | none |
| Blocks | TASK-005 |

## Goal

Every endpoint these pages use is one thin function in `services/`, a cancelled call can be told apart from a failed one, and the profile address is built in one place (AC37, AC10, choice 25).

## Files to touch

| Path | Action |
|---|---|
| `frontend/src/services/alumniService.ts` | create |
| `frontend/src/services/userService.ts` | edit |
| `frontend/src/services/apiError.ts` | edit |
| `frontend/src/routes/paths.ts` | edit |

## Approach

- `alumniService.ts`, relative `/api/alumni` paths, types from `@alumni/shared`: `listAlumni(params, signal?)` → `Paged<Alumni>`; `getAlumniFilters(signal?)` → `AlumniFilters`; `getMyAlumni()` → `Alumni`; `getAlumni(id, signal?)` → `Alumni`; `createAlumni(body: CreateAlumniDTO)` → `Alumni`; `updateAlumni(id, body: UpdateAlumniDTO)` → `Alumni`. The `signal` goes straight to axios; `apiClient.ts` is not edited. A 200 that is not the API's shape is a known trap (G47): follow what `getUser` does today.
- `userService.ts`: `updateUser(id, body: UpdateUserDTO)` → `PublicUser` via `PUT /api/users/:id`.
- `apiError.ts`: `isCancelled(error: unknown): boolean` using `axios.isCancel`. `toApiFailure` is unchanged; the store checks `isCancelled` first.
- `paths.ts`: `alumniProfilePath(id: number): string` built with `generatePath(PATHS.alumniProfile, …)`; `PATHS` is unchanged. Rule i of the style check still passes.

## Acceptance

- [ ] No page or component imports `services/` (rule d)
- [ ] `isCancelled` is true for an aborted call and false for a 500
- [ ] `alumniProfilePath(7)` is `/directory/7`
- [ ] `npm run build` exits 0, `node scripts/frontend-style-check.mjs` exits 0

## Notes

Rules for every task of this REQ: see TASK-001. `GET /api/alumni/filters` and `/me` must stay above `/:id` on the server (G36): the service only calls them, it does not change that. A one-line check of `isCancelled` may go into the library check only if it needs no network; otherwise cover it in the browser review.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-005-frontend-directory-and-profiles/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-004-3-401-flag-token-header-timeout|L-REQ-fs-004-3]]; gotchas G36, G47
