# Architecture adversary — REQ-fs-007-frontend-users-about-polish-perf

Written by: architecture-adversary (tier: balanced), dispatched sub-agent.

| Field | Value |
|---|---|
| Generated | 2026-10-08 |
| Trigger | ui-surface, large-blast-radius |
| Verdict | found problems |

## Summary

Checked 36 ACs against 14 tasks, the Directory logic the hook must keep, 3 session reset sites, the font files, Table phone CSS, ConfirmDialog/Dialog/useModalDialog, the 409 path through apiClient, and the memo plan. Every AC has a task (AC32 is explicitly left to wrap-up). 5 findings: 1 major, 4 minor, plus 2 trivials. The biggest: the delete dialog can be left invisibly "open" and stuck while a delete is running (ADV-001). Checked, nothing: session resets (exactly 3 sites, plan is right), font file name (`hanken-grotesk-latin-wght-normal.woff2` exists, CSS has `font-display: swap`), a 409 reaching the UI (apiClient only special-cases 401, so `toApiFailure` gives `{http, 409}`), Table `role` attributes with the card CSS (consistent).

## Findings

### ADV-001: Delete dialog goes stuck if closed natively while a delete runs

| Field | Value |
|---|---|
| Severity | major |
| Confidence | high |
| Lens | failure-mode |
| Where | `tasks/TASK-008.md` Approach (Delete), `components/ui/Dialog/ConfirmDialog.tsx`, `hooks/useModalDialog.ts:55-60` |

**What:** TASK-008 says Cancel is `aria-disabled` while busy "so the answer never lands on a closed dialog". But `ConfirmDialog` has no such prop (its Cancel `Button` never gets `busy`), and no task edits it. Escape is not covered at all. If the page ignores `onClose` while busy, `useModalDialog` still lets the browser close a second Escape natively (`handleClose` only calls `onClose`), so `open` stays true while the `<dialog>` is closed.
**Break scenario:** admin confirms Delete, presses Escape twice while the request is pending. The dialog vanishes but the page state says open and busy. The request fails with 409: the message is written into an invisible dialog; the admin sees nothing and the row stays. Clicking Delete on another row sets the same `open=true`, so `showModal()` never runs (the effect depends on `[open]`). The page cannot open the dialog again until reload.
**Why this holds up:** I looked for a guard: `handleClose` only forwards to `onClose`; nothing resets `open`. FeedPost avoids this by letting Cancel and Escape close at any time and sending a late failure to a toast (`FeedPost.tsx:140-171`). TASK-008 chose the opposite and did not carry the mechanism.
**Recommendation:** use the FeedPost rule in `UsersPage`: `onClose` always clears `pendingUser`, a late failure with no open dialog becomes a toast (`userDeleteFailureText`). Drop the "Cancel aria-disabled" line, or add a task to extend `ConfirmDialog` and put it in the blast radius.

### ADV-002: "Focus to the count line" after delete has no mechanism and will silently fail

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | medium |
| Lens | omission |
| Where | `tasks/TASK-008.md` Approach (`ok`: close, toast, focus), spec AC7 |

**What:** the plan says "close, toast, focus to the count line" in one step. While the modal `<dialog>` is still open the page behind is inert, so `countRef.focus()` called in the click handler does nothing. `dialog.close()` runs later in an effect and then tries to return focus to the Delete button, which was removed, so focus lands on `body`.
**Break scenario:** admin deletes a user with the keyboard; focus drops to the top of the page and a screen reader loses its place. AC7 fails the "stable place" test.
**Why this holds up:** FeedPage solves the same thing with a request counter plus an effect (`requestHeadingFocus`, `FeedPage.tsx:146`). TASK-008 names no such effect, and the effect order matters: it must run after the dialog's own close effect (child effects run first, so an effect in the page works).
**Recommendation:** in TASK-008 say: on `ok` or 404 bump a `focusCountRequest` state; a page effect on it focuses the count line. Add the keyboard delete case to the TASK-012 browser check (L-REQ-fs-004-4).

### ADV-003: `useListAddress` interface cannot serve the Directory's remaining needs

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | high |
| Lens | hidden-coupling |
| Where | `architecture.md` Approach step 2, `tasks/TASK-007.md` Approach |

**What:** `DirectoryPage.tsx` also uses `pastTheEnd`, `pageCount` and `current` outside the moved code (view = "loading" while clamping, `Pagination pageCount`, `emptyWithCriteria`). The listed outputs do not include them, and the Users page needs the same three.
**Break scenario:** the implementer leaves the past-the-end calculation in the page as well as in the hook (two copies of the `lastPage` rule, the thing this REQ set out to avoid), or the Directory shows a flash of the old ready view for a frame while clamping because the page lost `pastTheEnd`.
**Why this holds up:** the hook gets `list: {queryKey, status, total, limit}` as input, so it can compute these; but TASK-007 lists only `query, queryKey, searchText, refs, handlers` as output. Nothing says the page may not recompute.
**Recommendation:** add `pageCount` and `pastTheEnd` to the hook's output in TASK-007 and have both pages build `view` from them.

### ADV-004: AC25 ("a post image does not make the page jump") is not met by the chosen approach

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | high |
| Lens | contradiction |
| Where | spec AC25, `architecture.md` Performance/Images and Risks, `FeedPost.module.css:10-19` |

**What:** the plan uses `aspect-ratio: auto 4 / 3` with the existing `height: auto`. Once a picture loads, a non-4:3 picture resizes the box. The Risks table accepts this, but the AC still says "does not make the page jump", so review will fail it.
**Break scenario:** a 16:9 post image reserves a 4:3 box, then collapses on load and pushes the comments button up.
**Why this holds up:** `.image` already has `object-fit: contain` and a `--sunken` background, which only makes sense for a fixed box; with `height: auto` they do nothing. A fixed `aspect-ratio: 4 / 3` (no `auto`) with `height: auto` removes the jump with no API change.
**Recommendation:** either use a fixed 4:3 box for `.image` (letterboxed, no jump), or reword AC25 at the gate to "reserves a 4:3 box" and record the known jump.

### ADV-005: Performance changes land after the phone audit, with only a partial re-check

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | medium |
| Lens | rollback |
| Where | `tasks/TASK-013.md` (depends on 012), Acceptance |

**What:** TASK-013 changes `Avatar` and `FeedPost` image markup and CSS, adds `memo` and `useCallback` to FeedPost, CommentItem, AlumniCard and the Users cells, and may move imports in `App.tsx` / `AppShell`, all after the audit and its screenshots. Re-check is only "TASK-012's no-scroll check still passes".
**Break scenario:** `memo` with a missed unstable prop shows stale comment text or a stale "You"/Delete state; a new `aspect-ratio` pushes a toast or dialog over a button. Neither is a horizontal scroll, so neither is caught, and the review gate sees TASK-012's old evidence.
**Why this holds up:** `FeedPage.handleToggleComments` is a plain function (`FeedPage.tsx:163`), so FeedPost memo needs real prop work, not a one-line wrap.
**Recommendation:** make TASK-013's acceptance also repeat the TASK-007 Directory and TASK-011 edit scenarios and a Feed delete/edit/comment pass, and refresh the screenshots for the pages it touched.

## Trivials (2 not fully listed)

- `fontPreload` plugin: `ctx.bundle` keys start with `assets/`, so "name starts with" must be a `includes`/basename match; and if nothing matches it adds nothing silently. Make it throw in build when the Latin file is not found (TASK-013).
- TASK-001 ("before") has no DAG edge before TASK-002..011; only the prose "do first" protects the baseline. Add it to Tier 0 notes as a hard first step.

Also noted, not a finding: memo on the Users name/actions cells will save little because `Table` is not memoized and builds each `<tr>`/`<td>` itself; the render counter in TASK-013 will show this, and the "each case says what it saved" rule already allows skipping.

## Coverage

- **Lenses run:** omission, failure-mode, hidden-coupling, rollback, contradiction/testability, ux-consistency.
- **Lenses skipped:** cross-repo (single repo, no backend change).
- **Acceptance-criteria coverage:** AC1-AC11 checked (TASK-003/006/007/008; ADV-001, 002, 003 apply), AC12 checked (TASK-009), AC13-AC16 checked (TASK-005/010), AC17-AC21 checked (TASK-012; ADV-005), AC22 checked (TASK-001/014; trivial), AC23-AC27 checked (TASK-013; ADV-004, ADV-005), AC28-AC30 checked (TASK-011), AC31 checked (TASK-014), AC32 checked (wrap-up by design), AC33-AC36 checked (cross-cutting, TASK-014).
