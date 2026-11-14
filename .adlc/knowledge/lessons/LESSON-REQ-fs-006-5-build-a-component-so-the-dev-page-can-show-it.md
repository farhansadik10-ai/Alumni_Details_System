# Build a component so the dev page can show every state without copying it ^L-REQ-fs-006-5

| Field | Value |
|---|---|
| ID | LESSON-REQ-fs-006-5 |
| Captured | 2026-10-08 |
| REQ | REQ-fs-006 |
| Component | `frontend/src/pages/dev/ComponentsPage/`, `frontend/src/components/posts/` |
| Tags | dev-page, components, css, frontend |
| Severity | guideline (a rule to follow) |

## The lesson

A component that reads the store or keeps a state in its own `useState` (an edit form, a delete dialog) cannot be shown on the dev page from props, so the page rebuilds it and copies its CSS, and the copy drifts. Expose reviewable states as props, keep list states in a props-only inner part, take the stylesheet with `composes`, and wrap anything that calls a write on a press in a capture-phase guard so a press cannot reach the services.

## Saw it in

- `ComponentsPage.module.css` — five rules copied from `CommentsPanel.module.css` with a "change both together" comment (QUAL-004); replaced by `composes` in the fix round.
- `FeedPostSamples` — the editing state and the delete dialog are rebuilt from parts because `FeedPost` keeps them in its own state; `CommentsPanel` is never rendered because it reads `commentsAtom`.
- `NoRequests` (capture-phase press guard) — the reason no real request can start from the dev page.

## Related

- Originating REQ: REQ-fs-006
- See also: [[knowledge/lessons/LESSON-REQ-fs-004-5-find-out-what-listens-on-the-api-port]]
