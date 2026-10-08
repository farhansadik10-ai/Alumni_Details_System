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

## Notes

Done 2026-10-08 (task-implementer).

- Every word was already in `text.ts` (TASK-005); nothing was added there.
- AboutPage: `PageLayout` (heading `ABOUT_HEADING`, sub `aboutSub(APP_NAME)`), then two `Card`s with `padding="lg"`: a plain card holding two `<section>`s (purpose, what you can do) and a `section` card for "Who to ask". The email link is `mailtoHref(CONTACT_EMAIL)`; if that is ever null (owner sets a non-plain address) the email shows as text. The email sits in a span with `overflow-wrap: anywhere` so a long address cannot scroll sideways at 360px. One phone media query (it narrows the gap between the two sections).
- Footer: `.inner` is now a flex row with `flex-wrap` and `space-between`, so name and About sit on two lines when they do not fit; no media query. The link is the shared `Link` (`to={PATHS.about}`), so it keeps the shared focus ring. Header nav is unchanged.
- Route: `<Route path={PATHS.about}>` sits inside `RequireAuth` and `AppShell`, after the admin route and before the not-found route.
- Checks: `npm run build` exit 0, `dist/assets` has `AboutPage-*.js` and `AboutPage-*.css`; style check PASS (rule e 0); lib check 529 passed; `grep -in "privacy\|password reset"` on AboutPage and text.ts finds nothing.
- Not done here: the browser check (360px, both themes, Tab to the link, focus on the heading) is TASK-012's.

## Related

- Architecture: [[specs/2026-10/fs/REQ-fs-007-frontend-users-about-polish-perf/architecture]]
- ADRs: [[architecture/adr-09-white-label-app-name-from-one-constant|ADR-09]], [[architecture/adr-10-about-page-last-privacy-and-password-reset-later|ADR-10]]
