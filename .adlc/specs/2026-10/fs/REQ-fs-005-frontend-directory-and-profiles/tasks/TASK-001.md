# TASK-001 — All new words in config/text.ts

| Field | Value |
|---|---|
| REQ | REQ-fs-005 |
| Tier | 0 |
| Status | complete |
| Repo | alumni-details-system |
| Depends on | none |
| Blocks | TASK-003, TASK-007, TASK-009, TASK-010, TASK-011 |

## Goal

Every word the three pages show, read out or announce is a named constant in `config/text.ts`, grouped by page, so no page types a sentence itself (AC38).

## Files to touch

| Path | Action |
|---|---|
| `frontend/src/config/text.ts` | edit |

## Approach

- Keep `LOADING_TEXT`. Add groups, each under a one-line comment: shared words (`NOT_GIVEN` "Not given", `NAME_NOT_GIVEN` "Name not given", job-line word " at ", class prefix "Class of", "Open to mentoring"), directory, alumni profile, My profile (both cards), and the failure words.
- Directory group, from `directory.html` and `phone-directory.html`: heading "Alumni directory", sub line, labels (Search, Department, Graduation year, Field, "Only show alumni open to mentoring"), first options ("All departments", "Any year", "Any field"), buttons (Search, Filters, "Clear search and filters"), "View profile" with the name appended by a small function, the count words ("86 alumni", "1 alumnus", loading, none, could not load), empty-state heading and text (two versions: with criteria / empty directory), error heading and text (two versions: no answer / server refused), filter-options error text, `Filters (2)` as a function.
- Alumni profile group: "Back to directory", "Email <first name>", "LinkedIn profile", "(opens in a new tab)", "About", "Details", row labels, mentoring values ("Open to students", "Not at the moment"), not-found heading/text/link, error heading/text, the band's loading heading "Alumni profile".
- My profile group: page heading and sub line, card headings ("Alumni profile", "Account"), the card intro line, every label and help ("Ask an admin to change your email.", "Without a photo, your initials are shown."), "(optional)", the checkbox text, buttons ("Save profile", "Discard changes", "Save account", "Log out"), toasts ("Profile saved", "Account saved"), "See my public profile", "Role", the profile-load error, the account-load error, and the save-failure messages: no answer, server error, conflict ("You already had a profile, so we loaded it. Check the details and save again."), can-no-longer-save with its retry label.
- Functions are allowed only for a word with a hole in it (a name, a count, a year). No imports, no DOM (the Vite config reads config files).
- A later task that needs a word the file lacks adds it to its own page group, nothing else in the file.

## Acceptance

- [ ] Each AC38 word is a constant; no sentence is left for a page to type
- [ ] The app name and contact email are not written here (`node scripts/frontend-style-check.mjs` rule e passes)
- [ ] `npm run build` exits 0

## Notes

Rules for every task of this REQ: never read or print any `.env` file; never run `psql` or anything that changes the database; never run `git push`; touch nothing under `backend/`, `shared/` (except TASK-013's comments), `db/`; delete no file the table does not list; add no package; stop and write why if the task cannot be done inside these rules. Plain English, short sentences, no emoji.

Implementation notes (TASK-001, 2026-10-08):

- Shared groups added besides the page groups: `RETRY_LABEL` and a "failure words" pair (`FAILURE_NO_ANSWER_TEXT`, `FAILURE_SERVER_TEXT`). Each page has its own error heading and uses this pair as the text, so the directory, profile and My profile load errors do not repeat the same two sentences.
- Functions: `directoryFiltersButton(n)`, `directoryViewProfileName(name)` (accessible name starts with the visible "View profile"), `directoryCount(n)`, `profileEmailLink(firstName)`, `myProfileSub(name, email)`.
- The form's company label is "Current company" (from `my-profile.html`); the profile Details row is "Company" (from `profile.html` and AC15). AC23 lists "Company"; the picture was followed.
- The phone sub line in `phone-directory.html` is shorter; only the `directory.html` sub line is kept (AC1).
- The "can no longer save" retry is `RETRY_LABEL` ("Try again"), as AC30 says.
- `npm run build` and `node scripts/frontend-style-check.mjs` pass.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-005-frontend-directory-and-profiles/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-002-3-new-helper-convert-every-sibling|L-REQ-fs-002-3]]
