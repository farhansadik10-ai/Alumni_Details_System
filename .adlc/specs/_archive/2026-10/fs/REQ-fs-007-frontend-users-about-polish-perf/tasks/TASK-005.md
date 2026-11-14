# TASK-005 — Words, address, role words, user service

| Field | Value |
|---|---|
| REQ | REQ-fs-007 |
| Tier | 0 |
| Status | done |
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

- [x] `npm run build` and the style check exit 0.
- [x] `RoleTag` looks the same as before.
- [x] Later tasks import these words; none types a visible string again.

## Notes

- Checks (2026-10-08): `npm run build` exit 0 (with `tsc -b`), style check PASS (184 files), lib check 493 passed / 0 failed.
- `RoleTag`: same variants, same three words, same `null` for an unknown role; only the word now comes from `ROLE_WORDS`. `ROLE_WORDS` is typed `Record<"student" | "alumni" | "admin", string>` in `text.ts`, so `text.ts` still has one import (G58).
- Names later tasks use. Users: `USERS_HEADING`, `USERS_SUB`, `USERS_SEARCH_LABEL`, `USERS_SEARCH_PLACEHOLDER`, `USERS_SEARCH_BUTTON`, `USERS_ROLE_LABEL`, `USERS_ALL_ROLES`, `USERS_CLEAR_BUTTON`, `USERS_COLUMN_{NAME,EMAIL,ROLE,JOINED,ACTIONS}`, `USERS_YOU_TAG`, `USERS_DELETE_BUTTON`, `usersDeleteButtonName(name)` (aria-label "Delete <name>", as the design), `usersCount(total)`, `USERS_COUNT_{LOADING,NONE,FAILED}`, `USERS_EMPTY_{MATCH,NONE}_{HEADING,TEXT}`, `USERS_ERROR_HEADING`, `USER_DELETE_TITLE`, `userDeleteBody(name)`, `USER_DELETE_CONFIRM`, `userDeletedToast(name)`, `USER_ALREADY_GONE_TOAST`, `userDeleteBlockedText(name)`, `userDeleteFailureWords(name)`. Shared: `ROLE_WORDS`, `NO_ROLE`. About: `FOOTER_ABOUT_LINK`, `ABOUT_HEADING`, `aboutSub(appName)`, `ABOUT_PURPOSE_HEADING`, `aboutPurposeText(appName)`, `ABOUT_USE_HEADING`, `ABOUT_USE_TEXT`, `ABOUT_CONTACT_HEADING`, `ABOUT_CONTACT_TEXT` (followed by the `CONTACT_EMAIL` link).
- `userDeleteFailureWords(name)` returns `{ blocked, forbidden, notFound, save: { noAnswer, server, gone, general } }`, the shape TASK-004's `UserDeleteFailureWords` (WriteFailureWords + `blocked`) describes. It is checked by shape where TASK-008 passes it to `userDeleteFailureText`; `text.ts` does not import the type. The 404 words equal the already-gone toast.
- Sub text: the task and AC1 say "Everyone with an account."; the design adds "Only admins can open this page." The task's shorter text is used.
- Backend contract read (not run): `GET /api/users` admin only, takes `q`, `role`, `page`, `limit`, answers `{ items, total, page, limit }`; `DELETE /api/users/:id` admin only, 200 `{ message }`, 404 when gone, 409 (ConflictError) when the user owns posts, comments or an alumni profile.
- Manual checklist (needs the real server): an admin list with `q` and `role`; a real 409 on a user with content.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-007-frontend-users-about-polish-perf/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-002-3-new-helper-convert-every-sibling|L-REQ-fs-002-3]]
