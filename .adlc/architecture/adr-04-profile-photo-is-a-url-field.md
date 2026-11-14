# ADR-04 — A profile photo is a URL field, with an initials avatar as fallback ^ADR-04

| Field | Value |
|---|---|
| Status | accepted |
| Decided | 2026-10-02 |
| Author | farhansadik10-ai (owner) |
| Supersedes | (none) |
| Superseded by | (none) |
| Based on | Q5 of the retired AI-DLC plan (`AIdlc/plan.md`, deleted 2026-10-05; in git history) |

## Context

`"User"` has a `photo_url` text column. The backend has no upload endpoint and no file storage; it stores only the URL it is given.

The question was whether a plain URL text field is acceptable for now.

## Considered options

### Option 1 — URL text field, initials avatar when there is no photo

The user pastes a link to an image hosted elsewhere. When `photo_url` is empty, the UI shows the user's initials.

**Pros:**
- No backend work and no storage.
- Every user has something to show, photo or not.

**Cons:**
- The user must host the image somewhere else.
- The link can break or point at anything.

### Option 2 — Build photo upload

**Pros:**
- Normal experience: pick a file.

**Cons:**
- Needs an upload endpoint, storage, and size and type limits. None exist.

## Decision

**We chose Option 1.**

A URL field with an initials avatar fallback, "for now". It works with the backend as it is.

## Consequences

| Consequence | Type |
|---|---|
| Sign-up and profile forms have an optional photo URL field | new work |
| Every place a user is shown needs the initials fallback, including when the URL fails to load | new work |
| No photo upload | trade-off |

## Open questions

- [ ] Photo upload later? Not planned.

## Related

- Concepts: (none)
- Components: (none yet — the frontend is being rebuilt)
- Gotchas: (none)
- Lessons: (none)
- ADRs: [[architecture/adr-05-post-list-returns-author-name-and-photo|ADR-05]]
