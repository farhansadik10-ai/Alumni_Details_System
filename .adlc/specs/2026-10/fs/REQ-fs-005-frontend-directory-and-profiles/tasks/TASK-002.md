# TASK-002 — Validators and the alumni form rules

| Field | Value |
|---|---|
| REQ | REQ-fs-005 |
| Tier | 0 |
| Status | complete |
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

- [x] AC25, AC26 (rules) hold in the cases above
- [x] `npx tsx scripts/frontend-lib-check.ts` exits 0, and was seen to exit 1 for a wrong expectation
- [x] `validateName` / `validatePhotoLink` still give the part 1 messages for the part 1 cases
- [x] `npm run build` exits 0

## Notes

Rules for every task of this REQ: see TASK-001. G34: these limits are the database column sizes (100 for department, company, job title, experience and the name); `field` follows 100. Messages stay in this file as exported constants, as in part 1 (pattern 16).

### Implementation notes (2026-10-08)

- Messages. The spec gives no wording, so: "Use N characters or fewer." (`tooLongMessage(max)`, names the limit as ADV-008 asked), "Enter a year with four digits, like 2019." (`GRADUATION_YEAR_FORMAT_MESSAGE`), "Enter a year from 1950 to <thisYear+6>." (`graduationYearRangeMessage`). The two with a number are small functions, because the number is a hole in the sentence. The link message is part 1's text, now `WEB_LINK_INVALID_MESSAGE`; `PHOTO_LINK_INVALID_MESSAGE` stays exported and equals it.
- Order of link checks: not a web link first, then length. So a 501-character `ftp://` link says "starts with https://".
- One private `validateOptionalWebLink` serves both `validatePhotoLink` and `validateLinkedInLink` (L-REQ-fs-004-2). `validateName` reuses `validateOptionalText` for its 100 limit.
- Lengths are counted with `Array.from` (characters, not UTF-16 units), after trimming. The year accepts ASCII digits only.
- `validateAlumniForm` adds errors in screen order (AC23 order), and `firstInvalidField` uses the same `FIELD_ORDER` list. `mentoring` never has an error but is in the order list.
- `alumniFormToBody` returns `Required<CreateAlumniDTO>` (all nine keys). The year becomes `null` if the text is not a whole number; the page validates first, so this is only a guard.
- Library check: 166 passed, 0 failed, exit 0. Failing run: changed the expectation of "year: 1950 passes" from `null` to the range message; the script printed `FAIL  year: 1950 passes` (got null, want "Enter a year from 1950 to 2032."), "165 passed, 1 failed", exit 1. Changed back; 166 passed, exit 0.
- `npm run build` exit 0; `node scripts/frontend-style-check.mjs` PASS, no findings.
- Note: the build type-checks `frontend/src` only, not `scripts/`. The library check runs through tsx, which strips types without checking them.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-005-frontend-directory-and-profiles/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-004-2-one-rule-one-function-in-lib|L-REQ-fs-004-2]], [[knowledge/lessons/LESSON-REQ-fs-004-6-a-check-that-reads-only-tracked-files|L-REQ-fs-004-6]]
