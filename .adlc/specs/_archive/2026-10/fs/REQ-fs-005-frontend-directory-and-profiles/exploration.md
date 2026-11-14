# REQ-fs-005 — Codebase exploration

| Field | Value |
|---|---|
| Generated | 2026-10-08 |
| By | codebase-explorer |
| Repo(s) scanned | alumni-details-system |

## 1. Similar existing implementations

| Path | What it does | Recommended action |
|---|---|---|
| `frontend/src/pages/LoginPage/LoginPage.tsx` | Form with field-level errors, validation on submit, busy button, API call error handling. AC26 pattern complete. | follow — copy error clearing on field edit, focus movement, message placement |
| `frontend/src/hooks/useFormError.ts` | Shared form message and double-submit guard used by both auth pages. | follow — reuse this for My profile Account and Alumni profile cards |
| `frontend/src/services/authService.ts`, `userService.ts` | Service file structure: thin function per endpoint, relative `/api` paths, types from `@alumni/shared`. | follow — add `alumni.ts` with same structure |
| `frontend/src/store/sessionActions.ts` | Action atoms that return results and never throw; manage state changes atomically. | follow — create loadAlumniListAtom, saveAlumniProfileAtom, saveAccountAtom |
| `frontend/src/components/ui/Pagination/Pagination.tsx` | Already handles page range, focus preservation (AC8). | reuse — pass it the page count and current page |
| `frontend/src/components/shell/PageLayout/PageLayout.tsx`, `Band.tsx` | Frame for every page inside the shell; sets tab title. | reuse — wrap directory, profile, My profile pages with it |
| `frontend/src/lib/pageRange.ts` | Calculates which page numbers to show; tested in `scripts/frontend-lib-check.ts`. | reuse — for Pagination component |
| `frontend/src/lib/returnAddress.ts` | Reads router state safely; validates pathname, search, hash. | reuse — for AC17 back-to-directory with preserved filters |
| `frontend/src/lib/validation.ts` | Email, password, name validators; `isWebLink` function. | extend — add validators for graduation year, company, bio, field (all 100 chars), experience (100 chars), LinkedIn URL (500 chars max, must be web link), bio (2000 chars) |
| `frontend/src/lib/initials.ts` | Builds initials from name; tested in lib-check. | reuse — already called by Avatar component |
| `frontend/src/lib/browserStorage.ts` | Safe `localStorage` access that never throws. | reuse — if filters are persisted (out of scope per spec) |
| `frontend/src/components/ui/Avatar/Avatar.tsx` | Shows photo or initials; already checks `isWebLink`. | reuse — for directory cards and profile bands |
| `frontend/src/components/ui/Tag.tsx`, `RoleTag.tsx` | Plain and role tags; RoleTag maps role → variant + word. | reuse — for department, class, field, mentoring tags |
| `frontend/src/components/ui/Card.tsx` | Wrapper with padding and optional `aria-labelledby`. | reuse — for directory cards, About, Details sections, form cards |
| `frontend/src/components/ui/Link.tsx` | Routes or plain `<a>` depending on `to` vs `href`. | reuse — for "View profile", "Back to directory", LinkedIn, mailto |
| `frontend/src/components/ui/Field.tsx` with `TextInput`, `Select`, `Textarea` | Label + control + error/help, wired via Field. Control cannot pass id/aria props. | reuse — for all form fields on My profile and alumni profile |
| `frontend/src/components/ui/Checkbox.tsx` | Checkbox inside its own label, aria-invalid wired by Field. | reuse — for mentoring checkbox on alumni profile |
| `frontend/src/components/ui/Button.tsx` | Busy state that blocks presses, keeps focus. | reuse — for search, filters, save, discard, pagination |
| `frontend/src/components/ui/Skeleton.tsx` | Shapes: avatar-sm, line. | reuse — add card shape for directory cards; add row for filter options |
| `frontend/src/components/ui/EmptyState.tsx`, `ErrorState.tsx` | Title, text, optional action link/button. | reuse — for directory (no results), profile not found, profile failed to load, account errors |
| `frontend/src/components/ui/Message.tsx` | Alert or status, icon + text; takes ref for focus. | reuse — for card errors (profile save failed, account save failed) |
| `frontend/src/components/ui/Toast.tsx` | Via `showToastAtom`; dismissable after 5 seconds. | reuse — for "Profile saved", "Account saved" feedback |
| `frontend/src/config/app.ts` | `APP_NAME`, `CONTACT_EMAIL` constants. | reuse — app name in Directory subline and My profile email hint |
| `frontend/src/config/layout.ts` | `PHONE_LAYOUT_QUERY` = `"(max-width: 767.98px)"`. | reuse — for phone filter panel behavior |
| `frontend/src/config/text.ts` | `LOADING_TEXT` constant. | extend — add all directory and profile words here (AC38). Grouped by page with comments. |
| `frontend/src/routes/paths.ts` | `PATHS` object with every route; helper for profile link. | extend — add helper `buildAlumniProfilePath(id: number)` next to `PATHS` (AC25 choice #25 and pattern 12) |
| `frontend/src/store/profileAtoms.ts` | Loads user's PublicUser for header; prevents stale responses by checking userId. | extend — add action to update user (after account save) without reloading; consider split for alumni vs user profile |
| `frontend/src/components/shell/Header/Header.tsx` | Reads `sessionAtom` and `profileAtom`; shows avatar and name. | check — after account save on My profile, name and photo must update at once (AC28); no reload |

## 2. Blast radius

| Path | Why touched | Risk |
|---|---|---|
| `frontend/src/services/alumni.ts` | New file: `listAlumni`, `getAlumniFilters`, `getAlumniProfile`, `getAlumniById`, `createAlumni`, `updateAlumni`. All call `/api/alumni*` endpoints. | low |
| `frontend/src/services/apiClient.ts` | **CHANGE REQUIRED**: Add AbortSignal/CancelToken support (AC10). Currently no way to cancel requests. Axios supports `signal` option. New parameter needed. | high |
| `frontend/src/services/apiError.ts` | No change needed. Already handles network and http failure shapes. | low |
| `frontend/src/pages/DirectoryPage/DirectoryPage.tsx` | Replace "being built" placeholder with full directory: search, filters, result list, pagination. | high |
| `frontend/src/pages/AlumniProfilePage/AlumniProfilePage.tsx` | Replace placeholder with single alumni profile: load by id, show details, About section, contact links, back button. | high |
| `frontend/src/pages/MyProfilePage/MyProfilePage.tsx` | Replace placeholder with Account and Alumni profile cards: load user and alumni profile, forms, save/discard, See my public profile link. | high |
| `frontend/src/lib/validation.ts` | Add validators: `validateGraduationYear`, `validateBio`, `validateLinkedInUrl`, lenient field validators for company/job/field/experience (all 100 chars). Add `MAX_BIO_LENGTH`, `MAX_LINKEDIN_LENGTH` constants. Test cases added to `scripts/frontend-lib-check.ts`. | med |
| `frontend/src/lib/pageRange.ts` | No change. Already used by Pagination. | low |
| `frontend/src/store/profileAtoms.ts` | Extend: add `updateProfileUserAtom` action to update user (name, photo) without full reload (for AC28). Split or extend to handle alumni profile separate from user profile. | med |
| `frontend/src/store/sessionAtoms.ts` | No change. Token atom already works. | low |
| `frontend/src/store/toastAtoms.ts` | No change. Already supports `showToastAtom("Profile saved")` calls. | low |
| `frontend/src/config/text.ts` | Add constants for: directory heading, subline, filter labels, empty states, error messages, My profile labels, form help texts. AC38: all new words go here; part 1 words stay where they are. | low |
| `frontend/src/config/layout.ts` | No change. `PHONE_LAYOUT_QUERY` already defined. | low |
| `frontend/src/routes/paths.ts` | Add helper function `buildAlumniProfilePath(id)` to build `/directory/<id>` (AC25, pattern 12). No change to `PATHS` object itself (already has `alumniProfile: "/directory/:id"`). | low |
| `frontend/src/components/shell/Header/Header.tsx` | Check only: reads `profileAtom` which will be updated by new actions. No code change if `profileAtom` structure stays same. | low |
| `frontend/src/components/shell/AppShell/AppShell.tsx` | No change. Already loads profile for header. | low |
| `frontend/src/styles/tokens.css` | May need to add avatar size token for profile band (120px per design) if not already present. Check: `--avatar-lg` = 72px (not 120px). Likely need `--avatar-xl` or reuse 120px via inline calc. Verify with design. | low |
| `frontend/src/App.tsx` | Routes already defined (DirectoryPage, AlumniProfilePage, MyProfilePage). No change. | low |
| `frontend/src/main.tsx` | No change. Already calls `wireApi()`. | low |
| `scripts/frontend-lib-check.ts` | Add test cases for new validators (graduation year ranges, field lengths, LinkedIn validation). Expected answers from spec, not from code (pattern 16). | low |
| `frontend/README.md` | Needs a real README (AC45): what the frontend is, how to run from repo root, folder map, link to patterns doc. Currently either placeholder or Vite template text. | low |
| `shared/types/alumni.types.ts` | No change. Already has `Alumni`, `CreateAlumniDTO`, `UpdateAlumniDTO`. | low |
| `shared/types/user.types.ts` | AC46: Remove "legacy frontend" comments and write what's true today: "The legacy frontend is gone; `User` and `CreateUserDTO` carry `password` and are not exported from `index.ts`; new code uses `PublicUser` and `SignUpUserDTO`/`UpdateUserDTO`." (Comment only; no type change.) | low |
| `.adlc/context/conventions.md` | AC47: Write the Comments section (when comments are expected, when noise, TODO format). Mark `STATUS: needs verification` until owner confirms. Template is empty today. | low |
| `docs/frontend-patterns.md` | AC48: Add numbered patterns after code works. Likely patterns: (1) load list into atoms with three states and stale-response handling, (2) filters and page kept in address, (3) load-then-edit form (create or edit), (4) profile link helper, (5) dates if used. Write with real file paths after code exists. | low |
| `docs/roadmap.md` | AC48: Mark F6 and F7 as Done at wrap-up. | low |
| `npm run build` | Typescript build must pass (no type errors). | med |
| `npm run check:frontend` | Style check (rule e: no app name outside config) and lib-check (new validator cases) must pass. | med |

## 3. Integration points

**API client request cancellation (AC10 gap):**
- Current `apiClient` has no way to pass an abort signal or cancel token.
- Spec requires: typing "ab" then "abc" quickly ends showing "abc" results, with older request cancelled and no error shown.
- **Action needed**: Modify `frontend/src/services/apiClient.ts` to accept optional `signal` in config and pass it to axios. Update `alumni.ts` to pass signal from the calling atom when a new request supersedes an older one.

**Profile atom updates (AC28 gap):**
- After account save on My profile, header must show new name and photo at once, without reload.
- Current: `profileAtom` is read-only from HTTP `getUser` call via `loadProfileAtom`.
- **Action needed**: Add `updateProfileUserAtom` action in `sessionActions.ts` (or new `profileActions.ts`) to merge a partial user update into the stored profile atom.

**Address parameters (AC5, AC6, AC7, AC45):**
- Directory and My profile must keep search, filters, page in the URL query string.
- Back button should step through history.
- **Utilities needed** in `frontend/src/lib/` or as part of directory page logic:
  - Read: `?q=`, `?department=`, `?graduation_year=`, `?field=`, `?mentoring=true`, `?page=`
  - Write: only non-empty values; page 1 omitted; bad page values clamped
  - History: browser Back should work (React Router handles this)

**Text configuration (AC38):**
- All new words go into `config/text.ts`.
- Export constants for: Directory heading, subline, filter labels, empty states, error messages, My profile labels, form help.

**Form validation and errors (AC26):**
- Directory and My profile forms use same `useFormError` hook pattern from auth pages.
- On submit: run validators, show errors under fields, move focus to first error field.
- Error clears when field is edited.
- Graduation year and bio validators must be added to `lib/validation.ts`.

**Store pattern for directory list (AC9, AC37):**
- Create atoms for: list (loading/ready/error), filters (options loading), current filters, current page, search text.
- Actions: `loadDirectoryAtom`, `setSearchAtom`, `setFilterAtom`, `setPageAtom`.
- List action must handle stale responses and request cancellation.

**Section links to profile (AC25, choice #25):**
- Helper function in `routes/paths.ts`: `buildAlumniProfilePath(id: number): string` returns `/directory/${id}`.
- Used by directory cards and My profile "See my public profile" link.

**Session and header updates:**
- `sessionAtom` and `profileAtom` already integrated in Header.
- New actions must not navigate; guards move the user (existing pattern).
- My profile Account save updates `profileAtom` (user name/photo); no redirect.

**Filters loading error fallback (AC4):**
- If `GET /api/alumni/filters` fails, Show selects with only first option ("All departments") and error message with "Try again".
- Message replaced when retry succeeds.

**Live region for list updates (AC44):**
- Result count line must be in a polite live region; screen reader reads when it changes.
- Can use existing Message component or simple `role="status"` div.

**Phone layout filter panel (AC13, AC53):**
- Below 768px: search and "Filters (2)" button visible; other filters hidden behind button.
- Pressing button opens inline panel below search row.
- Panel is not a dialog, uses regular click-outside to close or scroll-away behavior.
- Panel state lives in component (not store); no history entry.

## 4. Test coverage

| Test file | Scenarios covered | Gaps for new code |
|---|---|---|
| `npm run build` | Type errors fail the build. | New page files must pass tsc. New store atoms must type-check against API shapes. |
| `npm run check:frontend` (rule a–j) | Hardcoded colors, px literals, antd imports, axios in UI code, app name outside config, onclick on div, innerHTML, box-shadow, open-redirect, media queries. | New rule for: all new page words in `config/text.ts`; no text literals in components. |
| `scripts/frontend-lib-check.ts` | Validator cases, token reader, page range, return address. | Add cases for: `validateGraduationYear` (1950 to next 6 years, 4 digits), `validateBio` (max 2000), `validateLinkedInUrl` (web link or empty, max 500), field validators (max 100). Cases written from spec, not code. |
| Manual checklist (owner) | Three pages visually match design at 360px, 768px, 1280px both themes. Keyboard: all controls reachable, focus visible, order correct. Screen reader: live region reads, field errors heard. | Real backend: list filters load, pagination works, search debounce, old requests cancelled. Profile save creates/edits/conflicts. Account save updates header. |
| None | No Storybook, no Jest, no Cypress. | Risk: form error handling, filter toggle, focus management after page change, address parameter round-trip. |

## Vault references

- [[architecture/adr-13-frontend-structure-css-modules-on-tokens|ADR-13]] — structure and styles (patterns 1, 3)
- [[architecture/adr-14-session-and-theme-kept-in-the-browser|ADR-14]] — session, token, 401 handling (pattern 10)
- [[knowledge/concepts/paged-list-query]] — page, limit, items, total answer shape
- [[knowledge/concepts/partial-update-sent-fields]] — only changed fields sent in PUT (AC25)
- [[knowledge/lessons/LESSON-REQ-fs-002-3-new-helper-convert-every-sibling|L-REQ-fs-002-3]] — one shared piece, not a copy (AC36, pattern 12)
- [[knowledge/lessons/LESSON-REQ-fs-004-2-one-rule-one-function-in-lib|L-REQ-fs-004-2]] — rules used twice live in lib (validators, profile link)
- [[knowledge/lessons/LESSON-REQ-fs-004-4-check-focus-for-real|L-REQ-fs-004-4]] — focus tests must use real Tab key
- [[knowledge/lessons/LESSON-REQ-fs-004-5-find-out-what-listens-on-the-api-port|L-REQ-fs-004-5]] — mock API first (AC52)
- [[knowledge/lessons/LESSON-REQ-fs-004-6-a-check-that-reads-only-tracked-files|L-REQ-fs-004-6]] — checks read only committed files
- [[knowledge/gotchas#^g34|G34]] — raw database text can reach the client (validation must block long strings: 100 chars for department/company/job/field/experience, 2000 for bio)
- [[knowledge/gotchas#^g37|G37]] — duplicate alumni profiles; `/me` returns lowest id; page does not merge (AC23)
- [[knowledge/gotchas#^g42|G42]] — email visible to all (shown in profile detail per design; decide later if owner wants to hide)

## Open questions

None. The spec is complete and the existing patterns are clear.
