# TASK-009 — Alumni profile page

| Field | Value |
|---|---|
| REQ | REQ-fs-005 |
| Tier | 2 |
| Status | pending |
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
- [ ] No hard-coded text; `npm run build` and style check exit 0

## Notes

Rules for every task of this REQ: see TASK-001. G42: the email shows as drawn. There is no "Recent posts" block (non-goal).

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-005-frontend-directory-and-profiles/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-004-1-router-state-survives-a-reload|L-REQ-fs-004-1]]; gotchas G42, G49
