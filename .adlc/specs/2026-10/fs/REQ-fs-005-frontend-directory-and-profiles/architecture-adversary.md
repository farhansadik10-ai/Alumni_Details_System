# Architecture adversary — REQ-fs-005-frontend-directory-and-profiles

Written by: architecture-adversary (tier: balanced), dispatched sub-agent.

| Field | Value |
|---|---|
| Generated | 2026-10-08 |
| Trigger | ui-surface (also large-blast-radius) |
| Verdict | found problems |

## Summary

Checked the 52 ACs, 14 tasks, the 5 listed deviations, and the real code in `frontend/src` (store, AppShell, Pagination, validation), `AlumniController`, `AlumniQuery`, `UserController`, `requestHelpers`. 8 findings: 0 critical, 3 major, 5 minor. The biggest: `tokenChangedElsewhereAtom` is not covered by the planned session reset, so after a user switch in another tab an admin can save over a different user's alumni profile. Dispatch answers: backend contract (filters, paging, /me 404, PUT /users fields, nine-field PUT, null rules) checked, nothing; `Array.from` vs varchar counting checked, nothing; changed `validateName`/`validatePhotoLink` in sign-up checked, safe; Pagination vs count-line focus order checked, works as designed; phone panel CSS-only resize checked, nothing; StrictMode double effect checked, nothing; stale-after-logout covered except ADV-001; AC21 contradiction is ADV-006.

## Findings

### ADV-001: Alumni atoms survive a user switch made in another tab

| Field | Value |
|---|---|
| Severity | major |
| Confidence | high |
| Lens | failure-mode |
| Where | `tasks/TASK-005.md` (sessionActions edit); `frontend/src/store/sessionActions.ts:158-167` |

**What:** TASK-005 resets the alumni atoms only inside `startSessionAtom` and `clearSessionAtom`. A third path exists: `tokenChangedElsewhereAtom` (sessionActions.ts:158) swaps the user and resets only `profileAtom`.
**Break scenario:** Tab 1 is user A (alumnus, `myAlumniAtom` = ready, id 7). In tab 2 an admin B logs in. Tab 1 adopts B's token via the storage event; AppShell stays mounted. B opens My profile: the card shows A's profile (state `ready`, no reload). B edits and saves: `PUT /api/alumni/7` with B's admin token passes `isAdmin` in `AlumniController.updateAlumni` and overwrites A's profile. A non-admin B gets 403 and the "can no longer be saved" text. In-flight loaders and `directoryAtom` also stay.
**Why it holds up:** Tried "the guards remount the page" - no, same session slot, same route, no remount. Tried "the ticket check covers it" - the ticket is only cancelled by `resetAlumniAtom`, which is not called on this path.
**Recommendation:** Call `resetAlumniAtom` in `tokenChangedElsewhereAtom` when the user id changed. Also add a TASK-005 acceptance line for it, and key `AlumniProfileCard` on `session.userId`.

### ADV-002: Keyed inner form remounts on first create and on 409, losing focus and the message

| Field | Value |
|---|---|
| Severity | major |
| Confidence | medium |
| Lens | omission |
| Where | `tasks/TASK-011.md` Approach (inner form keyed on profile id or "new"; loading shows skeleton) |

**What:** Two flows destroy the form that owns the focused button and the `useFormError` message.
**Break scenario (a):** First save, 201: `myAlumniAtom` goes `none` to `ready`, the key goes "new" to the id, the form remounts, the "Save profile" button the user pressed is destroyed, and focus falls to `body` (AC42: "a saved form, focus is not lost").
**Break scenario (b):** 409: the action calls `loadMyAlumniAtom` first, which sets `loading`, so the card shows the skeleton and the inner form (holding the conflict `Message`) unmounts. The result returns afterward and sets a message on an unmounted form. The user sees the form silently replaced and never sees "already existed, check the details" (AC30).
**Why it holds up:** Tried "message lives in the outer card" - TASK-011 says the card has its own `useFormError` without saying where it is called; with a keyed inner form it is the natural place for it to die. Tried "`loadMyAlumniAtom` keeps the form while reloading" - TASK-005 sets `loading`.
**Recommendation:** Keep `useFormError` and the focus target in the outer card (not in the keyed child). On a successful create, do not change the key: reset values in place (`alumniToForm(saved)`), key on the id only for a 409 reload, and have the reload skip the `loading` state (keep the old state until the answer). Add both flows to TASK-011 acceptance with a real Tab key.

### ADV-003: Debounce timer can undo a filter change, and the trimmed-text compare can eat a typed space

| Field | Value |
|---|---|
| Severity | major |
| Confidence | medium |
| Lens | omission |
| Where | `architecture.md` Approach (search box and timer), Risks row 1; `tasks/TASK-008.md` |

**What:** The plan says "the timer writes the address" and "the box takes the address value when it differs from the last value the user committed", but never says what the timer writes over, or whether the compare is raw or trimmed.
**Break scenario (a):** User types "ab", and within 300 ms picks Department X (pushes `?department=X`). The timer then fires with a closure built before the push and writes `?q=ab` without the department, so the filter silently vanishes. (If instead it reads the live address, it must also reset the page; unstated.)
**Break scenario (b):** User types "John " and pauses. The timer commits the trimmed "John". The address `q=John` differs from the box's raw "John ", the overwrite rule fires, the space is lost, and "Smith" becomes "JohnSmith".
**Why it holds up:** Tried "the address-is-truth design makes this impossible" - the timer is the one writer that can hold stale data; and AC3 trims, so raw and committed text differ by design.
**Recommendation:** In TASK-008 say: the timer and Enter build the new address from the live params (functional `setSearchParams`), a filter change cancels the pending timer and commits the typed text with it, and the "address changed by itself" compare is against a `lastCommitted` ref holding the trimmed value (compare `trim(box)` to the address `q`, never overwrite while the trimmed values are equal).

### ADV-004: `readDirectoryQuery` drops long text and trims tabs, against AC3 and the backend

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | high |
| Lens | contradiction |
| Where | `tasks/TASK-003.md` (text over 100 characters counts as absent; text trimmed); AC3; `requestHelpers.ts:210-227` |

**What:** AC3 says the page sends the text as typed, trimmed. TASK-003 treats any value over 100 characters as absent, so a 101-character search or a `field` option longer than 100 (the column is `text`, no limit) is silently not applied while the box still shows it. The backend (`queryFilterValue`) deliberately strips only spaces so a department/field with a tab round-trips from `/filters`; a JS `trim()` in the reader turns "Eng\t" into "Eng", which matches no row.
**Why it holds up:** Tried "data like that is unlikely" - the backend comment documents it as a known case, and the options are generated from real data. Impact is low, so minor.
**Recommendation:** Drop the 100-character rule for `q` (cap at a large sane value instead and keep it consistent in the box); trim `department` and `field` for spaces only; add both cases to the library check.

### ADV-005: A filter value in the address that the select cannot show

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | medium |
| Lens | omission |
| Where | AC4, AC7; `tasks/TASK-007.md`, `TASK-003.md` |

**What:** "Unknown graduation_year is ignored" (AC7) is undefined: the reader is pure and knows no options, so TASK-003 only checks "four digits". Meanwhile a shared link with a `department` or `graduation_year` not in the option list (options still loading, options call failed per AC4, or value since removed) is sent to the API, while the controlled `<select>` has no matching option and displays "All departments". The list is filtered but the controls say not.
**Why it holds up:** Tried "options load first" - they load in parallel on mount, and AC4 explicitly allows them to fail.
**Recommendation:** Pick one: state that "unknown" means "not four digits" (fix AC7 wording), and make `DirectoryFilters` add the current value as an extra option when it is not in the list. Count it in `activeFilterCount` (already done) so the phone button stays truthful.

### ADV-006: AC21 and the architecture disagree about where the avatar and role tag live

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | high |
| Lens | contradiction |
| Where | spec AC21 vs `architecture.md` My profile (band holds avatar, name, email, role tag; Account card has a Role row); `tasks/TASK-010.md` |

**What:** AC21 lists the avatar and a role tag inside the Account card; TASK-010 builds no avatar there. `docs/design/screens/my-profile.html` lines 40-46 show avatar and role tag in the band, so the architecture follows the picture and the spec sentence is the odd one out.
**Why it holds up:** Tried "the Role row counts as the role tag" - it covers the tag, not the avatar.
**Recommendation:** Fix AC21 at the gate: avatar and role tag in the band, a read-only Role row in the card. Same for the 96 px vs 120 px avatar (deviation 5): keep, it is listed.

### ADV-007: Stale directory atom shows old results for a frame; count-line focus is not limited to user page changes

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | medium |
| Lens | failure-mode |
| Where | `architecture.md` Approach (atom `{status, query, page}`, "page's own effect" focus); `tasks/TASK-008.md` |

**What:** (a) `directoryAtom` outlives the page. Returning to `/directory` renders the last `ready` items before the load effect runs, which breaks AC9 ("previous results not shown as the new ones"), and after a user switch it is also another user's view. The plan stores `query` in the atom but never says to compare it with the address. (b) The count-line focus effect is keyed on `query.page`, so it also fires on browser Back, a pasted link and the past-the-end replace, stealing focus; the plan says "after a page change by the user" without a mechanism.
**Why it holds up:** Tried "effects run before paint" - `useEffect` runs after paint, so a frame shows; for (b) no flag is in the TASK-008 approach.
**Recommendation:** Derive the shown status as `loading` unless `atom.query` equals the address query. Set a `pageChangedByUser` ref in the Pagination `onChange` handler and focus only when it is set (clear it after use).

### ADV-008: Existing data can make Save impossible, and two deviations are not on the list

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | medium |
| Lens | omission |
| Where | spec "Choices" 13-15; `architecture.md` Convention alignment; `tasks/TASK-002.md` |

**What:** The new limits apply to values the API already stored: a bio over 2000, a year outside 1950 to this year+6, a non-web `linkedin_url`, or an old `field` over 100 makes the whole form fail validation until the user edits that field, and the card gives no hint that the old value is the cause. A name that is `null` (allowed by the API at sign-up) forces the user to type a name just to change a photo. The Convention alignment list also omits: the `field` 100-character cap on a `text` column (invented, not a column limit) and the extra read-only Role row.
**Why it holds up:** Tried "the error message under the field explains it" - the message text is the generic limit message, and the field may be off-screen on a phone; focus-first-error helps, so this stays minor.
**Recommendation:** Accept and document: add the two items to the deviation list; for fields loaded with an over-limit value, the message should say "shorter than N" with the count. Consider raising the `field` cap to match `bio`-style leniency or drop it.

(0 trivials not listed.)

## Coverage

- **Lenses run:** omission, failure-mode, hidden-coupling, rollback (frontend-only, nothing to roll back beyond git revert; no finding), contradiction, testability, ux-consistency.
- **Lenses skipped:** cross-repo (single repo).
- **Acceptance-criteria coverage:** AC1-AC14 checked (AC3, AC5-AC10 produced ADV-003/004/005/007); AC15-AC20 checked, nothing; AC21 checked (ADV-006); AC22-AC33 checked (AC24/AC27/AC30/AC42 produced ADV-001/002); AC34-AC44 checked; AC45-AC47 checked (TASK-013, not read in detail); AC48-AC52 checked (TASK-014). Every AC has a task; none is planned-as-zero.
