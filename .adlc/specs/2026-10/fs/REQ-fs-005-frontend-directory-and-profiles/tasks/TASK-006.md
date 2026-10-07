# TASK-006 — Avatar size, band slot and ProfileBand

| Field | Value |
|---|---|
| REQ | REQ-fs-005 |
| Tier | 0 |
| Status | pending |
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

- [ ] `PageLayout` without `band` renders exactly as before (the log-in-free shell pages and the being-built pages are unchanged)
- [ ] `ProfileBand` shows correctly at 360px and 200% zoom: a 100-character name wraps; the actions wrap
- [ ] `node scripts/frontend-style-check.mjs` exits 0 (no literal, rule j media query)
- [ ] `npm run build` exits 0

## Notes

Rules for every task of this REQ: see TASK-001. Colors for tags on the band come from the existing `Tag` variants; if "Open to mentoring" (accent-soft) is not readable on `--band`, the contrast is checked in both themes before the task is done (AC40).

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-005-frontend-directory-and-profiles/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-fs-002-3-new-helper-convert-every-sibling|L-REQ-fs-002-3]]; gotchas G45, G46, G49
