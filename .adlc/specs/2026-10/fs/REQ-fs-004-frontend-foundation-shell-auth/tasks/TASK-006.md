# TASK-006 — Tag, Avatar, Card, Table, Pagination, loading / empty / error states

| Field | Value |
|---|---|
| REQ | REQ-fs-004 |
| Tier | 3 |
| Status | pending |
| Repo | alumni-details-system |
| Depends on | TASK-005 |
| Blocks | TASK-008, TASK-010 |

## Goal

The display components of the design system exist and match `system.html` in both themes.

## Files to touch

| Path | Action |
|---|---|
| `frontend/src/components/ui/Tag/Tag.tsx + Tag.module.css` | create |
| `frontend/src/components/ui/Avatar/Avatar.tsx + Avatar.module.css` | create |
| `frontend/src/components/ui/Card/Card.tsx + Card.module.css` | create |
| `frontend/src/components/ui/Table/Table.tsx + Table.module.css` | create |
| `frontend/src/components/ui/Pagination/Pagination.tsx + Pagination.module.css` | create |
| `frontend/src/components/ui/Skeleton/Skeleton.tsx + Skeleton.module.css` | create |
| `frontend/src/components/ui/EmptyState/EmptyState.tsx + EmptyState.module.css` | create |
| `frontend/src/components/ui/ErrorState/ErrorState.tsx + ErrorState.module.css` | create |

## Approach

- **Tag.** `variant`: `plain` (1px `--line` outline), `mentoring` (`--accent-soft`, `--accent-soft-text`), `role-student` (`--sunken`), `role-alumni` (`--accent`, `--on-accent`), `role-admin` (`--action`, `--on-action`). Caption size; weight 600 except `plain`. A `RoleTag` component in the same folder maps the API role to the variant and the word ("Student", "Alumni", "Admin"); an unknown role renders nothing.
- **Avatar.** Props `name`, `photoUrl`, `size` (`sm` 32, `md` 44, `lg` 72). Square, `--radius`, `--accent-soft` background, initials from `lib/initials.ts` in `--accent-soft-text`, weight 700. When `photoUrl` starts with `http://` or `https://` render `<img alt="" referrerPolicy="no-referrer" loading="lazy">` covering the square; on `onError` fall back to initials (this also covers an `http://` photo blocked on an `https://` site). The avatar is decorative (`aria-hidden`) because the name is always beside it.
- **Card.** `--surface`, 1.5px `--edge`, `--radius`; `padding`: `md` (24px) or `lg` (32px). `as` prop for `section` / `article` / `div`.
- **Table.** Generic `Table<T>`: `columns: { key: string; header: string; align?: "left" | "right"; render: (row: T) => ReactNode }[]`, `rows`, `rowKey`, `caption` (visually hidden). Real `<table>`, `<th scope="col">`. Head row `--sunken` with a 1.5px `--edge` bottom border; rows divided by 1px `--line`; row hover `--sunken`. Each `<td>` gets `data-label={column.header}`. Below 768px: the head is visually hidden, each `<tr>` becomes a bordered card, each `<td>` a row that shows `attr(data-label)` before the value.
- **Pagination.** Props `page`, `pageCount`, `onChange`. `<nav aria-label="Pages">` with real buttons: Previous, page numbers, Next, and the text "Page X of Y". Current page: `aria-current="page"`, `--action` / `--on-action`. Previous is `disabled` on page 1, Next on the last page. With more than 7 pages show first, last, the current and its neighbours, with a non-interactive "…" between. Renders nothing when `pageCount` is 0 or 1.
- **Skeleton.** A block filled with `--sunken`, shapes by a `shape` prop mapped to classes (`line`, `title`, `avatar-sm`, `avatar-md`, `block`). No animation at all. A `SkeletonGroup` wrapper sets `aria-busy="true"` and holds a visually hidden "Loading".
- **EmptyState.** Dashed 1px `--line` box on `--surface`: heading (H3 size, weight 700), one line of text in `--muted` that says what to do next, optional action (a secondary Button). **ErrorState.** Solid 1.5px `--edge` box: heading, one line, a "Try again" Button calling `onRetry`; `role="alert"`.

## Acceptance

- [ ] AC20, AC21, AC22, AC23, AC24, AC28: each as written in the spec
- [ ] Table at 360px: no sideways scroll; every value shows with its column name
- [ ] `node scripts/frontend-style-check.mjs` exits 0 and `npm run build` exits 0

## Notes

- **Rules for every task of this REQ.** Never read or print any `.env` file. Never run `psql` or anything that changes the database. Never run `git push` or any git command that writes. Touch nothing under `backend/`, `shared/` or `db/`. Delete no file that this task's table does not list. Add no package that this task does not name. If the task cannot be done inside these rules, stop and write why in the implementation notes.
- Read `architecture.md` in this REQ folder first (layout, token names, the size-snapping table). Read `docs/design/README.md` and the screen files this task names. Do not copy inline styles from the screens; read the tokens.
- Compiler rules: `import type` for types, no enums, no unused locals or parameters. No barrel `index.ts` files for components.
- ErrorState uses the primary button as `system.html` draws it. On a page that already has a primary button the caller can pass `retryVariant="secondary"` (one primary per view).
- The page-range logic of Pagination is a pure function; export it so the components page can show both a short and a long range.
- The CSS `content: attr(data-label)` text is read by some screen readers and not others; that is acceptable here because the cell value itself is always real text.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-004-frontend-foundation-shell-auth/architecture]]
- Lessons checked: —
