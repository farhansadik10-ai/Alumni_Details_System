# TASK-005 — Words, address, role words, user service

| Field | Value |
|---|---|
| REQ | REQ-fs-007 |
| Tier | 0 |
| Status | pending |
| Repo | alumni-details-system |
| Depends on | TASK-001 |
| Blocks | TASK-006, TASK-008, TASK-010 |

## Goal

Everything the Users page and the About page need that is not a component exists: words, the About address, one copy of the role words, and the two user calls.

## Files to touch

| Path | Action |
|---|---|
| `frontend/src/config/text.ts` | edit: Users words (heading, sub "Everyone with an account.", search label and placeholder "Name or email", role label, "All roles", `ROLE_WORDS`, "No role", column heads Name / Email / Role / Joined / Actions, "You", the Delete button label, dialog title and body, the 409 words, deleted toast, already-gone toast, `usersCount(total)` ("124 users", "1 user"), count loading / none / failed, two empty states, error heading); About words (heading, sub, two or three short neutral paragraphs, contact line, footer link "About") |
| `frontend/src/routes/paths.ts` | edit: `about: "/about"` |
| `frontend/src/components/ui/Tag/RoleTag.tsx` | edit: read the role words from `ROLE_WORDS` in `config/text.ts` |
| `frontend/src/services/userService.ts` | edit: `UserListParams`, `listUsers(params, signal): Promise<Paged<PublicUser>>`, `deleteUser(id): Promise<void>` |

## Approach

- Follow how the Directory words are grouped and named in `text.ts` (`DIRECTORY_*`, `directoryCount`). Plain English, short sentences, no invented fact about a university (spec AC14).
- `ROLE_WORDS` is a `Record<"student" | "alumni" | "admin", string>` typed inside `text.ts` itself (it must not import from `lib/`; see G58). `RoleTag` keeps its variants and reads only the word from there.
- The About text says what the system is for (find people, read posts, comment, keep a profile) and whom to ask (the contact email, put in through the constant, not typed). No number, no year, no school name. The app name is not typed in `text.ts`: the page puts `APP_NAME` in (style rule e).
- The 409 words say the person has posts, comments or an alumni profile, so the account cannot be deleted. The name is put in by a function.
- `listUsers` uses `apiClient.get` with `params` and `signal`, like `listAlumni`. `deleteUser` uses `DELETE` on the relative path `/api/users/:id`.

## Acceptance

- [ ] `npm run build` and the style check exit 0.
- [ ] `RoleTag` looks the same as before.
- [ ] Later tasks import these words; none types a visible string again.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-007-frontend-users-about-polish-perf/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-002-3-new-helper-convert-every-sibling|L-REQ-fs-002-3]]
