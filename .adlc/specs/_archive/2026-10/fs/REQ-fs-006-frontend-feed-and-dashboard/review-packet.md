# REQ-fs-006-frontend-feed-and-dashboard — Review Packet (round 3)

`Packet: 71KB · round 3 · 4 files in this round`

Round 3 packet: only the four files the third fix round touched. The diff is against the last commit, so for these four files it also contains the round 2 changes (the fixes are not committed yet). The spec, architecture and earlier packet sections are unchanged; read them from the REQ folder if you need them (that is your mandate, not a packet gap).

## Round 3 — what changed since round 2

| ID | Finding | Disposition |
|----|---------|-------------|
| n1 (REFL-006) | a late answer wiped a newer reply or edit | fixed in CommentsPanel.tsx (activeRef, changeActive, endEdit(id): clear only if it is still the same reply or edit) and CommentItem.tsx (editingRef: close the edit and move focus only if still editing) |
| n3 (QUAL-009, CORR-005) | blank-comment guard returned a made-up 400 | fixed in store/postActions.ts: new result `CommentWriteResult = PostWriteResult \| { ok: false; blank: true }` used by addCommentAtom and saveCommentAtom; the callers show the existing COMMENT_REQUIRED_MESSAGE |
| n4 (QUAL-008) | stale lines in the patterns doc | fixed in docs/frontend-patterns.md (patterns 22, 30, and 9 which also lacked the new comment-failure rule) |
| n5 (ARCH-004) | store file imports a type from a component | one sentence added to pattern 33 |

Library check 469 passed; build and style check pass. Not touched (owner's call): M1, n2, n6, m6, m14, m15, m16.

## Diff — the four files (40 lines of context, vs HEAD)

```diff
diff --git a/docs/frontend-patterns.md b/docs/frontend-patterns.md
index 7b98e7ba..e0b53b43 100644
--- a/docs/frontend-patterns.md
+++ b/docs/frontend-patterns.md
@@ -249,81 +249,81 @@ We did not choose custom hooks that hold the logic (they die with the component)
 - `onUnauthorized`: what to do when the server refuses that token.
 
 The client calls `onUnauthorized` only when all of these are true: the answer is 401; the request was not marked `skipAuthHandling`; the request really carried a token; and that token is still the current one. Log in, sign-up and log out are marked `skipAuthHandling`, because a 401 there means something else (a wrong password, for example). Log in and sign-up are also marked `withoutToken`, so an old token is not sent with them; log out still sends it.
 
 Each service file is a thin list of calls: one function per endpoint, relative `/api` paths, types from `@alumni/shared`.
 
 **Where it lives.**
 
 - The client: `frontend/src/services/apiClient.ts`
 - The hand-over, called once before the first render: `frontend/src/store/wireApi.ts`
 - Services: `frontend/src/services/authService.ts`, `frontend/src/services/userService.ts`, `frontend/src/services/alumniService.ts` (part 2; the three loaders that can be cancelled take a `signal`, see pattern 23; from part 3 its list takes an optional `limit`, so the small lists ask for 3)
 - From part 3: `frontend/src/services/postService.ts` (list, create, edit, delete a post; it owns `POSTS_PATH`), `frontend/src/services/commentService.ts` (a post's comments, create, edit, delete; it imports `POSTS_PATH` for `/api/posts/:id/comments`), `frontend/src/services/statsService.ts` (`GET /api/stats`). The list loaders take a `signal`; the deletes return nothing.
 - The dev proxy that sends `/api` to the backend: `frontend/vite.config.ts`
 
 **Why we chose it.** If the client imported the store, and the store imports the services, the two would import each other. Handing the functions in keeps the arrow pointing one way (pattern 1) and lets the client be tried with a fake token and a fake handler.
 
 We did not choose a base URL from an env variable (paths stay relative; Vite in development and Apache in production forward them), and we did not let each service add the token itself.
 
 The only timeout is on log out (5 seconds), so a hung server cannot keep the user logged in. See "Open points" at the end.
 
 **To add an endpoint in parts 2 to 4:** add a function to a service file (or a new `somethingService.ts`), call it from an action or a loading atom in `frontend/src/store/`, and read the atom in the page.
 
 ---
 
 ## 9. One failure shape; each screen chooses its own words
 
 **What it is.** Whatever goes wrong in a call becomes one of two shapes:
 
 ```ts
 type ApiFailure = { kind: "network" } | { kind: "http"; status: number };
 ```
 
 `network` means no answer came (server down, no connection, or an answer that made no sense). `http` means the server answered with an error status.
 
 The server's own error text is never shown. Each screen picks its words from `kind` and `status`. On log in, 401 becomes "The email or password is not correct." On sign-up, 409 becomes "This email is already registered." under the Email field. Everything else is "Something went wrong. Try again." Messages are named constants at the top of the page file.
 
 **Where it lives.**
 
 - `frontend/src/services/apiError.ts` (`ApiFailure`, `toApiFailure`, and `isCancelled`: a call this app cancelled is not a failure and shows nothing, pattern 23)
 - From part 2, two shared word rules, both pure and both with cases in `scripts/frontend-lib-check.ts`: `frontend/src/lib/loadFailure.ts` (a failed load; it also owns the failure shape `CallFailure` and the status numbers 403, 404, 409 and 500) and `frontend/src/lib/saveFailure.ts` (a failed save: `saveFailureReason` and `saveFailureText`; each card passes its own words)
-- From part 3, a third word rule: `frontend/src/lib/writeFailure.ts` (a failed edit, delete or publish in the feed). `writeFailureText` checks 403 first, then 404, then hands the rest to `saveFailureText`; `isGone` is the one "the server said 404" test. The caller passes its own words. Callers: `FeedPost`, `CommentItem`, `CommentsPanel`, `FeedPage` and `frontend/src/store/postActions.ts`.
+- From part 3, a third word rule: `frontend/src/lib/writeFailure.ts` (a failed edit, delete or publish in the feed). `writeFailureText` checks 403 first, then 404, then hands the rest to `saveFailureText`; `isGone` is the one "the server said 404" test. A new comment or reply has its own rule in the same file: `commentAddFailureText` reads a 400 on a reply as "the comment replied to is gone" (`isReplyTargetGone`), then 404 as "the post is gone", then 403, then hands the rest to `saveFailureText`. The caller passes its own words. Callers: `FeedPost`, `CommentItem`, `CommentsPanel`, `FeedPage` and `frontend/src/store/postActions.ts`.
 - Turned into results in `frontend/src/store/sessionActions.ts`
 - Words chosen in `frontend/src/pages/LoginPage/LoginPage.tsx` and `frontend/src/pages/SignUpPage/SignUpPage.tsx`
 
 **Why we chose it.** The same status means different things on different screens, so the words belong to the screen. The server's text is written for developers, may change, and may say more than a user should read (for example which of email or password was wrong).
 
 We did not pass the axios error up to the pages (see pattern 1), and we did not build a table of status-to-message for the whole app.
 
 ---
 
 ## 10. One way to end a session
 
 **What it is.** A session can die in three ways: the server answers 401, the token's time runs out, or the stored token cannot be read. All three go through one action, `endSessionAtom`. It removes the token, resets the profile and sets the notice `sessionEnded`. The log-in page then shows "Your session has ended. Log in again."
 
 Who calls it:
 
 - the 401 handler (pattern 8);
 - the start-up check, before the first render, for a stored token that is expired or broken;
 - the `RequireAuth` guard, which checks the clock on every render of a guarded page.
 
 Two other things can empty the token, and neither sets that notice: `logOutAtom` (notice `loggedOut`, no message shown) and `tokenChangedElsewhereAtom` (another tab logged in or out; this tab follows).
 
 The token is kept in `localStorage` under `ua.token`. The frontend reads only the middle part of the token (user id, role, expiry). It cannot check the signature; the server does.
 
 **Where it lives.**
 
 - The action: `frontend/src/store/sessionActions.ts`
 - Token, session and notice atoms: `frontend/src/store/sessionAtoms.ts`
 - Start-up check and other tabs: `frontend/src/store/wireApi.ts`
 - The guard: `frontend/src/routes/RequireAuth.tsx`
 - Reading the token: `frontend/src/lib/token.ts`
 - The message: `frontend/src/pages/LoginPage/LoginPage.tsx`
 
 **Why we chose it.** An early version of the plan only redirected when the guard found an expired token: nothing was cleared and no message was shown. With one action, an ended session looks the same however it was found, and the profile of the old user is always dropped before the next user logs in.
 
 We did not keep the token in a cookie that scripts cannot read. That is safer against an injected script, but it needs a backend change, and this part does not touch the backend. The risk and the things that limit it (no `dangerouslySetInnerHTML`, a one-hour token) are in ADR-14.
 
 ---
 
 ## 11. Route guards as layout routes; one decider after a log in
 
@@ -408,81 +408,81 @@ Log in and sign-up do not use the shell. They share `AuthLayout`: the band panel
 - A page that replaces the band with its own: `PageLayout`'s `band` slot, used with `ProfileBand` (pattern 26)
 - `frontend/src/components/auth/AuthLayout/AuthLayout.tsx`
 
 **Why we chose it.** The plan gave `BeingBuilt` its own stylesheet. While building, three pages turned out to need the same card (a statement, a line, a link). So the card became `PageNote` inside `PageLayout`, and `BeingBuilt` has nothing of its own to style. One frame also means the tab title, the single `<h1>` and the band overlap are right on every page without each page thinking about them.
 
 We did not make one shared page file for all six unbuilt routes (the build could then not show one file per page).
 
 **To build a real page in parts 2 to 4:** replace the thin page file. Keep `PageLayout` as the outer element and put your cards inside it. Delete `BeingBuilt` when the last unbuilt page is gone. Log out lives in the Account card of My profile (`frontend/src/components/profile/AccountCard/AccountCard.tsx`) and in the phone menu.
 
 ---
 
 ## 15. Field wires the label, the help text and the error
 
 **What it is.** `Field` lays out a label, a control, and the help or error text under it. It makes the ids and hands the control three things: its `id`, what describes it (`aria-describedby`), and whether it is invalid. So the label is tied to the control, and a screen reader reads the error with the field.
 
 When there is an error, it replaces the help text. `TextInput`, `PasswordInput`, `Select` and `Textarea` are all built on `Field`. A caller cannot pass its own `id`, `aria-describedby`, `aria-invalid` or `className` to them; `Field` owns those. A page reaches the control through `ref` (to move focus to it).
 
 **Where it lives.**
 
 - `frontend/src/components/ui/Field/Field.tsx` and `frontend/src/components/ui/Field/Field.module.css`
 - Built on it: `frontend/src/components/ui/TextInput/TextInput.tsx`, `frontend/src/components/ui/PasswordInput/PasswordInput.tsx`, `frontend/src/components/ui/Select/Select.tsx`, `frontend/src/components/ui/Textarea/Textarea.tsx`
 - Groups have their own wiring with `<fieldset>` and `<legend>`: `frontend/src/components/ui/RadioCards/RadioCards.tsx`. A single checkbox sits inside its own label: `frontend/src/components/ui/Checkbox/Checkbox.tsx`.
 
 **Why we chose it.** Tying a label and an error to a control takes four attributes, and one missing attribute is invisible on screen. Doing it in one component means no form can get it wrong.
 
 We did not rely on placeholders as labels, and we did not let each page write its own ids.
 
 ---
 
 ## 16. Forms without a form library; validators are pure functions
 
 **What it is.** A form page holds its values in `useState`. On submit it runs the validators, shows each message under its field, and moves focus to the first field with an error. No request is sent while there is an error. A field's error goes away when the user edits that field. Forms carry `noValidate`, so the browser's own bubbles do not appear.
 
 A validator is a plain function: it takes the text as typed and returns the message to show, or `null`. The messages are exported constants. The validators judge email and name after trimming; they never trim a password.
 
 A double submit is stopped twice: the button is busy (it stays focusable and ignores presses), and the submit handler returns early while a request runs.
 
 **Where it lives.**
 
 - Validators and messages: `frontend/src/lib/validation.ts`
-- The check that runs them without a browser: `scripts/frontend-lib-check.ts` (333 cases after part 2, 434 after part 3; the expected messages are typed out in the script on purpose, so the code is not compared with itself)
+- The check that runs them without a browser: `scripts/frontend-lib-check.ts` (333 cases after part 2, 469 after part 3; the expected messages are typed out in the script on purpose, so the code is not compared with itself)
 - Forms: `frontend/src/pages/LoginPage/LoginPage.tsx`, `frontend/src/pages/SignUpPage/SignUpPage.tsx`
 - The busy button: `frontend/src/components/ui/Button/Button.tsx`
 - Other pure functions checked the same way: `frontend/src/lib/token.ts`, `frontend/src/lib/initials.ts`
 
 **Why we chose it.** There is no test runner in this repo. A pure function can still be run from the command line, so the rules that are easiest to get wrong (what counts as an email, how long a password is) have a real check. Two forms with five fields do not need a library.
 
 We did not add a form library or a schema library. If part 3's profile form grows large, raise it then; adding a package needs the owner's yes.
 
 One rule is used in two places on purpose: `isWebLink` in `validation.ts` decides both whether a photo link is accepted in the form and whether `frontend/src/components/ui/Avatar/Avatar.tsx` will load it.
 
 ---
 
 ## 17. The native dialog element for the dialog and the phone menu
 
 **What it is.** The confirm dialog and the full-screen phone menu are both a real `<dialog>` element opened with `showModal()`. The browser then does the hard parts: it moves focus inside, keeps Tab inside, makes the page behind unusable, closes on Escape, and gives focus back to the button that opened it.
 
 The caller owns `open`. On Escape the dialog asks to be closed (`onClose`); it closes when the caller sets `open` to false. Focus lands on Cancel first, so Enter alone never deletes anything. The backdrop is the band color mixed with transparent, so no new color was needed.
 
 **Where it lives.**
 
 - `frontend/src/components/ui/Dialog/Dialog.tsx`, `frontend/src/components/ui/Dialog/ConfirmDialog.tsx`, `frontend/src/components/ui/Dialog/Dialog.module.css`
 - `frontend/src/components/shell/PhoneMenu/PhoneMenu.tsx` (also closes when the address changes or the window grows past the phone width)
 
 **Why we chose it.** A focus trap written by hand is the most common place for keyboard bugs. The browser's own is tested by the browser makers and costs no code.
 
 We did not use a `<div role="dialog">` with our own trap, and we did not add a dialog package. The price is that the element needs a browser from 2023 or later; that was accepted.
 
 The open, close, Escape and close-before-unmount logic is held once in `frontend/src/hooks/useModalDialog.ts`. `Dialog.tsx` and `PhoneMenu.tsx` both use it and keep their own markup.
 
 ---
 
 ## 18. A table that turns into cards on a phone
 
 **What it is.** `Table` takes a list of columns and a list of rows. Each cell carries its column name in a `data-label` attribute. On a wide screen it is an ordinary table. Below 768px the stylesheet hides the head row from the eye (a screen reader still reads it), turns each row into a card, and shows the label before each value with `content: attr(data-label)`.
 
 The table elements keep explicit roles (`role="table"`, `row`, `cell`), because some browsers stop treating them as a table once CSS changes their layout. With no rows the table shows only its head; the caller shows `EmptyState` instead.
 
 **Where it lives.**
 
 - `frontend/src/components/ui/Table/Table.tsx` and `frontend/src/components/ui/Table/Table.module.css`
@@ -541,81 +541,81 @@ The same "no list file" rule holds for all components: import a component by its
 
 ## 21. Browser storage that never throws
 
 **What it is.** A browser can refuse storage: private mode, a full disk, a setting. So `localStorage` is touched in one file only, through three functions that catch the error: `readStored`, `writeStored`, `removeStored`. A refused write is ignored and the value lives in memory for that visit.
 
 The app uses three keys, all named in one file: `ua.token`, `ua.theme`, `ua.rememberedEmail`. The password is never stored.
 
 **Where it lives.**
 
 - `frontend/src/lib/browserStorage.ts`
 - The keys: `frontend/src/config/storageKeys.ts`
 - The one other reader: the head script in `frontend/index.html`, which cannot import anything and has its own `try`/`catch`.
 
 **Why we chose it.** Without the wrapper, a user in a locked-down browser gets a blank page because one line threw at start-up. With it, they get a working app that forgets its theme.
 
 We did not use `sessionStorage` (the user would be logged out in every new tab) or a storage package.
 
 ---
 
 ## 22. A components page for development only
 
 **What it is.** One page shows every base component in every state, in the current theme: colors, type, buttons, form controls, tags, avatars, dialog, pagination, cards, table, messages and the loading, empty and error states. It is where a component is compared with the design pictures.
 
 It exists only in development, at `/dev/components`. In `App.tsx` its import sits behind `import.meta.env.DEV`. In a production build that is `false` when the code is built, so the page's file is dropped and none of its text is in `frontend/dist`.
 
 **Where it lives.**
 
 - `frontend/src/pages/dev/ComponentsPage/ComponentsPage.tsx`
 - The condition and the route: `frontend/src/App.tsx`
 - The pictures to compare with: `docs/design/screens/system.html` and `docs/design/screens/system-dark.html`
 
 **Why we chose it.** There is no test runner and no Storybook. A plain page costs no package and shows the real components with the real tokens.
 
 - From part 3, the page's own styles: `frontend/src/pages/dev/ComponentsPage/ComponentsPage.module.css`
 
 **To add a component in parts 2 to 4:** add a section for it to this page, in every state it has. Part 2 added the alumni card and its loading card, the directory search and filters, and the profile band.
 
 Part 3 added button links, the post byline and text, the post and comment forms, feed posts, comments, the people lists, recent posts, counts and "Your profile". Two things about those sections:
 
 - **No request can start from them.** A small wrapper on the page, `NoRequests`, stops every click, middle click and submit in the capture phase, before it reaches a post, a comment or a block's link or retry. The keyboard is stopped too, because Enter and Space on a button fire a click. The two form samples are not wrapped: their submit is a function on the page that only shows a toast or a fixed failure.
-- **Some states are drawn from parts, not from the live component.** `FeedPost` keeps its editing state and its delete dialog in its own `useState`, so a prop cannot switch them on. The page draws them from the same parts (card, byline, `PostForm`, `ConfirmDialog` with FeedPost's words). `CommentsPanel` reads the comment thread from the store, so it is not rendered at all; its loading, error, empty and thread states are drawn from `CommentItem`, `CommentForm` and `buildThreads`. The thread's look is copied into the page's stylesheet for that (see "Open points").
+- **Some states are drawn from parts, not from the live component.** `FeedPost` keeps its editing state and its delete dialog in its own `useState`, so a prop cannot switch them on. The page draws them from the same parts (card, byline, `PostForm`, `ConfirmDialog` with FeedPost's words). `CommentsPanel` reads the comment thread from the store, so it is not rendered at all; its loading, error, empty and thread states are drawn from `CommentItem`, `CommentForm` and `buildThreads`. For that, the page's stylesheet takes the thread's look from `frontend/src/components/posts/CommentsPanel/CommentsPanel.module.css` with `composes` (its `panel`, `threads`, `replies` and `reply` classes, so the phone indent comes too). Nothing is copied (pattern 3).
 
 ---
 
 ## 23. A list loaded into an atom; the latest request wins
 
 **What it is.** Data a page shows from the API lives in an atom, with a status: `idle`, `loading`, `ready` or `error` (a profile also has `notFound`, and My profile has `none` for "no profile yet"). A write-only loader atom (pattern 7) fills it. The page reads the atom and starts the loader in an effect; it never calls a service.
 
 Each loader goes through its own `createLatestRequest()`. Starting a call asks for a ticket: the call before it is aborted (axios takes the `signal`), and an answer that still arrives for an old ticket is dropped. A cancelled call changes nothing and shows no error, because `isCancelled` is checked before the failure is stored.
 
 The state also says whose it is. The directory state keeps the address it was loaded for (`queryKey`) and the profile state keeps its `id`. A page that finds another key in the atom treats it as loading, so the results of the last search or the last person never show for a frame. While loading, the atom holds no items.
 
 When a session starts or ends, `resetAlumniAtom` cancels all four loaders and empties the atoms, so one user's data is never shown to the next.
 
 When a page closes, it clears its own atom: the directory calls `clearDirectoryAtom`, a profile calls `clearViewedAlumniAtom` and My profile calls `clearMyAlumniAtom`, each from the cleanup of an effect. Each cancels its loader and puts the atom back to idle, so the next visit never shows the last visit's error or data for a frame. My profile clears only on close, never while open: the band's "See my public profile" link reads the saved profile from the atom.
 
 **Where it lives.**
 
 - The helper: `frontend/src/store/latestRequest.ts`
 - The atoms and loaders: `frontend/src/store/alumniAtoms.ts` (`directoryAtom`, `filtersAtom`, `viewedAlumniAtom`, `myAlumniAtom`)
 - The reset: `frontend/src/store/sessionActions.ts`
 - `isCancelled`: `frontend/src/services/apiError.ts`
 - Readers: `frontend/src/pages/DirectoryPage/DirectoryPage.tsx`, `frontend/src/pages/AlumniProfilePage/AlumniProfilePage.tsx`, `frontend/src/pages/MyProfilePage/MyProfilePage.tsx`
 - The clear on close: `clearDirectoryAtom`, `clearViewedAlumniAtom`, `clearMyAlumniAtom` in `frontend/src/store/alumniAtoms.ts`
 - From part 3: `frontend/src/store/postAtoms.ts` holds five more atoms with their own loaders and clears (`feedAtom`, `commentsAtom`, `recentPostsAtom`, `peopleAtom`, `statsAtom`), each with its own `createLatestRequest()`. Its `resetPostsAtom` is called in the same three places as `resetAlumniAtom` in `frontend/src/store/sessionActions.ts`. The keys are `postId` (comments), `authorId` (recent posts) and `kind` (people); see patterns 30 and 33.
 
 **Why we chose it.** A search box fires several calls in a row, and the network does not answer in order. Without a ticket, a slow answer for "ab" can arrive after the answer for "abc" and replace it. React's StrictMode also starts every effect twice in development, which starts two calls. The ticket makes both harmless, and the abort saves the server the work.
 
 We did not add a data-fetching library (it would be a new package and a second place for state), and we did not keep the list in the page's `useState` (the list, its status and its failure are read by the page, the count line and the retry together, and the store's reset on logout and on a user switch reaches an atom but not a component's state). The atom is cleared when the page closes, so a new visit never shows the last visit's list. We did not rely on the abort alone: `getMyAlumni` takes no signal, so for it only the ticket protects.
 
 ---
 
 ## 24. Search, filters and page kept in the address
 
 **What it is.** The directory's search text, its three filters, the mentoring checkbox and the page number are in the address (`/directory?q=ab&department=Computer+Science&page=2`). The address is the truth. The page reads it with `readDirectoryQuery`, which turns every bad value into its default, so the page never sees a bad query. It writes it with `writeDirectoryQuery`, which leaves out defaults and page 1. The list loads in an effect keyed on that written text.
 
 How writes are made:
 
 - A filter, the checkbox or a page change adds a history entry, and a filter change goes back to page 1.
 - Typing waits for a 300 ms pause, then replaces the current entry, so Back does not step through every pause. Enter or the Search button sends it at once.
 - The typed text is the component's own state. The box takes the address's value only when the address changed by itself (Back, a pasted link) and differs from what the user last sent. Every write starts from the address as it is now (a ref), so a timer never writes an old copy.
@@ -732,182 +732,181 @@ Three more rules in the store:
 - Page 1 and "Load more" share one latest-request ticket, so a retry or leaving the page cancels a "Load more", and the other way round.
 - A failed "Load more" keeps the posts already shown. The same button then reads "Try again", so keyboard focus stays on it.
 - The posts this browser deleted during the visit are remembered (`removedIds`). A load that was already running when the delete finished drops them, and takes them off `total`.
 
 A visually hidden status line above the list says "Showing N of M posts" after a load, a "Load more", a publish and a delete.
 
 **Where it lives.**
 
 - The rule: `frontend/src/lib/feedPaging.ts` (`nextFeedPage`, `mergePosts`), with cases in `scripts/frontend-lib-check.ts`
 - The state and the two loaders: `feedAtom`, `loadFeedAtom`, `loadMoreFeedAtom`, `removePostLocallyAtom` and `clearFeedAtom` in `frontend/src/store/postAtoms.ts`
 - The page: `frontend/src/pages/FeedPage/FeedPage.tsx`
 
 **Why we chose it.** The rule is two lines, has cases, and gives the right list after any of this browser's own writes. It needs no change to the API.
 
 We did not ask for "page + 1" (a delete skips a post for good). We did not reload page 1 after every write (the user loses their place). We did not ask the backend for a cursor ("posts older than this one"): that would be a new API shape, and the spec allowed only one small backend change.
 
 The known limit: a post that **another user** deletes while this feed is open is not seen. The list keeps it, and one post can be missed by "Load more" until the page is opened again. This was accepted at the architecture gate (ADV-001). A real fix needs two requests per press and still leaves the deleted post on screen.
 
 ---
 
 ## 30. One open comment thread, patched from the server's answers
 
 **What it is.** Only one post's comments are open at a time, so there is one atom for them, `commentsAtom`, with the post id as its key. A post whose id is not the key treats its thread as closed. Opening another post's comments closes the first. The toggle button carries `aria-expanded`, and focus stays on it.
 
 After a write, the list is patched from what the server answered. Nothing is loaded again:
 
 - a new post goes on top and `total` goes up by one; an edited post replaces its copy; a deleted post is taken out and `total` goes down by one;
 - a new comment is added at the end; an edited one replaces its copy; a deleted one is taken out **with all its replies**.
 
 Then the post's comment count is set to the length of the comment list. The count is never worked out a second way, so the number on the toggle and the list cannot disagree. When the write ends and that post's thread is no longer the open one, the count moves by the number added or removed (for a delete, the comment and its replies, counted when the delete started).
 
 A comment write changes the thread and the count in one store update (`patchCommentsAtom`), so React never draws one without the other. A 404 on an edit or a delete removes the post or comment on this screen, because the server says it is gone.
 
 A write only patches if the same user and the same visit are still there when the answer comes. Leaving the feed or logging out starts a new visit, so a late answer patches nothing.
 
 Threads are shaped by pure functions. `buildThreads` returns the top-level comments, oldest first, each with all its replies flat under it, oldest first. A comment whose parent is not in the list is shown as top level, so it can never be hidden. A reply to a reply is sent with that reply's id and drawn under the top-level comment.
 
 **Where it lives.**
 
 - The thread rules: `frontend/src/lib/commentThread.ts` (`buildThreads`, `appendComment`, `replaceComment`, `removeWithReplies`, `countReplies`), with cases in the library check
-- The date and count words: `frontend/src/lib/postDisplay.ts` (`dateText`, `commentCountText`)
+- The date and count words: `frontend/src/lib/postDisplay.ts` (`dateText`, `countText`, `commentCountText`)
 - The state: `commentsAtom`, `openCommentsAtom`, `closeCommentsAtom` in `frontend/src/store/postAtoms.ts`
 - The writes and the patching: `frontend/src/store/postActions.ts`
 - The parts: `frontend/src/components/posts/FeedPost/FeedPost.tsx` (the toggle), `frontend/src/components/posts/CommentsPanel/CommentsPanel.tsx` (the open thread; one reply or edit at a time), `frontend/src/components/posts/CommentItem/CommentItem.tsx`
 
 **Why we chose it.** One open thread means one request at a time, one latest-request ticket, and no answers for two posts that arrive in the wrong order. Patching from the answer is quick and keeps the user's place. Taking the count from the list means the count is right after every add and delete, also when replies go with a comment.
 
 We did not keep a thread per post (more state, more answers to keep apart, and the design opens one). We did not reload the post or its thread after a write (slower, and there is no `GET /api/posts/:id` route, G33). We did not trust the stored `posts.comment_count` column (G11).
 
 ---
 
 ## 31. One owner rule for posts and comments
 
 **What it is.** Two pure functions decide which buttons a post or a comment shows:
 
 - `canEditContent(session, userId)`: true only for the author.
 - `canDeleteContent(session, userId)`: true for the author or an admin (ADR-02).
 
 No session, or content with no author, gives false. Posts and comments both call them; nothing else asks "is this mine". The server still decides. When it refuses (403), the user reads words for that, chosen by `writeFailureText` (pattern 9).
 
 **Where it lives.**
 
 - `frontend/src/lib/contentOwner.ts`, with cases for the author, another user, an admin, a student and no session in the library check
 - Callers: `frontend/src/components/posts/FeedPost/FeedPost.tsx`, `frontend/src/components/posts/CommentItem/CommentItem.tsx`
 
 **Why we chose it.** The rule is small, but it is easy to write slightly differently in two places (for example, letting an admin edit in one). One function with cases means both lists follow the same rule.
 
 We did not show every button and let the server refuse (a user should not be offered what they cannot do). We did not put the rule in the store (it decides what to draw, not what to save).
 
 ---
 
 ## 32. Shared forms for create and edit: PostForm and CommentForm
 
 **What it is.** One `PostForm` serves "Write a post" and "Edit post" (caption, image link, submit, an optional Cancel). One `CommentForm` serves a new comment, a reply and an edit. Both follow pattern 16: values in `useState`, the validators from `lib/validation.ts`, messages under the field through `Field`, focus to the first field with a message, a busy button, and an early return against a double submit.
 
 The forms do not know the API. The caller gives them an `onSubmit` that answers a `FormResult`: `{ ok: true }`, `{ ok: true, reset: true }` (empty the form after a new post or comment) or `{ ok: false, text }` (show these words). On a reset a field is emptied only if it still holds what was sent, so text typed during the request is kept. A failure keeps what was typed, and its message takes focus.
 
 Each form hands its text field to the caller through a ref, so the caller can move focus back there after a publish or a comment.
 
-Edit has no "Save stays off until something changed" rule: a post is never new, and the form closes on Save or Cancel, so none of the three traps of LESSON-REQ-fs-005-1 arises.
+Edit has no "Save stays off until something changed" rule: a post is never new, and the form closes on Save or Cancel, so traps 1 and 2 of LESSON-REQ-fs-005-1 do not arise. Trap 3 does (a control that closes or resets the form must be off while a save runs): Cancel gets the same `busy` as the submit, so while the request runs it ignores presses and keeps focus (`aria-disabled`), and the answer never lands on an edit or reply that Cancel already closed.
 
 The validators: `validateCaption` (a visible character, at most 2000) and `validateComment` (a visible character, at most 1000). The image link uses the existing `validatePhotoLink`.
 
 **Where it lives.**
 
 - `frontend/src/components/posts/PostForm/PostForm.tsx` (it exports `FormResult`) and `frontend/src/components/posts/CommentForm/CommentForm.tsx`
 - The validators: `frontend/src/lib/validation.ts`
 - The callers: `frontend/src/pages/FeedPage/FeedPage.tsx` (publish), `frontend/src/components/posts/FeedPost/FeedPost.tsx` (edit post), `frontend/src/components/posts/CommentsPanel/CommentsPanel.tsx` (add and reply), `frontend/src/components/posts/CommentItem/CommentItem.tsx` (edit comment)
 - The words of a failure: `frontend/src/lib/writeFailure.ts` (pattern 9)
 
 **Why we chose it.** Create and edit have the same fields and the same rules. One form keeps them the same and means one place to fix. Leaving the API to the caller keeps the forms in the components layer (pattern 1) and lets the dev page show them with a fake submit.
 
 We did not build separate create and edit forms, and we did not add a form library (pattern 16).
 
 ---
 
 ## 33. Small blocks that fail on their own, one atom per kind with a key
 
 **What it is.** The Dashboard is four blocks: counts, recent posts, "New in the directory" and "Your profile". The Feed has a side list ("Open to mentoring"), and an alumni profile has "Recent posts". Each block has its own loading, empty, error and ready states and its own "Try again". One block that fails never hides another.
 
 The blocks take props only; none reads an atom. Each exports its own state type with the status `loading`, `ready` or `error`. The page maps the atom to it.
 
 Lists of the same kind share one atom, with a key that says whose it is:
 
 - `recentPostsAtom` with `authorId`: `null` for everyone's newest (the Dashboard), a user id for one person (the profile).
 - `peopleAtom` with `kind`: `"newest"` (Dashboard) or `"mentoring"` (Feed).
 
 As in pattern 23, a page that finds `idle` or another key treats the state as loading, so one page never shows the other's list for a frame. The small lists ask for 3 items.
 
 The page starts its loads in one effect keyed on the user and clears them in the cleanup. "Your profile" chooses by role: a student gets a prompt and sends **no** request; alumni and admin load the existing `myAlumniAtom`.
 
 The retry buttons in the blocks are secondary, so a page with several failed blocks still has one primary action.
 
 **Where it lives.**
 
 - The blocks: `frontend/src/components/alumni/PeopleBlock/PeopleBlock.tsx`, `frontend/src/components/dashboard/CountsBlock/CountsBlock.tsx`, `frontend/src/components/dashboard/RecentPostsBlock/RecentPostsBlock.tsx`, `frontend/src/components/dashboard/YourProfileBlock/YourProfileBlock.tsx`, and the card inside the recent posts list, `frontend/src/components/posts/PostSummaryCard/PostSummaryCard.tsx`
 - The atoms and loaders: `recentPostsAtom`, `peopleAtom`, `statsAtom` and their loaders and clears in `frontend/src/store/postAtoms.ts`
-- The mapping from atom to block state: `toCountsState`, `toRecentPostsState`, `toPeopleState` in `frontend/src/pages/DashboardPage/DashboardPage.tsx`; the same idea in `frontend/src/pages/FeedPage/FeedPage.tsx` and `frontend/src/pages/AlumniProfilePage/AlumniProfilePage.tsx`
+- The mapping from atom to block state: `toCountsState` and `toRecentPostsState` in `frontend/src/pages/DashboardPage/DashboardPage.tsx`; the same idea in `frontend/src/pages/AlumniProfilePage/AlumniProfilePage.tsx`. The people list has one shared mapper for both pages, `toPeopleBlockState(state, kind)` in `frontend/src/store/peopleBlockState.ts`. That file is the one store file that points up at `components/`: it imports the `PeopleBlockState` type from `PeopleBlock` with `import type`, so there is no runtime link and no loop. It could not go in `lib/`, because style rule k forbids `lib/` to import the store, and it needs the store's `PeopleState`. Do not copy this for other mappers; if they move out of the pages (m14), the block-state types should move next to the atoms
+- Who may write posts and has an alumni profile (alumni or admin): `canWritePosts` in `frontend/src/lib/token.ts`, used by the Feed, the Dashboard, `YourProfileBlock` and My profile
+- The "open to mentoring" directory address of the Feed's and the Dashboard's links: `mentoringDirectoryAddress` in `frontend/src/lib/directoryQuery.ts`
 - The backend filter the profile uses: `GET /api/posts?user_id=<id>&limit=3`, in `backend/src/dal/query/PostQuery.ts` and `backend/src/api/controllers/PostController.ts`
 
 **Why we chose it.** A dashboard that waits for four calls, and fails when one fails, is slow and fragile. Blocks that take props can be shown in every state on the dev page without the store. One atom per kind with a key keeps the store small, and the key rule is already known from pattern 23.
 
 We did not load the dashboard in one request (there is no such endpoint, and the backend change was kept to one filter). We did not give each page its own copy of the same atom (more state to reset on log out). We did not let the blocks read atoms themselves (then the dev page could not show them).
 
 ---
 
 ## How to add to this file
 
 For parts 2 to 4 (directory and profiles, My profile, feed, dashboard, users):
 
 1. **A new pattern gets a new numbered section** at the end of the list, with the same three parts: What it is, Where it lives, Why we chose it. Add it to "Contents". Write it after the code works, from the code.
 2. **Use real paths**, written in full from the repo root (starting with `frontend/`, `scripts/` or `docs/`), and check that each one exists before you finish.
 3. **If you change a pattern, change its section** in the same piece of work. If the change is a real decision (for example "we now use a form library"), it also needs a decision record (ADR) and the owner's yes.
 4. **If you extend a pattern, add to "Where it lives"**. A new service file, a new store file or a new guard is a line there, not a new section.
 5. **Say what you did not choose.** That sentence is what stops the next person from trying it again.
 6. **Plain words, short sentences.** The reader is the owner and whoever builds the next part.
 
 Part 2 wrote sections 23 to 28. Part 3 (the feed and the dashboard) wrote sections 29 to 33; the owner check expected here became pattern 31, and dates written as "3 October 2026" are `dateText` in `frontend/src/lib/postDisplay.ts` (pattern 30). Likely new sections in part 4 (the users page), so nobody is surprised: an admin-only list with role changes.
 
 ## Checks to run
 
 Run all four from the repo root before you say a piece of work is done. All must exit 0. `npm run check:frontend` runs the style check and the library check in one go.
 
 | Command | What it proves |
 |---|---|
 | `npm run build` | The code compiles (type errors fail it) and the production build works. |
 | `node scripts/frontend-style-check.mjs` | The eleven style and layer rules of pattern 3. |
-| `npx tsx scripts/frontend-lib-check.ts` | The pure functions in `frontend/src/lib/` give the right answers (434 cases after part 3). |
+| `npx tsx scripts/frontend-lib-check.ts` | The pure functions in `frontend/src/lib/` give the right answers (469 cases after part 3). |
 | `git grep -n --untracked "antd" -- frontend/src frontend/package.json` | Prints nothing: the old UI library is gone. Keep `--untracked`; without it git skips files that are not committed yet. |
 
 After the build, two looks at the output:
 
 - `ls frontend/dist/assets` shows one `.js` file for each page, plus a few shared files.
 - `grep -rlF "Compare each section with" frontend/dist` prints nothing: the components page is not in the build.
 
 When you add a validator or another pure function, add its cases to `scripts/frontend-lib-check.ts`. Write the expected answer from the spec, not from the code. Prove once that a new case can fail: run a copy of the script with one wrong expectation and see `FAIL` and exit 1. Make the copy outside the repo (rewrite its `../frontend/src/` imports to full paths), so nothing has to be deleted from the repo after.
 
 The build type-checks `frontend/src` only. The library check runs through `tsx`, which strips types without checking them, so a type error in `scripts/` is not caught.
 
 Screens are checked in a browser against a mock API: a throwaway script outside the repo, and a throwaway Vite config that points the `/api` proxy at it. Before you start, find out what listens on port 3000; it may be the real backend on a real database. Never point anything at it for a review.
 
 What these checks cannot prove (how a screen looks, a real log in, a screen reader) goes on a manual checklist for the owner. Part 1's is `manual-checklist.md` in the REQ-fs-004 folder of the vault; part 2's is in the REQ-fs-005 folder; part 3's is in the REQ-fs-006 folder.
 
 ## Files added in review round 1
 
 Seven files were added after the first draft of this document. All paths are under `frontend/src/`: `hooks/useModalDialog.ts` (the native-dialog logic of Dialog and PhoneMenu), `hooks/useFormError.ts` (the form error message, its focus and the double-submit guard of both auth pages), `config/layout.ts` (the phone-layout query), `config/text.ts` (`LOADING_TEXT`), `lib/returnAddress.ts` (the open-redirect guard), `lib/pageRange.ts` (the page numbers) and `components/shell/navLabels.ts` (the shared navigation labels).
 
 ## Open points
 
 Known gaps left by part 1. None blocks parts 2 to 4. The full list is in `check-notes.md` in the REQ-fs-004 folder.
 
 - The API client has no general timeout. Only log out has one (5 seconds); other calls wait for the server.
 - The checks on the store (401 handling, start-up check, and in part 2 the latest-request and save actions) were run from scratch files and are not in `scripts/`.
 - ESLint is not installed, so nothing lints the code.
 - Part 2: `ProfileBand` takes no heading ref, so the profile page reaches its `<h1>` through a wrapper element. After a 409 on create the focused Save button switches off with no focus move. Other review items left open are listed in the REQ-fs-005 `verification.md`.
 - Part 3 (REQ-fs-006), known gaps after the implement phase:
-  - "May this user write posts?" (alumni or admin) is written in four places: `FeedPage`, `DashboardPage`, `YourProfileBlock` and `MyProfilePage`. The address of the directory with the mentoring filter on is built in two: `FeedPage` and `CountsBlock`. Each should become one function (pattern 28).
-  - Five CSS rules of `CommentsPanel` (`.commentPanel`, `.threads`, `.replies`, `.reply` and the phone indent) are copied into `frontend/src/pages/dev/ComponentsPage/ComponentsPage.module.css`, because the dev page cannot render the live panel (pattern 22). A change to the thread's look must be made in both files.
-  - Five loading words in `frontend/src/config/text.ts` are unused: `PEOPLE_LOADING`, `DASHBOARD_COUNTS_LOADING`, `DASHBOARD_RECENT_LOADING`, `DASHBOARD_PROFILE_LOADING` and `PROFILE_POSTS_LOADING`. `SkeletonGroup` reads out the one `LOADING_TEXT` and takes no label. `COMMENTS_LOADING_TEXT` and `POST_IMAGE_ALT` are unused for the same kind of reason. Either drop them or give `SkeletonGroup` a label.
   - Saving or deleting a comment that is not in the open thread patches nothing on this screen: the store cannot tell which post it belongs to. Today a comment's buttons are only shown inside the open thread, so this cannot happen from the screen.
-  - The browser checks were not done in the implement phase: focus rings by a real Tab key, 360px and 200% zoom, and screenshots in both themes. They are left to the review phase.
+  - The browser checks (focus rings by a real Tab key, 360px and 200% zoom, screenshots in both themes) were done in the review phase of REQ-fs-006 against a mock API; the screenshots are in the `ui-evidence/` folder of that REQ.
   - ADV-001: a post that another user deletes while the feed is open can make "Load more" miss one post until the page is opened again (pattern 29).
diff --git a/frontend/src/components/posts/CommentItem/CommentItem.tsx b/frontend/src/components/posts/CommentItem/CommentItem.tsx
index 7aa4d276..2adf186c 100644
--- a/frontend/src/components/posts/CommentItem/CommentItem.tsx
+++ b/frontend/src/components/posts/CommentItem/CommentItem.tsx
@@ -1,168 +1,180 @@
 import { useSetAtom } from "jotai";
 import type { Comment } from "@alumni/shared";
 import { useEffect, useRef, useState } from "react";
 import type { ReactNode } from "react";
 import { Button } from "../../ui/Button/Button";
 import { ConfirmDialog } from "../../ui/Dialog/ConfirmDialog";
 import { Message } from "../../ui/Message/Message";
 import { CommentForm } from "../CommentForm/CommentForm";
 import { PostByline } from "../PostByline/PostByline";
 import type { FormResult } from "../PostForm/PostForm";
 import { PostText } from "../PostText/PostText";
 import {
   CANCEL_LABEL,
   COMMENT_CHANGE_FORBIDDEN_TEXT,
   COMMENT_DELETED_TOAST,
   COMMENT_DELETE_CONFIRM,
   COMMENT_DELETE_TITLE,
   COMMENT_EDIT_LABEL,
   COMMENT_NOT_FOUND_TEXT,
   COMMENT_REPLY_BUTTON,
   COMMENT_SAVED_TOAST,
   COMMENT_SAVE_FAILURE_WORDS,
   DELETE_LABEL,
   DELETING_LABEL,
   EDIT_LABEL,
   SAVE_LABEL,
   SAVING_LABEL,
   commentDeleteBody,
 } from "../../../config/text";
 import { canDeleteContent, canEditContent } from "../../../lib/contentOwner";
 import type { Session } from "../../../lib/token";
+import { COMMENT_REQUIRED_MESSAGE } from "../../../lib/validation";
 import { isGone, writeFailureText } from "../../../lib/writeFailure";
 import type { WriteFailureWords } from "../../../lib/writeFailure";
 import { deleteCommentAtom, saveCommentAtom } from "../../../store/postActions";
 import { showToastAtom } from "../../../store/toastAtoms";
 import styles from "./CommentItem.module.css";
 
 // The words for a failed edit or delete of a comment (AC18).
 const COMMENT_WRITE_FAILURE_WORDS: WriteFailureWords = {
   forbidden: COMMENT_CHANGE_FORBIDDEN_TEXT,
   notFound: COMMENT_NOT_FOUND_TEXT,
   save: COMMENT_SAVE_FAILURE_WORDS,
 };
 
 export type CommentItemProps = {
   comment: Comment;
   session: Session | null;
   // How many comments sit below this one; the delete dialog says they go too.
   replyCount: number;
   // This comment is the one being edited (one edit or reply at a time).
   editing: boolean;
   onReply: (comment: Comment) => void;
   onStartEdit: (id: number) => void;
   onEndEdit: () => void;
   // The comment left the list (deleted, or found already gone). The panel
   // moves focus to the comment field in an effect after that commit (C11).
   onRemoved: () => void;
   // The replies of a top-level comment, drawn indented under it.
   children?: ReactNode;
 };
 
 /** One comment: byline, text, and Reply, Edit and Delete for those allowed. */
 export function CommentItem({
   comment,
   session,
   replyCount,
   editing,
   onReply,
   onStartEdit,
   onEndEdit,
   onRemoved,
   children,
 }: CommentItemProps) {
   const saveComment = useSetAtom(saveCommentAtom);
   const deleteComment = useSetAtom(deleteCommentAtom);
   const showToast = useSetAtom(showToastAtom);
 
   const editRef = useRef<HTMLButtonElement>(null);
   // Raised by Save and Cancel only: an edit closed because another comment
   // took over keeps focus where the user put it.
   const [focusEditRequest, setFocusEditRequest] = useState(0);
+  // `editing` now, read when a save answers: if another reply or edit took
+  // over meanwhile, the answer must not close it or move focus (REFL-006).
+  const editingRef = useRef(editing);
+  useEffect(() => {
+    editingRef.current = editing;
+  }, [editing]);
 
   const [confirmOpen, setConfirmOpen] = useState(false);
   const [deleting, setDeleting] = useState(false);
   const [deleteError, setDeleteError] = useState<string | null>(null);
   const confirmOpenRef = useRef(false);
   const deletingRef = useRef(false);
 
   useEffect(() => {
     if (focusEditRequest > 0 && !editing) {
       editRef.current?.focus();
     }
   }, [focusEditRequest, editing]);
 
   const mayEdit = canEditContent(session, comment.user_id);
   const mayDelete = canDeleteContent(session, comment.user_id);
 
   function closeEdit() {
     onEndEdit();
     setFocusEditRequest((current) => current + 1);
   }
 
   async function handleSave(content: string): Promise<FormResult> {
     const result = await saveComment({ id: comment.id, content });
     if (result.ok) {
-      closeEdit();
+      if (editingRef.current) {
+        closeEdit();
+      }
       showToast(COMMENT_SAVED_TOAST);
       return { ok: true };
     }
+    if ("blank" in result) {
+      // Nothing was sent; the form blocks this first.
+      return { ok: false, text: COMMENT_REQUIRED_MESSAGE };
+    }
     if (isGone(result.failure)) {
       // The store took the comment off the list, so this form goes with it.
       showToast(COMMENT_NOT_FOUND_TEXT);
       onRemoved();
     }
     return { ok: false, text: writeFailureText(result.failure, COMMENT_WRITE_FAILURE_WORDS) };
   }
 
   function openConfirm() {
     setDeleteError(null);
     confirmOpenRef.current = true;
     setConfirmOpen(true);
   }
 
-  // Cancel and Escape; ignored while the delete runs (ADV-004).
+  // Cancel and Escape, also while the delete runs: the browser closes the
+  // dialog on a second Escape anyway, so the flag always follows it. A failure
+  // that answers after the close becomes a toast (handleConfirmDelete).
   function closeConfirm() {
-    if (deletingRef.current) {
-      return;
-    }
     confirmOpenRef.current = false;
     setConfirmOpen(false);
   }
 
   async function handleConfirmDelete() {
     if (deletingRef.current) {
       return;
     }
     deletingRef.current = true;
     setDeleting(true);
     setDeleteError(null);
     const result = await deleteComment(comment.id);
     deletingRef.current = false;
     setDeleting(false);
 
     if (result.ok || isGone(result.failure)) {
       // The store removed the comment and its replies; this item leaves.
       confirmOpenRef.current = false;
       setConfirmOpen(false);
       showToast(result.ok ? COMMENT_DELETED_TOAST : COMMENT_NOT_FOUND_TEXT);
       onRemoved();
       return;
     }
     const text = writeFailureText(result.failure, COMMENT_WRITE_FAILURE_WORDS);
     if (confirmOpenRef.current) {
       setDeleteError(text);
     } else {
       showToast(text);
     }
   }
 
   return (
     <div className={styles.item}>
       <PostByline
         name={comment.name}
         photoUrl={comment.photo_url}
         createdAt={comment.created_at}
         size="sm"
       >
         {editing ? (
diff --git a/frontend/src/components/posts/CommentsPanel/CommentsPanel.tsx b/frontend/src/components/posts/CommentsPanel/CommentsPanel.tsx
index 31c70da4..7af4a683 100644
--- a/frontend/src/components/posts/CommentsPanel/CommentsPanel.tsx
+++ b/frontend/src/components/posts/CommentsPanel/CommentsPanel.tsx
@@ -1,186 +1,218 @@
 import { useAtomValue, useSetAtom } from "jotai";
 import type { Comment } from "@alumni/shared";
 import { useEffect, useId, useRef, useState } from "react";
 import { EmptyState } from "../../ui/EmptyState/EmptyState";
 import { ErrorState } from "../../ui/ErrorState/ErrorState";
 import { Skeleton, SkeletonGroup, SkeletonStack } from "../../ui/Skeleton/Skeleton";
 import { CommentForm } from "../CommentForm/CommentForm";
 import { CommentItem } from "../CommentItem/CommentItem";
 import type { FormResult } from "../PostForm/PostForm";
 import {
   COMMENTS_EMPTY_HEADING,
   COMMENTS_EMPTY_TEXT,
   COMMENTS_ERROR_HEADING,
   COMMENTS_HEADING,
+  COMMENT_ADD_FORBIDDEN_TEXT,
   COMMENT_FIELD_LABEL,
   COMMENT_POSTED_TOAST,
   COMMENT_POST_GONE_TEXT,
   COMMENT_REPLY_TARGET_GONE_TEXT,
   COMMENT_SAVE_FAILURE_WORDS,
   COMMENT_SUBMIT_BUSY,
   COMMENT_SUBMIT_BUTTON,
 } from "../../../config/text";
 import { buildThreads, countReplies } from "../../../lib/commentThread";
 import { loadFailureText } from "../../../lib/loadFailure";
-import { saveFailureText } from "../../../lib/saveFailure";
 import type { Session } from "../../../lib/token";
-import { isGone } from "../../../lib/writeFailure";
+import { COMMENT_REQUIRED_MESSAGE } from "../../../lib/validation";
+import { commentAddFailureText, isGone, isReplyTargetGone } from "../../../lib/writeFailure";
+import type { CommentAddFailureWords } from "../../../lib/writeFailure";
 import { addCommentAtom } from "../../../store/postActions";
 import { commentsAtom, openCommentsAtom } from "../../../store/postAtoms";
 import { showToastAtom } from "../../../store/toastAtoms";
 import styles from "./CommentsPanel.module.css";
 
-// The API answers 400 to a reply whose parent comment no longer exists (ADV-005).
-const HTTP_BAD_REQUEST = 400;
+// The words for a failed new comment or reply (UI-003: a 403 has its own line).
+const COMMENT_ADD_FAILURE_WORDS: CommentAddFailureWords = {
+  replyTargetGone: COMMENT_REPLY_TARGET_GONE_TEXT,
+  postGone: COMMENT_POST_GONE_TEXT,
+  forbidden: COMMENT_ADD_FORBIDDEN_TEXT,
+  save: COMMENT_SAVE_FAILURE_WORDS,
+};
 
 // One reply or one edit at a time, across the whole thread.
 type Active =
   | { kind: "reply"; id: number; name: string | null }
   | { kind: "edit"; id: number };
 
 export type CommentsPanelProps = {
   // The id the post's comments button points at (aria-controls).
   id: string;
   postId: number;
   session: Session | null;
   // The thread answered 404: the post is gone. The page removes it and says so.
   onPostGone: (postId: number) => void;
 };
 
 /**
  * The open comment thread of one post (C3): its states, the threads with
  * replies indented one level, and the comment form. It reads the one
  * comments atom; another post's state there counts as loading (pattern 23).
  */
 export function CommentsPanel({ id, postId, session, onPostGone }: CommentsPanelProps) {
   const comments = useAtomValue(commentsAtom);
   const openComments = useSetAtom(openCommentsAtom);
   const addComment = useSetAtom(addCommentAtom);
   const showToast = useSetAtom(showToastAtom);
 
   const headingId = useId();
   const headingRef = useRef<HTMLHeadingElement>(null);
   const fieldRef = useRef<HTMLTextAreaElement>(null);
 
   const [activeState, setActiveState] = useState<Active | null>(null);
+  // The same value, read when a send or save answers: that answer may close
+  // the reply or edit only if it is still the one it was sent from, so a
+  // reply or edit started meanwhile is not wiped (REFL-006).
+  const activeRef = useRef<Active | null>(null);
   // Raised after a comment is added, removed or a reply is started; the
   // effect moves focus to the field after that commit (C11).
   const [focusFieldRequest, setFocusFieldRequest] = useState(0);
   // The 404 already reported, so StrictMode's second effect run does not
   // report it again (G48).
   const reportedGone = useRef<unknown>(null);
 
   const isThisPost = comments.postId === postId;
   const status = isThisPost ? comments.status : "loading";
   const items = isThisPost && status === "ready" ? comments.items : [];
   const failure = isThisPost ? comments.failure : null;
 
   // A reply or edit whose comment has gone (deleted here or found gone) is over.
   const active =
     activeState !== null && items.some((item) => item.id === activeState.id) ? activeState : null;
   const replyingTo = active?.kind === "reply" ? active : null;
 
   useEffect(() => {
     if (focusFieldRequest > 0) {
       fieldRef.current?.focus();
     }
   }, [focusFieldRequest]);
 
   const postGone = status === "error" && failure !== null && isGone(failure);
   useEffect(() => {
     if (postGone && reportedGone.current !== failure) {
       reportedGone.current = failure;
       onPostGone(postId);
     }
   }, [postGone, failure, postId, onPostGone]);
 
   function requestFieldFocus() {
     setFocusFieldRequest((current) => current + 1);
   }
 
   function handleRetry() {
     void openComments(postId);
     // "Try again" goes away with the error state; the heading stays.
     headingRef.current?.focus();
   }
 
+  function changeActive(next: Active | null) {
+    activeRef.current = next;
+    setActiveState(next);
+  }
+
   function handleReply(comment: Comment) {
-    setActiveState({ kind: "reply", id: comment.id, name: comment.name });
+    changeActive({ kind: "reply", id: comment.id, name: comment.name });
     requestFieldFocus();
   }
 
   function handleCancelReply() {
-    setActiveState(null);
+    changeActive(null);
     requestFieldFocus();
   }
 
+  // Closes the edit of this comment, unless another reply or edit took over.
+  function endEdit(commentId: number) {
+    const current = activeRef.current;
+    if (current?.kind === "edit" && current.id === commentId) {
+      changeActive(null);
+    }
+  }
+
   async function handleAdd(content: string): Promise<FormResult> {
+    const sentFrom = activeRef.current;
     const parentId = replyingTo?.id ?? null;
     const result = await addComment({ posts_id: postId, content, parent_id: parentId });
+    // Still the reply (or plain comment) this was sent from: nothing newer to keep.
+    const unchanged = activeRef.current === sentFrom;
     if (result.ok) {
-      setActiveState(null);
       showToast(COMMENT_POSTED_TOAST);
-      requestFieldFocus();
+      if (unchanged) {
+        changeActive(null);
+        requestFieldFocus();
+      }
       return { ok: true, reset: true };
     }
-    const { failure: addFailure } = result;
-    if (addFailure.kind === "http" && addFailure.status === HTTP_BAD_REQUEST && parentId !== null) {
-      setActiveState(null);
-      return { ok: false, text: COMMENT_REPLY_TARGET_GONE_TEXT };
+    if ("blank" in result) {
+      // Nothing was sent; the form blocks this first.
+      return { ok: false, text: COMMENT_REQUIRED_MESSAGE };
     }
-    if (isGone(addFailure)) {
-      return { ok: false, text: COMMENT_POST_GONE_TEXT };
+    if (isReplyTargetGone(result.failure, parentId) && unchanged) {
+      // The reply is over; the typed text stays for a new comment.
+      changeActive(null);
     }
-    return { ok: false, text: saveFailureText(addFailure, COMMENT_SAVE_FAILURE_WORDS) };
+    return {
+      ok: false,
+      text: commentAddFailureText(result.failure, parentId, COMMENT_ADD_FAILURE_WORDS),
+    };
   }
 
   function renderItem(comment: Comment, replies?: Comment[]) {
     return (
       <CommentItem
         comment={comment}
         session={session}
         replyCount={countReplies(items, comment.id)}
         editing={active?.kind === "edit" && active.id === comment.id}
         onReply={handleReply}
-        onStartEdit={(commentId) => setActiveState({ kind: "edit", id: commentId })}
-        onEndEdit={() => setActiveState(null)}
+        onStartEdit={(commentId) => changeActive({ kind: "edit", id: commentId })}
+        onEndEdit={() => endEdit(comment.id)}
         onRemoved={requestFieldFocus}
       >
         {replies !== undefined && replies.length > 0 ? (
           <ul className={styles.replies}>
             {replies.map((reply) => (
               <li key={reply.id} className={styles.reply}>
                 {renderItem(reply)}
               </li>
             ))}
           </ul>
         ) : null}
       </CommentItem>
     );
   }
 
   let body;
   if (status === "ready") {
     const threads = buildThreads(items);
     body = (
       <>
         {threads.length === 0 ? (
           <EmptyState
             heading={COMMENTS_EMPTY_HEADING}
             headingAs="h3"
             text={COMMENTS_EMPTY_TEXT}
           />
         ) : (
           <ul className={styles.threads}>
             {threads.map((thread) => (
               <li key={thread.comment.id}>{renderItem(thread.comment, thread.replies)}</li>
             ))}
           </ul>
         )}
         <CommentForm
           ref={fieldRef}
           label={COMMENT_FIELD_LABEL}
           submitLabel={COMMENT_SUBMIT_BUTTON}
           busyLabel={COMMENT_SUBMIT_BUSY}
           replyingTo={replyingTo?.name ?? null}
           onCancel={replyingTo !== null ? handleCancelReply : undefined}
diff --git a/frontend/src/store/postActions.ts b/frontend/src/store/postActions.ts
index 55ed9bee..38f27cfb 100644
--- a/frontend/src/store/postActions.ts
+++ b/frontend/src/store/postActions.ts
@@ -1,149 +1,158 @@
 import { atom } from "jotai";
 import type { Getter } from "jotai";
 import type { Comment, Post } from "@alumni/shared";
 import { presentText } from "../lib/alumniDisplay";
 import {
   appendComment,
   countReplies,
   removeWithReplies,
   replaceComment,
 } from "../lib/commentThread";
 import { isGone } from "../lib/writeFailure";
 import { toApiFailure } from "../services/apiError";
 import type { ApiFailure } from "../services/apiError";
 import {
   createComment,
   deleteComment,
   updateComment,
 } from "../services/commentService";
 import { createPost, deletePost, updatePost } from "../services/postService";
 import {
   commentsAtom,
   currentPostsVisit,
   feedAtom,
   removePostLocallyAtom,
+  withCommentCount,
 } from "./postAtoms";
 import type { FeedState } from "./postAtoms";
 import { sessionAtom } from "./sessionAtoms";
 
 // The six writes of the feed: publish, save and delete a post; add, save and
 // delete a comment. Each returns a result and never throws; none shows a
 // toast or moves focus (pattern 7). After the server answers, the lists are
 // patched, not reloaded (C2), and only when it is still safe: the same user,
 // the same visit of the feed (no clear or reset since), and the list `ready`.
 // A late answer patches nothing and still returns its result.
 //
 // A 404 on a save or a delete still returns the failure, and also removes the
 // item here, so the page can say "already gone" (AC18).
 //
 // The page maps two failures to its own words: a 400 on `addCommentAtom` with
 // a `parent_id` means the comment replied to is gone (ADV-005), and a 404 on
 // the comments load means the post is gone (see `removePostLocallyAtom`).
+// A comment with no visible text gets `{ ok: false, blank: true }` instead.
 
 export type PostWriteResult = { ok: true } | { ok: false; failure: ApiFailure };
 
+/**
+ * A comment add or save. `blank` means the text had nothing visible and
+ * nothing was sent: no server answer, so no status the page could misread
+ * (a 400 on a reply means "the comment replied to is gone").
+ */
+export type CommentWriteResult = PostWriteResult | { ok: false; blank: true };
+
 export interface PublishPostInput {
   caption: string;
   media_url: string | null;
 }
 
 export interface SavePostInput {
   id: number;
   caption: string;
   media_url: string | null;
 }
 
 export interface AddCommentInput {
   posts_id: number;
   content: string;
   parent_id: number | null;
 }
 
 export interface SaveCommentInput {
   id: number;
   content: string;
 }
 
 // Nothing to write as: no session. The forms are not shown then, so no
 // status is worth reporting: "network".
 const NOT_READY: ApiFailure = { kind: "network" };
 
+// A comment with no visible text is never sent. The forms check first
+// (`validateComment` uses the same `presentText`), so this is a guard with
+// its own result, not a made-up server status.
+const BLANK_TEXT: CommentWriteResult = { ok: false, blank: true };
+
 /**
  * Remembers who writes and in which visit of the feed. The answer may patch
  * the lists only while `isCurrent()` is true. Null when nobody is logged in.
  */
 function startWrite(get: Getter): { isCurrent: () => boolean } | null {
   const session = get(sessionAtom);
   if (session === null) {
     return null;
   }
   const { userId } = session;
   const visit = currentPostsVisit();
   return {
     isCurrent: () =>
       get(sessionAtom)?.userId === userId && currentPostsVisit() === visit,
   };
 }
 
-/** The feed with one post's comment count set (never below zero). */
-function withCommentCount(feed: FeedState, postId: number, count: number): FeedState {
-  return {
-    ...feed,
-    items: feed.items.map((post) =>
-      post.id === postId ? { ...post, comment_count: Math.max(0, count) } : post,
-    ),
-  };
-}
-
 /** The comment count the feed holds for a post, or null when it is not held. */
 function heldCommentCount(feed: FeedState, postId: number): number | null {
   return feed.items.find((post) => post.id === postId)?.comment_count ?? null;
 }
 
 // Puts a post the server created on top of a ready feed, once.
 const putPostOnTopAtom = atom(null, (get, set, post: Post) => {
   const feed = get(feedAtom);
   if (feed.status !== "ready" || feed.items.some((item) => item.id === post.id)) {
     return;
   }
-  set(feedAtom, { ...feed, items: [post, ...feed.items], total: feed.total + 1 });
+  set(feedAtom, {
+    ...feed,
+    items: [post, ...feed.items],
+    total: feed.total + 1,
+    totalEdits: [...feed.totalEdits, { id: post.id, change: 1 }],
+  });
 });
 
 // Replaces a post the server saved, when the ready feed holds it.
 const replacePostAtom = atom(null, (get, set, post: Post) => {
   const feed = get(feedAtom);
   if (feed.status !== "ready") {
     return;
   }
   set(feedAtom, {
     ...feed,
     items: feed.items.map((item) => (item.id === post.id ? post : item)),
   });
 });
 
 interface CommentPatch {
   postId: number;
   // The thread list after the write, from the list before it.
   patchList: (items: readonly Comment[]) => Comment[];
   // How much the count changes when the thread is not open for that post.
   countChange: number;
 }
 
 // One store update for a comment write (G48): the thread list, when it is
 // ready for the same post, and that post's count in the ready feed. With the
 // list patched the count is its length, so the two cannot disagree (AC12,
 // AC14); otherwise the count moves by `countChange` (ADV-003).
 const patchCommentsAtom = atom(null, (get, set, patch: CommentPatch) => {
   const comments = get(commentsAtom);
   const feed = get(feedAtom);
   let newCount: number | null = null;
 
   if (comments.status === "ready" && comments.postId === patch.postId) {
     const items = patch.patchList(comments.items);
     set(commentsAtom, { ...comments, items });
     newCount = items.length;
   } else {
     const held = heldCommentCount(feed, patch.postId);
     newCount = held === null ? null : held + patch.countChange;
   }
 
@@ -215,123 +224,135 @@ export const savePostAtom = atom(
     } catch (error) {
       const failure = toApiFailure(error);
       if (isGone(failure) && scope.isCurrent()) {
         set(removePostLocallyAtom, input.id);
       }
       return { ok: false, failure };
     }
     if (scope.isCurrent()) {
       set(replacePostAtom, post);
     }
     return { ok: true };
   },
 );
 
 /** Deletes a post (author or admin); its comments go with it and its open thread closes. */
 export const deletePostAtom = atom(
   null,
   async (get, set, id: number): Promise<PostWriteResult> => {
     const scope = startWrite(get);
     if (scope === null) {
       return { ok: false, failure: NOT_READY };
     }
     try {
       await deletePost(id);
     } catch (error) {
       const failure = toApiFailure(error);
       if (isGone(failure) && scope.isCurrent()) {
         set(removePostLocallyAtom, id);
       }
       return { ok: false, failure };
     }
     if (scope.isCurrent()) {
       set(removePostLocallyAtom, id);
     }
     return { ok: true };
   },
 );
 
 /**
  * Adds a comment, or a reply when `parent_id` is a number. The content is
- * trimmed. The post's count goes up by one even when its thread is closed.
+ * trimmed with `presentText`; empty content is refused without a call. The
+ * post's count goes up by one even when its thread is closed.
  */
 export const addCommentAtom = atom(
   null,
-  async (get, set, input: AddCommentInput): Promise<PostWriteResult> => {
+  async (get, set, input: AddCommentInput): Promise<CommentWriteResult> => {
     const scope = startWrite(get);
     if (scope === null) {
       return { ok: false, failure: NOT_READY };
     }
+    const content = presentText(input.content);
+    if (content === null) {
+      return BLANK_TEXT;
+    }
     const postId = input.posts_id;
     let comment: Comment;
     try {
       comment = await createComment({
         posts_id: postId,
-        content: input.content.trim(),
+        content,
         parent_id: input.parent_id,
       });
     } catch (error) {
       return { ok: false, failure: toApiFailure(error) };
     }
     if (scope.isCurrent()) {
       set(patchCommentsAtom, {
         postId,
         patchList: (items) => appendComment(items, comment),
         countChange: 1,
       });
     }
     return { ok: true };
   },
 );
 
-/** Saves an edited comment (author only). A 404 removes it and its replies here. */
+/**
+ * Saves an edited comment (author only). Same trimming as add. A 404 removes
+ * it and its replies here.
+ */
 export const saveCommentAtom = atom(
   null,
-  async (get, set, input: SaveCommentInput): Promise<PostWriteResult> => {
+  async (get, set, input: SaveCommentInput): Promise<CommentWriteResult> => {
     const scope = startWrite(get);
     if (scope === null) {
       return { ok: false, failure: NOT_READY };
     }
+    const content = presentText(input.content);
+    if (content === null) {
+      return BLANK_TEXT;
+    }
     const where = locateComment(get, input.id);
     let comment: Comment;
     try {
-      comment = await updateComment(input.id, { content: input.content.trim() });
+      comment = await updateComment(input.id, { content });
     } catch (error) {
       const failure = toApiFailure(error);
       if (isGone(failure) && where !== null && scope.isCurrent()) {
         set(patchCommentsAtom, {
           postId: where.postId,
           patchList: (items) => removeWithReplies(items, input.id),
           countChange: -where.removedCount,
         });
       }
       return { ok: false, failure };
     }
     if (scope.isCurrent() && where !== null) {
       set(patchCommentsAtom, {
         postId: where.postId,
         patchList: (items) => replaceComment(items, comment),
         countChange: 0,
       });
     }
     return { ok: true };
   },
 );
 
 /**
  * Deletes a comment (author or admin) with every reply under it. The post's
  * count drops by the comment and its replies, even when the thread closed
  * meanwhile. A 404 removes it here too.
  */
 export const deleteCommentAtom = atom(
   null,
   async (get, set, id: number): Promise<PostWriteResult> => {
     const scope = startWrite(get);
     if (scope === null) {
       return { ok: false, failure: NOT_READY };
     }
     const where = locateComment(get, id);
     let failure: ApiFailure | null = null;
     try {
       await deleteComment(id);
     } catch (error) {
       failure = toApiFailure(error);
```
