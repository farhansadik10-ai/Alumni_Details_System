# TASK-002 — Validators and the alumni form rules

| Field | Value |
|---|---|
| REQ | REQ-fs-005 |
| Tier | 0 |
| Status | pending |
| Repo | alumni-details-system |
| Depends on | none |
| Blocks | TASK-003, TASK-010, TASK-011 |

## Goal

The rules of the two My profile forms are pure functions with cases in the library check, written from the spec (AC26, AC25, AC49).

## Files to touch

| Path | Action |
|---|---|
| `frontend/src/lib/validation.ts` | edit |
| `frontend/src/lib/alumniForm.ts` | create |
| `scripts/frontend-lib-check.ts` | edit |

## Approach

- `validation.ts`: add exported constants for the limits (`MAX_TEXT_LENGTH = 100`, `MAX_BIO_LENGTH = 2000`, `MAX_LINK_LENGTH = 500`, `MIN_GRADUATION_YEAR = 1950`, `GRADUATION_YEARS_AHEAD = 6`) and their messages. New validators, each takes the text as typed and returns a message or `null`: `validateGraduationYear(value, thisYear)` (empty is fine; exactly four digits; 1950 to thisYear + 6), `validateOptionalText(value, max)` (judged after trim; counts characters, not UTF-16 units), `validateLinkedInLink(value)` (empty fine; `isWebLink`; at most 500). Add the 100-character limit to `validateName` and the 500 limit to `validatePhotoLink`, keeping every existing message and case.
- `alumniForm.ts`: `AlumniFormValues` (strings: department, graduationYear, field, company, jobTitle, experience, linkedinUrl, bio; boolean: mentoring), `EMPTY_ALUMNI_FORM`, `alumniToForm(alumni | null)` (null fields become `""`; year becomes text), `validateAlumniForm(values, thisYear)` returning a partial map field→message, `alumniFormToBody(values)` returning an object with all nine API keys (`department`, `graduation_year`, `current_company`, `job_title`, `experience`, `bio`, `linkedin_url`, `mentorship_available`, `field`): trimmed text, empty becomes `null`, year becomes a number or `null`, never `user_id`. Types are `import type` from `@alumni/shared`. Export `firstInvalidField(errors)` using the on-screen order of the fields, so a page can focus it.
- `frontend-lib-check.ts`: add cases written from the spec: year `1949` fails, `1950` passes, `thisYear + 6` passes, `+7` fails, `abc`, `20199`, ` 2019 ` (trim then four digits), empty passes; text of 100 passes and 101 fails (also 100 emoji pairs count as 100); bio 2000 / 2001; link `ftp://x`, `https://x.y`, a 500-character and a 501-character link; name of 100 / 101 characters; the existing sign-up cases stay green. `alumniFormToBody` and `alumniToForm` round trip, an all-empty form gives nine keys with `null` / `false`. Run the script once with one expected value changed on purpose, see exit 1, change it back, record both runs in the implementation notes.

## Acceptance

- [ ] AC25, AC26 (rules) hold in the cases above
- [ ] `npx tsx scripts/frontend-lib-check.ts` exits 0, and was seen to exit 1 for a wrong expectation
- [ ] `validateName` / `validatePhotoLink` still give the part 1 messages for the part 1 cases
- [ ] `npm run build` exits 0

## Notes

Rules for every task of this REQ: see TASK-001. G34: these limits are the database column sizes (100 for department, company, job title, experience and the name); `field` follows 100. Messages stay in this file as exported constants, as in part 1 (pattern 16).

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-005-frontend-directory-and-profiles/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-004-2-one-rule-one-function-in-lib|L-REQ-fs-004-2]], [[knowledge/lessons/LESSON-REQ-fs-004-6-a-check-that-reads-only-tracked-files|L-REQ-fs-004-6]]
