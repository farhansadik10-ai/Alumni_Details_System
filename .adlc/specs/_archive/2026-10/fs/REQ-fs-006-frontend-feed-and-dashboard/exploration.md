# REQ-fs-006 — Codebase exploration

| Field | Value |
|---|---|
| Generated | 2026-10-08 |
| By | codebase-explorer (tier: fast) |
| Repo(s) scanned | alumni-details-system |

## 1. Similar existing implementations

| Path | What it does | Recommended action |
|---|---|---|
| `frontend/src/pages/DirectoryPage/DirectoryPage.tsx` | Paginated list with filters, search, state in address, latest-request pattern, clearOnUnmount | **Follow pattern exactly**: same state wiring, address management, loading/empty/error/ready states, focus handling, queryKey for deduplication |
| `frontend/src/pages/AlumniProfilePage/AlumniProfilePage.tsx` | Profile page with loading state, error retry, cleanup on unmount, band with dynamic heading | **Follow pattern**: cleanup on unmount (`clearViewed`), error retry with focus to band's h1, separate atom for the loaded object's id to check staleness |
| `frontend/src/store/alumniAtoms.ts` + `alumniActions.ts` | State management for lists, filters, profiles with latestRequest deduplication, idle/loading/ready/error/notFound states, 404 handling | **Follow pattern**: one atom per major state (posts list, my posts, recent posts), loadXAtom/clearXAtom pairs, latestRequest begin/isCurrent/cancel, resetOnSessionChange via resetAlumniAtom call |
| `frontend/src/store/latestRequest.ts` | Deduplication for multiple concurrent requests; AbortSignal and ticket pattern | **Use directly**: calls to listPosts will hand ticket.signal to the service, check ticket.isCurrent() after answer |
| `frontend/src/lib/alumniDisplay.ts` | Display rules: presentText (trim-or-null), displayName, firstName, jobLine, sameText | **Reuse for posts/comments**: the same presentText rule applies to captions, comment text, author names |
| `frontend/src/lib/validation.ts` | Validators (isWebLink, validatePhotoLink, etc.) and message constants | **Reuse**: isWebLink checks media_url, validatePhotoLink rule applied; tooLongMessage(2000) for caption, tooLongMessage(1000) for comment |
| `frontend/src/lib/loadFailure.ts` + `saveFailure.ts` | Failure classification: kind (network vs http), status codes, reason→words | **Use directly**: loadFailureText for list fails, saveFailureReason for edit/delete fails, distinguish 403/404/409 |
| `frontend/src/services/alumniService.ts` | Service layer pattern: apiClient.get/post, AbortSignal, Paged<T> response | **Follow pattern**: new postService.ts with listPosts(params, signal), createPost(body), updatePost(id, body), deletePost(id), getCommentsByPost(postId), createComment(body), updateComment(id, body), deleteComment(id), getStats() |
| `frontend/src/lib/directoryQuery.ts` | Query string parsing, history state, hasCriteria check, readXQuery/writeXQuery pair | **Not used here**: Feed has no filters, only page + older-post deduplication; Dashboard has no address state |
| `frontend/src/components/ui/Card/Card.tsx` | Semantic wrapper: `as="div"|"section"|"article"`, padding, aria-labelledby | **Reuse for post cards and dashboard blocks**: `as="article"` for posts, `as="section"` for Dashboard blocks |
| `frontend/src/components/ui/Button/Button.tsx` | Variant, tone, busy (ignores click, shows busyLabel), size, fullWidth | **Reuse**: publish/comment button busy, delete confirm button busy, all actions honor AC19 (double press) via busy |
| `frontend/src/components/ui/Field/Field.tsx` + `TextInput/Textarea.tsx` | Label, help, error wiring; control gets id, describedBy, invalid props | **Reuse**: caption field (Textarea), image link field (TextInput), comment text field (Textarea), all with error message below per AC8/AC12 |
| `frontend/src/components/ui/EmptyState/ErrorState.tsx` | Heading, text, optional action button | **Reuse**: feed empty (alumni vs student text), recent posts empty on profile ("has not posted yet"), dashboard blocks empty |
| `frontend/src/components/ui/Skeleton/Skeleton.tsx` + `SkeletonGroup.tsx` | Shape: line, title, avatar-sm/md, block; SkeletonGroup wraps with "Loading" + aria-busy | **Reuse**: post card skeleton (avatar, 2-3 lines), dashboard block skeleton |
| `frontend/src/components/ui/Dialog/Dialog.tsx` + `ConfirmDialog.tsx` | Modal with native `<dialog>`, showModal, focus management, Escape handling, aria-labelledby/describedby | **Reuse**: delete confirm (post/comment), title names action, children describe consequence (comments go with post per AC17) |
| `frontend/src/components/ui/Avatar/Avatar.tsx` | Name + photo; shows photo only when http(s) link and loads; initials fallback | **Reuse**: post/comment author avatar (name is separate text, never link) |
| `frontend/src/components/ui/Link/Link.tsx` | InApp (to + state) or plain (href); strong weight option | **Reuse**: profile public link on My profile, author name stays plain text not Link (per spec difference), "See all" and filter links |
| `frontend/src/components/ui/Tag/Tag.tsx` + `RoleTag.tsx` | Tag variant (plain, mentoring, role-student/alumni/admin); never color alone | **Not used**: spec says post author role not shown (ADR-05); can't carry role in post answer |
| `frontend/src/components/ui/Message/Message.tsx` | Alert (error) or status (success); icon + words; can take ref and hold focus | **Reuse**: form validation messages (caption empty, image invalid, text too long), could move focus here on error per AC8/AC12 |
| `frontend/src/components/ui/Toast/ToastViewport.tsx` | Store-driven (toastAtom), auto-dismiss, pause on hover, list in bottom corner | **Reuse**: "Post published", "Post saved", "Post deleted", "Comment added", etc. via addToastAtom |
| `frontend/src/components/ui/Pagination/Pagination.tsx` | Page/pageCount, onChange handler, Previous/Next buttons, "Page X of Y" status, focus on page change | **Not used**: Feed uses "Load more" button (C1), Dashboard/recent posts have max 3 items (no pagination) |
| `frontend/src/components/shell/Band/Band.tsx` | Heading + optional sub line, accent bar, heading is h1 with tabIndex -1 | **Reuse**: Feed band (heading "Feed", sub from design), Dashboard band (heading "Welcome back, <first name>") |
| `frontend/src/components/shell/PageLayout/PageLayout.tsx` + `PageNote.tsx` | Frame with band, optional custom band, content pulled over it; PageNote is a static card statement | **Reuse**: FeedPage and DashboardPage wrap content in PageLayout with Band |
| `frontend/src/store/sessionAtoms.ts` + `sessionActions.ts` | Session from token (sub, role), profile (name, photo_url), authNotice, login/logout/endSession/tokenChangedElsewhere | **Use for**: req.user.sub (user_id in form body, optional user_id filter query), req.user.role to hide "Write post" from students, profile.name for Dashboard greeting |

## 2. Blast radius

| Path | Why touched | Risk |
|---|---|---|
| `frontend/src/pages/FeedPage/FeedPage.tsx` | Complete rewrite: replaces BeingBuilt placeholder with full post list, write form, comments, actions | **high** |
| `frontend/src/pages/DashboardPage/DashboardPage.tsx` | Complete rewrite: replaces BeingBuilt with 4 blocks (counts, recent posts, your profile, new people), each with own state | **high** |
| `frontend/src/pages/AlumniProfilePage/AlumniProfilePage.tsx` | Adds optional "Recent posts" block below About block (only if AC26 approved); new load and state | **med** (optional, additive only) |
| `frontend/src/services/postService.ts` (new file) | New service: listPosts, createPost, updatePost, deletePost, getCommentsByPost, createComment, updateComment, deleteComment, getStats | **low** (new, no dependents yet) |
| `frontend/src/store/postAtoms.ts` (new file) | New atoms: postsAtom, postsLoadAtom, postFormAtom (or per-form state in component); same latestRequest, idle/loading/ready/error | **low** (new, isolated) |
| `frontend/src/store/sessionActions.ts` | May call resetPostAtom on session change (if needed); currently resetAlumniAtom exists, post state follows same pattern | **low** (checks sessionAtom?.userId already; pattern established) |
| `frontend/src/components/ui/` | No changes: all UI components pre-exist (Card, Button, Field, TextInput, Textarea, Dialog, EmptyState, ErrorState, Skeleton, Avatar, Link, Message, Toast) | **low** (reuse only) |
| `frontend/src/config/text.ts` | Add constants for: Feed band sub, Dashboard greeting patterns, "Write post" button/form labels, "N comments" singular/plural, empty/error messages for each block, char limits, comment placeholder, post button labels, "Load more" text, "Open to mentoring" label, etc. | **low** (additions only) |
| `frontend/src/lib/` | Add dateText(iso8601) → "3 October 2026"; add commentCountText(n) → "No comments yet" / "1 comment" / "N comments"; both pure functions to go in a new lib/postDisplay.ts (follows alumniDisplay.ts pattern) | **low** (new, reusable) |
| `frontend/src/routes/paths.ts` | Already has /feed and /dashboard; no changes | **low** |
| `frontend/src/App.tsx` | Already has route entries for FeedPage and DashboardPage (lines 15, 18, 58, 61); no changes | **low** |
| `backend/src/api/controllers/PostController.ts` | **Only if AC26 approved**: add optional `user_id` query param to getAllPosts, parse with toWholeNumber, apply filter to both list query and count (digits only, 400 on bad value, same as parseId pattern) | **med** (modifies query param parsing) |
| `backend/src/businessLogic/src/PostManager.ts` | **Only if AC26**: pass filter param to postQuery.listPosts | **low** (thin layer, just pass-through) |
| `backend/src/dal/query/PostQuery.ts` | **Only if AC26**: listPosts accepts optional userId param, applies `WHERE p.user_id = $n` to both the rows query and count query so totals stay correct | **med** (affects SQL, count must match rows filter) |
| `backend/src/api/utils/requestHelpers.ts` | No changes needed; toWholeNumber and parseId already exist and can be reused | **low** |
| `postman/` | Add one example request: GET `/api/posts?user_id=123` with response showing Paged<Post> result | **low** (documentation, if AC26 approved) |

## 3. Integration points

**Frontend entry points (pages and routes):**
- `PATHS.feed` and `PATHS.dashboard` already defined and routed (App.tsx lines 58, 61)
- FeedPage and DashboardPage already lazy-loaded
- Both inside `<RequireAuth>`, so sessionAtom is available
- Feed is `/feed`, Dashboard is `/dashboard` (per directoryPage/myProfilePage pattern)

**Backend entry points (routes and controllers):**
- `POST /api/posts` - createPost (requires authMiddleware, requireRole alumni/admin)
- `GET /api/posts` - getAllPosts (requires authMiddleware; **conditionally add optional user_id filter per AC26**)
- `GET /api/posts/:id/comments` - getCommentsByPost (requires authMiddleware)
- `PUT /api/posts/:id` - updatePost (requires authMiddleware, author-only per isSelf check)
- `DELETE /api/posts/:id` - deletePost (requires authMiddleware, author-or-admin per isSelf + isAdmin check)
- `POST /api/comments` - createComment (in CommentRoutes, requires authMiddleware)
- `PUT /api/comments/:id` - updateComment (author-only)
- `DELETE /api/comments/:id` - deleteComment (author-or-admin)
- `GET /api/stats` - getStats (already exists, returns { alumni, students, posts, mentoring })

**Cross-cutting concerns:**
- **Auth**: Every route checked by authMiddleware; roleMiddleware used for create; isSelf/isAdmin checked in controllers for edit/delete
- **Errors**: Typed errors (ValidationError, ForbiddenError, NotFoundError) caught by one error middleware, returned as `{ error: "<message>" }`; 401 follows existing session-ended path; 403 and 404 distinguished in frontend (saveFailure.ts)
- **Paging**: DirectoryPage pattern (parsePaging, queryKey deduplication, latest-request-wins) should NOT be copied for Feed; Feed uses "Load more" button (C1), no page param (latest answer replaces older, but user always clicks to load more, never types a URL with &page=2)
- **State reset on session change**: sessionActions.ts already calls `resetAlumniAtom` when session changes; post state should follow same pattern (new resetPostAtom called from sessionActions)
- **Cleanup on page unmount**: both FeedPage and DashboardPage should clear their atoms when unmount (useEffect cleanup) to prevent stale data showing next visit
- **Focus management**: Feed comments open/close should reset focus; delete confirms should move focus to heading after close (C11); edit/save should move focus back to Edit button (C11)

**Shared state:**
- `sessionAtom`: provides userId (for author checks, filtering), role (for alumni-only UI)
- `profileAtom`: provides user's name for Dashboard greeting (first word via firstName helper)
- `myAlumniAtom`: optional profile data for Dashboard "Your profile" block and alumni profile "Recent posts" block

**Shared utilities:**
- `presentText(value)`: trim-or-null rule for caption, comment text, author name
- `firstName(name)`: first word for "Welcome back, Nadia"
- `displayName(name)`: with fallback "Name not given"
- `jobLine(title, company)`: for Dashboard "new people" and profile block
- `isWebLink(url)`: for image link validation
- `loadFailureText(failure)`: for list fails
- `saveFailureReason(failure)`: for edit/delete fails, distinguish 403/404/409
- `toApiFailure(error)`: convert errors to ApiFailure shape
- `isCancelled(error)`: check if request was aborted

## 4. Test coverage

**No test runner exists.** Manual testing via:

| Test file / Check | Scenarios covered | Gaps for new code |
|---|---|---|
| `npm run build` (TypeScript build) | Type safety of all imports, exports, props | Must pass before every gate |
| `npm run check:frontend` (scripts/frontend-style-check.mjs) | No color literal, px number, antd, axios in UI, box-shadow, outline:none, app name only in config, etc. | New components and pages must follow rules a–k; media queries must match layout.ts phone breakpoint |
| `npm run check:frontend` (scripts/frontend-lib-check.ts) | Pure functions in lib/; cases like dateText("2026-10-03") and commentCountText(0, 1, 5) with expected outputs written from spec (C9, C3) | AC36 requires new cases in frontend-lib-check.ts for the two new rules; must prove they can fail |
| `dev ComponentsPage` (frontend/src/pages/dev/ComponentsPage/ComponentsPage.tsx) | Shows all components in all states | AC38 requires new post card and comment card, every state (loading, ready, empty, error, edit, delete confirm) |
| Manual checklist in spec | Every AC1–AC38 scenario (user interactions, edge cases, focus, a11y, themes, 360–2000px, keyboard) | No automated check; each AC must be walked through before gate |
| Postman collection | GET /api/posts, GET /api/posts/:id/comments, POST /api/posts, PUT /api/posts/:id, DELETE /api/posts/:id, POST /api/comments, PUT /api/comments/:id, DELETE /api/comments/:id, GET /api/stats | **If AC26 approved**: add one example with ?user_id=123 and prove 400 on invalid value |

**Specific gaps:**
- No test for "latest request wins" (G48, latestRequest.ts). Manually checked: load list, quickly leave and return, or switch user, ensure old data never shows.
- No test for cleanup on unmount. Manually checked: load Feed, go to Directory, back to Feed; old data not shown.
- No test for comment nesting and flat rendering (C3, reply under comment). Design shows the layout; code logic tested by walking through "add comment, reply to comment, see reply under comment" manually.
- No test for edge cases like 2000-char caption, 1000-char comment (AC8, AC12). Validators exist; manual typing or a Postman script can check.
- No test for date rendering across time zones (assumption: `created_at` is `timestamp without time zone` per spec, viewer sees local date; assumption needs verification per Assumptions section of spec).
- No test for role-based UI (student without "Write post" form). Manually checked: log in as student, confirm no form; log in as alumni, confirm form shown.

## Vault references

- [[knowledge/concepts/latest-request-wins]] — pattern used in DirectoryPage; Feed does not use address-based deduplication (no page in URL), but must use latestRequest for concurrent comment loads
- [[knowledge/lessons/LESSON-REQ-fs-002-3-new-helper-convert-every-sibling]] — post card, comment card, date text, comment count text must be shared pieces in lib/, not duplicated
- [[knowledge/lessons/LESSON-REQ-fs-004-4-check-focus-for-real]] — focus management (C11, edit button, delete confirm, heading after close) must be tested manually
- [[knowledge/lessons/LESSON-REQ-fs-004-5-find-out-what-listens-on-the-api-port]] — backend dev server runs on 3000; Vite proxy in frontend/vite.config.ts routes /api requests there
- [[knowledge/lessons/LESSON-REQ-fs-005-1-disable-until-changed-has-three-traps]] — post/comment forms must use the same pattern: button disabled while loading (AC19), or custom "disable if no change" logic per form state
- [[knowledge/lessons/LESSON-REQ-fs-005-2-store-state-outlives-the-page]] — FeedPage and DashboardPage must clear their atoms on unmount (AC35), and resetPostAtom must be called on session change (sessionActions.ts pattern already exists for alumni)
- [[knowledge/lessons/LESSON-REQ-fs-005-5-does-the-reused-part-carry-what-the-design-needs]] — post card (caption, date, author name, avatar, comment count, action buttons) must work for Feed list, Dashboard recent posts, and alumni profile recent posts; design shows avatar size consistent, no role tag shown
- [[knowledge/gotchas#^g11|G11]] — posts.comment_count column is never read or written in code; comment count is always counted live from the comment table per AC2 line "comment count worked out when the post is read"
- [[knowledge/gotchas#^g33|G33]] — PostController.findPostById is not bound to a route; it is called internally only
- [[knowledge/gotchas#^g38|G38]] — shared types compiled output (.d.ts, .js) is checked in; if you edit .ts files in shared/, keep .js/.d.ts in sync
- [[knowledge/gotchas#^g48|G48]] — StrictMode starts effects twice; latestRequest.isCurrent() must be checked after every async operation to drop late answers
- [[architecture/adr-02-admin-deletes-any-post-edits-only-own]] — edit is author-only (line 74 PostController), delete is author-or-admin (lines 95–96); same for comments
- [[architecture/adr-05-post-list-returns-author-name-and-photo]] — post answer carries author name and photo_url, not role or alumni id; cannot show role tag or link to profile
- [[architecture/adr-06-deleting-rows-that-other-rows-reference]] — delete post cascades to comments and replies in one transaction; delete comment cascades to its replies
- [[architecture/adr-11-typed-errors-and-one-error-middleware]] — every throw in a controller is caught by one error middleware; response is `{ error: "<message>" }` with status from the error type
- [[architecture/adr-12-list-endpoints-answer-items-total-page-limit]] — GET /api/posts response is `{ items, total, page, limit }` in that order; same for other lists
- [[architecture/adr-13-frontend-structure-css-modules-on-tokens]] — component stylesheets have no literals; all values are tokens
- [[architecture/adr-14-session-and-theme-kept-in-the-browser]] — session (token, user id, role) read from localStorage by sessionAtoms.ts; profile (name, photo) stored in profileAtom by sessionActions.ts

## Open questions

1. **AC26 approval**: Backend filter for `GET /api/posts?user_id=<digits>` — required for alumni profile "Recent posts" (AC27, AC28). Spec default is (a) add the filter. User must confirm or choose (b) defer the block.
2. **Date format assumption**: "3 October 2026" — spec says `created_at` column is `timestamp without time zone` in the database. The JSON response carries an ISO string (e.g., "2026-10-03T14:30:00"). When the browser interprets this as UTC and displays local time, does "October 3, 2026" at midnight UTC show as "October 3" in a browser 5 hours west (e.g., US East), or as "October 2"? Spec assumption: ISO string is meant to be read in the viewer's local time zone. Needs verification against real database behavior.
3. **Comment reply visual order (C3)**: Spec says replies are shown "one level deep: a reply to a reply is saved under that reply but drawn flat under the top-level comment, oldest first." This means if comment A has replies B (reply to A), C (reply to B), D (reply to A), the display is A, B, C, D all under A in time order. Confirmed by CommentController.listCommentsByPost, which returns all comments for a post with parent_id set; code must sort by created_at and group by parent_id to show the flat layout.
4. **"Load more" button state (AC3)**: Button shows only when `loaded_count < total`. Must disappear before the retry error message appears (if retry fails, button stays gone and message shows below the list, per "if it fails, a message with 'Try again' shows under the list and the posts already shown stay"). Design consequence: the button list index must be calculated each render to decide whether to show it.

## Summary of component and prop requirements

**Reusable pieces to audit/create:**

| Component/Util | Props required | Carries Feed | Carries Dashboard | Carries Profile Recent |
|---|---|---|---|---|
| Post card (new) | post: Post, onEdit, onDelete, onCommentToggle, opened: bool, onCommentAdded, comments loading/empty/error | ✓ (list + form above) | ✓ (3 items, no form) | ✓ (3 items, no form) |
| Comment card (new) | comment: Comment, onReply, onEdit, onDelete, isReply: bool, parentName?: string | ✓ (open from post) | — | — |
| Post form (in FeedPage) | caption, mediaUrl, errors, onCaptionChange, onMediaUrlChange, onSubmit, busy | ✓ (at top) | — (shown only if logged in as alumni/admin) | — |
| Comment form (in post card) | placeholder, error, onTextChange, onCancel, onSubmit, replyingTo?: string, busy | ✓ (in open post) | — | — |
| dateText(iso: string): string | — | Every post and comment | Every post and comment | Every post |
| commentCountText(total: number): string | — | Every post | Every post | Every post |
| Dashboard counts block (new) | stats loading/error/ready, stats.alumni/students/posts/mentoring | — | ✓ (one block) | — |
| Dashboard recent posts block (new) | posts loading/empty/error/ready, posts[] | — | ✓ (one block) | — |
| Dashboard "Your profile" block (new) | alumni loading/error/ready/none, alumni data, userRole | — | ✓ (one block) | — |
| Dashboard "New in directory" block (new) | alumni loading/error/ready, alumni[] | — | ✓ (one block) | — |
| Feed side "Open to mentoring" block (AC20, new) | alumni loading/error/ready, alumni[] | ✓ (below posts on wide, after on phone) | — | — |
| Alumni profile "Recent posts" block (new, AC26 only) | posts loading/error/empty/ready, posts[], alumni.user_id | — | — | ✓ (if AC26 approved) |

All new components use existing UI primitives (Card, Button, Field, Skeleton, EmptyState, ErrorState, Message, Toast, Dialog, Link, Avatar, Tag). Post card and comment card can be visual variations of AlumniCard structure (avatar-name-date-content layout).

