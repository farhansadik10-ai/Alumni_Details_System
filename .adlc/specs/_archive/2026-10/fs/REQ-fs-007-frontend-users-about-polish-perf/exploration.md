# REQ-fs-007 — Codebase exploration

| Field | Value |
|---|---|
| Generated | 2026-10-08 |
| By | codebase-explorer (tier: fast) |
| Repo(s) scanned | alumni-details-system |

## 1. Similar existing implementations

| Path | What it does | Recommended action |
|---|---|---|
| `frontend/src/pages/DirectoryPage/DirectoryPage.tsx` | Alumni directory list: search box with 300ms delay, filter dropdown panel, role-based (admin) access, pagination, load/error/empty states, skeleton loader, address-driven query in URL. Each filter writes to address; latest request pattern prevents old answers overwriting new. | **follow** — Users page uses same pattern: query string in address, filters (role only), pagination, latestRequest for load cancellation, ConfirmDialog for delete. Copy the directoryQuery pattern adapted for users (q, role, page). |
| `frontend/src/lib/directoryQuery.ts` | Read/write directory query from URL: `readDirectoryQuery()`, `writeDirectoryQuery()`, `toListParams()`, `hasCriteria()`, `lastPage()`. Handles defaults, validation, order preservation. | **follow** — Create `usersQuery.ts` with same shape: read/write `{ q, role, page }` to address; `toListParams()` sends only set values. |
| `frontend/src/components/ui/Table/Table.tsx` | Generic table with rows, columns, rowKey, caption. On phone (stylesheet), rows become cards with column headers as labels. | **follow** — Users page uses Table for admin-only row list. |
| `frontend/src/components/ui/Pagination/Pagination.tsx` | Page navigation 1 to N, keeps focus after page change. | **follow** — Users page pagination. |
| `frontend/src/components/ui/Dialog/ConfirmDialog.tsx` | "Are you sure?" dialog, Cancel button gets focus, danger variant for red button. | **follow** — Delete user confirmation, modeled on FeedPost delete (lines 246–260 of FeedPost.tsx). |
| `frontend/src/components/ui/Tag/RoleTag.tsx` | Maps role string ("student", "alumni", "admin") to variant and label. Unknown role renders nothing. | **follow** — Users table role column; same role tag for "You" next to logged-in admin's name. |
| `frontend/src/components/ui/Avatar/Avatar.tsx` | Photo with fallback initials, `loading="lazy"`. No width/height yet; AC25 adds them. | **follow** — Users table Name column shows avatar + name. |
| `frontend/src/components/posts/FeedPost/FeedPost.tsx` lines 148–173 | Delete post: open dialog (line 134), confirm (line 148–173 `handleConfirmDelete`), show error in dialog or as toast if closed, toast on success. Refs track dialog state separate from UI state (confirmOpenRef, deletingRef). | **follow** — Users delete uses same pattern: dialog with error message inside or toast after close, row removed from list on success. |
| `frontend/src/components/posts/CommentItem/CommentItem.tsx` lines 145–170 | Comment delete: same pattern as FeedPost. Also shows r1 fix (line 113 checks `editingRef.current` before `onRemoved()`). | **reference** — Shows safe delete pattern. |
| `frontend/src/components/shell/Footer/Footer.tsx` | Footer inside AppShell, shows APP_NAME constant only. About link planned here (ADR-10). | **extend** — Add About link with href from PATHS.about. |
| `frontend/src/components/shell/AppShell/AppShell.tsx` | Frame around every logged-in page: skip link, header, main, footer. Footer is last child (line 95). Suspense around Outlet for lazy pages. | **reference** — AppShell already has Footer; About page route goes inside AppShell like other pages. |
| `frontend/src/store/postAtoms.ts` lines 1–100 | Feed state with `latestRequest` pattern (line 128): `createLatestRequest()` creates one per loader; `scope.isCurrent()` checks if answer is still wanted. Older calls aborted; late answers dropped. | **follow** — Users load also uses latestRequest (new atom). Pattern prevents race on delete (latest request wins). |
| `frontend/src/store/latestRequest.ts` | `createLatestRequest()` returns `{ begin(), cancel() }`. `begin()` returns ticket with `signal` (pass to fetch) and `isCurrent()` (check after answer). | **follow** — Users atoms use same latestRequest. |
| `frontend/src/lib/contentOwner.ts` | `canDeleteContent(session, userId)` returns true for author or admin. | **follow** — Users table Delete button guard (only non-self, admin check redundant here). |
| `frontend/src/lib/loadFailure.ts` | `loadFailureText(failure)` returns user words for network or server error; one rule for every loader. | **follow** — Users error state uses same words. |
| `frontend/src/lib/writeFailure.ts` | `isGone(failure)` (404), `writeFailureText(failure, words)` map 403/404/other to user words. | **follow** — Users delete error message uses same rules. |
| `frontend/src/lib/alumniDisplay.ts` lines 17–30 | `presentText(text)` trims and returns null if empty; `sameText(a, b)` compares trimmed. Used by AccountCard to decide "Save is disabled". | **follow** — m6 fix: Post/comment edit forms check `sameText(caption, initialCaption) && sameText(media, initialMedia)` before sending PUT (see "Open questions" section). |
| `frontend/src/services/userService.ts` | `getUser(id)`, `updateUser(id, body)`, `logOut(id)`. No list endpoint yet; A1 says GET /api/users exists with q, role, page, limit params. | **reference** — Assumption A1 to verify at gate. |
| `@alumni/shared types` — `PublicUser` | User with no password; role is string or null. | **follow** — Users list rows are PublicUser[]; filter role sends only when set. |
| `@alumni/shared types` — `Paged<T>` | `{ items, total, page, limit }` response shape. | **follow** — Users list answer is Paged<PublicUser>. |

## 2. Blast radius

| Path | Why touched | Risk |
|---|---|---|
| `frontend/src/pages/UsersPage/UsersPage.tsx` | Placeholder → full Users page (list, delete, filters, pagination) | high |
| `frontend/src/pages/AboutPage/AboutPage.tsx` | New file. Page with heading, text from config, no new component. | high (new file) |
| `frontend/src/store/usersAtoms.ts` | New file. Atoms for users list state, delete action, latestRequest pattern. | high (new file) |
| `frontend/src/lib/usersQuery.ts` | New file. Read/write users query from address (q, role, page). | high (new file) |
| `frontend/src/config/text.ts` | Add USERS_* and ABOUT_* text constants; add text accessors like `directoryCount()`. | medium (additive) |
| `frontend/src/routes/paths.ts` | Add `about: "/about"` constant. | low (additive) |
| `frontend/src/App.tsx` | Add `const AboutPage = lazy(() => import(...))` at line 13–27 range; add route at line 56–67 range inside AppShell. | low (additive) |
| `frontend/src/components/shell/Footer/Footer.tsx` | Add About link with href from PATHS.about. | low (additive) |
| `frontend/src/services/userService.ts` | Add `listUsers(params: UserListParams)` function. | low (additive) |
| `frontend/src/lib/token.ts` (session id access) | No change needed; `session.userId` is already accessible from sessionAtom. | low (reference) |
| `frontend/src/App.tsx` (RequireAdmin) | Users route already guarded by RequireAdmin (line 63). About route does not need guard (logged-in only via AppShell). | low (reference) |
| `frontend/index.html` | No change to font preload (already correct per A9: only Latin hanken-grotesk). | low |
| `frontend/vite.config.ts` | No change needed; route splitting already configured (React.lazy). | low (reference) |
| `frontend/src/main.tsx` | No change; font import `@fontsource-variable/hanken-grotesk` already in place. | low (reference) |
| `frontend/src/components/ui/Avatar/Avatar.tsx` | Avatar images need `width` and `height` attributes (AC25). Also `loading="lazy"` already present. | medium (modify) |
| `frontend/src/components/posts/PostText/PostText.tsx` | Post images need `width`, `height`, `loading="lazy"`, `decoding="async"`. Check if already set. | medium (audit) |
| `frontend/src/components/posts/PostForm/PostForm.tsx` | m6 fix: Check if caption and media_url have changed before sending PUT. Compare `sameText(caption, initialCaption)`. | medium (modify) |
| `frontend/src/components/posts/CommentForm/CommentForm.tsx` | m6 fix: Check if comment text changed before sending PUT (same as PostForm). | medium (modify) |
| `frontend/src/components/posts/FeedPost/FeedPost.tsx` | No change; already models delete pattern correctly for Users page. | low (reference) |
| `frontend/src/store/postAtoms.ts` lines 34–44 | n2 issue: "Load more" racing a write can show total one off. Check if totalEdits log properly applies local changes to older server answer. Code at lines 34–44 documents totalEdits; search for usage in "Load more" load. | medium (audit) |
| CSS modules (phone risk) | All component CSS modules checked for `width`, `min-width`, `nowrap`, `overflow`. Good pattern: `overflow-wrap: anywhere` on text, `min-width: 0` on flex parents. Examples: PhoneMenu.module.css lines 143, 150; AlumniCard.module.css lines 32, 37; FeedPost.module.css line 61. | low (audit) |
| `frontend/src/pages/*/[PageName].module.css` (phone risk) | Each page audited at 360px and 390px; dialog, toast, header, phone menu do not overlap or scroll sideways. AC21 requires no new literal colors, px widths, or media queries outside phone breakpoint. | low (audit) |

## 3. Integration points

### Routes and navigation
- **Entry point:** `App.tsx` (lines 34–76). About route added inside AppShell (after MyProfilePage, before or after Users). Users route already guarded by RequireAdmin (line 63).
- **Address constants:** `routes/paths.ts` — add `about: "/about"` (line 16).
- **Footer link:** `components/shell/Footer/Footer.tsx` — add link with href=`${PATHS.about}` and text from config. Link is visible on every logged-in page because Footer is in AppShell.

### State and API
- **Users list state:** New `store/usersAtoms.ts` with `usersAtom` (status, items, total, page, limit, failure), `loadUsersAtom`, `deleteUserAtom`, one `usersRequest` latestRequest. Pattern mirrors `feedAtom` and `directoryAtom`.
- **Delete user:** New `deleteUserAtom` in postActions-like file or in usersAtoms; calls `userService.deleteUser(id)`, patches state, returns `{ ok: true } | { ok: false; failure }`. On 409, page shows "user has posts/comments/alumni profile"; on 404, row removed silently; on other errors, page message or toast.
- **Session access:** `sessionAtom` (from `store/sessionAtoms.ts`) gives `{ userId, role }`. Logged-in admin's id is `useAtomValue(sessionAtom)?.userId`. Users page compares it to row userId to show "You" tag and hide Delete button.
- **API:** `services/userService.ts` adds `listUsers(q?: string, role?: string, page?: number, limit?: number): Promise<Paged<PublicUser>>` and updates `deleteUser(id)` (if not already present). No sign of list endpoint in current file; A1 says it exists.

### Query string and address
- **Atoms:** `usersAtom` holds `queryKey` (the address URLSearchParams stringified, like directoryAtom line 27) to mark which query loaded the state. Only patch the state if `current.queryKey === newQueryKey` (prevents stale data).
- **Query library:** New `lib/usersQuery.ts` with `readUsersQuery()`, `writeUsersQuery()`, `toListParams()` mirroring directoryQuery.ts. No departments/years/fields filters; only q (text search) and role.

### Components reused
- **Table:** `ui/Table/Table.tsx` with columns: Name (Avatar + name), Email, Role (RoleTag), Joined (date), Actions (Delete button). "You" tag next to logged-in admin's name in Name column (see AC5).
- **Pagination:** `ui/Pagination/Pagination.tsx` with onChange handler that writes page to address.
- **Delete dialog:** `ui/Dialog/ConfirmDialog.tsx`, danger variant. Body includes person's name (e.g., "Delete Alice Chen?") and list of blockers ("Alice Chen has posts, comments, or an alumni profile").
- **EmptyState, ErrorState:** For no results and load failure, with retry button.
- **Skeleton, SkeletonGroup:** Loading state while list fetches.
- **Message:** Show error message inside dialog if delete fails with 409 (user has content).
- **Toast:** Show success or failure message after dialog closes or request completes.
- **Avatar, RoleTag:** In Name column; role column.

### Shared utilities
- **loadFailureText():** Load error message (same for Users as Directory).
- **writeFailureText():** Error message for failed delete (403 forbidden, 404 gone, other).
- **contentOwner:** `canDeleteContent(session, userId)` — but Users page only shows Delete on rows where userId ≠ session.userId (ACL in UI, not in utility; server enforces it).
- **Session:** Access `session.userId` to know logged-in admin's id.

### Performance and entry chunk
- **Route splitting:** Users and About pages are both `React.lazy` imports in App.tsx, so each is its own file in the build and fetched only when first shown (already configured, AC6/AC23).
- **Entry chunk:** `main.tsx` line 3 imports font; line 4-5 import CSS files (all in entry). No import of postAtoms, alumniAtoms, or validator libraries should be in App.tsx or main.tsx (only in pages/components that use them).
- **Image attributes:** Every `<img>` in Users table rows (avatar) and in existing post/comment images (PostText) must have `width`, `height`, `loading="lazy"` (unless top-of-page), `decoding="async"` (AC25).

### Auth and roles
- **Admin-only access:** RequireAdmin guard on Users route already in place (App.tsx line 63–65).
- **Delete ownership:** Server returns 403 if non-admin tries delete, 404 if user is gone, 409 if user has content. UI shows Delete button only on rows where userId ≠ session.userId.

### Cross-cutting concerns
- **Error handling:** One error middleware on backend (ADR-11); every error is `{ error: "<message>" }`. Frontend uses `ApiError` type, `apiError.ts` to parse failures.
- **Logging:** None (not in scope).
- **Observability:** Toast confirms success/failure; dialog shows 409 message inline.

## 4. Test coverage

| Test file | Scenarios covered | Gaps for new code |
|---|---|---|
| None | No automated test runner exists in the repo. The build, style check, and library check are the tests. | Users page and About page add new code with no test file. AC36 forbids reaching the database or session, so manual checklist covers real login + real delete. Build checks (AC35) confirm no antd, no `.env` import, no backend imports. |

Manual checks listed in spec AC17–AC21: phone widths (360px, 390px, 200% zoom), both themes, no sideways scroll, no overlap of toast/dialog/menu, contrast WCAG AA, focus visible, long words wrap. AC22–AC27: build sizes recorded before and after; lazy loading audited; font preload verified; images have attributes; list rows not re-rendered (memo audit); motion respects prefers-reduced-motion.

## 5. Open questions

1. **A1 (backend API):** GET /api/users endpoint exists and works as spec says (q, role, page params; returns Paged<PublicUser>). DELETE /api/users/:id answers 409 when user has posts, comments, or alumni profile. To be verified at spec gate or manual checklist.

2. **A3 (409 wording):** User "has posts, comments or an alumni profile" (spec words) vs. "has posts or comments" (task words). Assumption: include alumni profile (common standard in ADR-06). If different, update dialog words.

3. **n2 item (Load more total one off):** In postAtoms.ts, the `totalEdits` array logs local changes (line 44, type FeedTotalEdit). When "Load more" runs and gets an older server total from before the local change, does the load handler apply the edits (add/subtract them)? If still buggy and fix is one line, it is fixed here (AC29); if not one line or unsafe, it is listed in AC30 skipped items. Needs code read of loadMoreFeedAtom in postAtoms.ts.

4. **m6 item (Edit Save with no change):** PostForm and CommentForm both submit even when values are unchanged. Check: does `presentText(caption) === presentText(initialCaption)` work? The fix (one line per form) is to wrap `onSubmit()` call with `if (changed) { ... }` before sending. If safe, fixed here (AC28); if not, listed in AC30. The utility `sameText()` exists in alumniDisplay.ts (lines 29–31) and is already used in AccountCard (lines 70–73 show the pattern).

## Vault references

- [[knowledge/lessons/LESSON-REQ-fs-002-3-new-helper-convert-every-sibling|L-REQ-fs-002-3]] — Shared rules written once (sameText, presentText applied to Posts and Comments).
- [[knowledge/lessons/LESSON-REQ-fs-005-1-disable-until-changed-has-three-traps|L-REQ-fs-005-1]] — One trap: disabling Save when form unchanged (pattern for m6 fix).
- [[knowledge/lessons/LESSON-REQ-fs-006-2-an-async-answer-may-only-change-its-own-state|L-REQ-fs-006-2]] — latestRequest pattern: older answers are dropped (used by Users loader).
- [[knowledge/lessons/LESSON-REQ-fs-006-3-patched-list-total-needs-a-log-of-local-changes|L-REQ-fs-006-3]] — totalEdits log for Load more (n2 item, needs audit).
- [[knowledge/gotchas#^g48|G48]] — latestRequest: StrictMode double-run, old answers dropped.
- [[knowledge/gotchas#^g50|G50]] — Headless browser audit (pattern reference).
- [[knowledge/gotchas#^g56|G56]] — Session rules: no .env, pg, dotenv, database, real socket.
- [[architecture/adr-06-deleting-rows-that-other-rows-reference|ADR-06]] — User delete blocked when has content (posts, comments, alumni profile).
- [[architecture/adr-10-about-page-last-privacy-and-password-reset-later|ADR-10]] — About page logged-in only (A5), footer link, no Privacy or password reset (A7).
- [[architecture/adr-11-typed-errors-and-one-error-middleware|ADR-11]] — Error format `{ error: "<message>" }`.
- [[architecture/adr-12-list-endpoints-answer-items-total-page-limit|ADR-12]] — Paged<T> response shape.

## Dependency sketch

```
App.tsx (routes)
  ├─ AboutPage (lazy)
  └─ UsersPage (lazy, RequireAdmin guard)
       ├─ usersAtoms (state, delete action, latestRequest)
       ├─ usersQuery (address pattern)
       ├─ Table, Pagination, ConfirmDialog, RoleTag, Avatar
       ├─ EmptyState, ErrorState, Skeleton, Toast, Message
       └─ Footer.tsx (About link added)

directoryAtom + directoryQuery → model for usersAtom + usersQuery
postAtoms (latestRequest pattern) → used by usersAtoms (delete is write, not load)
sessionAtom → access userId for "You" tag and Delete button guard
```

## Open questions for spec gate

None block the spec. Three decisions from assumptions:
- [ ] A1: Backend API verified (spec gate manual checklist).
- [ ] A3: 409 wording includes alumni profile (proceed or override at gate).
- [ ] A5: About page logged-in only (proceed or make public at gate).

## Summary

Users page and About page are new additions following established patterns (Directory, Feed, My Profile). The Users page reuses Table, Pagination, Dialog, and the latestRequest load pattern; delete uses the FeedPost/CommentItem model. About is a simple page with static text from config. Footer link and route are straightforward additions. Two small issues (m6 save-on-unchanged, n2 load-more total) are audited; n2 needs code read before deciding if the fix is one line.
