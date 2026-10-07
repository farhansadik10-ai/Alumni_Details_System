# TASK-012 — My profile page

| Field | Value |
|---|---|
| REQ | REQ-fs-005 |
| Tier | 3 |
| Status | pending |
| Repo | alumni-details-system |
| Depends on | TASK-006, TASK-010, TASK-011 |
| Blocks | TASK-014 |

## Goal

`/profile` assembles the band and the cards by role (AC21, AC22, AC32, AC33, AC34).

## Files to touch

| Path | Action |
|---|---|
| `frontend/src/pages/MyProfilePage/MyProfilePage.tsx` | edit (replace the placeholder) |
| `frontend/src/pages/MyProfilePage/MyProfilePage.module.css` | create |

## Approach

- `PageLayout` with `band={<ProfileBand …/>}` (avatar xl, name, email line, role tag; "See my public profile" link to `alumniProfilePath(id)` only when `myAlumniAtom` is `ready`). While the user is loading the band shows the loading heading.
- Role from `sessionAtom`: `alumni` or `admin` → `AlumniProfileCard` first, then `AccountCard`; anything else (student, no role) → `AccountCard` only. The placeholder's Log out code is removed (it lives in `AccountCard`).
- The heading is "My profile". The page has one `<h1>`.

## Acceptance

- [ ] AC22: as a student no request goes to `/api/alumni/me` (mock log)
- [ ] AC32: the public-profile link is absent before a profile exists and present after the first save
- [ ] AC33: Log out works from the card; the phone menu's Log out is untouched
- [ ] No leftover `BeingBuilt` import in the three finished pages (AC34); `BeingBuilt` itself stays for the other routes
- [ ] `npm run build` and style check exit 0

## Notes

Rules for every task of this REQ: see TASK-001. Check the cards in the order a keyboard meets them: band link, alumni card, account card.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-005-frontend-directory-and-profiles/architecture]]
