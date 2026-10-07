# REQ-fs-004 — lesson candidates

## CAND-001 [implement-task]
**Claim:** When a plan gives a file count for a delete list, count the named files and the tracked files before the gate; approve the names, not the number.
**Saw it in:** `.adlc/specs/2026-10/fs/REQ-fs-004-frontend-foundation-shell-auth/architecture.md:18`
**Context:** The plan and the task said "57 legacy files"; the named list and `git ls-files frontend/src` both gave 51. The names matched, so the delete was safe, but the number the owner approved was wrong.

## CAND-002 [implement-task]
**Claim:** Do not write a `%PLACEHOLDER%` inside an HTML comment in `frontend/index.html`; the Vite plugin replaces it there too.
**Saw it in:** `frontend/vite.config.ts:17`
**Context:** The marker comment for the theme script would have carried the storage key text if it had named the placeholder.

## CAND-003 [implement-task]
**Claim:** `vite.config.ts` may import plain-constant files from `src/config/` with the `.ts` ending; `tsc -b` accepts a file that sits in both the node and the app project.
**Saw it in:** `frontend/vite.config.ts:4`
**Context:** architecture.md listed this as a risk with a fallback; the build proved the fallback is not needed. The files must stay free of DOM and imports.

## CAND-004 [implement-task]
**Claim:** A file deleted and written new at the same path shows as modified in `git status`, so count deletions as "D lines plus reused paths" when checking a delete list.
**Saw it in:** `frontend/src/App.tsx:1`
**Context:** AC2 expects every legacy file to show as deleted; `App.tsx` and `main.tsx` show as `M`, giving 50 `D` lines for 52 removed files.

## CAND-005 [implement-task]
**Claim:** Do not import anything from `services/` in a component, page, route, hook or icon, not even with `import type`; get the type through the store.
**Saw it in:** `scripts/frontend-style-check.mjs:276`
**Context:** Rule d of the style check looks at the import path only, so a type-only import of `ApiFailure` in a page fails the check the same as a real call.

## CAND-006 [implement-task]
**Claim:** A size with no token still needs one in `tokens.css`, even in `base.css`: the px rule covers `base.css` as well as component stylesheets.
**Saw it in:** `frontend/src/styles/base.css:66`
**Context:** The screen-reader-only helper needs a 1px box; it reads `--hidden-size`, a token added beside the architecture list.

## CAND-007 [implement-task]
**Claim:** Do not write `#` plus 3, 4, 6 or 8 letters a to f or digits in frontend code (`"#feed"`, `"#add"`, `"#123"`); the style check reads it as a hex color.
**Saw it in:** `scripts/frontend-style-check.mjs:81`
**Context:** The check cannot tell an in-page link or an issue number in a string from a color. Comments are skipped; strings are not.

## CAND-008 [implement-task]
**Claim:** When proving a check can fail, write one bad line per rule and a few lines that must stay clean, not only the one case the task names.
**Saw it in:** `.adlc/specs/2026-10/fs/REQ-fs-004-frontend-foundation-shell-auth/tasks/TASK-002.md:39`
**Context:** The task asked for one `color: #fff` probe; that proves rule a only. A 2-file probe exercised all eight rules and showed no false finding on `color-mix`, `white-space` or a `<button onClick>`.

## CAND-009 [implement-task]
**Claim:** In a Jotai write atom, after an `await`, change several atoms through one inner write-only atom; separate `set` calls after an `await` each notify listeners on their own.
**Saw it in:** `frontend/src/store/sessionActions.ts:48`
**Context:** Log out must clear the token and set the `loggedOut` notice in one update, or the route guard sees a logged-out user with no notice. A scratch run with listeners on the three atoms showed one state per action.

## CAND-010 [implement-task]
**Claim:** Only treat a 401 as "session ended" when the request was sent with a token and that token is still the current one.
**Saw it in:** `frontend/src/services/apiClient.ts:54`
**Context:** Without the "was sent with a token" half, a 401 on a call made while logged out equals the current token (both nothing) and would show "Your session has ended" to a visitor.

## CAND-011 [implement-task]
**Claim:** After a log in answers 200, read the token before storing it; a 200 that is not the API (a proxy answering with a web page) must count as a failure.
**Saw it in:** `frontend/src/store/sessionActions.ts:64`
**Context:** Apache serving `index.html` for `/api` when its proxy is off answers 200. Storing that gives no session and no error, so the form would just sit there.

## CAND-012 [implement-task]
**Claim:** To augment an axios interface, repeat its exact type parameters (`AxiosRequestConfig<D = any, P = any>` in axios 1.20), or the build fails with "all declarations must have identical type parameters".
**Saw it in:** `frontend/src/services/apiClient.ts:12`
**Context:** Older examples show one parameter; the installed axios has two.

## CAND-013 [implement-task]
**Claim:** A check script run with `tsx` can test store code too: fake `localStorage` and `window` on `globalThis` before a dynamic `import()`, and give the axios instance a fake `adapter`.
**Saw it in:** `frontend/src/store/wireApi.ts:36`
**Context:** The 401 rule, the start-up check and "one update" could not be proven by the lib-only script; a scratch harness (not shipped) proved them in 69 cases. A shipped version would need a new task.

## CAND-014 [implement-task]
**Claim:** Do not write a token another tab stored back to storage; adopt it in memory only.
**Saw it in:** `frontend/src/store/sessionAtoms.ts:33`
**Context:** A late `storage` event carrying an old value would be written back and sent to the other tab again; two tabs could keep answering each other.

## CAND-015 [implement-task]
**Claim:** Keep the theme script in `index.html` above everything else in the head; Vite adds its module script and stylesheet link at the end of the head, so a script placed there by hand stays first.
**Saw it in:** `frontend/index.html:11`
**Context:** AC15 depends on this order. Checked by reading `frontend/dist/index.html` after a build, not assumed.

## CAND-016 [implement-task]
**Claim:** The theme rule is written twice, in the `index.html` script and in `store/themeAtoms.ts`; change both together (saved light or dark wins, anything else asks the system, no answer means light).
**Saw it in:** `frontend/src/store/themeAtoms.ts:33`
**Context:** The head script cannot import anything, so the rule cannot be shared. Only the storage key is shared, through the Vite plugin.

## CAND-017 [implement-task]
**Claim:** A store module that adds listeners when it is loaded must remove them in `import.meta.hot.dispose`, or a hot reload leaves an old listener that reads the old atom.
**Saw it in:** `frontend/src/store/themeAtoms.ts:97`
**Context:** After a hot reload the atom is a new object in the same store; the old system-setting listener would apply a stale choice. Development only.

## CAND-018 [implement-task]
**Claim:** To make a button ignore presses without `disabled`, call `event.preventDefault()` in its click handler; skipping the caller's `onClick` alone still lets a submit button submit.
**Saw it in:** `frontend/src/components/ui/Button/Button.tsx:49`
**Context:** The busy Button keeps focus (aria-disabled, not disabled). Enter in a field of the form also reaches the form through the submit button's click, so one line covers both.

## CAND-019 [implement-task]
**Claim:** Give every `<fieldset>` `min-width: 0`; its default is the width of its content, so it will not shrink on a narrow page.
**Saw it in:** `frontend/src/components/ui/RadioCards/RadioCards.module.css:3`
**Context:** RadioCards is a fieldset holding a two-column grid; without the line the grid cannot get narrower than its longest label at 360px.

## CAND-020 [implement-task]
**Claim:** To look at a component before any page renders it, put a throwaway `index.html` + `main.tsx` in a folder beside `frontend/src` (not inside), serve it with `npx vite --port <free>`, and screenshot with headless Chrome.
**Saw it in:** `frontend/src/components/ui/Field/Field.tsx:1`
**Context:** Outside `src` the scratch page is not type-checked by a parallel task's build nor read by the style check. `--dump-dom` after a scripted click also proves behaviour.

## CAND-021 [implement-task]
**Claim:** In headless Chrome, `el.focus()` from a script does not show `:focus-visible` on buttons, links, checkboxes or radios (only on text controls); prove their ring with a real Tab key.
**Saw it in:** `frontend/src/styles/base.css:48`
**Context:** A probe read `outline-style: none` on a focused Button and looked like a bug; it is the browser's rule for focus that did not come from the keyboard.

## CAND-022 [implement-task]
**Claim:** When CSS turns a `<table>` into cards with `display: block` or `grid`, write the table roles (`table`, `rowgroup`, `row`, `columnheader`, `cell`) on the elements yourself.
**Saw it in:** `frontend/src/components/ui/Table/Table.tsx:27`
**Context:** Changing `display` on table elements makes some browsers stop telling a screen reader it is a table. Not proven with a screen reader here.

## CAND-023 [implement-task]
**Claim:** Wrap a cell's content in one element before making the cell a grid or flex box; each direct child becomes its own item.
**Saw it in:** `frontend/src/components/ui/Table/Table.tsx:57`
**Context:** The phone table cell is a label / value grid. Two buttons rendered into one cell would have landed in two grid cells.

## CAND-024 [implement-task]
**Claim:** Headless Chrome on Windows will not go narrower than about 500px; to check 360px, load the page in a 360px-wide `<iframe>` and measure `getBoundingClientRect().right` of its elements.
**Saw it in:** `frontend/src/components/ui/Table/Table.module.css:54`
**Context:** `--window-size=360` gave a 500px page. Also give each parallel Chrome run its own `--user-data-dir`, or it prints nothing.

## CAND-025 [implement-task]
**Claim:** Check a filled tag or badge on every background it can sit on, not only on the card color; a `--sunken` tag vanishes on a `--sunken` (hovered) table row.
**Saw it in:** `frontend/src/components/ui/Tag/Tag.module.css:26`
**Context:** The spec says the Student tag is `--sunken`; system.html draws it outlined inside its sunken row. A 1px `--line` outline covers both.

## CAND-026 [implement-task]
**Claim:** Style a native `<dialog>`'s layout on `.dialog[open]`, never on `.dialog`: a plain `display: flex` beats the browser's `display: none` and the closed dialog shows.
**Saw it in:** `frontend/src/components/ui/Dialog/Dialog.module.css:22`
**Context:** The dialog stays in the page while closed; only the `[open]` rule may set `display`.

## CAND-027 [implement-task]
**Claim:** Check the focus ring on every background a control sits on; on an `--action` surface use `outline-color: var(--on-action)`, because `--focus` on `--action` is about 1.8:1 in the dark theme.
**Saw it in:** `frontend/src/components/ui/Toast/ToastViewport.module.css:58`
**Context:** The toast's Dismiss button draws its ring inside the toast. The same will happen to any control placed on `--action` or `--band`.

## CAND-028 [implement-task]
**Claim:** To test a `<dialog>` in headless Chrome, drive it over the debugging port with real keys; `--dump-dom --virtual-time-budget` runs no animation frames, so the dialog's `close` event never fires and a JS-made Escape does nothing.
**Saw it in:** `frontend/src/components/ui/Dialog/Dialog.tsx:60`
**Context:** Node 22+ has `WebSocket` built in, so `Input.dispatchKeyEvent` (Tab, Escape, Enter with `text: "\r"`) needs no package.

## CAND-029 [implement-task]
**Claim:** A `var(--token)` inside `::backdrop` only works in browsers from early 2024 (Chrome 122, Firefox 120, Safari 17.4); before that `::backdrop` inherited nothing and the backdrop is clear.
**Saw it in:** `frontend/src/components/ui/Dialog/Dialog.module.css:29`
**Context:** architecture.md says "a browser from 2023 or later" for `<dialog>` and `color-mix`; the token in the backdrop moves that line a little later. No fix without a color literal.

## CAND-030 [implement-task]
**Claim:** Before a browser look with the dev server, check whether port 3000 already answers; if it does, run Vite with a throwaway config that sends `/api` to a dead port, or a hand-made token sends real requests to a real backend.
**Saw it in:** `frontend/vite.config.ts:29`
**Context:** TASK-008 was told "no backend is running", but a Node process was answering `/api/health` on 3000; the look includes a `PUT /api/users/1/logout`.

## CAND-031 [implement-task]
**Claim:** When an effect must run once per state ("load when idle"), read that state from the store inside the effect (`useStore().get(atom)`), not from the render: StrictMode runs the same closure twice and the second run still sees the old value.
**Saw it in:** `frontend/src/components/shell/AppShell/AppShell.tsx:51`
**Context:** The first version sent `GET /api/users/:id` twice per load in development; the network log showed it.

## CAND-032 [implement-task]
**Claim:** Mount a fixed-position region that can hold buttons (the toast viewport) after the routes in the document, or its buttons come before the skip link in Tab order.
**Saw it in:** `frontend/src/App.tsx:51`
**Context:** architecture.md says "mounted once at the top"; taken literally that breaks AC36 whenever a toast is on screen.

## CAND-033 [implement-task]
**Claim:** A guard that redirects on an expired session needs its opposite guard to judge expiry too, and both must read the clock themselves; the session atom alone calls an expired token "logged in" and the two guards bounce.
**Saw it in:** `frontend/src/routes/PublicOnly.tsx:42`
**Context:** `RequireAuth` redirects in the same commit in which its effect ends the session, so for one render `PublicOnly` still sees the old token.

## CAND-034 [implement-task]
**Claim:** An element as wide as the screen (`<main>`, a full-width menu link) needs its focus ring drawn inside its edge (`outline-offset: calc(-1 * var(--focus-width))`); the default outside ring is cut off at both sides.
**Saw it in:** `frontend/src/components/shell/PhoneMenu/PhoneMenu.module.css:98`
**Context:** The style check forbids removing an outline, and base.css says components do not write their own ring; moving the offset keeps both rules.

## CAND-035 [implement-task]
**Claim:** `react-router` 7 wraps every navigation in a React transition, so with `React.lazy` pages the old page stays until the new file arrives; a "focus the new h1 on pathname change" effect therefore runs when the real page is in the document, not the Suspense fallback.
**Saw it in:** `frontend/src/components/shell/AppShell/AppShell.tsx:65`
**Context:** Checked in `node_modules/react-router` 7.18.3 (`useTransitions`); if that default is ever turned off, the effect would focus the fallback heading.

## CAND-036 [implement-task]
**Claim:** When a check looks at an image that has `loading="lazy"`, scroll it into view first; until then it neither loads nor fails, so a broken photo still looks like a photo to the script.
**Saw it in:** `frontend/src/components/ui/Avatar/Avatar.tsx:35`
**Context:** TASK-010's first probe counted six `<img>` and no fallback to initials; after scrolling through the page the three broken ones had become initials.

## CAND-037 [implement-task]
**Claim:** Measure widths before any full-page screenshot over the debugging port: `captureBeyondViewport` removes the 15px scrollbar and the page stays 15px wider afterwards, so numbers taken before and after do not agree.
**Saw it in:** `frontend/src/components/ui/Dialog/Dialog.module.css:1`
**Context:** The dialog measured 313px wide at "360px" before a screenshot and 328px after; TASK-007 had reported 328.

## CAND-038 [implement-task]
**Claim:** To prove a page is left out of the production build, search `dist` for several strings that only that page has, and run the same search on `src` so a typo in the search string cannot pass as "not found".
**Saw it in:** `frontend/src/App.tsx:24`
**Context:** `import.meta.env.DEV ? lazy(() => import(...)) : null` drops the file; the search gave 0 files in dist and 1 in src for four strings.

## CAND-039 [implement-task]
**Claim:** A demo that needs "a photo link that works" should point at the app's own origin (`window.location.origin + "/favicon.svg"`), not at an outside host: it passes the http(s) rule and no request leaves the machine.
**Saw it in:** `frontend/src/pages/dev/ComponentsPage/ComponentsPage.tsx:163`
**Context:** The components page must make no outside call; the network log of the look shows one host only.

## CAND-040 [implement-task]
**Claim:** To prove a form against 401 / 409 / 500 without a backend, start Vite from a script with `configFile: false` and no proxy, and answer `/api` in a `configureServer` middleware; then no request can reach whatever listens on the real API port.
**Saw it in:** `frontend/vite.config.ts:29` (the proxy that the throwaway server leaves out)
**Context:** Port 3000 held the owner's API with the real database; a sign-up through the normal dev server would have written a row.

## CAND-041 [implement-task]
**Claim:** A page that must not set state after a successful dispatch needs a ref, not only `busy` state, as its double-submit guard: set the ref before the `await` and clear it only on failure.
**Saw it in:** `frontend/src/pages/LoginPage/LoginPage.tsx:91`
**Context:** On success the guard unmounts the page, so the busy state is never reset; the ref also stops a second submit that arrives before the busy state is drawn.

## CAND-042 [implement-task]
**Claim:** Keep a failed-request message as a new object per failure (`{ text }`), not a string, when an effect moves focus to it; the same string twice in a row would not re-run the effect.
**Saw it in:** `frontend/src/pages/LoginPage/LoginPage.tsx:84`
**Context:** Two wrong passwords in a row must both move focus to "The email or password is not correct."

## CAND-043 [implement-task]
**Claim:** When driving headless Chrome over the debugging port, a synthetic mouse press can leave the tab deaf to later key and mouse events; restart the browser before reading a "key did nothing" result as a page bug.
**Saw it in:** `frontend/src/components/ui/RadioCards/RadioCards.tsx:40` (the radio that looked broken and was not)
**Context:** Space on the Graduate radio did nothing in one run and worked in every run of a fresh browser.

## CAND-044 [implement-task]
**Claim:** When a check is "git grep finds nothing", add `--untracked`: plain `git grep` reads only tracked files, so it passes on a tree of new, uncommitted files without reading them.
**Saw it in:** `.adlc/specs/2026-10/fs/REQ-fs-004-frontend-foundation-shell-auth/check-notes.md:96` (section 1.4)
**Context:** AC1's `git grep -n "antd" -- frontend/src` exited "no match" while 106 of the files in `frontend/src` were untracked.

## CAND-045 [implement-task]
**Claim:** When a task closes a follow-up that another task wrote down, fix the comment in the first task's file in the same edit.
**Saw it in:** `frontend/src/store/themeAtoms.ts:73` (says no start-up call is needed; `main.tsx:11` now imports the file for that reason)
**Context:** TASK-008 added the import TASK-004 suggested; the old comment stayed and now contradicts the code.

## CAND-046 [implement-task]
**Claim:** To test an expired or refused session by hand, edit the stored token in the browser console (move `exp` back, or spoil the signature) instead of waiting an hour; only "expires while the page is open" needs the real wait.
**Saw it in:** `.adlc/specs/2026-10/fs/REQ-fs-004-frontend-foundation-shell-auth/manual-checklist.md:215` (steps 49 to 51)
**Context:** Any change to the payload breaks the signature, so a hand-made token always gets a 401 on the first API call; it cannot stand in for a live session.

## CAND-047 [review-arch]
**Claim:** Put a rule that several guards must agree on (session is live) in one lib function, not in each guard.
**Saw it in:** `frontend/src/routes/RequireAuth.tsx:23` (also PublicOnly.tsx:42, wireApi.ts:16)
**Context:** Three copies of the same expiry check; drift gives redirect loops.

## CAND-048 [review-arch]
**Claim:** A literal that CSS cannot take from a token (media query width) needs one guard covering every language that repeats it, not only CSS.
**Saw it in:** `frontend/src/components/shell/PhoneMenu/PhoneMenu.tsx:33`
**Context:** Style check pins the CSS breakpoint but not the TSX copy.

## CAND-QUAL-001 [review-qual]
**Claim:** Put the tricky native-dialog logic in one hook; do not copy it between dialog-like components.
**Saw it in:** `frontend/src/components/ui/Dialog/Dialog.tsx` and `frontend/src/components/shell/PhoneMenu/PhoneMenu.tsx`
**Context:** About 60 identical lines (showModal guard, held-back Escape, layout-effect close) in two files.

## CAND-QUAL-002 [review-qual]
**Claim:** Keep pure logic that guards security or has edge cases in `lib/` so the no-test-runner check script can reach it.
**Saw it in:** `frontend/src/routes/PublicOnly.tsx:13` (`readReturnAddress`), `frontend/src/components/ui/Pagination/Pagination.tsx:23`
**Context:** The check script imports only `lib/`, so logic placed in routes or components is unchecked.

## CAND-QUAL-003 [review-qual]
**Claim:** Wire check scripts into root npm scripts, or the next REQ will not run them.
**Saw it in:** `package.json:12-17`
**Context:** `frontend-style-check.mjs` and `frontend-lib-check.ts` exist but only as commands in prose.

## CAND-QUAL-004 [review-qual]
**Claim:** Write one shared "is the session live" helper; two guards judging expiry separately can loop.
**Saw it in:** `frontend/src/routes/PublicOnly.tsx:42`, `frontend/src/routes/RequireAuth.tsx:23`, `frontend/src/store/wireApi.ts:16`
**Context:** Three copies of the same expiry test, with a comment saying two must agree.

## CAND-QUAL-005 [review-qual]
**Claim:** Add a style-check rule for path and storage-key literals outside their one config file.
**Saw it in:** `scripts/frontend-style-check.mjs:11-18`
**Context:** Rules cover colors, sizes, imports and app name, but not the "no magic strings" rule for addresses and keys.

## CAND-049 [review-corr]
**Claim:** When a page relies on a guard to leave after success, reset its busy state anyway or make the action refuse results the guard will refuse.
**Saw it in:** `frontend/src/pages/LoginPage/LoginPage.tsx:4701` (packet)
**Context:** A token already expired on the browser clock keeps PublicOnly on the login page with the button busy forever.

## CAND-050 [review-corr]
**Claim:** Put a timeout on every call whose failure path is the only way out (log out).
**Saw it in:** `frontend/src/services/userService.ts:5556` (packet)
**Context:** axios has no default timeout; a hung server never reaches the catch that logs the user out.

## CAND-051 [review-corr]
**Claim:** A flag that skips 401 handling is not a flag that skips the Authorization header; name and implement each separately.
**Saw it in:** `frontend/src/services/apiClient.ts:5443` (packet)
**Context:** `skipAuthHandling` replaced `skipAuthRedirect` but login and sign-up now send any stored token.

## CAND-047 [review-reflect]
**Claim:** A REQ that deletes a whole old module must grep the vault and shared code for "legacy" and "kept for" in the same REQ, and close each line it finds.
**Saw it in:** `shared/types/user.types.ts:1` (also G34, G38, ADR-07)
**Context:** The legacy antd frontend was deleted; four places still say it needs `User` / `CreateUserDTO` or that antd stays installed.

## CAND-048 [review-reflect]
**Claim:** When a second page needs the same message or limit as the first, move it to one shared file at that moment, not "when the third form comes".
**Saw it in:** `frontend/src/pages/SignUpPage/SignUpPage.tsx:46,54` (copy of `LoginPage.tsx:39,47`)
**Context:** Documented as an open point instead of fixed; same shape as LESSON-REQ-fs-002-3 (third REQ in a row).

## CAND-049 [review-reflect]
**Claim:** A patterns doc that tells the reader to "check each path exists" needs a script that does it; run one over the doc before the gate.
**Saw it in:** `docs/frontend-patterns.md:562`
**Context:** Every path in the doc was correct this time, but only because the writer checked by hand; nothing re-checks it after parts 2 to 4 edit it.

## CAND-UI-1 [ui-review]
**Claim:** A control that disables itself on activation (Pagination Next/Previous) drops keyboard focus; use aria-disabled or move focus, as `Button` already does for busy.
**Saw it in:** `frontend/src/components/ui/Pagination/Pagination.tsx:105`
**Context:** Focus on Next, activate to the last page: `document.activeElement` becomes BODY. Parts 2 and 4 reuse Pagination.

## CAND-UI-2 [ui-review]
**Claim:** A toggle button should either keep one name and use aria-pressed, or change its name and drop aria-pressed; not both.
**Saw it in:** `frontend/src/components/ui/PasswordInput/PasswordInput.tsx:56`
**Context:** Screen readers get "Hide password, toggle button, pressed". Same check applies to ThemeSwitch if it ever renames.

## CAND-UI-3 [ui-review]
**Claim:** The "wrap as a safety net" header hides a real layout at 768 to 850px; check the widths just above the phone breakpoint, not only 360 and 1280.
**Saw it in:** `frontend/src/components/shell/Header/Header.module.css:12`
**Context:** Header is 145px high at 768 and 800 with a short user name; 200% zoom of a 1536px laptop lands there.

## CAND-IMPL-A1 [implement-task]
**Claim:** To act once a lazy page is on screen, render a sibling effect component inside the same Suspense; its effect runs only after the boundary resolves.
**Saw it in:** `frontend/src/components/shell/AppShell/AppShell.tsx` (FocusHeading)
**Context:** Focusing the h1 at shell mount would hit the loading fallback, not the page.

## CAND-IMPL-B1 [implement-task]
**Claim:** Blank string contents one-for-one (also after a backslash) when a check maps a position in blanked text back to the file.
**Saw it in:** `scripts/frontend-style-check.mjs` (`openingTagAttributes`)
**Context:** The old version skipped an escaped character without output, so the offsets drifted; rule f's role check needs exact offsets.

## CAND-IMPL-B2 [implement-task]
**Claim:** A shared hook keeps one effect order; a caller that also needs the latest props keeps its own small ref instead of exporting the hook's.
**Saw it in:** `frontend/src/hooks/useModalDialog.ts`, `components/shell/PhoneMenu/PhoneMenu.tsx`
**Context:** PhoneMenu's route-change effect must read the newest `open` and `onClose` without re-running when they change.

- (architecture-reviewer, round 2) When fixes add files to a layer-ruled folder (config/, lib/, hooks/), update the architecture folder list at wrap-up; it is the placement contract for the next part.
- (architecture-reviewer, round 2) A per-call request flag (`withoutToken`, `skipAuthHandling`) read by the API client itself keeps the client store-free; prefer it over new injected hooks.

- (reflector, round 2) When a fix removes a duplication or adds a check rule, grep the docs for the old claim ("known duplication", "eight rules", case counts): the prose is the last copy left (LESSON-REQ-fs-002-3, third sighting).
- (quality-reviewer, round 2) A comment that names a check rule by letter goes stale when rules are added; name the rule by what it checks, or grep for "rule " after adding one.
- (quality-reviewer, round 2) A TypeScript type predicate (`x is T`) also narrows the false branch; use it only when "false" really means "not T".

## CAND-R2A [review-corr]
**Claim:** Router state outlives the navigation (it is kept in history.state across reloads); never use it as a one-shot signal without clearing it.
**Saw it in:** `frontend/src/routes/paths.ts:22`
**Context:** AFTER_LOG_IN_STATE focus flag is read at AppShell mount and survives a reload.

## CAND-R2B [review-corr]
**Claim:** A "do this on the next change" ref flag must be tied to the expected target value, not just set and cleared by the effect.
**Saw it in:** `frontend/src/components/ui/Pagination/Pagination.tsx:17`
**Context:** keepFocus stays true if the parent never changes the page.

## CAND-R2-UI1 [ui-review]
**Claim:** Router state that triggers a one-time action (focus the heading) outlives a reload; clear it after use or the action repeats.
**Saw it in:** `frontend/src/components/shell/AppShell/AppShell.tsx:68`
**Context:** history.state keeps `afterLogIn` on reload, so focus jumps to the h1 again.

## CAND-R2-UI2 [ui-review]
**Claim:** A mock API added only through Vite `configureServer` does not answer under `vite preview`; also set `configurePreviewServer`.
**Saw it in:** scratchpad `vite.mock.config.mjs` (not in repo)
**Context:** the first preview run showed false "Something went wrong" errors.
