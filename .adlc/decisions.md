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
| [[architecture/adr-07-design-direction-oak-ink-band\|ADR-07]] | Design direction is "Oak, ink band", with light, dark and system themes | accepted | 2026-10-06 | (none) | (none) |
| [[architecture/adr-08-mentoring-and-field-stay-two-new-alumni-columns\|ADR-08]] | Mentoring and field stay in the design; `alumni` gets two new columns | accepted | 2026-10-06 | (none) | (none) |
| [[architecture/adr-09-white-label-app-name-from-one-constant\|ADR-09]] | The app is white-label; its name "University Alumni" is text from one constant | accepted | 2026-10-06 | (none) | (none) |
| [[architecture/adr-10-about-page-last-privacy-and-password-reset-later\|ADR-10]] | The About page is built last; the Privacy page and password reset are later work | accepted | 2026-10-06 | (none) | (none) |
| [[architecture/adr-11-typed-errors-and-one-error-middleware\|ADR-11]] | Code throws typed errors; one middleware turns them into `{ error }` | accepted | 2026-10-06 | (none) | (none) |
| [[architecture/adr-12-list-endpoints-answer-items-total-page-limit\|ADR-12]] | List endpoints answer `{ items, total, page, limit }` | accepted | 2026-10-06 | (none) | (none) |

ADR-01 to ADR-06 are the owner's answers to questions Q2 to Q7 of the retired AI-DLC plan, carried over on 2026-10-05. Q1 (the Ant Design navy theme and Inter font) was dropped with the redesign and has no ADR.

ADR-07 to ADR-10 record the design approved by the owner on 2026-10-06 (`docs/design/README.md`).

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
