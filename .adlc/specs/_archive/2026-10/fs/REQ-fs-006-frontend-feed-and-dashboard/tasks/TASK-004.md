# TASK-004 — All new words in `config/text.ts`

| Field | Value |
|---|---|
| REQ | REQ-fs-006 |
| Tier | 0 |
| Status | done |
| Repo | alumni-details-system |
| Depends on | none |
| Blocks | TASK-006 |

## Goal

Every word the feed, the dashboard and the profile's recent posts show is a named constant in `frontend/src/config/text.ts`, grouped by page, so no component holds user-facing text.

## Files to touch

| Path | Action |
|---|---|
| `frontend/src/config/text.ts` | edit: append groups `FEED_*`, `POST_*`, `COMMENT_*`, `DASHBOARD_*`, `PEOPLE_*`, `PROFILE_POSTS_*` |

## Approach

- Take the words from `docs/design/screens/feed.html`, `dashboard.html`, `profile.html`: band heading and sub of Feed ("Feed", "News, job openings and events from alumni."), Dashboard greeting (a function `dashboardGreeting(firstName | null)` giving "Welcome back, Tanvir" or "Welcome back") and sub ("Here is what is new in your alumni network."), "Write a post", "Share news, a job opening or an event", "Image link", "(optional)", "Publish post", "Add a comment", "Comment", "Reply", "Edit", "Delete", "Save", "Cancel", "Load more posts", "Open to mentoring", "See all in the directory", "Recent posts", "Your profile", "Edit my profile", "New in the directory", the counts card labels and links (design copy), the student note about who can post, the empty, error and loading words of every block (heading + one sentence saying what to do next), the delete dialog texts for a post (functions of the comment count) and for a comment (functions of the reply count), the toasts ("Post published", "Post saved", "Post deleted", "Comment posted", "Comment saved", "Comment deleted"), the save-failure words per write (one `SaveFailureWords` object for post writes and one for comment writes, so `saveFailureText` is used with each), the 403/404 sentences for edit and delete, the "Replying to <name>" line (function), the visually hidden "Posts" heading, and the polite status line "Showing N of M posts" (function).
- One name through a flow (design README section 7): button "Publish post" leads to "Post published"; "Save" on an edit leads to "Post saved"; "Comment" leads to "Comment posted"; "Delete" leads to "Post deleted"/"Comment deleted".
- Plain words, short sentences. No app name here (use `APP_NAME`); no contact email.
- Do not duplicate strings that already exist (`OPEN_TO_MENTORING`, `RETRY_LABEL`, `LOADING_TEXT`, `NAME_NOT_GIVEN` ...): import and reuse.
- If `commentCountText` in TASK-002 keeps its three strings in `lib/`, do not define them again here (TASK-002 decides; the later task that finds a duplicate removes the one in `text.ts`).
- A later task that finds a missing word appends it to its own group and says so in its note.

## Acceptance

- [ ] `npm run build` and `node scripts/frontend-style-check.mjs` exit 0 (rule e: the app name and contact email appear nowhere new).
- [ ] No word is defined twice in the file (`grep` the new values).
- [ ] Every string in the list above exists, grouped and commented by page.

## Notes

Validator messages (caption and comment) are NOT here; they live in `lib/validation.ts` (pattern 16, TASK-002).

Implementation notes (2026-10-08, task-implementer):
- Comment-count words are NOT here; they are in `lib/postDisplay.ts` (`commentCountText`, TASK-002), per the orchestrator's decision.
- Generic action words `EDIT_LABEL`, `DELETE_LABEL`, `SAVE_LABEL`, `CANCEL_LABEL`, `SAVING_LABEL`, `DELETING_LABEL` and the shared write-failure words `WRITE_FAILED_*` sit in a "Shared words: post and comment actions" group, since posts and comments both use them.
- `POST_SAVE_FAILURE_WORDS` / `COMMENT_SAVE_FAILURE_WORDS` are plain objects shaped like `SaveFailureWords` (no import; text.ts stays import-free). Their `gone` is a fallback only: `saveFailureText` maps 403 and 404 to the same reason, so pages must check the status first and use `POST_CHANGE_FORBIDDEN_TEXT` / `POST_NOT_FOUND_TEXT` (and the COMMENT_ versions, plus `COMMENT_POST_GONE_TEXT` for a 404 on adding a comment). `POST_WHO_CAN_POST` is the 403 sentence on publish.
- Reused by alias, not retyped: `OPEN_TO_MENTORING`, `OPTIONAL_MARK`, `ACCOUNT_PHOTO_PLACEHOLDER`, `ALUMNI_LOAD_ERROR_HEADING`; "Recent posts", "Write a post", "No posts yet" and "Open the feed" are each defined once and aliased across groups.
- Added beyond the list (needed for states): `DASHBOARD_COUNTS_HEADING` (visually hidden), busy words (`POST_PUBLISH_BUSY`, `COMMENT_SUBMIT_BUSY`, `FEED_LOAD_MORE_BUSY`), `POST_IMAGE_ALT`, loading words per block, `FEED_EMPTY_WRITER_ACTION`.
- Checks: `npm run build` exit 0; `node scripts/frontend-style-check.mjs` PASS. Duplicate-value grep shows only pre-existing directory/profile labels, no new duplicates.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-006-frontend-feed-and-dashboard/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-002-3-new-helper-convert-every-sibling]]
