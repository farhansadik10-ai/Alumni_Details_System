# TASK-002 — Pure rules in `lib/` and their library-check cases

| Field | Value |
|---|---|
| REQ | REQ-fs-006 |
| Tier | 0 |
| Status | pending |
| Repo | alumni-details-system |
| Depends on | none |
| Blocks | TASK-005, TASK-006 |

## Goal

Every rule the feed and dashboard need that is not a component is one pure function in `frontend/src/lib/`, with cases in `scripts/frontend-lib-check.ts` (AC36).

## Files to touch

| Path | Action |
|---|---|
| `frontend/src/lib/postDisplay.ts` | create: `dateText(iso)`, `commentCountText(n)` |
| `frontend/src/lib/contentOwner.ts` | create: `canEditContent(session, userId)`, `canDeleteContent(session, userId)` |
| `frontend/src/lib/commentThread.ts` | create: `buildThreads`, `appendComment`, `replaceComment`, `removeWithReplies`, `countReplies` |
| `frontend/src/lib/feedPaging.ts` | create: `nextFeedPage(held, limit)`, `mergePosts(held, incoming)` |
| `frontend/src/lib/validation.ts` | edit: `validateCaption`, `validateComment`, their messages and `MAX_POST_LENGTH` (2000), `MAX_COMMENT_LENGTH` (1000) |
| `scripts/frontend-lib-check.ts` | edit: cases for all of the above |

## Approach

- `dateText(iso: string | null): string | null` returns "3 October 2026": English month names from a fixed array (never `toLocaleDateString`), the viewer's local day, month, year. `null`, empty or unreadable text gives `null`. `commentCountText(n)`: 0 "No comments yet", 1 "1 comment", otherwise "N comments" (the words are constants in this file or passed from `config/text.ts`; keep them in `config/text.ts` if TASK-004 defines them and import them, since `lib/` may not import React but may import plain constants; if that breaks a style rule, keep the three strings here and have TASK-004 not duplicate them).
- `contentOwner`: takes the `Session` type from `lib/token.ts` (`sub`, `role`). Edit: the author only. Delete: the author or an admin (use the existing `isAdmin`). No session or a `null` `userId` gives false.
- `commentThread`: types come from `@alumni/shared` (`Comment`). `buildThreads(comments)` returns `{ comment, replies }[]`: top-level comments (and any comment whose parent is not in the list) oldest first by `created_at` then `id`; `replies` holds every descendant, flat, oldest first. `removeWithReplies(items, id)` removes the comment and every descendant. `countReplies(items, id)` counts descendants (for the delete dialog). Nothing mutates its input.
- `feedPaging`: `nextFeedPage(held, limit) = Math.floor(held / limit) + 1` (limit below 1 gives 1). `mergePosts(held, incoming)` returns one list, no id twice, ordered newest first by `created_at` then `id` descending, the incoming copy winning for an id held twice.
- Validators follow pattern 16: take the text as typed, return the message or `null`. `validateCaption`: after trimming, empty gives a "Write something before you publish." style message (final words in the constants), longer than the limit gives `tooLongMessage(MAX_POST_LENGTH)`. `validateComment` the same with its own words. Length counts the trimmed text. Messages are exported constants. The image link reuses `validatePhotoLink` (do not add a second web-link validator).
- Cases in `frontend-lib-check.ts`: expected answers typed out from the spec (G55), not computed with the function under test. Cover at least: dates (normal, single-digit day, 31 December, 29 February 2028, `null`, "", "not a date"); counts (0, 1, 2, 1000); owner rules (author, other user, admin, student, no session, null user id); threads (order, flat replies oldest first, reply to a reply, missing parent becomes top level, empty list, input not changed); removal (leaf, with replies, a reply of a reply, unknown id); `nextFeedPage` (0, 11, 12, 13, 24 held with limit 12; limit 0); `mergePosts` (duplicate id, empty sides, order); validators (empty, spaces only, 1 character, exactly the limit, one over).
- Prove once that a new case can fail: make a copy of the script outside the repo with one wrong expectation (rewrite its `../frontend/src/` imports to full paths) and see `FAIL` and exit 1. Do not leave the copy in the repo.

## Acceptance

- [ ] `npx tsx scripts/frontend-lib-check.ts` exits 0 and prints the new case count.
- [ ] The failing copy exits 1 (state this in the task note).
- [ ] `node scripts/frontend-style-check.mjs` and `npm run build` exit 0 (rule k: nothing in `lib/` imports React, the router, `services/` or `store/`).
- [ ] Each function has one definition; `grep` shows no second inline copy of month names, the owner rule or the thread grouping anywhere in `frontend/src`.

## Notes

`created_at` can be `null` in the type: sort `null` last, and treat it as the oldest. Use the existing `presentText` for "visible character" instead of a new trim helper.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-006-frontend-feed-and-dashboard/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-002-3-new-helper-convert-every-sibling]], [[knowledge/lessons/LESSON-REQ-fs-003-1-write-the-check-from-the-spec-not-the-code]], [[knowledge/lessons/LESSON-REQ-fs-003-4-a-check-must-be-able-to-fail]]
