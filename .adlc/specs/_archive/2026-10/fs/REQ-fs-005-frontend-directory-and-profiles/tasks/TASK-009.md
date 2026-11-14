# TASK-009 — Alumni profile page

| Field | Value |
|---|---|
| REQ | REQ-fs-005 |
| Tier | 2 |
| Status | complete |
| Repo | alumni-details-system |
| Depends on | TASK-001, TASK-003, TASK-005, TASK-006 |
| Blocks | TASK-014 |

## Goal

`/directory/:id` shows one person's public profile with its loading, not-found and error states (AC15 to AC20, AC34, AC35).

## Files to touch

| Path | Action |
|---|---|
| `frontend/src/pages/AlumniProfilePage/AlumniProfilePage.tsx` | edit (replace the placeholder) |
| `frontend/src/pages/AlumniProfilePage/AlumniProfilePage.module.css` | create |

## Approach

- `useParams().id`: digits only (`/^\d+$/` and at most the integer range the server accepts), else the not-found state with no request. Otherwise call `loadAlumniAtom(id)` in an effect on the id.
- `PageLayout` with `band={<ProfileBand …/>}` and `heading` = the name when ready, "Alumni profile" before and when not found (tab title, AC19). `ProfileBand` is rendered in every status at the same place so the `<h1>` survives. Back link target: `PATHS.directory + readDirectorySearch(location.state)`.
- Ready: band with avatar (xl), mentoring tag, name, `jobLine`, plain tags (department, class, field), actions row: "Email <first name>" `mailto:` when the email exists; "LinkedIn profile" only when `isWebLink(linkedin_url)`, with `target="_blank"`, `rel="noopener noreferrer"` and a hidden "(opens in a new tab)". Content: a two-column grid on wide screens (About `Card` with the bio, or "Not given"; Details `Card` as a `<dl>` with the eight rows of AC15, each `orNotGiven`), one column on a phone.
- Loading: the band with the loading heading and one skeleton `Card` shaped like About and Details. Not found: `PageNote`/`EmptyState` with a link back to the directory. Error: `ErrorState` with retry.
- All text is rendered as text (no HTML insertion); long unbroken words wrap (`overflow-wrap`).

## Acceptance

- [ ] AC16: a `javascript:` or `ftp:` `linkedin_url` is never a link; a missing email shows no mailto
- [ ] AC17: from a filtered directory, the back link returns to the same filters; in a new tab it returns to the plain directory
- [ ] AC18: `/directory/abc` and `/directory/99999` (404) show not-found; no request for `abc`; 500 shows the error state; retry works
- [ ] AC20: a 300-character word in the bio does not widen the page at 360px
- [x] No hard-coded text; `npm run build` and style check exit 0

## Notes

Rules for every task of this REQ: see TASK-001. G42: the email shows as drawn. There is no "Recent posts" block (non-goal).

Implementation notes (TASK-009, 2026-10-08):

- Status comes from `viewedAlumniAtom` only when its `id` equals the page's id; `idle`, `loading` or another id all count as loading, so a previous profile never shows for a frame.
- `readProfileId` (local to the page): digits only, 1 to 2147483647 (the server's `parseId` cap). `0`, `abc`, `1.5`, `-3`, a 23-digit string and Arabic-Indic digits all give not-found with no request. Checked by a copy of the rule in the scratchpad (17 cases pass).
- No first name: the email action reads "Email" (`PROFILE_EMAIL_LABEL`). No new words were added to `config/text.ts`.
- LinkedIn: trimmed, then a link only if `isWebLink` (http/https); new tab, `rel="noopener noreferrer"`, hidden " (opens in a new tab)".
- The email is also a `mailto:` link in the Details row, as drawn. The Details rows are eight: department, year, field, company, job title, experience, email, mentoring.
- Loading: the same two-column layout with two still cards inside one `SkeletonGroup` (one "Loading"), so nothing jumps when the data arrives. The task said "one skeleton Card"; two cards match the ready layout.
- The not-found link goes to the same address as "Back to directory" (the saved filters, or the plain directory).
- The bio keeps typed line breaks (`white-space: pre-line`); the bio, the Details values and the tags use `overflow-wrap: anywhere`; the grid uses `minmax(0, ...)` so a 300-character word cannot widen the page (AC20). Checked by reading; the browser check at 360px is TASK-014's.
- Follow-ups (not done, outside this task's files): move `readProfileId` and the failure-to-text rule into `lib/` with library-check cases (CAND-015, CAND-016). Pressing "Try again" unmounts the button, so focus falls to the page body.
- `npm run build` and `node scripts/frontend-style-check.mjs` pass.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-005-frontend-directory-and-profiles/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-004-1-router-state-survives-a-reload|L-REQ-fs-004-1]]; gotchas G42, G49

## Fix round 1 - batch A

- m1 (CORR-001): new `lib/mailtoLink.ts` `mailtoHref(email)`: null unless the trimmed email passes `validateEmail`, is at most 100 characters and matches a plain address (letters, digits, `. _ + -`, a dotted domain); the parts are encoded with `encodeURIComponent`. The band hides "Email Name" and the Details row shows the email as text when it is null. 20 cases in scripts/frontend-lib-check.ts. Not put in lib/alumniDisplay.ts as the finding suggested: that file belongs to another fix batch.
- m4 (CORR-004, ARCH-005): new `clearViewedAlumniAtom` cancels the profile call and sets the viewed profile to idle; the page calls it on unmount, so the next visit (also your own profile after a save) starts from "loading", never from an old error, "not found" or old data.
