# When an endpoint changes, change its shared request and response types in the same change ^L-REQ-fs-003-6

| Field | Value |
|---|---|
| ID | LESSON-REQ-fs-003-6 |
| Captured | 2026-10-07 |
| REQ | REQ-fs-003 |
| Component | `shared/types/`, `backend/src/api/controllers/` |
| Tags | shared-types, api, contract, controllers |
| Severity | guideline (a rule to follow) |
| Supersedes | — |

## The lesson

A change to what an endpoint accepts or answers is not done until the matching types in `@alumni/shared` say the same: the response type, and the request type too. Check each type against the controller field by field, including which fields are required and which allow `null`; matching names is not enough. Do the same for any convention page an accepted ADR has just settled.

## Saw it in

- `shared/types/posts.types.ts`, `comment.types.ts` — after the controllers changed, `CreatePostDTO` still required `user_id` and `UpdatePostDTO` forbade `null` (review finding M2).
- `shared/types/user.types.ts` — `CreateUserDTO.role` is optional while the controller answers 400 without it; no type existed for the update body (finding n1, a third round).
- `.adlc/context/conventions.md` — still said "not written down" for pagination and response format after ADR-11 and ADR-12 were accepted (finding m7).
