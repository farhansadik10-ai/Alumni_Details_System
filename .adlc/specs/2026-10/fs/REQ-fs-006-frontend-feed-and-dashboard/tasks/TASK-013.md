# TASK-013 — Patterns doc and the manual checklist

| Field | Value |
|---|---|
| REQ | REQ-fs-006 |
| Tier | 4 |
| Status | pending |
| Repo | alumni-details-system |
| Depends on | TASK-009, TASK-010, TASK-011, TASK-012 |
| Blocks | none |

## Goal

The new patterns are written down from the code that works, and what no script can prove is on a checklist for the owner (AC38).

## Files to touch

| Path | Action |
|---|---|
| `docs/frontend-patterns.md` | edit: new numbered sections, "Contents", file lists |
| `.adlc/specs/2026-10/fs/REQ-fs-006-frontend-feed-and-dashboard/manual-checklist.md` | create |

## Approach

- Write after the code works, from the code, with real paths that you check exist. New sections 29 and on, each with What it is / Where it lives / Why we chose it / what we did not choose: (29) a feed that loads more by the aligned page rule and merges by id; (30) one open comment thread, patched from server answers, with the count taken from the list; (31) one owner rule for posts and comments; (32) shared forms for create and edit (`PostForm`, `CommentForm`); (33) small blocks that fail on their own (dashboard, side list, profile posts) and share one atom per kind with a key. Extend "Where it lives" of patterns 7, 8, 14, 22 and 23 with the new files instead of repeating them, and update the "Likely new sections" line and the checks list (new case count).
- Do NOT edit `docs/roadmap.md` or the root `CLAUDE.md` here: `/wrapup` owns them.
- The checklist covers, as steps the owner can follow: the real backend (log in as student, alumni, admin; write, edit, delete, comment, reply; the dashboard counts equal the directory; the profile posts for a person), one post written near midnight (time zone), a screen reader pass over the feed (live status line, dialog, `aria-expanded`), both themes by eye, 360px and 200% zoom, a phone menu round trip, the keyboard only, `prefers-reduced-motion`, and the one real call `GET /api/posts?user_id=<id>&limit=3` (compare `total` with `items`; a 500 here means a SQL fault the build cannot see) and a bad value (400). Add: with two browsers, delete a post in one and press Load more in the other (a known limit, see the architecture Risks).
- Pattern 1 and the style check must still pass after the doc edits (no code change here).

## Acceptance

- [ ] Every path written in the new sections exists (`ls` them).
- [ ] `docs/frontend-patterns.md` "Contents" lists the new sections in order.
- [ ] `manual-checklist.md` exists with the items above.
- [ ] `npm run build`, `node scripts/frontend-style-check.mjs`, `npx tsx scripts/frontend-lib-check.ts` exit 0.

## Notes

Plain words, short sentences, the reader is the owner.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-006-frontend-feed-and-dashboard/architecture]]
