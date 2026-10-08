# TASK-007 — `FeedPost`, `CommentsPanel`, `CommentItem`

| Field | Value |
|---|---|
| REQ | REQ-fs-006 |
| Tier | 2 |
| Status | pending |
| Repo | alumni-details-system |
| Depends on | TASK-005, TASK-006 |
| Blocks | TASK-009, TASK-012 |

## Goal

One post of the feed, with its comments, edit and delete, built from the shared pieces (AC2, AC10 to AC19, AC30 to AC32).

## Files to touch

| Path | Action |
|---|---|
| `frontend/src/components/posts/FeedPost/FeedPost.tsx` + `.module.css` | create |
| `frontend/src/components/posts/CommentsPanel/CommentsPanel.tsx` + `.module.css` | create |
| `frontend/src/components/posts/CommentItem/CommentItem.tsx` + `.module.css` | create |

## Approach

- `FeedPost` (a `Card as="article"`): `PostByline` (md), `PostText`, the image when `isWebLink(media_url)` (hidden on error; alt text names the author; no role tag, no profile link), then a footer row: the comments toggle button (`commentCountText`, `aria-expanded`, `aria-controls`) and, by `canEditContent` / `canDeleteContent`, **Edit** and **Delete** (quiet buttons, Delete in the danger tone). Edit swaps the text for `PostForm` (initial values, submit "Save", Cancel) and calls `savePostAtom`; on success it closes, shows the toast and focuses the post's Edit button; on Cancel it restores and focuses Edit. Delete opens `ConfirmDialog` (danger, title and sentence from text, saying the post's comments go with it and how many); confirm calls `deletePostAtom`, busy while it runs, cannot be confirmed twice; on success it closes the dialog, toasts, and calls an `onDeleted` prop. **Nothing calls `focus()` inside the promise chain** (the dialog is still open then and the page behind it is inert; ADV-004): `onDeleted` only raises a "focus the list heading" request (a counter in the page's state) and the page runs the focus in an effect after the commit that removed the post. While the delete runs, the dialog ignores Escape and Cancel (`onClose` does nothing when busy), so a failure is always seen inside the open dialog; a failure that still arrives after a close shows as a toast. 403 shows the "you can only change your own" words, 404 the "already gone" words, other failures `saveFailureText` with the post words; the dialog shows its failure message inside and stays open on a failure.
- The component reads no atoms for the list; it gets `post`, `session`, `open` (is this post's thread open), `onToggleComments`, `onDeleted`. It calls the write actions with `useSetAtom` and shows toasts with `showToastAtom`.
- `CommentsPanel` (shown inside the card when open, with the design's raised background and top border): reads `commentsAtom`; treats `postId !== postId prop` or `idle` as loading; skeleton while loading; `ErrorState` with retry inside the panel; empty state inviting the first comment; else `buildThreads` rendered as top-level `CommentItem`s with their replies indented one level (a left border, as in the design), then one `CommentForm` ("Add a comment"). Reply sets `replyingTo` (id and name) on the panel; the form shows the line and Cancel; sending or cancelling clears it. Only one edit or one reply is active at a time. A 400 on a reply shows "That comment is gone. Your reply was not sent." and clears `replyingTo` (ADV-005); a 404 when the thread loads means the post is gone: the panel calls `onPostGone`, the page removes the post and says so.
- `CommentItem`: `PostByline` (sm), `PostText`, then quiet `sm` buttons: **Reply** (everyone), **Edit** (author), **Delete** (author or admin) with the same dialog rules; deleting a comment with replies says the replies go too (`countReplies`). Edit swaps in `CommentForm` with the current text.
- After a comment is added the field is cleared and focused; after a comment delete focus goes to the comment field, again through a request run in an effect after the commit (C11).
- All words from `config/text.ts`; all values from tokens; the panel and items wrap at 360px (`overflow-wrap`), no horizontal scroll at 200% zoom. Respect `prefers-reduced-motion` (no animation for open and close).

## Acceptance

- [ ] `npm run build`, `node scripts/frontend-style-check.mjs`, `npx tsx scripts/frontend-lib-check.ts` exit 0.
- [ ] With the mock API (outside the repo; never port 3000's real backend): as author, as another user and as admin, the right buttons show (AC15, AC14); Delete always opens the dialog; Escape closes it and focus returns to the opener.
- [ ] Opening a second post's comments closes the first; a slow answer for the first never shows in the second (AC10, AC6).
- [ ] Reply to a comment, reply to a reply: both are drawn under the top-level comment; the count equals the list after add and after delete (AC12, AC13, AC14).
- [ ] Real Tab key through a post with comments open: every stop has a visible ring in both themes.

## Notes

The post's comment count in the toggle comes from the post (`comment_count`), which the store keeps equal to the list length after every comment write. Do not compute it a second way.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-006-frontend-feed-and-dashboard/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-004-4-check-focus-for-real]], [[knowledge/lessons/LESSON-REQ-fs-005-5-does-the-reused-part-carry-what-the-design-needs]]
