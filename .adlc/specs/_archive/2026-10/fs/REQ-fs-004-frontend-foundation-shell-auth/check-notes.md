# REQ-fs-004 — Check notes (TASK-011)

Written by: task-implementer, 2026-10-07, on the final code of TASK-001 to TASK-010.

This file puts in one place:

1. the final machine checks, each with its command and its real output;
2. a table of all 65 acceptance criteria and what proves each one;
3. the criteria that were **not** proven here, and who proves them;
4. every deviation and "for the owner or reviewer to decide" item the tasks recorded;
5. every follow-up the tasks left undone;
6. what this task itself found.

No check failed. No source file under `frontend/src` or `scripts/` was changed by this task, and no check was edited.

---

## 1. Final checks

All run from the repo root (`C:/Users/Lenovo/Alumni_Details_System`) in Git Bash. Node v25.9.0, tsx v4.23.13. No dev server and no browser were used. No request was sent to port 3000.

### 1.1 `npm run build` — exit 0 (AC7)

```
> alumni-system@1.0.0 build
> npm run build --workspace=@alumni/api && npm run build --workspace=@alumni/frontend

> @alumni/api@1.0.0 build
> tsc

> @alumni/frontend@1.0.0 build
> tsc -b && vite build

The CJS build of Vite's Node API is deprecated. See https://vite.dev/guide/troubleshooting.html#vite-cjs-node-api-deprecated for more details.
vite v5.4.21 building for production...
transforming...
✓ 188 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                                                     1.30 kB │ gzip:  0.65 kB
dist/assets/hanken-grotesk-vietnamese-wght-normal-CHiFlh_0.woff2    9.32 kB
dist/assets/hanken-grotesk-latin-ext-wght-normal-Dg-wlmqe.woff2    19.59 kB
dist/assets/hanken-grotesk-latin-wght-normal-CaVRRdDk.woff2        34.70 kB
dist/assets/Link-N5dxkzTJ.css                                       0.16 kB │ gzip:  0.13 kB
dist/assets/LoginPage-BlqZ7eVa.css                                  2.74 kB │ gzip:  0.87 kB
dist/assets/SignUpPage-Csv2adPg.css                                 2.87 kB │ gzip:  0.92 kB
dist/assets/TextInput-jWTMdIyQ.css                                  4.67 kB │ gzip:  1.21 kB
dist/assets/index-BdYMLss9.css                                     19.58 kB │ gzip:  6.11 kB
dist/assets/DashboardPage-Cr2bUFMz.js                               0.19 kB │ gzip:  0.17 kB
dist/assets/UsersPage-CR2sq7oo.js                                   0.19 kB │ gzip:  0.17 kB
dist/assets/FeedPage-WIhsX4Jk.js                                    0.20 kB │ gzip:  0.18 kB
dist/assets/AlumniProfilePage-Cpox4yYJ.js                           0.20 kB │ gzip:  0.18 kB
dist/assets/DirectoryPage-B5nivkmf.js                               0.25 kB │ gzip:  0.21 kB
dist/assets/BeingBuilt-DqRMDeQS.js                                  0.26 kB │ gzip:  0.20 kB
dist/assets/NoAccessPage-BAaQC5nB.js                                0.30 kB │ gzip:  0.22 kB
dist/assets/NotFoundPage-4ts4dI0O.js                                0.30 kB │ gzip:  0.23 kB
dist/assets/Link-BsWWjEuz.js                                        0.32 kB │ gzip:  0.23 kB
dist/assets/MyProfilePage-B90GnQLW.js                               0.34 kB │ gzip:  0.26 kB
dist/assets/LoginPage-VWKI3zoF.js                                   3.47 kB │ gzip:  1.69 kB
dist/assets/TextInput-BVnm6Nlt.js                                   3.72 kB │ gzip:  1.54 kB
dist/assets/SignUpPage-D7Z4Xfkb.js                                  3.98 kB │ gzip:  1.86 kB
dist/assets/index-BQHWUOo1.js                                     266.09 kB │ gzip: 90.65 kB
✓ built in 1.25s
EXIT=0
```

The "CJS build of Vite's Node API is deprecated" line is a warning from Vite 5 itself, not from our code.

### 1.2 `node scripts/frontend-style-check.mjs` — exit 0 (AC1, AC3, AC8, AC11, AC60, part of AC61)

```
frontend-style-check: 111 files checked
  a    0  color literal outside styles/tokens.css
  b    0  px / em / rem literal in a component stylesheet or base.css
  c    0  import of antd, @ant-design or @fontsource-variable/inter
  d    0  import of axios or services/ from a UI folder
  e    0  app name or contact email outside config/app.ts
  f    0  onClick on a <div> or <span>
  g    0  dangerouslySetInnerHTML
  h    0  box-shadow, gradient or outline removed in a stylesheet
PASS: no findings
EXIT=0
```

That this check can fail was shown in TASK-002 (a probe file gave exit 1 with a finding for each of the eight rules). Not repeated here: it would mean writing a file under `frontend/src`.

### 1.3 `npx tsx scripts/frontend-lib-check.ts` — exit 0 (AC46, AC53 wording; token and initials rules)

```
frontend-lib-check: 72 passed, 0 failed
EXIT=0
```

That this check can fail was shown in TASK-003 (one changed expected message gave `70 passed, 2 failed`, exit 1).

### 1.4 `git grep -n "antd" -- frontend/src frontend/package.json` — nothing (AC1)

```
GREP_EXIT=1
```

Exit 1 from `git grep` means "no match". **But this command, as the task wrote it, proves little today:** `git grep` reads only files git already tracks, and 106 of the files in `frontend/src` are new and not committed yet. So the search was run again with `--untracked` and with all three package names:

```
$ git grep -n --untracked -e "antd" -e "@ant-design" -e "@fontsource-variable/inter" -- frontend/src frontend/package.json
EXIT=1
```

Nothing found in either run. Rule c of the style check (1.2) reads the files from disk and says the same.

### 1.5 One file per page in `frontend/dist/assets` (AC6)

`ls frontend/dist/assets` after the build of 1.1:

```
AlumniProfilePage-Cpox4yYJ.js    BeingBuilt-DqRMDeQS.js      DashboardPage-Cr2bUFMz.js
DirectoryPage-B5nivkmf.js        FeedPage-WIhsX4Jk.js        Link-BsWWjEuz.js
LoginPage-VWKI3zoF.js            MyProfilePage-B90GnQLW.js   NoAccessPage-BAaQC5nB.js
NotFoundPage-4ts4dI0O.js         SignUpPage-D7Z4Xfkb.js      TextInput-BVnm6Nlt.js
UsersPage-CR2sq7oo.js            index-BQHWUOo1.js
index-BdYMLss9.css   Link-N5dxkzTJ.css   LoginPage-BlqZ7eVa.css   SignUpPage-Csv2adPg.css   TextInput-jWTMdIyQ.css
hanken-grotesk-latin-ext-wght-normal-Dg-wlmqe.woff2
hanken-grotesk-latin-wght-normal-CaVRRdDk.woff2
hanken-grotesk-vietnamese-wght-normal-CHiFlh_0.woff2
```

Ten page files (the ten pages a production build has), three shared pieces (`BeingBuilt`, `Link`, `TextInput`) and the entry `index`.

The entry does not hold the pages' text:

```
$ grep -c "This page is being built" frontend/dist/assets/index-*.js
0
$ grep -lF "This page is being built" frontend/dist/assets/*
frontend/dist/assets/BeingBuilt-DqRMDeQS.js
Remember my email on this device: frontend/dist/assets/LoginPage-VWKI3zoF.js
Create account:                   frontend/dist/assets/SignUpPage-D7Z4Xfkb.js
Page not found:                   frontend/dist/assets/NotFoundPage-4ts4dI0O.js
You do not have access:           frontend/dist/assets/NoAccessPage-BAaQC5nB.js
```

What the log-in page pulls in (`grep -o 'from"[^"]*"' frontend/dist/assets/LoginPage-*.js`): `./index-…js`, `./TextInput-…js`, `./Link-…js`. Nothing else. The entry reaches every page only through `import("./…Page-….js")`, and `frontend/dist/index.html` has no `modulepreload` line. So the first load of `/login` is four script files. Seeing that in a browser's Network tab is checklist step 58.

### 1.6 The components page is not in the build (AC31)

Each string exists once in `frontend/src` (in `pages/dev/ComponentsPage/ComponentsPage.tsx`) and nowhere in `frontend/dist`:

```
Compare each section with: dist=0 src=1
Danger soft text:          dist=0 src=1
no-such-photo:             dist=0 src=1
Show a toast:              dist=0 src=1
files in frontend/dist/assets with "component" in the name: 0
```

Command for each: `grep -rlF "<string>" frontend/dist | wc -l` and the same on `frontend/src`.

### 1.7 `git status --short` — nothing under `backend/`, `shared/`, `db/`

```
$ git status --short -- backend shared db
(no output)
```

Outside `frontend/src` and the REQ folder, the whole tree shows only these changes: `frontend/index.html`, `frontend/package.json`, `frontend/public/favicon.svg` (modified), `frontend/public/icons.svg` (deleted), `frontend/vite.config.ts`, `package-lock.json` (modified), `scripts/frontend-lib-check.ts`, `scripts/frontend-style-check.mjs` (new), and after this task `docs/frontend-patterns.md` (new).

### 1.8 Every path named in `docs/frontend-patterns.md` exists

```
$ grep -oE '`(frontend|scripts|docs|\.adlc)/[^` ]*`' docs/frontend-patterns.md | tr -d '`' | sort -u | while read -r p; do [ -e "$p" ] || echo "MISSING $p"; done
(no output)
count: 103
```

103 different paths, 0 missing. Two of them (`frontend/dist`, `frontend/dist/assets`) exist only after a build.

### 1.9 Smaller searches used by the criteria table

| What | Command (short) | Result |
|---|---|---|
| `axios` is imported only in `services/` (AC3) | `grep -rnE 'from "axios"' frontend/src` | `services/apiClient.ts`, `services/apiError.ts` only |
| Types come from `@alumni/shared` (AC5) | `grep -rnoE 'import type \{[^}]*\} from "@alumni/shared"' frontend/src` | 5 imports: `LoginResponse`, `LoginUserDTO`, `PublicUser`, `SignUpUserDTO` |
| No copy of those types, no legacy `CreateUserDTO` (AC5) | `grep -rnE "(interface\|type) (LoginUserDTO\|LoginResponse\|SignUpUserDTO\|PublicUser\|ApiError)\b"`, `grep -rn CreateUserDTO` | nothing |
| App name and email written once (AC8) | `grep -r "University Alumni" frontend/src`, same for the email | `config/app.ts` only; built `index.html` has `<title>University Alumni</title>` |
| 27 color tokens in each theme block, `color-scheme` in both (AC9) | count of `--name:` lines in lines 9–41 and 43–74 of `tokens.css` | 27 and 27; `color-scheme: light` and `color-scheme: dark` |
| Font (AC12) | `grep -o "@font-face" frontend/dist/assets/index-*.css \| wc -l`; the `--font-family` line | 4 rules, 3 font files; `'Hanken Grotesk Variable', 'Hanken Grotesk', 'Segoe UI', Helvetica, sans-serif`; no file in `dist` names `fonts.googleapis` or `fonts.gstatic` |
| Theme script runs first (AC15) | read `frontend/dist/index.html` | the inline script comes before the module script and the stylesheet link; the key in it is `ua.theme` |
| No component reads the theme (AC16) | `grep -rln "data-theme\|dataset.theme" frontend/src` | `store/themeAtoms.ts` and `styles/tokens.css` only |
| No emoji (AC30) | `grep -rnP` for the emoji ranges | nothing |
| No About link (AC35) | `grep -i about` in `Footer.tsx` | one comment, no link |
| No other shadow, no motion (AC61) | `grep -rnE "text-shadow\|drop-shadow\|filter:"`, `grep -rnE "transition\|animation\|@keyframes"` on the stylesheets | no shadow of any kind; `transition` and `animation` appear only in the reduced-motion reset of `base.css` and in three comments |
| `VITE_API_URL` unused, no absolute API address | `grep -rn "VITE_API_URL\|http://localhost" frontend/src` | nothing |

---

## 2. All 65 criteria and what proves each

**Proof column:** **M** = a machine check in section 1 of this file. **R** = the browser review of the review phase (the page beside its design picture). **C n** = step n of `manual-checklist.md`. **T00n** = seen in a browser by that task and written in its notes (against a dev server, never the real backend). Where a line has several, the first is the main proof.

| AC | About | Proof |
|---|---|---|
| 1 | No antd, no UI library, CSS Modules on tokens | **M** 1.2 rule c, 1.4; `frontend/package.json` read |
| 2 | Legacy files replaced or deleted; list approved first | Record: the 51 + 1 files were approved at the design gate and deleted by TASK-001 (its notes). Not a machine check |
| 3 | State in atoms, calls in services, no axios in UI | **M** 1.2 rule d, 1.9 |
| 4 | One API client; a 401 ends the session with the message | **C 49**; logic run in T003's scratch harness (not shipped, not re-run here) |
| 5 | Types from `@alumni/shared`, no copies | **M** 1.9, 1.1 |
| 6 | Pages loaded on demand | **M** 1.5; in a browser **C 58** |
| 7 | `npm run build` exits 0 | **M** 1.1 |
| 8 | App name and contact email in one config file | **M** 1.2 rule e, 1.9; tab title **C 10**, **C 25** |
| 9 | 27 color tokens, exact values, `data-theme`, `color-scheme` | **M** 1.9 for the count and `color-scheme`. The exact values were compared with the README by T002's script (0 differences); **not re-run here**. **R** |
| 10 | Type, spacing, shape, control, layout, layer tokens | T002's script (53 names found); **R** |
| 11 | No color value in components; sizes from tokens | **M** 1.2 rules a and b |
| 12 | Hanken Grotesk 400–700 and the fallback | **M** 1.9 |
| 13 | Three choices; system by default; follows the system live | **C 22**, **C 23** |
| 14 | Choice saved across reload and browser close | **C 20**, **C 21** |
| 15 | Theme before first paint | **M** 1.9 (order in the built page); **C 19**, **C 58** |
| 16 | Components never branch on the theme | **M** 1.9 |
| 17 | Button | **R**; T005, T010; hover **C 55**; busy **C 14** |
| 18 | TextInput, Select, Textarea | **R**; T005; **C 6–9**. "A screen reader reads the error": **not proven** (section 3) |
| 19 | Checkbox | **R**; **C 35** |
| 20 | Tag | **R**; T006, T010 |
| 21 | Avatar | **R**; photo **C 3**, initials **C 1**; broken photo T010 |
| 22 | Card | **R** |
| 23 | Table, and cards on a phone | **R**; T006, T010 |
| 24 | Pagination | **R**; T006, T010 |
| 25 | Dialog | **C 41**; T007. "Announced as a dialog": **not proven** (section 3) |
| 26 | Message | **R**; **C 11**. "Announced": **not proven** (section 3) |
| 27 | Toast | **C 1**, **C 55**; T007. "Announced": **not proven** (section 3) |
| 28 | Loading, empty and error states | **R**; skeleton **C 27** |
| 29 | Link | **R**; hover **C 55** |
| 30 | Line icons, `currentColor`, no emoji | **M** 1.9 (no emoji); `icons/IconBase.tsx` read; **R** |
| 31 | Components page, development only | **M** 1.6; **C 41**, **C 55** (it exists in development), **C 58** (it does not in the build) |
| 32 | Header, desktop | **C 24**; **R**; measured in T008 |
| 33 | Header and menu, phone | **C 29–32**, **C 40** |
| 34 | Band | **C 25**; **R**; measured in T008 |
| 35 | Footer, no About | **C 26**; **M** 1.9 |
| 36 | Skip to content | **C 38** |
| 37 | Visitor sent to log in, then back to the page | **C 46** |
| 38 | Logged-in user sent away from log in and sign-up | **C 44** |
| 39 | Non-admin at Users: no access, no admin request | **C 42** |
| 40 | Six being-built pages; Page not found | **C 25**, **C 43** |
| 41 | Name and photo from the API; skeleton; plain avatar on failure | **C 1**, **C 3**, **C 27**. The failure look: T008 only (section 3) |
| 42 | Reload keeps the session; an expired token shows the message | **C 19** (reload while logged in), **C 51** |
| 43 | Log out, also when the call fails | **C 34**, **C 47**, **C 17** |
| 44 | Log-in page matches the pictures | **C 57**; **R** |
| 45 | Forgot-password line with a `mailto:` link | **R**; `LoginPage.tsx` line 216 read; last Tab stop in **C 35** |
| 46 | Log-in validation | **M** 1.3 (wording); **C 8**, **C 9**, **C 36** |
| 47 | Wrong email or password; password sent as typed | **C 11**, **C 12**, **C 13** |
| 48 | Server down or 500 | **C 17** |
| 49 | Busy button, no second request | **C 14** |
| 50 | Remember my email | **C 15**, **C 16** |
| 51 | Sign-up page matches the picture | **C 57**; **R** |
| 52 | Real radio group; only `student` or `alumni` sent | **C 1**, **C 3**, **C 37** |
| 53 | Sign-up validation | **M** 1.3 (wording); **C 6**, **C 7** |
| 54 | Taken email | **C 4** |
| 55 | Logged in after sign-up, with the toast; else the log-in page with a message | First half **C 1**, **C 2**. Second half: T009 against made-up answers only (section 3) |
| 56 | Log in and sign-up at 360px | **C 33** |
| 57 | 360px and 200% zoom | **C 33**, **C 56**; **R** |
| 58 | Keyboard only, focus ring | **C 35–41**; T010 (68 Tab stops) |
| 59 | Contrast AA; `--accent` never text | **R**. Not measured by any task (section 3) |
| 60 | Real elements, no clickable div or span | **M** 1.2 rule f; **R** |
| 61 | No shadows, no gradients, no unasked motion | **M** 1.2 rule h, 1.9 |
| 62 | Tab title per page, one `<h1>` | **C 10**, **C 25**; one `<h1>` counted in T008, T009, T010; **R** |
| 63 | `docs/frontend-patterns.md` | This task: the file exists, 22 patterns, each with the three parts; **M** 1.8 |
| 64 | Roadmap, root `CLAUDE.md`, design-system page | **Wrap-up.** Not this task, not done yet |
| 65 | Manual checklist | This task: `manual-checklist.md`, 60 steps. The owner runs it |

---

## 3. Not proven here, and who proves it

| What | AC | Who proves it |
|---|---|---|
| Everything that needs the real backend: a real log in, 401 and 409 from the real server, a real token read by the app, the saved role, the real name in the header | 4, 37–43, 46–55 | **Owner**, checklist steps 1 to 17 and 42 to 54 |
| Theme in a real browser: live system change, no flash, survives a restart | 13, 14, 15 | **Owner**, steps 18 to 23 |
| The production build opened in a browser | 6, 15, 31 | **Owner**, step 58 |
| Hover looks | 17, 29 | **Owner**, step 55; **review phase** |
| 200% zoom on a 1280px window | 57 | **Owner**, step 56 |
| Every component beside its picture, both themes | 17–30, 32, 34, 44, 51 | **Review phase** (browser review); owner, step 57 |
| Exact color values compared with the README again on the final code | 9, 10 | **Review phase**. T002's script found 0 differences; later tasks added only non-color tokens |
| Contrast measured on the built pages | 59 | **Review phase**. Nobody measured it. Checklist "Not covered" says how |
| A screen reader really announcing the field error, the message, the toast and the dialog | 18, 25, 26, 27 | **Nobody yet.** Checklist "Not covered". Needs NVDA, Narrator or VoiceOver |
| Firefox | all | **Owner**, step 59, if installed |
| Safari, a real phone, a touch screen | all | **Nobody yet.** Checklist "Not covered" |
| A password manager and autofill | 44, 50 | **Nobody yet.** Checklist "Not covered" |
| "Account created. Log in to continue." with the real backend | 55 | **Nobody yet.** Seen only against made-up answers (T009). Checklist "Not covered" |
| The header's plain avatar when the profile call fails, with the real backend | 41 | **Nobody yet.** Seen with no server at all (T008). Checklist "Not covered" |
| A slow network between two pages | 6 | **Nobody yet.** Reasoned from the router code (T008). Checklist "Not covered" |
| Reload on a deep address on Apache | — | **Owner at the first deploy**, step 60 |
| The store's rules (401 handling, start-up check, one update per change) as a check that stays in the repo | 4, 42 | **Nobody.** Run once from a scratch file in T003. See follow-up F4 |
| Roadmap and context pages updated | 64 | **Wrap-up** |

---

## 4. Deviations and decisions for you

One line each, with the task that recorded it. **Decide** marks the ones a task explicitly left to the owner or the reviewer. The rest are choices the task text left open; they stand unless you say otherwise.

### Marked "for the owner or reviewer to decide"

| # | Task | What |
|---|---|---|
| D1 | T005 | **Decide.** The password "Show / Hide" button changes both its name and `aria-pressed`, so a screen reader says "Hide password, pressed". Usual fix: keep one of the two. One line in `PasswordInput.tsx` |
| D2 | T007 | **Decide.** Deviation from "the focus ring is `--focus` everywhere": the toast's Dismiss button uses `--on-action` for its ring, because `--focus` on the `--action` background is about 1.8:1 in dark. To undo: delete one rule in `ToastViewport.module.css` |
| D3 | T002 | **Decide.** Style check rule d also forbids `import type` from `services/` in UI code. Allowing type-only imports is a one-line change in the check |
| D4 | T006 | **Decide.** The Student tag has a 1px `--line` outline everywhere; the picture draws it plain in "Tags". Without it the tag vanishes on a hovered table row. Two lines in `Tag.module.css` |
| D5 | T004 | **Decide (review).** Hover of an unpressed theme button is `--sunken`. The pictures draw no hover for it |
| D6 | T009 | **Decide.** "Forgot your password?" line: the sentence, then the email address itself as the link. If the sentence should be the link, one line in `LoginPage.tsx` |
| D7 | T010 | **Decide (review).** Phone table: a long email breaks inside a word ("…example.c / om"). Nothing is cut. A wider value column or a stacked label would avoid it |
| D8 | T010 | **Decide (review).** Pagination at 360px wraps onto two or three lines. It works; the pictures do not draw this width |
| D9 | T010 | **Decide (review).** Pagination shows "Page 2 of 3" after the buttons; `system.html` does not draw it, AC24 asks for it |
| D10 | T010 | **Decide (review).** The loading box's border is drawn by the components page, because `Skeleton` has no box of its own |
| D11 | T003 | **Decide.** The API client has no timeout; log out waits for the server before clearing the session (also follow-up F1) |

### Different from the plan or the task text

| # | Task | What |
|---|---|---|
| D12 | T001 | The plan said 57 legacy files; the real number was 51 (plus `icons.svg`). `architecture.md` now says 51 |
| D13 | T001 | The Vite plugin also escapes `&`, `<`, `>` in the app name. `vite-env.d.ts` was not needed. `main.tsx` mounts only when `#root` exists |
| D14 | T002 | One token outside the planned list: `--hidden-size` (1px, for the visually-hidden helper) |
| D15 | T002 | One extra file, `icons/IconBase.tsx`: the shared frame of the eight icons. Not a barrel file |
| D16 | T002 | Icon `size` is optional and defaults to `md`; every icon has round line ends and joins |
| D17 | T003 | A 401 on a request that carried no token does nothing (the plan's wording would have told a visitor "your session has ended") |
| D18 | T003 | A 200 log in whose token cannot be read counts as a failure (`network`), not a session |
| D19 | T003 | The actions trim email, name and photo link, not the pages. Sign-up leaves the remembered email alone |
| D20 | T003 | A third place can empty the token: `tokenChangedElsewhereAtom`, which copies a log out made in another tab. It sets no notice |
| D21 | T003 | `loadProfileAtom` takes no argument; starting a session resets the profile to `idle` |
| D22 | T003 | New-password length counts characters, not code units. The photo link check ignores letter case and is shared with Avatar as `isWebLink` |
| D23 | T003 | A token with no `exp` never expires on the frontend; an `exp` that is not a number makes the token unreadable. `sessionAtom` does not judge expiry |
| D24 | T004, T008 | Theme listeners are added when `themeAtoms.ts` loads, not by a start-up call. T008 then added the import to `main.tsx`, which closes T004's worry about a page with no theme switch |
| D25 | T004 | Theme text buttons are 14px (pictures: 15px), per the snapping table |
| D26 | T005 | `Button` default variant is `secondary`; sizes use `min-height` so a wrapped label is not cut |
| D27 | T005 | `Field` and every text control refuse `id`, `aria-describedby`, `aria-invalid` and `className` from the caller |
| D28 | T005 | `Select`'s placeholder is a first option that can be chosen again; a required select must check for `""` itself |
| D29 | T005 | `Link` takes `to` or `href` and no other anchor props (no `target`) |
| D30 | T005 | The radio is 20px (drawn 18px), to match the checkbox. The disabled Checkbox look is not drawn; it follows the disabled input |
| D31 | T006 | One token added: `--table-row-h` (60px). Every tag has a 1px border so all tags are the same height |
| D32 | T006 | Avatar text sizes 13 / 16 / 24px; a `null` name gives an empty square; a failed photo link is remembered per link |
| D33 | T006 | `Table` sets explicit table roles and wraps each value in a `<div>`; a right-aligned column reads from the left on a phone; an empty table shows only its head |
| D34 | T006 | Pagination: a gap never stands for a single page; a bad page number is moved to the nearest real one |
| D35 | T006 | `Skeleton` got a `layout` prop and a `SkeletonStack`; `EmptyState` and `ErrorState` got `headingAs` |
| D36 | T007 | One token added: `--toast-max`. The dialog's caller owns `open`; after a second Escape in a row a caller that ignores `onClose` can disagree with the dialog |
| D37 | T007 | Added to the dialog: `aria-describedby` on the sentence; the title is an `<h2>`; focus lands on Cancel |
| D38 | T007 | `ConfirmDialog` while busy: Cancel and Escape still work |
| D39 | T007 | Toast region is `aria-atomic="false"`; the timer really pauses; after Dismiss by keyboard focus falls to the page body; Dismiss has no hover look |
| D40 | T007 | No click-on-backdrop to close and no scroll lock behind the dialog (neither was asked for) |
| D41 | T008 | `BeingBuilt.module.css` was not created. The card is `PageNote` inside `PageLayout.tsx`, shared with Page not found and the no-access page |
| D42 | T008 | `ANY_OTHER_PATH = "*"` sits beside `PATHS` |
| D43 | T008 | `RequireAuth` also ends a stored token that cannot be read; `PublicOnly` also checks expiry |
| D44 | T008 | `PublicOnly` accepts a return address only when it is inside the app |
| D45 | T008 | Pages are default exports; components stay named exports |
| D46 | T008 | `ToastViewport` comes after the routes in the document, so the skip link stays first |
| D47 | T008 | The skip link moves focus by script; the address keeps no `#` |
| D48 | T008 | Focus does not move to the heading on arrival from `/` or right after a log in |
| D49 | T008 | Two focus rings are drawn inside the edge (`<main>`, phone menu links), because an outside ring would be cut off |
| D50 | T008 | Phone menu marker is 8px (drawn 6px). The header is not sticky. "Directory" stays marked on `/directory/:id` |
| D51 | T008 | Phone menu with a failed profile: the avatar row is left out, Log out stays |
| D52 | T008 | The header link is read as "Name, My profile"; the visible word "Theme" in the menu is hidden from screen readers |
| D53 | T008 | While a page loads for the first time the tab title is "Loading · University Alumni" |
| D54 | T008, T009, T010 | Sizes snapped to the scale beyond the architecture table's examples (band, header, footer, form gaps, components page). Each list is in that task's notes |
| D55 | T009 | Two tokens added: `--auth-headline-max` (520px), `--auth-sub-max` (460px) |
| D56 | T009 | Log in and sign-up on a phone: headline 36px and smaller paddings (the pictures have no phone rule). Between 768 and 840px the columns are stacked but the headline is still 60px |
| D57 | T009 | "Remember my email" is ticked only when an email is remembered (the picture draws it ticked) |
| D58 | T009 | The Show button is on sign-up too (the picture has it on log in only), on purpose |
| D59 | T009 | A field's error goes away when the field is edited; the two notices on log in leave once a request is sent; notices sit above the `<h1>` |
| D60 | T009 | Sign-up → log in uses `replace`. The `{ accountCreated: true }` state is written in one page file and read in the other, with a comment on each side |
| D61 | T009 | After a successful log in or sign-up the button stays busy. If the guard ever failed to move the user, the form would stay locked until a reload |
| D62 | T010 | The components page shows all 27 colors by token name (the picture shows 16 with hex values); it has no Hover and Focus columns; it adds a Links row and all icons |
| D63 | T010 | `Table` on the components page shows no `--sunken` row until the mouse is on one (the picture draws a hovered row) |

---

## 5. Follow-ups left undone

| # | Task | What | Needs |
|---|---|---|---|
| F1 | T003, T008 | No timeout on the API client. A server that never answers leaves Log out busy and the user logged in | A decision (D11), then a constant in `apiClient.ts` |
| F2 | T003 | A device clock more than an hour fast makes every new token look expired | A decision; the frontend does not know the server's clock |
| F3 | T008 | `PhoneMenu.tsx` repeats about 40 lines of `Dialog.tsx`. A shared hook (`hooks/useModalDialog.ts`) would hold them once | A small task; it edits TASK-007's Dialog |
| F4 | T003 | The store checks (69 cases: 401 rules, start-up check, one update per change) live in a scratch file that is gone. Shipping them as `scripts/frontend-store-check.ts` needs its own task | A task |
| F5 | T003 | ESLint is not installed, so nothing lints the frontend and the one `eslint-disable` line in `apiClient.ts` is untested | A decision (adding packages) |
| F6 | T002 | Style check rule h does not look for `text-shadow` or `drop-shadow`. (Searched by hand in 1.9: none today) | A few lines in the check |
| F7 | T002 | The style check does not read `frontend/index.html`, and a string like `"#feed"` reads as a hex color | Know it; fix when it bites |
| F8 | T002 | No token for transition time. The first task that animates something adds one | Later |
| F9 | T009 | `GENERAL_ERROR_MESSAGE` is written in both page files; `{ accountCreated: true }` is shared by comment only | One small shared file |
| F10 | T009 | No `autoFocus` on the first field of log in or sign-up | A decision |
| F11 | T009 | After "Account created. Log in to continue." the email is not filled in | A decision |
| F12 | T001 | `npm install` reports 7 known vulnerabilities (4 moderate, 2 high, 1 critical) in packages that were there before. `npm audit fix` was not run | A decision; outside this REQ |
| F13 | T008 | Something listens on port 3000 on this machine. Anyone who runs `npm run dev:frontend` with a hand-made token sends its requests there | Know it |
| F14 | spec | `CONTACT_EMAIL` is the placeholder `alumni-office@example.com` | The owner's real address |
| F15 | architecture | Open question: may a buyer change tokens (their own accent color)? | A decision, not for this REQ |
| F16 | spec | AC64: `docs/roadmap.md` F1 to F5, the root `CLAUDE.md` frontend lines and the design-system page | Wrap-up |
| F17 | T006 | None blocking. Its one note (show Table and Pagination at phone width and tab through them) was done by T010 | Closed |
| F18 | T004 | "Import `store/themeAtoms` from `main.tsx`" | Closed by T008. See 6.2 |

---

## 6. What this task found

1. **`git grep` skips the new files.** See 1.4. Until the 106 new files are committed, `git grep -n "antd"` reads only the old, deleted tree. The check was run again with `--untracked`; nothing found. The command in `docs/frontend-patterns.md` has the flag.
2. **One stale comment.** `frontend/src/store/themeAtoms.ts`, lines 73 to 74, says "Every page has a ThemeSwitch, which imports this file, so no start-up call is needed." Since TASK-008, `main.tsx` imports the file for exactly that reason. The code is right; the comment is out of date. Not changed (this task edits no source file).
3. **Task status fields.** The header of TASK-001, 003, 005, 006, 009 and 010 still says `Status | pending` although each has its implementation notes. For the orchestrator to set.
4. **Log out has one home on a wide screen: the My profile being-built page.** When part 3 replaces that page, Log out must move with it or wide screens lose it. Written into `docs/frontend-patterns.md`, pattern 14.
5. **`frontend/README.md`** is still the Vite template text (the architecture says it is left alone). Not touched.
6. **`npm run build` also compiles the API** (`tsc` for `@alumni/api`). It changed no tracked file under `backend/` (1.7).

## Related

- Checklist: `manual-checklist.md` in this folder
- Patterns: `docs/frontend-patterns.md`
- Tasks: TASK-001 to TASK-011 in `tasks/`
