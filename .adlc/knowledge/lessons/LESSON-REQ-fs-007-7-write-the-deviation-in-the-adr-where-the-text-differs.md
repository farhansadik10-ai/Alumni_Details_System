# When a spec or a screen departs from words an accepted ADR fixes, write the deviation in the ADR at that gate ^L-REQ-fs-007-7

| Field | Value |
|---|---|
| ID | LESSON-REQ-fs-007-7 |
| Captured | 2026-10-09 |
| REQ | REQ-fs-007 |
| Component | `architecture/adr-06`, `architecture/adr-10`, `config/text.ts` |
| Tags | adr, process, wording, vault |
| Severity | guideline (a rule to follow) |

## The lesson

An ADR can fix words (a message) or content (what a page shows). If the spec or the screen then says something different, add one deviation line to the ADR at the spec or architecture gate, not at review. Otherwise the reviewers find the difference as a conflict and an open question (such as "where does the app version come from") stays open for months.

## Saw it in

- ADR-06 fixes "This user has posts, comments or an alumni profile and cannot be deleted"; the Users page says "{name} cannot be deleted because they still have posts, comments or an alumni profile. Nothing was changed." (ARCH-001).
- ADR-10 lists "who can join" and "the app version" for the About page; AC14 (no invented facts) dropped both and nothing recorded it (REFL-002).

## Related

- Originating REQ: REQ-fs-007
- ADRs: [[architecture/adr-06-deleting-rows-that-other-rows-reference]], [[architecture/adr-10-about-page-last-privacy-and-password-reset-later]]
