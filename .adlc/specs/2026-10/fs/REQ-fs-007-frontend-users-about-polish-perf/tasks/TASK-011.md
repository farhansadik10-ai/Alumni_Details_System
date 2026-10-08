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

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-007-frontend-users-about-polish-perf/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-005-1-disable-until-changed-has-three-traps|L-REQ-fs-005-1]], [[knowledge/lessons/LESSON-REQ-fs-006-3-patched-list-total-needs-a-log-of-local-changes|L-REQ-fs-006-3]]
