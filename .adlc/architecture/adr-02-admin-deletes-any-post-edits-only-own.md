# ADR-02 — An admin can delete any post but edit only their own ^ADR-02

| Field | Value |
|---|---|
| Status | accepted |
| Decided | 2026-10-02 |
| Author | farhansadik10-ai (owner) |
| Supersedes | (none) |
| Superseded by | (none) |
| Based on | Q3 of the retired AI-DLC plan (`AIdlc/plan.md`, deleted 2026-10-05; in git history) |

## Context

`DELETE /api/posts/:id` already lets the post's owner or an admin delete a post. `PUT /api/posts/:id` checks only that a token is present, so any logged-in user can edit any post ([[knowledge/gotchas#^g21|G21]]).

The question was whether an admin's power over other people's posts covers editing as well as deleting.

## Considered options

### Option 1 — Admin can delete any post and edit any post

**Pros:**
- An admin can correct a post without removing it.

**Cons:**
- An admin can change words published under someone else's name.

### Option 2 — Admin can delete any post but edit only their own

**Pros:**
- A post's text is always its author's.
- Moderation still works: an admin removes what should not be there.

**Cons:**
- A small mistake in someone else's post can only be removed, not corrected.

## Decision

**We chose Option 2.**

An admin can delete any post but edit only their own. Edit is therefore owner-only for every role; delete is owner or admin.

## Consequences

| Consequence | Type |
|---|---|
| `PUT /api/posts/:id` must allow only the owner ([[knowledge/gotchas#^g21|G21]]) | new work |
| The UI shows Edit only to the owner, and Delete to the owner and admins | new work |
| An admin cannot correct another user's post | trade-off |

## Open questions

- [ ] Does the same rule apply to comments? The retired plan's hardening list implies it (edit: owner only; delete: owner or admin — [[knowledge/gotchas#^g23|G23]]), but the owner was not asked directly.

## Related

- Concepts: (none)
- Components: `backend/src/api/controllers/PostController.ts`, `backend/src/api/routes/PostRoutes.ts`
- Gotchas: [[knowledge/gotchas#^g21|G21]], [[knowledge/gotchas#^g23|G23]]
- Lessons: (none)
- ADRs: [[architecture/adr-06-deleting-rows-that-other-rows-reference|ADR-06]]
