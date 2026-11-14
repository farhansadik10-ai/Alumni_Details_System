
## Architecture findings

Written by: architecture-reviewer (tier: balanced)

**Summary:** Checked 47 files: layering (hooks/ imports only react, react-router-dom, lib: rule d holds), store split (usersAtoms/userActions mirror postAtoms/postActions), the hook seam, the DirectoryPage refactor, usersColumns, 3 session resets, ROLE_WORDS, ADR-06/10/12/13, and the API contract against `Paged<PublicUser>` and backend UserRoutes/UserController. 0 critical, 0 major, 2 minor, 2 trivial. Biggest: the 409 wording differs from the text ADR-06 fixes.
- useListAddress honours the import rules: checked, nothing. Seam (returns query, queryKey, current, handlers; page keeps load effect and views): right cut, no store knowledge.
- userActions/usersAtoms vs postAtoms/postActions: checked, nothing (same shapes, visit counter, latestRequest).
- DirectoryPage refactor: justified by the architecture (one copy for two pages); no barrel file, direct import (ADR-13). Risk only: the hook has no automated check (hooks need a DOM; there is no runner), so Directory behaviour rests on the manual evidence.
- sessionActions reset: present in all three places (lines 55, 64, 181 of the old numbering): checked, nothing.
- ROLE_WORDS shared with RoleTag: checked, nothing (Record<Role,...> indexing breaks the build if Role grows).
- ADR-10 About (inside shell, footer link): checked, nothing. ADR-12/contract: GET /api/users returns `{items,total,page,limit}` = `Paged<PublicUser>`; DELETE is admin-only; 409 comes from UserManager ConflictError: checked, nothing. New ADR: not needed (the hook is a pattern; docs/frontend-patterns.md 34 to 37 carry it).
- Packet-gap: none.

### ARCH-001: 409 message differs from the wording ADR-06 fixes

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `frontend/src/config/text.ts:497` |
| Category | contract |
| Rule broken | ADR-06 Decision, "Users" bullet |

**What:** ADR-06 says the UI shows "This user has posts, comments or an alumni profile and cannot be deleted"; the code shows "{name} cannot be deleted because they still have posts, comments or an alumni profile. Nothing was changed."
**Why it matters:** The ADR is the accepted text; either the code or the ADR is stale, and a later reader cannot tell which.
**Recommendation:** Ask the owner: keep the new words and note it in ADR-06 (or a REQ deviation line), or change `userDeleteBlockedText` to the ADR text. Do not pick silently.
**References:** [[architecture/adr-06-deleting-rows-that-other-rows-reference]]

### ARCH-002: Delete orchestration and list refill sit in the page

| Field | Value |
|---|---|
| Severity | minor |
| Effort | medium |
| File | `frontend/src/pages/UsersPage/UsersPage.tsx:2779-2791` (refillEmptiedPage), `2793-2824` (handleConfirmDelete) |
| Category | separation |
| Rule broken | Layering: pages -> store; docs/frontend-patterns.md (actions return results; page owns views) |

**What:** `refillEmptiedPage` reads `store.get(usersAtom)`, decides a reload from total/page/limit, and re-parses `list.queryKey` with `readUsersQuery`. That is list-state logic, not a view.
**Why it matters:** The next list page with delete (or a second delete path) must copy this rule; the page is already about 310 lines.
**Recommendation:** Move the "emptied page, more remain" decision into `deleteUserAtom` (or a small `refillUsersAtom` in usersAtoms.ts) and let the page only call it. FeedPost keeps its delete state in the component, so this is a tighten-up, not a violation.
**References:** `frontend/src/store/userActions.ts` header comment; postActions.ts

### ARCH-003: Small hook typing looseness (trivial)

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `frontend/src/hooks/useListAddress.ts:1536`, `:1396` |
| Category | pattern |
| Rule broken | Type safety at the shared seam (no ADR) |

**What:** `changePage` casts `{ page } as Partial<Q>`; `ListAddressList.status` is `string`, so a wrong status word compiles. Also `UserListParams` exists twice (lib/usersQuery.ts, services/userService.ts), and `resetUsersAtom` equals `clearUsersAtom`.
**Why it matters:** The first two weaken the one generic seam two pages share; the duplicates follow the existing Directory/Alumni precedent (lib cannot import services), so keep them.
**Recommendation:** Type `status` as the union `"idle"|"loading"|"ready"|"error"`; drop the cast with `Q extends ListAddressQuery` and a typed `{ page } satisfies Partial<ListAddressQuery>`.
**References:** scripts/frontend-style-check.mjs rule d

(1 trivial not listed: `isKnownRole` in usersColumns repeats RoleTag's own unknown-role check.)

### Round 2

Checked the fix diff and the work tree. Style check PASS (rules d and k hold). 0 critical, 0 major, 0 minor, 1 trivial new.

- ARCH-002 resolved: `refillEmptiedUsersPageAtom` sits in `store/usersAtoms.ts` beside `loadUsersAtom` and `removeUserLocallyAtom`; `deleteUserAtom` calls it under the same `isCurrent()` guard. The store imports only `lib/pageRange`, `lib/usersQuery`, `services/` and `./latestRequest` (store -> lib is allowed; rule k only bans the reverse); no cycle (userActions -> usersAtoms only). `UsersPage` lost `useStore`, `lastPage` and the refill function: it is thin again.
- ARCH-003 resolved: `ListAddressStatus` union replaces `string`; the cast is gone (`writeControl(patch, page)`, page always explicit, new-search-resets-to-1 kept); `resetUsersAtom` and `clearUsersAtom` share `forgetUsersAtom`. The `UserListParams` twin stays by design.
- ARCH-001: left for the owner, as agreed.
- The `isKnownRole` trivial is resolved by `asRole` in `lib/token.ts` (one rule, used by token, usersQuery, filters, columns, RoleTag); `PAGE_KEY` is now one export.

### ARCH-004: The four-word list status is written in many places (trivial)

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `frontend/src/hooks/useListAddress.ts:16` |
| Category | pattern |
| Rule broken | One rule, one definition (pattern 28) |

**What:** `ListAddressStatus` is a new copy of `"idle" | "loading" | "ready" | "error"`, which `postAtoms.LoadStatus`, `usersAtoms`, `alumniAtoms` and `profileAtoms` already spell out. The hook's comment says they "use the same four words" but nothing ties them: a fifth word in a store would still compile against the hook only while it is a subtype.
**Recommendation:** Optional. Leave it (hooks may not import store; a structural check already fails the build if a store list gets a word the hook lacks).

## Quality findings

Written by: quality-reviewer (tier: balanced)

**Summary:** Checked 47 files against conventions.md and design-system.md (words, hex/px, phone query, comments, TODOs: all clean; the one phone query is the pinned `767.98px` in all 3 new stylesheets), file naming (clean), 8 doc paths (all `frontend/`, `scripts/`, `docs/` paths in patterns exist; 536 cases claimed and 536 run), and the lib check (the new pure functions have typed-from-spec cases). 0 critical, 0 major, 5 minor, 1 trivial. Biggest: the "is this a role" rule is spelled four ways, and the page view chain is copied between the two list pages.
- Hex/px, words outside text.ts, TODO/FIXME, console.log, commented-out code: checked, nothing.
- Lib-check coverage: singleParam, readPageParam, lastPage, usersQuery, userDeleteFailureText, sameText all covered (QUAL-004 lists the gaps). toPeopleBlockState: still no cases (REQ-fs-006 n6, skipped again).
- BeingBuilt dead: yes (QUAL-001). Stale wording: one wrong doc line and one stale comment (QUAL-001, QUAL-002).
- Packet-gap: none.

### QUAL-001: BeingBuilt is dead code and its words are left in other files

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `frontend/src/components/shell/BeingBuilt/BeingBuilt.tsx:1`, `frontend/src/components/shell/PageLayout/PageLayout.tsx:47` |
| Category | dead-code |
| Rule | conventions.md "Comments" (stale comments); LESSON-REQ-fs-006-4 |

**What:** No file imports `BeingBuilt` any more. Its own comment ("Each such page has its own thin file") and the `PageNote` doc example ("This page is being built") describe a page that no longer exists. It also keeps two English strings (`TITLE`, `TEXT`) outside `config/text.ts`.
**Why it matters:** A dead component with hard-coded words invites reuse and hides from the words-in-one-file rule. Pattern 14 and the Open points then have to explain it.
**Recommendation:** Delete the folder `components/shell/BeingBuilt/` (outside `.adlc/`, so the owner decides), change the `PageNote` example to the no-access words, and cut the matching lines in `docs/frontend-patterns.md` pattern 14 and Open points.
**References:** [[knowledge/lessons/LESSON-REQ-fs-006-4]]

### QUAL-002: Patterns doc describes a code comment that says the opposite

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `docs/frontend-patterns.md` (Open points, part 4, the `useListAddress.ts` bullet); `frontend/src/hooks/useListAddress.ts:31` |
| Category | documentation |
| Rule | conventions.md "Comments"; patterns doc "How to add", rule 7 |

**What:** The Open point says the comment on `list` "says style rule d keeps `hooks/` out of `store/`". The comment says the reverse: "Style rule d only keeps axios and services/ out of hooks/." The code and pattern 1 are right.
**Why it matters:** The next reader hunts for a wrong comment that is not there.
**Recommendation:** Delete that Open point bullet.
**References:** [[knowledge/lessons/LESSON-REQ-fs-006-4]]

### QUAL-003: "Is this string a role" is written four times

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `frontend/src/components/users/UserCells/usersColumns.tsx:19`; also `frontend/src/components/ui/Tag/RoleTag.tsx:14`, `frontend/src/lib/usersQuery.ts:40`, `frontend/src/components/users/UsersFilters/UsersFilters.tsx:56` |
| Category | duplication |
| Rule | LESSON-REQ-fs-002-3 (a second copy of a rule); patterns doc pattern 28 |

**What:** `ROLES` was exported to stop copies, yet four places test a string against it: `isKnownRole` (usersColumns), `isRole` via `Object.hasOwn` (RoleTag), `readRole` (usersQuery) and `handleRole` (UsersFilters). `usersColumns` even checks before calling `RoleTag`, which checks again and returns null.
**Why it matters:** Only `readRole` is in the lib check; the other three can drift (e.g. case, whitespace).
**Recommendation:** Add `asRole(value: string | null): Role | null` beside `ROLES` in `lib/token.ts` with cases in the lib check; use it in all four (RoleTag keeps its colour map; usersColumns can pass the value straight to `RoleTag` and test `asRole(...) === null` only for "No role").
**References:** [[knowledge/lessons/LESSON-REQ-fs-002-3]]

### QUAL-004: Copied page view chain; its pure parts and some new words have no cases

| Field | Value |
|---|---|
| Severity | minor |
| Effort | medium |
| File | `frontend/src/pages/UsersPage/UsersPage.tsx:213-230`, `frontend/src/pages/DirectoryPage/DirectoryPage.tsx:109-126`; `frontend/src/config/text.ts` (users block) |
| Category | duplication / test-coverage |
| Rule | LESSON-REQ-fs-002-3; patterns doc "Checks to run" (add cases for new pure functions) |

**What:** Both list pages carry the same ten-line `loading/error/empty/ready` chain and the same `countText` lookup, with `pastTheEnd` and `current` rules in the hook; none of it is checked (the hook has no DOM-free test). Also uncovered, though `postDeleteBody` sets the precedent: `usersCount` ("1 user" / "124 users"), `userDeleteBody`, `userDeletedToast`, `usersDeleteButtonName`, `aboutSub`, `aboutPurposeText`.
**Why it matters:** The REQ extracted the address code to stop drift but left this beside it; a state added to one page (e.g. a "stale" status) will miss the other. Untested words are where a wrong plural ships.
**Recommendation:** Add `listView(current, pastTheEnd)` to `lib/` (pure, typed on `status` and `items.length`), use it in both pages, and add cases for it and for `usersCount(0|1|2)`, `userDeleteBody` and `userDeletedToast`.
**References:** [[knowledge/lessons/LESSON-REQ-fs-002-3]]

### QUAL-005: toPeopleBlockState still has no check cases

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `frontend/src/store/peopleBlockState.ts`; `scripts/frontend-lib-check.ts` |
| Category | test-coverage |
| Rule | patterns doc "Checks to run" |

**What:** REQ-fs-006 n6 (no cases for `toPeopleBlockState`) was carried again in `skipped.md` as "more than one line", while this REQ added 67 cases next to it. It lives in `store/`, so the lib check cannot import it as it stands without the atoms.
**Why it matters:** Two pages (Dashboard, Feed) depend on its status mapping and nothing proves it.
**Recommendation:** Move the pure mapping to `lib/` (or import it with the harness) and add one case per status and per `kind`; or tell the owner it is a standing decision and close n6 in the vault.
**References:** `skipped.md` (REQ-fs-006 n6)

### QUAL-006: Third copy of the "page" key and a convention gap on shared constants

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `frontend/src/lib/addressParams.ts:8`, `frontend/src/lib/usersQuery.ts:63`, `frontend/src/lib/directoryQuery.ts:49` |
| Category | duplication |
| Rule | LESSON-REQ-fs-002-3 |

**What:** `readPageParam` reads `"page"` from a private `PAGE_KEY`, while both `write*Query` functions set it from their own `PAGE_KEY`. A rename of the key in one place breaks the round trip silently (the round-trip cases catch it today).
**Why it matters:** Small; the cases do cover it. Mentioned for completeness.
**Recommendation:** Export `PAGE_KEY` from `addressParams.ts` and import it in both query files.

### Round 2

**Summary:** Checked the fix diff and the work tree. Library check run: 565 passed, 0 failed (matches the docs). 6 of 6 round-1 findings resolved as scoped; 0 critical, 0 major, 0 minor, 3 trivial new. No hex, px or words outside `config/text.ts` in the fixes; the `:has` rules sit inside the pinned phone query and use only tokens.

- QUAL-001 resolved (text part): `PageNote` example now uses the no-access and not-found words; patterns Open points say deletion waits for the owner. `BeingBuilt.tsx` still holds its two strings, on purpose.
- QUAL-002 resolved: the wrong Open-point bullet is gone; the `list` comment and the new `ListAddressStatus` note are right.
- QUAL-003 resolved: `asRole` in `token.ts` is used by `toRole`, `readRole`, `RoleTag`, `UsersFilters` and `usersColumns`; no other "is this a role" test is left (grep: no `isRole`, `isKnownRole`, `hasOwn`). Ten cases, including capital, spaces, empty and look-alike words; each can fail.
- QUAL-004 resolved (chain duplication left for the owner, as agreed): cases for `usersCount` (0, 1, 2, 124), `usersDeleteButtonName`, `userDeleteBody`, `userDeletedToast`, the 409 words, `aboutSub`, `aboutPurposeText`. They compare whole strings, so a wrong plural or word fails.
- QUAL-005 resolved: six `toPeopleBlockState` cases (idle, loading, ready, error, and both wrong-kind states). Importing from `store/` is safe because that file imports types only; the header comment and pattern 16 say so.
- QUAL-006 resolved: `PAGE_KEY` exported once; both query files import it; pattern 35 names it.

### QUAL-007: `asRole` takes only a string, so three callers keep a null guard

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `frontend/src/lib/token.ts:22`, `frontend/src/lib/usersQuery.ts:40`, `frontend/src/components/ui/Tag/RoleTag.tsx:21`, `frontend/src/components/users/UserCells/usersColumns.tsx:49` |
| Category | duplication |
| Rule | LESSON-REQ-fs-002-3 |

**What:** My round-1 advice was `asRole(value: string | null)`. As built, `readRole`, `RoleTag` and `usersColumns` each repeat a `null`/empty check before calling it, and `usersColumns` still tests the role and then `RoleTag` tests it again.
**Why it matters:** Small. A null guard written three ways is the same drift risk in miniature.
**Recommendation:** Widen the parameter to `string | null | undefined` (the lib check gets two cases), drop the three guards, and let `usersColumns` test `asRole(user.role) === null` only for "No role".

### QUAL-008: Library-check header and the new cases' source are only partly traceable

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `scripts/frontend-lib-check.ts:1-12`, `scripts/frontend-lib-check.ts:1426-1475` |
| Category | documentation / test-coverage |
| Rule | patterns doc "Checks to run" (expected answer from the spec; prove once a case can fail) |

**What:** The header lists "the TASK-002 and TASK-003 lists", while the new section cites AC9, A3 and the TASK-008 list. The word cases repeat the sentences of `text.ts` letter for letter; that is what the spec fixes only where the spec quotes them (e.g. the 409 sentence is the one ADR-06 is argued about, m11). No record shows the "wrong expectation fails" run for the new cases.
**Why it matters:** If the owner changes the 409 words (m11), these cases fail with the code, as they should, but the header will not tell the next reader which list they came from.
**Recommendation:** Add TASK-008 and the fix round to the header, and note in `verification.md` the one wrong-expectation run.

### QUAL-009: Fifth copy of the four list states, linked by a comment only

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `frontend/src/hooks/useListAddress.ts:16`; `frontend/src/store/usersAtoms.ts:21`, `frontend/src/store/postAtoms.ts:24` |
| Category | duplication |
| Rule | LESSON-REQ-fs-002-3 |

**What:** `ListAddressStatus` repeats `"idle" | "loading" | "ready" | "error"`, which `usersAtoms`, `alumniAtoms`, `postAtoms` (`LoadStatus`) and `profileAtoms` already write. The comment says the store "uses the same four words"; nothing enforces it, though the build would fail if a page's list stopped matching.
**Why it matters:** None today (the compiler is the guard). The hook stays free of `store/` by choice (pattern 35), so the copy is deliberate.
**Recommendation:** Keep it. No action unless a fifth state is added; then change all in one go.

## Correctness findings

Written by: correctness-reviewer (tier: balanced)

**Summary:** Read the full diff and the off-diff collaborators (useModalDialog, Dialog, latestRequest, sessionActions/sessionAtoms, Avatar and FeedPost CSS, saveFailure, loadFailure, backend UserController). Traced 9 delete-flow races, 4 session paths, the hook against the old DirectoryPage, 25 address edge cases. 0 critical, 0 major, 1 minor, 1 trivial. Biggest: a delete that fails after the user left the page (dialog open) drops its error with no toast.
- Delete flow (dialog open/close/Escape, deletingRef, confirmOpenRef, late answers, focus counter): checked; one finding (CORR-001). Escape while busy, reopening the same user, opening another user, 404 and 409 all resolve correctly.
- refillEmptiedPage / past-the-end: checked, nothing (last row on last page goes to the hook's clamp; middle-page empty reloads once; a stale handler after unmount sees idle or a different key and does nothing).
- usersAtoms/userActions (visit + user guard, patch only when held, total floor 0, reset paths): checked, nothing. reset runs in clearSession (log out, 401 end-session), startSession, and tokenChangedElsewhere when the user id changes. A different-user list cannot show.
- useListAddress vs old DirectoryPage: checked, nothing. Code moved verbatim; only effect order differs (hook effects now run before the page's load effect), and no effect reads another's output in the same commit.
- usersQuery/addressParams/lastPage move: checked, nothing. Role is an exact match, repeated keys are absent, page 1 to 9999999; no stale importer of lastPage.
- Unchanged-edit fix (FeedPost, CommentItem): checked, nothing for correctness. Whitespace-only edits count as unchanged (see CORR-002).
- userDeleteFailureText / words: checked, nothing (409 first, then 403/404/save; HTTP_CONFLICT exists; words match SaveFailureWords).
- Font preload plugin: checked, nothing (dev returns no tags; the latin-ext file does not match the name test; href assumes base "/", which the config does not change).
- memo (AlumniCard, FeedPost, UserNameCell): checked, nothing. FeedPage passes stable handlers; handleToggleComments reads the open post from the store at the press, so no stale thread id. Avatar 1x1 and FeedPost 4x3 attributes are overridden by CSS (width/height 100%, aspect-ratio).
- Packet-gap: none.

### CORR-001: Delete failure is lost when the user leaves the page while the dialog is open

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `frontend/src/pages/UsersPage/UsersPage.tsx:2713, 2805, 2819-2823` |
| Category | error-handling |

**What:** `confirmOpenRef` is never cleared when the page unmounts. If the admin presses Delete, then leaves (browser Back) before the answer, a failure finds `dialogOpen` still true, so it calls `setDeleteError` on the unmounted page and shows no toast.
**Why it matters:** The admin never learns the delete was refused (409) or failed; the success path is fine because it toasts either way. Rare, no data harm.
**Recommendation:** Add `useEffect(() => () => { confirmOpenRef.current = null; }, [])` in UsersPage so a late failure becomes a toast, as the header comment promises (ADV-001).

### CORR-002: Whitespace-only edit is treated as unchanged and not saved

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `frontend/src/components/posts/FeedPost/FeedPost.tsx:388-394`, `CommentItem.tsx:207` |
| Category | logic |

**What:** `sameText` compares trimmed text, so a post stored as "hello " that the user edits to "hello" closes with no request and the stored trailing space stays.
**Why it matters:** Harmless in practice (the display trims); noted because the spec says "trimmed compare" and this is its only visible edge.
**Recommendation:** None needed; keep as is unless the owner wants stored text normalized.

### Round 2

**Summary:** Read the fix diff and the work-tree files (usersAtoms, userActions, UsersPage, useListAddress, CommentItem, token, addressParams, both query files). 0 new findings. CORR-001 is resolved. Traced refill against: page or search changed during the delete, two deletes at once, delete after leaving the page, a refill that is still loading, and the past-the-end clamp. No wrong-params reload, no double reload, no leaked counter found.

- CORR-001: resolved. The unmount effect (UsersPage:119-125) sets `confirmOpenRef` to null, so a late failure takes the toast branch. `setConfirmOpen(false)` on an unmounted page is a no-op. The success path was already safe (toast either way). The cleanup also runs in StrictMode's test remount, where the ref is already null.
- CORR-002: unchanged, accepted (trivial, no fix asked).
- m10 (refill in the store): correct. It runs only under `scope.isCurrent()` (same user, same visit), so a delete that ends after the page closed reloads nothing. It reloads only a `ready`, empty list with `total > 0` and `page <= lastPage`, using the list's own `queryKey`. If the address changed meanwhile, the list is `loading` (skipped) or the effect's newer load wins through latestRequest. A second delete during the refill sees `loading` and skips. The page's load effect depends on `queryKey` only, so the refill does not trigger it again. Last row on the last page still goes to the hook's clamp (`page > lastPage`).
- m1 and m10 visit counter: `clearUsersAtom` and `resetUsersAtom` are the same atom object; one `usersVisit += 1` per call, no second counter, nothing leaked. `lib/usersQuery` imports no store code, so no import cycle.
- m2 (CommentItem 404): correct. `onRemoved` runs only while the edit is still open (`editingRef`), so a late 404 does not pull focus; the toast still shows. The delete path (line 174) and the save-in-edit path (line 137) are unchanged.
- m4 (asRole): same results as before in all four places. RoleTag was `Object.hasOwn` (exact key), `toRole` was an exact `find`; `""` and null still read as no role. `toRole` now rejects non-strings before the call, as `find` did by strict equality.
- t1 (hook): `writeControl(patch, page)` gives the same address as before: `changeFilter` page 1, `changePage` the asked page, and a pending search still forces page 1. Status union matches `UsersState` and the alumni list (build passes).
- t2 (PAGE_KEY): one exported constant, used by both writers, which set the page last as before; `readPageParam` uses it too.
- Packet-gap: none.

## Reflection findings

Written by: reflector (tier: balanced)

**Summary:** Checked 32 lessons (0 superseded), G01-G58 (the ones that touch these files: G43, G44, G46, G48, G50, G54, G56, G57, G58), ADR-06/09/10/12, the concept and component pages, and the 29 candidates. 0 critical, 0 major, 4 minor, 2 trivial (one of the minors is a vault-stale group for wrap-up). Biggest: the About page leaves out "who can join" and "the app version", which ADR-10 and the design rules list, with no recorded decision.
- Lessons 005-1, 005-2, 006-1, 006-5 and the 002-3 Directory sibling: checked, nothing. The unchanged-edit fix sends nothing and keeps focus; the users atom is cleared on close, reset in all 3 session places, and idle counts as loading; the Directory was converted in the same REQ.
- G46/G48/G57/G58: checked, nothing (name cell wraps; StrictMode safe; no new import in text.ts; 403/404/409 go through writeFailure). G56: no import of backend, pg or dotenv in the diff.
- Process: the scratch file in frontend/src left no trace (`git status` shows only the untracked packet; no ignored file in frontend/src). Outside `.adlc/`, `frontend/src/` and `docs/` the branch touches only `frontend/vite.config.ts` and `scripts/frontend-lib-check.ts`, both in the blast radius. Backend untouched. `.adlc/hot.md` already records the slip.
- Candidates: see the verdict at the end. Packet-gap: none.

### REFL-001: A 404 on saving a comment still moves focus with no check (the diff edited this function)

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `frontend/src/components/posts/CommentItem/CommentItem.tsx:132-135` |
| Category | repeated-mistake |
| Vault reference | [[knowledge/lessons/LESSON-REQ-fs-006-2-an-async-answer-may-only-change-its-own-state]] (REFL-009 still open there) |

**What:** This REQ added an `editingRef` guard to the new "unchanged" branch of `handleSave`, but the 404 branch below it still calls `onRemoved()` without it; the lesson names this exact line.
**Why it matters:** A late 404 after the user started another edit or reply moves focus and wipes their work. `skipped.md` says "not in the approach", but it is one line in a function this REQ rewrote.
**Recommendation:** Wrap `onRemoved()` in the same `if (editingRef.current)` test the success branch uses, or keep it skipped and update the lesson's "still open" line at wrap-up.

### REFL-002: About page leaves out two things ADR-10 lists

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `frontend/src/pages/AboutPage/AboutPage.tsx`, `frontend/src/config/text.ts` (About block) |
| Category | adr-conflict |
| Vault reference | [[architecture/adr-10-about-page-last-privacy-and-password-reset-later]] (Decision, "About page content", and its open question on the version) |

**What:** ADR-10 and design-system.md line 219 (owner, 2026-10-06) say the page tells what the system is, who can join, how to contact, and the app version. Spec AC14 and the page give purpose, what you can do, and the contact only.
**Why it matters:** The ADR left "where the version comes from" to the REQ that builds the page; this REQ neither answers it nor records the drop, so an accepted ADR and the code now disagree.
**Recommendation:** Ask the owner: add "who can join" and a version line (version from `package.json` through Vite, read in `config/`), or write a deviation line in ADR-10 at wrap-up saying both are left out and why. Do not pick silently.

### REFL-003: Two siblings of a new helper left on the old way

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `frontend/src/pages/LoginPage/LoginPage.tsx:207`; `frontend/src/pages/dev/ComponentsPage/ComponentsPage.tsx:231-234` |
| Category | repeated-mistake |
| Vault reference | [[knowledge/lessons/LESSON-REQ-fs-002-3-new-helper-convert-every-sibling]] (seventh sighting) |

**What:** AboutPage builds its contact link with `mailtoHref(CONTACT_EMAIL)`, but LoginPage still writes `mailto:${CONTACT_EMAIL}` by hand (CAND-007). The dev page also keeps its own `ROLE_OPTIONS` ("Student", "Alumni") beside the new `ROLE_WORDS`.
**Why it matters:** The lesson says convert or write down why it stays; neither is done. Today the constant is plain, so no bug, but the two links follow two rules.
**Recommendation:** Use `mailtoHref` in LoginPage (plain text on null, as AboutPage does) and build the dev page options from `ROLE_WORDS`. Two small edits. (QUAL-003 covers the four "is this a role" tests; this is a different spot.)

### REFL-004: Open-point line in the patterns doc describes a comment that was already fixed

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `docs/frontend-patterns.md:1115`; `frontend/src/hooks/useListAddress.ts:31` |
| Category | repeated-mistake |
| Vault reference | [[knowledge/lessons/LESSON-REQ-fs-006-4-a-fix-that-moves-a-rule-leaves-old-prose-behind]] |

**What:** The Open points say the comment on `list` blames style rule d for keeping `hooks/` out of `store/`; the comment now says the right thing. Same slip as QUAL-002, filed for the lesson link; CAND-028 is moot for the same reason.
**Why it matters:** Another REQ where fixed code leaves a "known gap" line behind.
**Recommendation:** Delete the bullet (one fix with QUAL-002) and add the sighting to L-REQ-fs-006-4 at wrap-up.

### REFL-005: A delete during a load is not in a log (accepted edge of the total rule)

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | medium |
| File | `frontend/src/store/usersAtoms.ts` (`removeUserLocallyAtom`), `frontend/src/store/userActions.ts:3192` |
| Category | repeated-mistake |
| Vault reference | [[knowledge/lessons/LESSON-REQ-fs-006-3-patched-list-total-needs-a-log-of-local-changes]] |

**What:** The patch is skipped while a load runs, and that load's answer may predate the delete, so a deleted row or a total one too high can show until the next load. There is no edit log, unlike the feed.
**Why it matters:** Needs a page or search change during a delete; deleting that row again answers 404 and removes it. Low cost.
**Recommendation:** Leave it; note it in pattern 34 as a known edge, or add an id log like `totalEdits` if it ever shows.

### REFL-006: Vault and root files that still say the old thing (vault-stale, for wrap-up)

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | see list |
| Category | vault-stale |
| Vault reference | [[knowledge/lessons/LESSON-REQ-fs-006-4-a-fix-that-moves-a-rule-leaves-old-prose-behind]] |

**What:** Not code findings; `/wrapup` step 3 updates them. (1) `CLAUDE.md:47` "the users page is still a placeholder". (2) `.adlc/context/project-overview.md:70` "the footer has no About link". (3) `.adlc/context/design-system.md` lines 179, 197, 247 (footer link "not rendered until the About page exists"), 217 and 219 (About "not designed yet / will say"). (4) `.adlc/knowledge/components/frontend-app.md` status line and line 38 (current as of REQ-fs-006, users page not built) and the `shell/` row still lists BeingBuilt. (5) ADR-10 open question on the version (REFL-002). (6) G50 says headless Chrome will not go under about 500 px; CAND-019 shows `setDeviceMetricsOverride` reaches 360 px, so G50 needs an update line.
**Recommendation:** Update these at wrap-up. docs/ and roadmap were already updated in the diff (checked: patterns 34 to 37, roadmap F9 to F11). `docs likely affected:` nothing further.

**Candidates verdict (29 in the file; I add three):** duplicates: CAND-006 = 002; 011 and 012 are the same harness family as 010 (one G55/G56 update line for all four); 003 is half of 010; 015 and 016 = L-REQ-fs-006-5; 028 moot (REFL-004); 029 = L-REQ-fs-004-7 / 006-4. Gotcha updates, not lessons: 004 (G54), 017, 019, 020 (G50), 018 (G52), 021 (G57). Real lessons: 001, 005, 007 (confirmed live, REFL-003), 013, 014, 022, 024, 025, 027; 023 is a tool note; 026 an open point for the owner; 008 and 009 are weak (hook-specific, fit a concept page for `useListAddress`).

### Round 2

**Summary:** Fix round checked against the work tree. 0 critical, 0 major, 0 minor, 1 trivial new. REFL-001, 003, 004 resolved; no lesson repeated in the fix round; process rules held.
- REFL-001 resolved: `CommentItem.tsx:137` wraps `onRemoved()` in `if (editingRef.current)` and the comment says why; the toast still shows.
- REFL-003 resolved: `LoginPage.tsx:95,211` uses `mailtoHref` with plain text on null (same as About); the dev page `ROLE_OPTIONS` is built from `ROLE_WORDS` (`ComponentsPage.tsx:231-236`).
- REFL-004 resolved: the `BeingBuilt` bullet now says deletion waits for the owner; the stale `list` comment bullet is gone. Case count 565 matches in both doc places.
- LESSON-REQ-fs-002-3: no copy of the role check left in `frontend/src` (`asRole` is used by `token.ts`, `usersQuery.ts`, `UsersFilters.tsx`, `usersColumns.tsx`, `RoleTag.tsx`; the other `ROLE_OPTIONS` in `SignUpPage.tsx:61` is the sign-up radio choices, two roles, not a role test). Page key: only `addressParams.ts` defines it. Mailto: Login, About and AlumniProfile all use `mailtoHref`.
- LESSON-REQ-fs-006-4: grep of `docs/`, `scripts/`, `frontend/src` for 'being built', '536', '469', 'asRole', 'PAGE_KEY': only true history remains (`docs/frontend-patterns.md:383` "Until part 4 some only said being built", `:460` "469 after part 3", the `BeingBuilt.tsx` title itself). `CLAUDE.md:47` still says the users page is a placeholder: already in REFL-006 (wrap-up), not re-filed.
- Process: `git status` outside `.adlc/` lists only `docs/`, `frontend/src/`, `scripts/frontend-lib-check.ts`, all allowed; no deletion; `BeingBuilt.tsx` still exists and is tracked.

### REFL-007: Dev page builds one mailto link by hand

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `frontend/src/pages/dev/ComponentsPage/ComponentsPage.tsx:1069` |
| Category | repeated-mistake |
| Vault reference | [[knowledge/lessons/LESSON-REQ-fs-002-3-new-helper-convert-every-sibling]] |

**What:** `href={`mailto:${SAMPLE_USERS[0].email}`}` is the last hand-built mailto in `frontend/src`. The sample address is plain, so nothing breaks.
**Recommendation:** Leave it (dev-only sample data) or use `mailtoHref`; no action needed.

## UI/UX findings

Written by: ui-reviewer (tier: balanced)

**Summary:** Ran the app in headless Chrome against a throwaway mock API (127.0.0.1 only; no real backend, no .env). Exercised /users, /about, footer link, /directory, /feed and /dev/components at 1280, 640 (200% zoom), 390 and 360px in both themes, about 60 interaction checks. 0 critical, 0 major, 2 minor, 2 trivial. No console errors. Biggest: at 360px two toasts cover the pagination "Next" button and the footer About link when the page is scrolled to the bottom.
- Broke it on purpose, all behaved: typing then Back before the 300 ms timer (leaves, no late push); type, wait, type, Back, Forward (restores q); deleting every row of the last page (lands on page 2, focus on the count line); delete with a search timer pending (one DELETE, list reloads for the search); slow delete (2.5 s) with a double press (one DELETE, label "Deleting", aria-disabled, Escape closes, late answer gives toast + focus on the count line); 409 after the dialog closed (toast, focus back on that row's Delete); 409/500 in the dialog (message inside, retry works); 404 (toast, row gone); keyboard-only delete by real Tab/Enter/Escape (focus ring visible, Escape returns focus to the row's Delete).
- Addresses: role=bogus, role=Alumni, page=0, page=2&page=3 fall back to defaults; role=alumni&page=3 and page=99 move to the last page; role change from page 3 resets to page 1; Next/Back/Forward keep the page. Error + Try again, loading skeleton (aria-busy), empty + Clear search and role: all intentional. Reduced-motion: no animation running.
- Screen-reader names: "Delete <name>" on every row, 60-character name included; own row has no Delete; "Name not given" for a null name. About: title "About · University Alumni", one footer link, 44px high, real link. Avatar img: width/height/lazy/async set, renders 32px/44px.
- Not covered: font preload in a built page (the plugin runs only in a build; I did not build; read the plugin, looks right; the t013 harness covered it); real network-drop wording (the Vite proxy turns a dropped socket into a 5xx, so the mock shows the server wording); Claude in Chrome tier was not available.

### UI-001: Toasts cover the pagination "Next" button and the footer About link at 360px

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| Route / flow | `/users` at 360px, delete a row, page scrolled to the bottom |
| Lens | responsive |
| Evidence | `ui-evidence/review-users-toast-pagination-360-dark.png`; Next at y 575-619, toast 1 at 592-654, footer link 684-728 under toast 2 (viewport 740) |

**What:** Cards are tall, so after a delete from the lower rows the Pagination wraps to two lines (Next alone on the second) and sits right above the bottom edge. Each toast (62px, 5 s) covers it, two toasts cover the footer link too. AC20 says a toast does not hide the page's main action.
**Why it matters:** The user who deletes several users in a row cannot press Next for up to 10 s (or until they press each Dismiss). Same class as the My profile Save case already in `skipped.md`, so this may be accepted.
**Recommendation:** Give the page bottom padding equal to the toast stack height on a phone (token spacing), or add the Users page to the `skipped.md` line so the gap is recorded.

### UI-002: Own row in phone card mode shows an "Actions" label with nothing beside it

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| Route / flow | `/users` at 360 and 390px, the "You" card |
| Lens | design-match |
| Evidence | `ui-evidence/review-users-cards-360-light.png` (last label, "Actions", empty) |

**What:** `UserActionsCell` returns null for the own row, but `Table` card mode still draws the label and an empty value box (`data-label="Actions"`).
**Why it matters:** An empty labelled line reads as a missing control (and a screen reader may announce an empty cell). The table view does not have this problem.
**Recommendation:** In `Table` card mode, hide a cell (label and value) whose render gives null, or render nothing for the whole cell; check the dev page Table section afterwards.

### UI-003: Dev page buttons grid overflows its box by 3px at 360px

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| Route / flow | `/dev/components` at 360px, "Buttons" section |
| Lens | responsive |
| Evidence | MEASURE output: `div.buttonGrid sw=316 cw=313`; no page scroll (dev-only) |

**What:** Three nested boxes are 3px wider than their container at 360 only (not at 390). Dev page, so no user sees it.
**Recommendation:** Let the grid shrink (`min-width: 0` or wrap) if the dev page is meant to pass the phone audit; otherwise ignore.

### UI-004: After a delete from page 1 the next page silently skips one user

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | medium |
| Route / flow | `/users`, delete on page 1 of 3, then Next |
| Lens | flow |
| Evidence | page 1 shows 11 rows after the delete (count 29); the server's offset paging now starts page 2 one row later |

**What:** The row that was 13th moves to position 12 on the server but is not shown on page 1 (not reloaded) nor page 2. It reappears on reload.
**Recommendation:** Accept (normal for offset paging), or reload the current page after a delete. Not worth a fix unless the owner objects. (Also: the inline feed author links are 18px tall at 360; inline text links are exempt, not listed.)

**UI review tier:** headless (Chrome 147 over CDP, mock API) -- /users (all states, delete, keyboard, addresses), /about, footer, /directory, /feed, /dev/components at 4 widths, 2 themes; 6 screenshots kept (`ui-evidence/review-*.png`); 0 critical / 0 major / 2 minor (+2 trivial).

### Round 2

Written by: ui-reviewer (tier: balanced). Work tree run (uncommitted fixes), headless Chrome 147 over CDP, mock API on 127.0.0.1 only, no .env read.

**Summary:** UI-002 and UI-003 are fixed. No new findings (0 critical / 0 major / 0 minor). About 75 checks, both themes, 360 and 1280px. No console errors. UI-001 (toasts on a phone) and UI-004 were out of scope and were not re-judged.

- **UI-002 fixed.** At 360px the "You" card ends after Joined: the Actions cell is `display:none`, no empty label, and Joined has no bottom line (the card's own border closes it, `ui-evidence/review2-users-you-card-360-dark.png`). Other cards keep 1px dividers and a Delete under "Actions". At 1280 the own row still has 5 cells, all with a 1px line (`review2-users-you-row-1280-light.png`). On the dev page the Table with the empty Actions cell hides only that cell at 360 and 390 and keeps it at 1280; the other dev table has no empty cells and is unchanged.
- **UI-003 fixed.** `/dev/components` at 360: no box wider than its parent, no sideways scroll (`review2-dev-buttons-360-light.png`).
- **Users regression, all pass (light 1280, dark 360, light 360, dark 1280):** 409 words in the dialog; 404 toast and row gone; success toast with focus on the count line; deleting all 12 rows of page 2 sends 12 DELETEs and exactly one reload (`page=2`, count 18, 6 rows); the same with a search and a role filter: one reload carrying `q` and `role`, page 1, 2 rows left; role filter then Next keeps `role=alumni&page=2`, Back drops the page and keeps the role; a slow delete then leaving to /feed gives the late 409 as a toast.
- **Other fixes:** Directory search, Back and page checks pass (7 of 7 at 1280 light and 360 dark); login page shows the contact as a real `mailto:` link in both themes at both widths, no scroll; comment edit with a 404 and comment delete with a 404 each show the "already deleted" toast, the comment leaves the list, the edit form closes, focus lands on the composer.
- **Tag:** Admin, Alumni and Student words and colours are identical at 360 and 1280 and unchanged by `asRole`: light Admin dark fill/white text, Alumni amber, Student pale with a line; dark Admin pale fill, Alumni amber, Student dark with a line; all 26px high, no wrapping.
- **Not covered:** the m2 case "a late 404 while another edit is open" (needs two own comments in one thread, the mock has one for the admin); read from source only (`CommentItem.tsx` checks `editingRef` before `onRemoved`).

**UI review tier (round 2):** headless (Chrome over CDP, mock API) -- /users, /directory, /feed thread, /login, /dev/components, both themes, 360 and 1280; 3 screenshots kept (`ui-evidence/review2-*.png`); 0 critical / 0 major / 0 minor. Ports 4317, 5317, 9317 stopped.
