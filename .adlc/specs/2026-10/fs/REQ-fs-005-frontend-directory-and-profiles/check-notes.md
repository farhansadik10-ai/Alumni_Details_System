# REQ-fs-005 — check notes

| Field | Value |
|---|---|
| REQ | REQ-fs-005 |
| Written by | task-implementer, TASK-014 |
| Date | 2026-10-08 |

## 1. The four checks (from the repo root)

| Command | Result |
|---|---|
| `npm run build` | exit 0 (`tsc -b` then `vite build`, 234 modules, "built in 1.50s") |
| `npm run check:frontend` | exit 0. Style check: "143 files checked", rules a to j all 0, "PASS: no findings". Library check: "282 passed, 0 failed" |
| `git grep -n --untracked "antd" -- frontend/src frontend/package.json` | printed nothing (exit 1 = no match) |
| `grep -rlF "Compare each section with" frontend/dist` | printed nothing (exit 1 = no match): the components page is not in the build |

`ls frontend/dist/assets` (one `.js` file per page, plus shared files):

```
AlumniProfilePage-B4biIwiK.css   AlumniProfilePage-DZhUg85g.js   BeingBuilt-D6NukSdQ.js
Checkbox-CafKblWs.js             Checkbox-DGDOrt_G.css           DashboardPage-BoKDPCUm.js
DirectoryPage-6Ae57QHU.js        DirectoryPage-BYp0ObT-.css      directoryReturn-Dr7kOBaE.js
FeedPage-Rrl0kvds.js             hanken-grotesk-*.woff2 (3)      index-COZrDclk.js
index-IzXHQMb4.css               Link-BR4Lxup2.js                Link-NQEbgKDd.css
loadFailure-TUC8cb5l.css         loadFailure-ZUvpdN6s.js         LoginPage-BLDLC9_3.css
LoginPage-BQbzIdCu.js            MyProfilePage-D3ELz73N.css      MyProfilePage-p_MYk9jn.js
NoAccessPage-bUXBW97l.js         NotFoundPage-BjNojmAl.js        PasswordInput-_ClcdDdr.js
PasswordInput-kGkEvUMO.css       ProfileBand-BOMMwXSX.js         ProfileBand-DRWnAGhG.css
SignUpPage-Bvv63DP2.css          SignUpPage-CEi2BV2G.js          TextInput-BilVxyWe.js
TextInput-DGABB0wI.css           useFormError-1ZhQsAr8.js        UsersPage-CZVHxGCa.js
```

Every page has its own file: Login, SignUp, Dashboard, Directory, AlumniProfile, Feed, MyProfile, Users, NotFound, NoAccess. No `ComponentsPage` file.

**The library check can fail.** A copy of `scripts/frontend-lib-check.ts` in the session scratchpad (imports rewritten to full paths, so no repo file was made or deleted), with the expectation of "year: 1950 passes" changed from `null` to `"wrong on purpose"`, printed `FAIL  year: 1950 passes` / `got null` / `want "wrong on purpose"`, then `frontend-lib-check: 281 passed, 1 failed`, exit 1.

## 2. Browser review on a mock API

**Setup.** Port 3000 was taken by the real backend (PID 23144); it was never sent a request and never touched. Ports 3999, 5199 and 9333 were checked free with `netstat` first. In the session scratchpad (not in the repo):

- `mock-api.mjs`: plain `node:http` on 127.0.0.1:3999, sample data only (30 alumni; id 7 has a 300-character word, id 8 a long name, id 9 the LinkedIn link `javascript:alert(1)`, id 10 nothing filled in), a fake unsigned token, switches for 404, 409, 403, 500, empty, slow first answer, slow saves, and a request log.
- `vite.mock.config.mjs`: imports the repo's `frontend/vite.config.ts` unchanged and only sets port 5199 and the `/api` proxy to 3999.
- `cdp.mjs` and `r1` to `r5` scripts: headless Chrome 147 (installed on the machine, own profile folder in the scratchpad) driven through the DevTools protocol with Node's built-in WebSocket. Real key events (Tab, Enter) and real mouse clicks; no package installed.

All three processes were stopped after the review (PIDs 19620, 14128, 24220 and Chrome's children). The scripts are left in the scratchpad. `git status` shows no mock file. No console error or uncaught exception in any run.

Screenshots: `ui-evidence/` (45 files).

### Directory (AC1 to AC14)

| Case | Result |
|---|---|
| 360, 768, 1280 px, light and dark | Pass. No sideways scroll at any width. `directory-{360,768,1280}-{light,dark}.png` |
| Real log in through the form | Pass. Lands on `/dashboard`; the header shows the name |
| Search debounce (AC3) | Pass. "nad" typed with 60 ms gaps, then a pause: exactly one call `?q=nad` |
| Enter right after typing | Pass. One call `?q=nadia` within 150 ms, no second call from the timer |
| Filters and checkbox (AC4, AC5) | Pass. Each change is one call and one history entry; page goes back to 1; the phone button reads "Filters (1)", "Filters (2)" |
| Back after filters | Pass. Back undoes the checkbox, then the year; the controls follow |
| Page change and focus (AC8) | Pass. Clicking "2" writes `?page=2`; focus lands on the count line "30 alumni"; the next Tab goes to the first card's "View profile of …" |
| Pasted link (AC5) | Pass. `?q=erik&field=Finance`: the box shows "erik", the select shows Finance, "1 alumnus" |
| Bad values (AC7) | Pass. `?page=abc&mentoring=yes&graduation_year=19x9` shows all 30, no error |
| Value not among the options (ADV-005) | Pass. `?department=Physics`: the select shows "Physics", "No alumni found" |
| Page past the end (AC7) | Pass. `?page=9` is replaced by `?page=3`; calls `?page=9`, then `?page=3` |
| Empty with criteria (AC11) | Pass. "No alumni match your search", one Clear button on the page; Clear empties the box and the address and puts focus in the search box |
| Empty with no criteria | Pass. "No alumni yet" with no button. `directory-empty-none.png` |
| Failed list | Pass. "Could not load alumni" and the error card; Try again reloads and focus goes to the count line. `directory-list-failed.png` |
| Failed filters call (AC4) | Pass. Message "The filter options could not be loaded. You can still search." and Try again; a `department` from the address stays selected; Try again fills the options |
| Slow first answer after a fast second (AC10) | Pass. First call `?q=a` held 1.5 s, second `?q=ak` fast: the page shows the 3 results of "ak" and keeps them after the slow answer arrives |
| Phone Filters panel with a real Tab (AC13) | Pass. Closed: Tab goes search box, Filters, Search, first card (the panel is skipped). Enter on Filters sets `aria-expanded="true"`; Tab then reaches Department, Graduation year, Field, the checkbox, then the cards. The panel stays open while filters are chosen. `directory-360-filters-open.png` |
| Card link and return state (AC17) | Pass. From `?department=Computer+Science`, "View profile" opens `/directory/1`; "Back to directory" returns to `/directory?department=Computer+Science`. Opened directly, the back link is `/directory` |

### Alumni profile (AC15 to AC20)

| Case | Result |
|---|---|
| Found, 360 and 1280, both themes | Pass. Tab title "Nadia Rahman · University Alumni"; focus on the `<h1>` after the in-app move. `profile-found-*.png` |
| Email and LinkedIn links (AC16) | Pass. `mailto:` links; LinkedIn has `target="_blank"`, `rel="noopener noreferrer"` and the hidden "(opens in a new tab)" |
| 300-character word (AC20) | Pass. At 360 px the word wraps in the band, the About card and the Details values; no sideways scroll. `profile-7-360.png` |
| Long name | Pass. Wraps; no sideways scroll at 360. `profile-8-360.png` |
| Bad LinkedIn link (`javascript:`) | Pass. No LinkedIn link is drawn. `profile-9-1280.png` |
| Nothing filled in | Pass. "Name not given", "Not given" on each row, "Not at the moment". `profile-10-1280.png` |
| 404 | Pass. "This profile does not exist" and "Go to the directory"; tab title "Alumni profile". `profile-404.png` |
| Ids `abc`, `0`, `1.5`, `99999999999` | Pass. Not-found state and no request sent |
| 500 and Try again | Pass. Error card; Try again loads the profile and focus is on its `<h1>`. `profile-500.png` |

### My profile (AC21 to AC33)

| Case | Result |
|---|---|
| Student (AC22) | Pass. Account card only; no call to `/api/alumni/me`. `myprofile-student-*.png` |
| Alumni with no profile: create | Pass. Empty form, no "See my public profile". After Save: one POST, toast "Profile saved", the link appears, focus stays on "Save profile". A second Save sends a PUT. `myprofile-alumni-none-1280.png`, `myprofile-created.png` |
| Validation (AC26) | Pass. Year "abc", job title 101 characters, `ftp://` link, bio 2001 characters: four messages under their fields, focus on Graduation year, no request. `myprofile-validation.png` |
| Double click (AC30) | Pass. Click, click and Enter during a 1.2 s save: one POST; the button is `aria-busy` |
| 409 while creating | Pass. Message "You already had a profile, so we loaded it…", the form shows the other profile, the next Save is a PUT. `myprofile-409.png` |
| 403 while editing | Pass. "This profile can no longer be saved…" with Try again; typed values kept. `myprofile-403.png` |
| 500 while editing | Pass. "Your changes were not saved. Something went wrong on our side. Try again." |
| Discard changes | Pass. The job title goes back to the saved value |
| Account: validation, save, header (AC26, AC28) | Pass. 101-character name refused with focus on it; bad photo link refused; Save sends `{"name":"Nadia R. Updated","photo_url":null}`; the header and the band show the new name at once. `myprofile-account-saved.png` |
| Account 500 and 404 | Pass. Each shows its own message in the Account card only |
| `/me` fails | Pass. Error with Try again and no form; Try again brings the form back. `myprofile-load-failed.png` |
| Layout 360, 768, 1280, both themes | Pass. No sideways scroll. `myprofile-alumni-*.png` |
| Tab order | Pass. "See my public profile", the nine alumni fields, Save profile, Discard changes, Full name, Photo link, Save account, Log out |
| Log out (AC33) | Pass. `/login`, token removed, one `PUT /api/users/1/logout` |

### Components page

The three new sections render at 1280 (both themes) and 360 with no sideways scroll. `components-*.png`.

## 3. Things found, for the review phase (not fixed here)

1. **Back after a search skips the plain directory.** Steps: open `/directory?department=Finance`, then `/directory`, type "erik", pause, type "x", pause, press Back. Seen: `/directory?department=Finance`. The plain `/directory` entry is gone, because typing replaces the entry (deviation 2 of the architecture). The owner may want the first search of a visit to push.
2. **Focus falls to the page after Back.** Steps: on the directory, change to page 2 (focus on the count line), Tab to a card link, press Back. Seen: focus on `<body>`, because the focused card is replaced. ADV-007 chose "Back never moves focus"; a keyboard user starts again from the top.
3. **"Try again" on the My profile load error drops focus.** Steps: make `/api/alumni/me` fail, open My profile, press Try again. Seen: focus on `<body>`. Already listed as a follow-up in TASK-015.
4. **Only two fields say "(optional)".** On the Alumni profile card only "LinkedIn link" says "(optional)"; Department, Graduation year, Bio and the rest are optional too but carry no mark. A question for the owner, not a failure.
5. **One extra list call, not reproduced.** In one full run, the AC10 case logged `?q=a`, `?q=ak`, `?q=ak` (the page result was right). A separate run of the same case logged only `?q=a`, `?q=ak`. Worth one look in review.

## 4. Not checked here

A screen reader, the real backend and database, a real phone, 200% browser zoom (only narrow widths were used as a stand-in), and real photo links on other hosts. See `manual-checklist.md`.
