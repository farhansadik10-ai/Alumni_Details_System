# REQ-fs-005 — manual checklist for the owner

| Field | Value |
|---|---|
| REQ | REQ-fs-005 |
| Written by | task-implementer, TASK-014 |
| Date | 2026-10-08 |

These are the checks a mock API could not prove. Run them against the real backend with `npm run dev` from the repo root. Tick each line when it holds. Use test accounts, not real people's data: saving a profile writes to the database.

## Before you start

- [ ] The API dev server runs on port 3000 and `/api/health` answers.
- [ ] You have three test accounts: a student, an alumni with no profile, and an alumni with a profile.

## Directory, real data

- [ ] `/directory` shows the real count and the first page of real alumni.
- [ ] The three filter lists hold the real departments, years and fields.
- [ ] Searching a real name, company and job title each finds that person.
- [ ] "Only show alumni open to mentoring" shows only people marked open to mentoring.
- [ ] Changing page shows the next people, with no person shown twice.
- [ ] A link copied from the address bar, opened in a new tab, shows the same results.
- [ ] A real photo link on another host shows the photo on the card; a broken one shows initials.

## Alumni profile, real data

- [ ] A real profile shows every filled-in field and "Not given" for the empty ones.
- [ ] "Email <first name>" opens your mail program with the address filled in.
- [ ] "LinkedIn profile" opens LinkedIn in a new tab.
- [ ] `/directory/` followed by an id that does not exist shows "This profile does not exist".

## My profile, real data

- [ ] As the student: only the Account card, and the server log shows no call to `/api/alumni/me`.
- [ ] As the alumni with no profile: fill the form, Save, and the profile appears in the directory.
- [ ] Reload My profile: the saved values are in the form.
- [ ] Clear a field, Save, reload: the field is empty in the database (not the old value).
- [ ] As the alumni with a profile: change the job title, Save, and the directory card shows it.
- [ ] Change your name in the Account card, Save: the header shows the new name without a reload.
- [ ] Open My profile in two tabs as the alumni with no profile; save in the first, then in the second: the second says you already had a profile and shows it.
- [ ] Log out from the Account card: you land on the log-in page, and logging in as another user shows that user's profile, not yours.

## Screen reader (NVDA on Windows, or VoiceOver)

- [ ] The directory's count line is read when the results change ("12 alumni", "No alumni found").
- [ ] While the list loads, "Loading" is read once, not once per card.
- [ ] Each "View profile" link is read with the person's name.
- [ ] After changing page, the reader is at the count line.
- [ ] On the phone layout, the Filters button is read as collapsed or expanded.
- [ ] On a profile, the heading is read as the person's name, and "LinkedIn profile" says it opens in a new tab.
- [ ] On My profile, a failed Save reads the error message, and a field error is read with its field.
- [ ] The "Profile saved" and "Account saved" toasts are read.

## Zoom, phone and contrast

- [ ] At 200% browser zoom, the directory, a profile and My profile have no sideways scroll and nothing overlaps.
- [ ] On a real phone, the Filters panel opens and closes, and the cards are one column.
- [ ] In both themes, the "Open to mentoring" tag on the dark band is readable.
- [ ] In the light theme, the admin role tag on My profile's band is readable (its box matches the band; TASK-006 notes).
- [ ] The keyboard focus ring is visible on every link, button, field and select of the three pages, in both themes.

## Things the browser review left open (see check-notes.md, section 3)

- [ ] Decide: should Back after a first search return to the plain directory?
- [ ] Decide: should the optional fields of the Alumni profile card say "(optional)"?
