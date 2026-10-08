# TASK-012 — My profile page

| Field | Value |
|---|---|
| REQ | REQ-fs-005 |
| Tier | 3 |
| Status | complete |
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

Implementation notes (TASK-012, 2026-10-08):

- **Role source.** `sessionAtom.role` (the token) decides the cards and the band's role tag, so the two always agree. An unknown or missing role gets the Account card only and no tag. The Account card's own "Role" row still shows `user.role` from the server, as TASK-010 built it.
- **Band.** Heading is always `MY_PROFILE_HEADING`, so the `<h1>` text never changes. Avatar and sub line come from `profileAtom.user`; `loading` while the profile is idle or loading; on a profile error the band shows the Avatar's no-name look and no sub (the Account card shows the error). "See my public profile" is an outline `ProfileBandAction` to `alumniProfilePath(id)`, shown only for the alumni/admin roles when `myAlumniAtom` is `ready` (AC32). No new words were needed.
- **Cards.** `<AlumniProfileCard key={session.userId} />` and `<AccountCard primary={false} />` for alumni/admin; `<AccountCard />` alone otherwise. Keyboard order follows the DOM: band link, alumni card, account card.
- **Layout.** One flex row that wraps (bases 480 and 320 from `--space-8`, ratio 2:1, as drawn 480/300); no breakpoint decides the stacking, so it works inside 360px and 200% zoom by construction. Both cards sit in one box, so the whole row overlaps the band (PageLayout's first child). Decision not in the picture: a student's lone Account card is capped at `--measure` (620px) instead of the full page width. Column gap is `--space-6` (drawn 40px; no 40 token).
- **AC33 / AC34.** The placeholder's Log out and its `BeingBuilt` import are gone; the phone menu is untouched. `DirectoryPage` still imports `BeingBuilt` (TASK-008's file, in progress).
- **Not checked in a browser.** AC22 (mock request log), AC32 and AC33 need the mock API (TASK-014). `npm run build`, `node scripts/frontend-style-check.mjs` and `npm run check:frontend` pass.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-005-frontend-directory-and-profiles/architecture]]

## Fix round 1 - batch E

- m4 leftover (CORR-004, ARCH-005): `clearMyAlumniAtom` in `store/alumniAtoms.ts` cancels `myAlumniRequest` and sets `myAlumniAtom` to idle. `MyProfilePage` calls it from `useEffect(() => () => clearMyAlumni(), [clearMyAlumni])`, the same shape as DirectoryPage and AlumniProfilePage. Only on close, so the band's "See my public profile" link keeps working after a save. `AlumniProfileCard` is unchanged: it treats idle like loading, and its `key={session.userId}` (ADV-001) is untouched. Under StrictMode the cleanup cancels the card's first load, and the card's second effect run starts a new one.
- Docs (after m7): `docs/frontend-patterns.md` patterns 9 and 28 now point to `lib/saveFailure.ts` and `lib/loadFailure.ts` (`CallFailure`) and say the lib check covers them; pattern 23 describes the three clear-on-close atoms. Every file path in that doc was checked to exist (123 paths, none missing).
- Not changed: the historical mentions of `saveFailureText.ts` / `LoadFailure` in architecture.md, lesson-candidates.md and the task notes (they record what was true then).
- Checks: `npm run build`, `node scripts/frontend-style-check.mjs` (no findings) and `npx tsx scripts/frontend-lib-check.ts` (326 passed) all pass. Not checked in a browser.
