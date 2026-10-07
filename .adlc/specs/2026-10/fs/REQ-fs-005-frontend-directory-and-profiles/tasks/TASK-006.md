# TASK-006 — Avatar size, band slot and ProfileBand

| Field | Value |
|---|---|
| REQ | REQ-fs-005 |
| Tier | 0 |
| Status | complete |
| Repo | alumni-details-system |
| Depends on | none |
| Blocks | TASK-007, TASK-009, TASK-012 |

## Goal

One band for a person (back link or links, avatar, tags, name, contact links) exists once and serves the profile page and My profile (AC15, AC36).

## Files to touch

| Path | Action |
|---|---|
| `frontend/src/styles/tokens.css` | edit |
| `frontend/src/components/ui/Avatar/Avatar.tsx` | edit |
| `frontend/src/components/ui/Avatar/Avatar.module.css` | edit |
| `frontend/src/components/shell/PageLayout/PageLayout.tsx` | edit |
| `frontend/src/components/shell/ProfileBand/ProfileBand.tsx` | create |
| `frontend/src/components/shell/ProfileBand/ProfileBand.module.css` | create |

## Approach

- `tokens.css`: in "Added by later tasks" add `--avatar-xl: 120px` with a comment (profile.html); redefine it as `96px` in the existing phone block (my-profile.html). No color is added.
- `Avatar`: size `"xl"`; the initials font size follows the size as for the other sizes.
- `PageLayout`: optional `band?: ReactNode`. When given it is rendered instead of `<Band>`; `heading` is still required and still sets the tab title. The content column and the first-card overlap are unchanged.
- `ProfileBand`: props for an optional back link (`to`, label), `avatar` (name, photo), a tag slot, `heading` (the one `<h1>`, `tabIndex={-1}` so the shell can focus it), `sub` text, a tags row, an actions row (links) and a loading flag. The outside box takes `.band` and the padding rule from `Band.module.css` with `composes`, so the two bands can never drift. The same component renders in every page status, so the `<h1>` node is kept when data arrives. Back link: a `Link`-like control in band colors, 44px high, with the chevron icon (an existing icon; add a `ChevronLeftIcon` only if none can be turned, as a copy of one icon file, pattern 20).
- Tokens only. Reduced motion needs nothing here (no motion).

## Acceptance

- [x] `PageLayout` without `band` renders exactly as before (the log-in-free shell pages and the being-built pages are unchanged)
- [ ] `ProfileBand` shows correctly at 360px and 200% zoom: a 100-character name wraps; the actions wrap (by construction only; nothing renders it yet, see Notes)
- [x] `node scripts/frontend-style-check.mjs` exits 0 (no literal, rule j media query)
- [x] `npm run build` exits 0

## Notes

Rules for every task of this REQ: see TASK-001. Colors for tags on the band come from the existing `Tag` variants; if "Open to mentoring" (accent-soft) is not readable on `--band`, the contrast is checked in both themes before the task is done (AC40).

### Implementation notes (task-implementer, 2026-10-08)

- **Deviation, tokens.** `--avatar-xl: 120px` is in "Added by later tasks" as asked, but the 96px phone value is in a new phone block right after it, not in section 4. Section 4 comes earlier in the file, and a later `:root` rule of the same weight wins over it, so 96px there would never apply.
- **Avatar xl.** Initials are `calc(var(--avatar-xl) / 3)`: 40px at 120 and 32px at 96, as in the two pictures; letter spacing `--tracking-snug` (-0.02em, as drawn).
- **PageLayout.** `band ?? <Band …/>`; without `band` the output is the same element tree as before. The three current callers (AppShell, BeingBuilt, NoAccess/NotFound) pass no `band`.
- **ProfileBand API.** `back {to,label}`, `avatar {name,photoUrl}`, `tag`, `heading`, `sub`, `tags`, `actions`, `loading`. Also exports `ProfileBandAction` (`to` or `href`, `variant` primary|outline, `newTab` sets `target=_blank rel="noopener noreferrer"`; the caller puts the hidden "(opens in a new tab)" in the children). TASK-009/012 use it for "Email Nadia", "LinkedIn profile", "See my public profile".
- **composes.** `.band`, `.inner`, `.heading`, `.sub` come from `Band.module.css`; the avatar loading block composes `.skeleton`. Only properties the composed class does not set are added, so stylesheet order cannot decide anything. Band's accent bar is left out (not drawn on the profile bands).
- **Against the pictures.** Back link: 44px, band-text, semibold small, left chevron (ChevronDownIcon turned 90deg; no new icon file). Its negative top margin brings it to ~16px from the top (8px on a phone) as drawn (20px), and its bottom margin plus the 12px gap gives the drawn 24px. Heading uses `--text-band` (60/36) instead of the drawn 56px, same as Band. The sub line uses Band's sub look (band-muted, 18px): my-profile.html draws that; profile.html draws the job line in band-text 20px, a small difference kept so the bands stay one look. Bottom padding keeps the card overlap (architecture choice), which neither picture draws.
- **Tags on the band.** `Tag` "plain" writes `color: var(--text)`, which is #161616 on the #161616 light band. The tags row sets `--text: var(--band-text)` so plain tags read white; the tag slot above the heading is not changed. Mentoring (accent-soft bg, accent-soft-text) and role tags carry their own background, so their text contrast does not depend on the band (same pairs as on a card, AA in both themes). One look issue: the light-theme admin role tag has the band's own background (#161616), so its box is invisible; the white text still reads.
- **Loading.** Avatar and sub line become still blocks; tag, tags and actions are left out; `aria-busy` on the band. The band itself says no "Loading" word (the page's content does), to avoid a double announcement.
- **Not checked in a browser.** No page renders ProfileBand yet (TASK-009/012), and the components page is TASK-014's file. The 360px / 200% zoom behavior is by construction (wrapping rows, `min-width: 0`, heading `overflow-wrap: break-word` from Band, `overflow-wrap: anywhere` on sub and actions) and must be seen in TASK-014's browser review.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-005-frontend-directory-and-profiles/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-002-3-new-helper-convert-every-sibling|L-REQ-fs-002-3]]; gotchas G45, G46, G49
