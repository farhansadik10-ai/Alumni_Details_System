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
| REQ-fs-001 | Fix AlumniQuery and CommentQuery against db/schema.md | merged | `specs/_archive/2026-10/fs/REQ-fs-001-fix-alumni-comment-queries` |
| REQ-fs-002 | Close the security and data-loss gaps in the backend | merged | `specs/_archive/2026-10/fs/REQ-fs-002-backend-security-data-loss-gaps` |
| REQ-fs-003 | Finish the backend API: class controllers, shared errors, alumni search, feed data | merged | `specs/_archive/2026-10/fs/REQ-fs-003-finish-backend-api` |
| REQ-fs-004 | New frontend part 1 of 4: foundation, theme, base components, app shell, log in and sign-up | merged | `specs/_archive/2026-10/fs/REQ-fs-004-frontend-foundation-shell-auth` |
| REQ-fs-005 | New frontend part 2 of 4: alumni directory, alumni profile and My profile | merged | `specs/_archive/2026-10/fs/REQ-fs-005-frontend-directory-and-profiles` |
| REQ-fs-006 | New frontend part 3 of 4: feed, dashboard and Recent posts on the alumni profile | merged | `specs/_archive/2026-10/fs/REQ-fs-006-frontend-feed-and-dashboard` |
| REQ-fs-007 | New frontend part 4 of 4: admin Users page, About page, phone polish and performance | ready to merge | `specs/2026-10/fs/REQ-fs-007-frontend-users-about-polish-perf` |

## ADRs

| ID | Title | Status | Decided |
|---|---|---|---|
| [[architecture/adr-01-sign-up-role-is-student-or-alumni\|ADR-01]] | Sign-up role is student or alumni; admin is never selectable | accepted | 2026-10-02 |
| [[architecture/adr-02-admin-deletes-any-post-edits-only-own\|ADR-02]] | An admin can delete any post but edit only their own | accepted | 2026-10-02 |
| [[architecture/adr-03-one-alumni-profile-per-user-created-by-that-user\|ADR-03]] | One alumni profile per user, created only by that user | accepted | 2026-10-02 |
| [[architecture/adr-04-profile-photo-is-a-url-field\|ADR-04]] | A profile photo is a URL field, with an initials avatar as fallback | accepted | 2026-10-02 |
| [[architecture/adr-05-post-list-returns-author-name-and-photo\|ADR-05]] | `GET /api/posts` returns each post's author name and photo | accepted | 2026-10-02 |
| [[architecture/adr-06-deleting-rows-that-other-rows-reference\|ADR-06]] | Deleting rows that other rows reference: backend deletes for posts and comments, never for users; no migration | accepted | 2026-10-03 |
| [[architecture/adr-07-design-direction-oak-ink-band\|ADR-07]] | Design direction is "Oak, ink band", with light, dark and system themes | accepted | 2026-10-06 |
| [[architecture/adr-08-mentoring-and-field-stay-two-new-alumni-columns\|ADR-08]] | Mentoring and field stay in the design; `alumni` gets two new columns | accepted | 2026-10-06 |
| [[architecture/adr-09-white-label-app-name-from-one-constant\|ADR-09]] | The app is white-label; its name "University Alumni" is text from one constant | accepted | 2026-10-06 |
| [[architecture/adr-10-about-page-last-privacy-and-password-reset-later\|ADR-10]] | The About page is built last; the Privacy page and password reset are later work | accepted | 2026-10-06 |
| [[architecture/adr-11-typed-errors-and-one-error-middleware\|ADR-11]] | Code throws typed errors; one middleware turns them into `{ error }` | accepted | 2026-10-06 |
| [[architecture/adr-12-list-endpoints-answer-items-total-page-limit\|ADR-12]] | List endpoints answer `{ items, total, page, limit }` | accepted | 2026-10-06 |
| [[architecture/adr-13-frontend-structure-css-modules-on-tokens\|ADR-13]] | Frontend structure: four layers, CSS Modules on one token file, own icons, self-hosted font | accepted | 2026-10-07 |
| [[architecture/adr-14-session-and-theme-kept-in-the-browser\|ADR-14]] | The session token and the theme choice are kept in the browser's localStorage | accepted | 2026-10-07 |

## Concepts

Patterns, rules that must always hold, domain models.

| Page | One-line summary |
|---|---|
| [[knowledge/concepts/user-join-read-shape]] | Reads that need the person join `"User"` with named columns, never `password` |
| [[knowledge/concepts/partial-update-sent-fields]] | An update writes only the fields that were sent; `null` clears; column names never come from the request |
| [[knowledge/concepts/paged-list-query]] | A paged list answers `{ items, total, page, limit }`; one WHERE shared by a count and a page query |
| [[knowledge/concepts/frontend-session-flow]] | One token, one way to end a session, one place that navigates after a log in |
| [[knowledge/concepts/latest-request-wins]] | Abort the older call, ignore its late answer, clear the atom when the page closes |
| [[knowledge/concepts/address-as-state]] | Search, filters and page live in the URL; pure reader and writer; debounce and focus rules; the shared hook useListAddress |
| [[knowledge/concepts/aligned-load-more]] | A "Load more" feed over a page-numbered API: next page from the held count, merge by id, a log of local total changes |

## Components

One page per major module.

| Page | Module | Owner |
|---|---|---|
| [[knowledge/components/dal-query-classes]] | `backend/src/dal/query/`, `dal/dto/` | farhansadik10-ai |
| [[knowledge/components/api-controllers-and-routes]] | `backend/src/api/controllers/`, `routes/`, `MiddleWare/`, `utils/` | farhansadik10-ai |
| [[knowledge/components/frontend-app]] | `frontend/src/` (config, styles, lib, services, store, routes, hooks, components, pages) | farhansadik10-ai |

## Lessons

See [[knowledge/lesson-ledger]] — generated, one row per lesson, rebuilt by every skill that writes a lesson. Not edited here.

## Gotchas

See [[knowledge/gotchas]] — single-file consolidated list with `^g##` anchors.

## Reference

Cross-cutting reference docs that don't fit elsewhere.

| Page | What it covers |
|---|---|
| [[context/design-system]] | The UI contract: tokens, scales, components and patterns of the approved design ("Oak, ink band") |
