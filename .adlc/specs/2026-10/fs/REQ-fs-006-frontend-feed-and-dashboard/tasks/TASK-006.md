# TASK-006 — Shared small components: `ButtonLink`, `EmptyState` link, `PostByline`, `PostText`, `PostForm`, `CommentForm`

| Field | Value |
|---|---|
| REQ | REQ-fs-006 |
| Tier | 1 |
| Status | pending |
| Repo | alumni-details-system |
| Depends on | TASK-002, TASK-004 |
| Blocks | TASK-007, TASK-008 |

## Goal

The building blocks that more than one place needs exist once, each with its stylesheet on tokens (AC7, AC8, AC12, AC29 to AC34).

## Files to touch

| Path | Action |
|---|---|
| `frontend/src/components/ui/ButtonLink/ButtonLink.tsx` + `.module.css` | create: router link drawn as a button (`primary` / `secondary`, size), `composes` from `Button.module.css` |
| `frontend/src/components/ui/EmptyState/EmptyState.tsx` | edit: optional `actionTo` (a `ButtonLink`) beside `onAction` |
| `frontend/src/components/posts/PostByline/PostByline.tsx` + `.module.css` | create: avatar (`sm` or `md`), name, date from `dateText` (nothing if `null`) |
| `frontend/src/components/posts/PostText/PostText.tsx` + `.module.css` | create: plain text, line breaks kept, `overflow-wrap: anywhere`, optional clamp to a few lines |
| `frontend/src/components/posts/PostForm/PostForm.tsx` + `.module.css` | create: caption `Textarea` + optional image link `TextInput` + submit + optional Cancel |
| `frontend/src/components/posts/CommentForm/CommentForm.tsx` + `.module.css` | create: one field + submit + optional Cancel + optional "Replying to <name>" line |

## Approach

- `ButtonLink`: copy nothing from `Button`; take the classes with `composes` (pattern 3; mind the `composes` order, G52). Text color and focus ring must come from the same tokens. It is a real `<a>` through the router's link.
- `EmptyState`: add `actionTo?: string`; render `ButtonLink` when given; `onAction` keeps working. No other change to the part 1 component.
- `PostByline` and `PostText` are presentational. The author name goes through `displayName`. The name is plain text (no link), per the spec. The date element is a `<time dateTime>` only when the ISO text is valid.
- `PostForm` props: `initialCaption`, `initialMediaUrl`, `submitLabel`, `busyLabel`, `captionLabel`, `onSubmit(values) => Promise<FormResult>`, `onCancel?`, `autoFocus?`, `ref` to the caption field (forwarded so the page can focus it). Follows pattern 16: `noValidate`, values in `useState`, validators from `lib/validation.ts` (`validateCaption`, `validatePhotoLink`), message under the field, focus to the first field with a message, early return while busy, a field's message clears when that field is edited. A failed save keeps the typed values and shows a `Message tone="error"` above the buttons with the words the caller returns. A successful create clears the form (the caller decides by returning ok and a `reset` flag). The submit is the **one primary** button of the view. The design shows the image link next to the button in one row, wrapping.
- `CommentForm`: same rules, one `TextInput` (design) or a `Textarea` for edit; choose `Textarea` with 2 rows for all so an edit has room. Props: `label`, `initialValue`, `submitLabel`, `replyingTo?`, `onCancel?`, `onSubmit`. Secondary button style as in the design ("Comment").
- Do not add a disabled-until-changed rule to Save (LESSON-REQ-fs-005-1): an edit form is closed by Save or Cancel and nothing here is "new".
- Both forms: 44px controls, labels from `config/text.ts`, no literals.

## Acceptance

- [ ] `npm run build`, `node scripts/frontend-style-check.mjs`, `npx tsx scripts/frontend-lib-check.ts` exit 0.
- [ ] `ButtonLink` and the `EmptyState` link action have a visible focus ring in both themes (checked with a real Tab key, LESSON-REQ-fs-004-4).
- [ ] Empty and spaces-only caption/comment are refused with a message in words under the field and nothing is sent; a double press sends one request (checked in TASK-012's page and in the review).
- [ ] No second copy of a web-link check, trim rule or date format in these files.

## Notes

`PostForm` and `CommentForm` get no API access: they receive an `onSubmit` that returns a result. They are shown in every state on the dev page (TASK-012).

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-006-frontend-feed-and-dashboard/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-005-1-disable-until-changed-has-three-traps]], [[knowledge/lessons/LESSON-REQ-fs-005-5-does-the-reused-part-carry-what-the-design-needs]], [[knowledge/lessons/LESSON-REQ-fs-004-4-check-focus-for-real]]
