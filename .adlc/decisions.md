# Decisions Index

Catalog of all ADRs (architecture decision records). Updated by `/wrapup` when an ADR is accepted, superseded, or rejected.

| ID | Title | Status | Decided | Supersedes | Superseded by |
|---|---|---|---|---|---|
| [[architecture/adr-01-sign-up-role-is-student-or-alumni\|ADR-01]] | Sign-up role is student or alumni; admin is never selectable | accepted | 2026-10-02 | (none) | (none) |
| [[architecture/adr-02-admin-deletes-any-post-edits-only-own\|ADR-02]] | An admin can delete any post but edit only their own | accepted | 2026-10-02 | (none) | (none) |
| [[architecture/adr-03-one-alumni-profile-per-user-created-by-that-user\|ADR-03]] | One alumni profile per user, created only by that user | accepted | 2026-10-02 | (none) | (none) |
| [[architecture/adr-04-profile-photo-is-a-url-field\|ADR-04]] | A profile photo is a URL field, with an initials avatar as fallback | accepted | 2026-10-02 | (none) | (none) |
| [[architecture/adr-05-post-list-returns-author-name-and-photo\|ADR-05]] | `GET /api/posts` returns each post's author name and photo | accepted | 2026-10-02 | (none) | (none) |
| [[architecture/adr-06-deleting-rows-that-other-rows-reference\|ADR-06]] | Deleting rows that other rows reference: backend deletes for posts and comments, never for users; no migration | accepted | 2026-10-03 | (none) | (none) |

ADR-01 to ADR-06 are the owner's answers to questions Q2 to Q7 of the retired AI-DLC plan, carried over on 2026-10-05. Q1 (the Ant Design navy theme and Inter font) was dropped with the redesign and has no ADR.

## Status legend

- **proposed** — drafted, not yet decided
- **accepted** — decision in effect
- **superseded** — replaced by a later ADR (link in "Superseded by")
- **rejected** — considered and not pursued

## How to add an entry

1. Create the ADR file at `architecture/adr-<NN>-<slug>.md` from `templates/adr-template.md`.
2. Add the `^ADR-<NN>` block anchor at the title.
3. Add a row here.
4. Link from `index.md` ADRs section.
