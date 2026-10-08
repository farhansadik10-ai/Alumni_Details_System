# TASK-010 — About page and footer link

| Field | Value |
|---|---|
| REQ | REQ-fs-007 |
| Tier | 1 |
| Status | pending |
| Repo | alumni-details-system |
| Depends on | TASK-005 |
| Blocks | TASK-012 |

## Goal

A finished About page at `/about`, reached from a footer link on every page inside the shell (spec AC13 to AC16).

## Files to touch

| Path | Action |
|---|---|
| `frontend/src/pages/AboutPage/AboutPage.tsx` + `.module.css` | create |
| `frontend/src/App.tsx` | edit: `const AboutPage = lazy(() => import("./pages/AboutPage/AboutPage"))` and `<Route path={PATHS.about} …>` inside `RequireAuth` and `AppShell`, before the not-found route |
| `frontend/src/components/shell/Footer/Footer.tsx` + `Footer.module.css` | edit: app name on the left, an About `Link` on the right; wraps at 360px |

## Approach

- `AboutPage` is `PageLayout` (one `<h1>`, the sub text) with one or two `Card`s of short paragraphs from `text.ts`. `APP_NAME` is put in by the page. The contact email is a link built with `mailtoHref` from `lib/mailtoLink.ts` and `CONTACT_EMAIL`.
- The footer link uses `frontend/src/components/ui/Link/Link.tsx` with `PATHS.about`; it has the shared visible focus ring. No other nav change (About is not in the header).
- No claim about a university: no founding year, number, name, address or policy. No Privacy or password-reset words.
- The tab title is "About · App name" (PageLayout sets it from the heading).

## Acceptance

- [ ] `npm run build` and the style check exit 0 (rule e: the app name and email are not typed).
- [ ] Browser check (TASK-012): the link shows on Dashboard, Directory, Feed, My profile, Users; Tab reaches it and shows the focus ring; the page works at 360px in both themes; focus moves to the heading after the move.
- [ ] `grep -in "privacy\|password reset" frontend/src/pages/AboutPage frontend/src/config/text.ts` finds nothing new.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-007-frontend-users-about-polish-perf/architecture]]
- ADRs: [[architecture/adr-09-white-label-app-name-from-one-constant|ADR-09]], [[architecture/adr-10-about-page-last-privacy-and-password-reset-later|ADR-10]]
