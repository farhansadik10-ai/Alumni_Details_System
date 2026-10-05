# Vault Index

A table of contents for the vault. Claude reads this when answering "what do we know about X" — it's faster than walking every file.

## How this file is maintained

Updated by `/wrapup` at the end of each REQ. You can also edit it manually. When a new artifact is created, add a row in the appropriate section with a one-line description.

---

## Specs

_(REQ pages by id, with a one-line summary)_

`Path` is vault-relative and is the one place a REQ's folder location is written down — `/wrapup` repoints it when a REQ is archived, and `/config migrate` repoints it when folders are bucketed. Everything else refers to a REQ by **ID** and resolves the path at read time.

| REQ | Title | Status | Path |
|---|---|---|---|
| REQ-fs-001 | Fix AlumniQuery and CommentQuery against db/schema.md | ready to merge | `specs/2026-10/fs/REQ-fs-001-fix-alumni-comment-queries` |

## ADRs

| ID | Title | Status | Decided |
|---|---|---|---|
| [[architecture/adr-01-sign-up-role-is-student-or-alumni\|ADR-01]] | Sign-up role is student or alumni; admin is never selectable | accepted | 2026-10-02 |
| [[architecture/adr-02-admin-deletes-any-post-edits-only-own\|ADR-02]] | An admin can delete any post but edit only their own | accepted | 2026-10-02 |
| [[architecture/adr-03-one-alumni-profile-per-user-created-by-that-user\|ADR-03]] | One alumni profile per user, created only by that user | accepted | 2026-10-02 |
| [[architecture/adr-04-profile-photo-is-a-url-field\|ADR-04]] | A profile photo is a URL field, with an initials avatar as fallback | accepted | 2026-10-02 |
| [[architecture/adr-05-post-list-returns-author-name-and-photo\|ADR-05]] | `GET /api/posts` returns each post's author name and photo | accepted | 2026-10-02 |
| [[architecture/adr-06-deleting-rows-that-other-rows-reference\|ADR-06]] | Deleting rows that other rows reference: backend deletes for posts and comments, never for users; no migration | accepted | 2026-10-03 |

## Concepts

Patterns, rules that must always hold, domain models.

| Page | One-line summary |
|---|---|
| [[knowledge/concepts/user-join-read-shape]] | Reads that need the person join `"User"` with named columns, never `password` |

## Components

One page per major module.

| Page | Module | Owner |
|---|---|---|
| [[knowledge/components/dal-query-classes]] | `backend/src/dal/query/`, `dal/dto/` | farhansadik10-ai |

## Lessons

See [[knowledge/lesson-ledger]] — generated, one row per lesson, rebuilt by every skill that writes a lesson. Not edited here.

## Gotchas

See [[knowledge/gotchas]] — single-file consolidated list with `^g##` anchors.

## Reference

Cross-cutting reference docs that don't fit elsewhere.

| Page | What it covers |
|---|---|
| _(empty)_ | |
