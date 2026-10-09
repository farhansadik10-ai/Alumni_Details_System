# ADR-06 — Deleting rows that other rows reference: backend deletes for posts and comments, never for users; no migration ^ADR-06

| Field | Value |
|---|---|
| Status | accepted |
| Decided | 2026-10-03 |
| Author | farhansadik10-ai (owner) |
| Supersedes | (none) |
| Superseded by | (none) |
| Based on | Q7 of the retired AI-DLC plan (`AIdlc/plan.md`, deleted 2026-10-05; in git history); `db/schema.md` |

## Context

`db/schema.md` shows that no foreign key has `ON DELETE CASCADE`. So deleting a post that has comments, a comment that has replies, or a user who has posts, comments or an alumni row fails with a foreign-key error ([[knowledge/gotchas#^g08|G08]]).

The delete queries (`PostQuery.deletePost`, `CommentQuery.deleteComment`, `UserQuery.deleteUser`) are each a single `DELETE` and do nothing about related rows.

## Considered options

### Option 1 — Block it in the UI

Hide or disable Delete when related rows exist, and show a clear message if the backend still returns the error.

**Pros:**
- No backend change; nothing is deleted by surprise.

**Cons:**
- A post with comments could never be deleted.

### Option 2 — The backend deletes the related rows first

In one transaction, in `deletePost`, `deleteComment`, `deleteUser`.

**Pros:**
- Delete works; no schema change.

**Cons:**
- For users it would silently remove all their posts, comments and profile.

### Option 3 — Change the foreign keys

`ON DELETE CASCADE` (or `SET NULL` for `comment.parent_id`), with a database migration.

**Pros:**
- The database enforces it everywhere.

**Cons:**
- A schema change and a migration.

### Option 4 — A mix, with no migration

Option 2 for posts and comments, Option 1 for users.

## Decision

**We chose Option 4.**

- **Posts and comments:** the backend deletes the related rows first, in one transaction. `deletePost` removes the post's comments (replies included), then the post. `deleteComment` removes the comment's replies (all levels), then the comment. The confirm dialog warns that the comments or replies will also be deleted.
- **Users:** related data is never deleted. A user who has posts, comments or an alumni profile cannot be deleted. When the backend returns the foreign-key error, the UI shows: "This user has posts, comments or an alumni profile and cannot be deleted".
- **No database migration.**

## Consequences

| Consequence | Type |
|---|---|
| `PostQuery.deletePost` and `CommentQuery.deleteComment` become multi-statement transactions | new work |
| Delete-confirm dialogs for posts and comments must warn about the comments / replies | new work |
| The user-delete path must turn the foreign-key error into the plain message above | new work |
| An admin cannot remove a user who has any content | trade-off |
| The foreign keys stay as they are; nobody adds `ON DELETE CASCADE` | trade-off |

## Open questions

- [ ] How does an admin remove a user who has content? Not decided (delete their content one by one first, or deactivate — there is no "active" column).
- [ ] Where does the transaction live under the layer rules — in the Query class, or the Manager? For `/architect` to settle.

## Related

- Concepts: (none)
- Components: `backend/src/dal/query/PostQuery.ts`, `CommentQuery.ts`, `UserQuery.ts`
- Gotchas: [[knowledge/gotchas#^g08|G08]], [[knowledge/gotchas#^g07|G07]], [[knowledge/gotchas#^g23|G23]]
- Lessons: (none)
- ADRs: [[architecture/adr-02-admin-deletes-any-post-edits-only-own|ADR-02]]

## Update 2026-10-07 (REQ-fs-003)

Built, with no migration.

- **Where the transaction lives** (open question above): in the Query layer, because SQL lives only there. `PostQuery.deletePost` uses `withTransaction` for its two statements.
- **Comment delete is one statement, not a transaction.** `CommentQuery.deleteComment` is a single recursive `DELETE` that removes the comment and every reply under it. One statement is all-or-nothing by itself, so the decision's intent holds; only its wording ("in one transaction") differs.
- **Users:** `DELETE /api/users/:id` answers 409 with the message above when the user has posts, comments or an alumni profile, and deletes nothing. The database's own foreign keys make the refusal; `UserManager` gives it the message.
- Still open: how an admin removes a user who has content.

## Update 2026-10-09 (REQ-fs-007)

The admin Users page shows the 409 as a message in the delete dialog. Its words differ from the text quoted above, on purpose: "{name} cannot be deleted because they still have posts, comments or an alumni profile. Nothing was changed." It names the person and says nothing was changed. The facts are the same: the refusal is for posts, comments or an alumni profile. The words live in `frontend/src/config/text.ts` (`userDeleteBlockedText`). The server's own message is never shown to the user (ADR-11).

- Still open: how an admin removes a user who has content.
