# `memo` only skips a row whose props are stable: count renders first, and keep handlers stable by reading the store at call time ^L-REQ-fs-007-6

| Field | Value |
|---|---|
| ID | LESSON-REQ-fs-007-6 |
| Captured | 2026-10-09 |
| REQ | REQ-fs-007 |
| Component | `FeedPost`, `FeedPage`, `AlumniCard`, `CommentItem`, users columns |
| Tags | performance, react, memo, frontend |
| Severity | guideline (a rule to follow) |

## The lesson

`memo` on a component that takes `children` JSX, or a closure made in a parent's render function (such as `Table`'s `render`), never skips, so check the props before adding it. Count real renders with a throwaway Vite `transform` plugin (enforce "pre") that adds a no-deps effect to named components, kept in the scratchpad so nothing reaches the repo. A handler that depends on changing state can stay stable by reading the atom at call time with `useStore().get(atom)` instead of closing over it.

## Saw it in

- `FeedPage.tsx` `handleToggleComments`: it depended on `comments.postId`, so every post drew again whenever any thread opened; reading the store at the press fixed it. Unchanged rows went from 12 to 48 draws to 0 (`performance.md`).
- `CommentItem` and `UserActionsCell` were left without `memo` because their props change on every parent draw; the reason is written in `performance.md`.

## Related

- Originating REQ: REQ-fs-007
