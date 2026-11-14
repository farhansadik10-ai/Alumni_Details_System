# REQ-fs-007 — Frontend build size, before and after

| Field | Value |
|---|---|
| REQ | REQ-fs-007 |
| Before | TASK-001, 2026-10-08, branch `feat/REQ-fs-007-frontend-users-about-polish-perf` at `4a957152`, no code change of this REQ yet |
| After | TASK-014, 2026-10-09, same branch with TASK-002 to TASK-013 done (uncommitted working tree), same commands |

## How it was measured

- Build: `npm run build --workspace=@alumni/frontend` (Vite; writes `frontend/dist`, which git ignores).
- Raw bytes: `wc -c < <file>` (same number as `ls -l`).
- Gzip bytes: `gzip -c <file> | wc -c` (default level 6, GNU gzip 1.14, Git Bash on Windows).
- Vite prints its own gzip numbers in kB; they differ by a few bytes from `gzip -c`. Compare Before and After only with the `gzip -c` numbers below.
- Repeat exactly this for the After table, so the two are comparable. File hashes in the names will change; match rows by the name before the hash.

## Before

### Entry (loaded on every page)

| File | Raw bytes | Gzip bytes |
|---|---:|---:|
| `index.html` | 1,336 | 672 |
| Entry script `assets/index-d523lT3p.js` | 288,075 | 98,078 |
| Entry stylesheet `assets/index-IzXHQMb4.css` | 19,942 | 6,166 |

### Page files (one lazy chunk per page)

| Page | JS file | JS raw | JS gzip | CSS file | CSS raw | CSS gzip |
|---|---|---:|---:|---|---:|---:|
| Log in | `LoginPage-BkMHGyr4.js` | 3,092 | 1,546 | `LoginPage-BLDLC9_3.css` | 2,085 | 697 |
| Sign up | `SignUpPage-DQ1nH5m5.js` | 3,979 | 1,903 | `SignUpPage-Bvv63DP2.css` | 2,878 | 940 |
| Dashboard | `DashboardPage-DXp9Oz7k.js` | 5,505 | 2,179 | `DashboardPage-BDHQrGAm.css` | 2,049 | 612 |
| Directory | `DirectoryPage-B7Jnv2KS.js` | 10,431 | 4,270 | `DirectoryPage-QspCRiYZ.css` | 4,873 | 1,341 |
| Alumni profile | `AlumniProfilePage-C8S_06Cu.js` | 5,535 | 2,305 | `AlumniProfilePage-BGPI26LY.css` | 1,128 | 533 |
| My profile | `MyProfilePage-D7-ouwuq.js` | 11,619 | 4,360 | `MyProfilePage-DPZyH5-Y.css` | 1,505 | 597 |
| Feed | `FeedPage-KgyisvtY.js` | 19,958 | 7,026 | `FeedPage-BTx-YNPO.css` | 4,133 | 1,108 |
| Users (placeholder) | `UsersPage-CSV4QKtZ.js` | 347 | 265 | none | — | — |
| No access | `NoAccessPage-DFowqCVl.js` | 301 | 251 | none | — | — |
| Not found | `NotFoundPage-DID5JgIE.js` | 307 | 253 | none | — | — |

### Shared chunks (split out by Vite, loaded by the pages that use them)

| File | Raw bytes | Gzip bytes |
|---|---:|---:|
| `Checkbox-CPlQYvHO.js` | 471 | 342 |
| `Checkbox-DGDOrt_G.css` | 664 | 364 |
| `ChevronDownIcon-D0a75Q4-.js` | 597 | 373 |
| `ChevronDownIcon-4M0TboqI.css` | 698 | 358 |
| `directoryQuery-U4sMpikc.js` | 1,477 | 683 |
| `directoryReturn-Du4as8hE.js` | 236 | 221 |
| `EmptyState-BKlO2-SR.js` | 1,032 | 543 |
| `EmptyState-BO97CnNs.css` | 2,611 | 756 |
| `ErrorState-CbKxyRwN.js` | 669 | 430 |
| `ErrorState-BIiglBoe.css` | 409 | 272 |
| `Link-BUPiLuLo.js` | 334 | 255 |
| `Link-NQEbgKDd.css` | 160 | 148 |
| `PasswordInput-PQDd2vf6.js` | 1,962 | 956 |
| `PasswordInput-kGkEvUMO.css` | 2,926 | 916 |
| `peopleBlockState-BV5YQELM.js` | 1,926 | 944 |
| `peopleBlockState-XCetITAJ.css` | 1,267 | 469 |
| `PostText-BzTvgdD_.js` | 969 | 549 |
| `PostText-CqfbSz8o.css` | 1,097 | 424 |
| `ProfileBand-PB4O38Gm.js` | 1,988 | 870 |
| `ProfileBand-Bz1Xy7mq.css` | 3,622 | 1,087 |
| `RecentPostsBlock-HNchvRHE.js` | 2,051 | 1,009 |
| `RecentPostsBlock-DwhLRx9a.css` | 718 | 340 |
| `saveFailure-DtSXUvf2.js` | 764 | 499 |
| `saveFailure-qy1Ih9V_.css` | 1,083 | 468 |
| `TextInput-fl9Ysqo7.js` | 1,844 | 908 |
| `TextInput-DGABB0wI.css` | 1,746 | 618 |
| `useFormError-zNY-m1aE.js` | 257 | 235 |

### Fonts (Hanken Grotesk, variable weight)

| File | Raw bytes | Gzip bytes |
|---|---:|---:|
| `hanken-grotesk-latin-wght-normal-CaVRRdDk.woff2` | 34,704 | 34,780 |
| `hanken-grotesk-latin-ext-wght-normal-Dg-wlmqe.woff2` | 19,588 | 19,663 |
| `hanken-grotesk-vietnamese-wght-normal-CHiFlh_0.woff2` | 9,320 | 9,396 |

woff2 is already compressed, so gzip makes it slightly larger; servers do not gzip it.

### Totals

| Group | Files | Raw bytes | Gzip bytes |
|---|---:|---:|---:|
| JS (entry + pages + shared) | 26 | 365,726 | 131,253 |
| CSS (entry + pages + shared) | 20 | 55,594 | 18,214 |
| Fonts (woff2) | 3 | 63,612 | 63,839 |
| `index.html` | 1 | 1,336 | 672 |
| **All** (`index.html` + `assets/`; `favicon.svg`, 203 bytes copied from `public/`, left out) | 50 | 486,268 | 213,978 |

The entry script is 79% of all JS raw (288,075 of 365,726) and 75% gzip.

## After

Measured by TASK-014 the same way: `npm run build --workspace=@alumni/frontend` (exit 0), then `wc -c <` and `gzip -c <file> | wc -c` (GNU gzip 1.14) on every file of `frontend/dist`. A second build through the root `npm run build` gave the same file names (same hashes), so the numbers stand. `favicon.svg` is left out, as before.

### Entry

| File | Raw bytes | Gzip bytes | Change raw | Change gzip |
|---|---:|---:|---:|---:|
| `index.html` | 1,467 | 734 | +131 | +62 |
| Entry script `assets/index-Ct3m2Ypt.js` | 292,023 | 99,291 | +3,948 | +1,213 |
| Entry stylesheet `assets/index-D_ODS2_Q.css` | 20,658 | 6,264 | +716 | +98 |

### Page files

| Page | JS file | JS raw | JS gzip | CSS file | CSS raw | CSS gzip | Change gzip (JS + CSS) |
|---|---|---:|---:|---|---:|---:|---:|
| Log in | `LoginPage-C6iVAx3R.js` | 3,060 | 1,527 | `LoginPage-BLDLC9_3.css` | 2,085 | 697 | −19 |
| Sign up | `SignUpPage-B9bl-j_V.js` | 3,947 | 1,888 | `SignUpPage-Bvv63DP2.css` | 2,878 | 940 | −15 |
| Dashboard | `DashboardPage-BCb06lX2.js` | 5,515 | 2,186 | `DashboardPage-BDHQrGAm.css` | 2,049 | 612 | +7 |
| Directory | `DirectoryPage-BGFKlqaa.js` | 6,859 | 2,876 | `DirectoryPage-B5ah_tfR.css` | 2,203 | 752 | −1,983 |
| Alumni profile | `AlumniProfilePage-ABj0nx1G.js` | 5,245 | 2,178 | `AlumniProfilePage-BGPI26LY.css` | 1,128 | 533 | −127 |
| My profile | `MyProfilePage-BdtMvsh5.js` | 11,379 | 4,274 | `MyProfilePage-DPZyH5-Y.css` | 1,505 | 597 | −86 |
| Feed | `FeedPage-DiPz6dCh.js` | 19,083 | 6,874 | `FeedPage-BXVooXqB.css` | 3,285 | 908 | −352 |
| Users (real page now) | `UsersPage-DqJVJTZy.js` | 8,258 | 3,528 | `UsersPage-ChPyZOIi.css` | 2,985 | 906 | +4,169 |
| About (new) | `AboutPage-rquXacqe.js` | 1,191 | 515 | `AboutPage-BSo8uD_o.css` | 384 | 247 | +762 |
| No access | `NoAccessPage-BNgcuHhE.js` | 269 | 234 | none | — | — | −17 |
| Not found | `NotFoundPage-Bk-oQ9Q8.js` | 275 | 236 | none | — | — | −17 |

### Shared chunks

Vite names a shared chunk after one of the modules in it, so some names changed. Rows are matched by content where the name moved.

| File | Raw bytes | Gzip bytes | Before (raw / gzip) | Note |
|---|---:|---:|---|---|
| `addressParams-dsATB3qS.js` | 189 | 195 | new | `singleParam`, `readPageParam`; loaded with `directoryQuery` (Directory, Dashboard, Feed) and by Users |
| `Checkbox-C6P2SW-Q.js` | 471 | 342 | 471 / 342 | |
| `Checkbox-DGDOrt_G.css` | 664 | 364 | 664 / 364 | |
| `ChevronDownIcon-DKfmpoAf.js` | 597 | 372 | 597 / 373 | |
| `ChevronDownIcon-C_ymI2_r.css` | 785 | 373 | 698 / 358 | |
| `directoryQuery-D7FcheZX.js` | 1,308 | 616 | 1,477 / 683 | the address helpers and `lastPage` moved out |
| `directoryReturn-Du4as8hE.js` | 236 | 221 | 236 / 221 | |
| `EmptyState-CW-mFoZi.js` | 1,032 | 543 | 1,032 / 543 | |
| `EmptyState-CCM-mMpn.css` | 2,683 | 784 | 2,611 / 756 | |
| `ErrorState-v8Iphb67.js` | 669 | 428 | 669 / 430 | |
| `ErrorState-BIiglBoe.css` | 409 | 272 | 409 / 272 | |
| `Link-*.js`, `Link-*.css` | — | — | 334 / 255 and 160 / 148 | gone: the footer's About link puts `Link` in the entry |
| `mailtoLink-CuEahiV3.js` | 347 | 278 | new | the alumni profile and About |
| `PasswordInput-SEtzVZ3f.js` | 1,962 | 955 | 1,962 / 956 | |
| `PasswordInput-kGkEvUMO.css` | 2,926 | 916 | 2,926 / 916 | |
| `peopleBlockState-T2b1p6JN.js` | 1,894 | 935 | 1,926 / 944 | |
| `peopleBlockState-XCetITAJ.css` | 1,267 | 469 | 1,267 / 469 | |
| `PostText-C21SY115.js` | 969 | 550 | 969 / 549 | |
| `PostText-CqfbSz8o.css` | 1,097 | 424 | 1,097 / 424 | |
| `ProfileBand-CeeBq5Mt.js` | 1,988 | 869 | 1,988 / 870 | |
| `ProfileBand-Bz1Xy7mq.css` | 3,622 | 1,087 | 3,622 / 1,087 | |
| `RecentPostsBlock-B_vxJdEt.js` | 2,019 | 997 | 2,051 / 1,009 | |
| `RecentPostsBlock-DwhLRx9a.css` | 718 | 340 | 718 / 340 | |
| `RoleTag-DxyrHBr0.js` | 307 | 257 | new | the role tag, shared by My profile and Users |
| `saveFailure-C5MI7_5K.js` | 302 | 247 | 764 / 499 | smaller: Vite regrouped the shared form chunks (see `Textarea` and `writeFailure`) |
| `Textarea-qy1Ih9V_.css` | 1,083 | 465 | 1,083 / 468 (`saveFailure-qy1Ih9V_.css`) | same file, same hash, new name; the 3 bytes are the name stored by `gzip -c` |
| `Textarea-DdNg5s7h.js` | 466 | 345 | new | |
| `TextInput-DMsbR2sE.js` | 1,844 | 908 | 1,844 / 908 | |
| `TextInput-DGABB0wI.css` | 1,746 | 618 | 1,746 / 618 | |
| `useFormError-Qao8JAUk.js` | 257 | 234 | 257 / 235 | |
| `useListAddress--QA8ive3.js` | 4,341 | 2,042 | new | the hook, `Pagination` and `Select`, shared by Directory and Users |
| `useListAddress-6OFf0joJ.css` | 2,671 | 838 | new | their styles, moved out of the Directory's CSS |
| `writeFailure-DgJCv-xV.js` | 1,453 | 699 | new | the write-failure words, shared by Feed and Users |
| `writeFailure-wleGf2Pm.css` | 869 | 450 | new | |

### Fonts

| File | Raw bytes | Gzip bytes | Change |
|---|---:|---:|---:|
| `hanken-grotesk-latin-wght-normal-CaVRRdDk.woff2` (now preloaded) | 34,704 | 34,780 | 0 |
| `hanken-grotesk-latin-ext-wght-normal-Dg-wlmqe.woff2` | 19,588 | 19,663 | 0 |
| `hanken-grotesk-vietnamese-wght-normal-CHiFlh_0.woff2` | 9,320 | 9,396 | 0 |

### Totals

| Group | Files | Raw bytes | Gzip bytes | Change raw | Change gzip |
|---|---:|---:|---:|---:|---:|
| JS (entry + pages + shared) | 32 | 379,755 | 137,640 | +14,029 | +6,387 |
| CSS (entry + pages + shared) | 23 | 59,700 | 19,856 | +4,106 | +1,642 |
| Fonts (woff2) | 3 | 63,612 | 63,839 | 0 | 0 |
| `index.html` | 1 | 1,467 | 734 | +131 | +62 |
| **All** (`index.html` + `assets/`; `favicon.svg` left out) | 59 | 504,534 | 222,069 | +18,266 | +8,091 |

The entry script is now 77% of all JS raw (292,023 of 379,755) and 72% gzip (it was 79% and 75%).

## Difference

| Group | Before raw | After raw | Change raw | Before gzip | After gzip | Change gzip |
|---|---:|---:|---:|---:|---:|---:|
| Entry script | 288,075 | 292,023 | +3,948 | 98,078 | 99,291 | +1,213 (+1.2%) |
| Entry stylesheet | 19,942 | 20,658 | +716 | 6,166 | 6,264 | +98 |
| `index.html` | 1,336 | 1,467 | +131 | 672 | 734 | +62 |
| Page JS (10 → 11 files) | 61,074 | 65,081 | +4,007 | 24,358 | 26,316 | +1,958 |
| Page CSS (7 → 9 files) | 18,651 | 18,502 | −149 | 5,828 | 6,192 | +364 |
| Shared JS (15 → 20 files) | 16,577 | 22,651 | +6,074 | 8,817 | 12,033 | +3,216 |
| Shared CSS (12 → 13 files) | 17,001 | 20,540 | +3,539 | 6,220 | 7,400 | +1,180 |
| Fonts | 63,612 | 63,612 | 0 | 63,839 | 63,839 | 0 |
| **Total** | 486,268 | 504,534 | +18,266 | 213,978 | 222,069 | +8,091 (+3.8%) |

**What grew:** +8.1 KB gzip in all, almost all of it the two new pages: the real Users page (+4.2 KB gzip with its CSS), About (+0.8 KB) and the new shared chunks they load (`useListAddress`, `writeFailure`, `RoleTag`, `addressParams`). The entry script grew 1.2 KB gzip: the Users and About words in `text.ts`, the Users store and its two calls (kept in the entry for the log-out reset), `Link` (the footer now uses it), and the image attributes; `index.html` grew 62 bytes for the font preload.
**What shrank:** the Directory's own files (−2.0 KB gzip) and the Feed's (−0.35 KB), because their code moved into chunks shared with Users; a first visit to the Directory still loads about the same as before (roughly +1.0 KB gzip once the `useListAddress` and `addressParams` chunks it now fetches are counted). The fonts did not change; only the Latin file is now fetched earlier, by the preload.

## Related

- REQ: REQ-fs-007
- Architecture: [[specs/2026-10/fs/REQ-fs-007-frontend-users-about-polish-perf/architecture]]
- Tasks: TASK-001 (Before), TASK-014 (After)
