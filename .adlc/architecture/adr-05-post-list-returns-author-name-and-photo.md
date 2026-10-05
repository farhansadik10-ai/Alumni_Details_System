# ADR-05 — `GET /api/posts` returns each post's author name and photo ^ADR-05

| Field | Value |
|---|---|
| Status | accepted |
| Decided | 2026-10-02 |
| Author | farhansadik10-ai (owner) |
| Supersedes | (none) |
| Superseded by | (none) |
| Based on | Q6 of the retired AI-DLC plan (`AIdlc/plan.md`, deleted 2026-10-05; in git history) |

## Context

`PostQuery.getAllPosts` runs `SELECT * FROM posts`. Each post has a `user_id` but no author name or photo, so a posts feed cannot show who wrote a post without more requests.

The question was whether the endpoint should join the user table.

## Considered options

### Option 1 — Join `"User"` in the query

`getAllPosts` returns the author's `name` and `photo_url` with each post.

**Pros:**
- One request for the whole feed.

**Cons:**
- A backend change; the response shape grows.

### Option 2 — Leave the endpoint; the frontend fetches each author

**Pros:**
- No backend change.

**Cons:**
- One extra request per author, and `GET /api/users/:id` currently returns the password hash ([[knowledge/gotchas#^g17|G17]]).

## Decision

**We chose Option 1.**

`GET /api/posts` joins `"User"` and returns the author's name and photo. The join selects named columns only and never `password`.

## Consequences

| Consequence | Type |
|---|---|
| Change `PostQuery.getAllPosts` to join `"User"` (name, photo_url; no password) | new work |
| The post type in `@alumni/shared` gains the author fields | new work |
| The alumni list has the same gap ([[knowledge/gotchas#^g05|G05]]); this ADR does not cover it | follow-up |

## Open questions

- [ ] Field names for the author's name and photo in the response.
- [ ] Should comments also return their author's name and photo? Not asked.

## Related

- Concepts: (none)
- Components: `backend/src/dal/query/PostQuery.ts`
- Gotchas: [[knowledge/gotchas#^g05|G05]], [[knowledge/gotchas#^g17|G17]]
- Lessons: (none)
- ADRs: [[architecture/adr-04-profile-photo-is-a-url-field|ADR-04]]
