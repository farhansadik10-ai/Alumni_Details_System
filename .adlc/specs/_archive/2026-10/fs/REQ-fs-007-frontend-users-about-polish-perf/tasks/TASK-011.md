# TASK-011 — An unchanged edit sends no request; the n2 verdict

| Field | Value |
|---|---|
| REQ | REQ-fs-007 |
| Tier | 0 |
| Status | pending |
| Repo | alumni-details-system |
| Depends on | TASK-001 |
| Blocks | TASK-012 |

## Goal

Saving a post or a comment edit with nothing changed closes the form with no request and no toast (spec AC28, A7); the Load-more total item is judged and recorded (AC29, AC30).

## Files to touch

| Path | Action |
|---|---|
| `frontend/src/components/posts/FeedPost/FeedPost.tsx` | edit `handleSave` |
| `frontend/src/components/posts/CommentItem/CommentItem.tsx` | edit `handleSave` |
| `.adlc/specs/2026-10/fs/REQ-fs-007-frontend-users-about-polish-perf/skipped.md` | create: the skipped list (AC30) |

## Approach

- `FeedPost.handleSave`: if the trimmed `values.caption` equals the trimmed `post.caption` and the trimmed `values.mediaUrl` equals `post.media_url ?? ""` trimmed, call `closeEdit()` and return `{ ok: true }` before `savePost`. Use `sameText` / `presentText` from `frontend/src/lib/alumniDisplay.ts`; do not write a second compare.
- `CommentItem.handleSave`: the same for `content` and `comment.content`. Keep the `editingRef.current` check that already guards `closeEdit()`.
- The forms are not changed: `PostForm` and `CommentForm` also create, and a new item is never unchanged.
- n2: do not change `postAtoms.ts`. Write in `skipped.md`: "n2 (Load more total one off after a racing delete): `totalAfterAnswer` applies a `-1` edit even when the server answered after the delete and its `total` already left the post out. The browser cannot tell the two orders apart, so there is no safe one-line fix; needs a decision." Add every other still-open item from the earlier `verification.md` files that is not a one-line safe fix, each with a one-line reason (read the archived REQ-fs-004, 005 and 006 `verification.md` files; do not extrapolate).

## Acceptance

- [ ] Browser check (TASK-012): editing a post and pressing Save with no change closes the form, sends no `PUT`, shows no toast; changing one letter sends one `PUT`. Same for a comment.
- [ ] `npm run build` exits 0.
- [ ] `skipped.md` exists, one line per item with a reason.

## Notes

- Done 2026-10-08. Both `handleSave` functions return `{ ok: true }` before the store call when `sameText` says nothing changed; `FeedPost` compares caption and image link (`null` read as `""`), `CommentItem` compares content and keeps the `editingRef.current` guard before `closeEdit()`. No toast (A7). Forms not changed. `closeEdit()` raises the focus request, so focus goes back to Edit as after a real save.
- Checks: `npm run build` exit 0; style check 0 findings; library check 493 passed, 0 failed. No unit seam: the change is inside components.
- n2 judged by reading `totalAfterAnswer` (`store/postAtoms.ts:170-183`): a `-1` edit for a post missing from the answer is always applied, so a server total that already left the post out is cut twice. Not fixed; listed in `skipped.md`. `postAtoms.ts` not touched.
- `skipped.md` also has a short section of still-open one-line fixes that no task of this REQ names (REQ-fs-006 r1 in `CommentItem.tsx`; REQ-fs-004 n3, n4, n5, t5). Not made, to stay in scope; the orchestrator decides.

### Browser scenarios for TASK-012 (mock API, never port 3000)

Watch the network log and the toast region in each:

1. Post, no change: Edit on own post, press Save without typing. Form closes, focus on Edit, no `PUT /api/posts/:id`, no toast.
2. Post, spaces only: add a trailing space to the caption, Save. Same as 1 (trimmed compare).
3. Post, one letter changed: change one letter of the caption, Save. Exactly one `PUT`, "saved" toast, new text shown.
4. Post, image link cleared: on a post with an image link, clear the link field, Save. One `PUT` with an empty `media_url`; image gone.
5. Post with no image link: Edit, leave the empty link field empty, Save. No `PUT` (`null` equals empty).
6. Comment, no change: Edit on own comment, Save without typing. Form closes, focus on the comment's Edit, no `PUT /api/comments/:id`, no toast.
7. Comment, one letter changed: one `PUT`, "saved" toast.
8. Create is unaffected: a new post and a new comment still send `POST` as before.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-007-frontend-users-about-polish-perf/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-005-1-disable-until-changed-has-three-traps|L-REQ-fs-005-1]], [[knowledge/lessons/LESSON-REQ-fs-006-3-patched-list-total-needs-a-log-of-local-changes|L-REQ-fs-006-3]]
