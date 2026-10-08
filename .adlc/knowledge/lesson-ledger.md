# Lesson ledger

<!-- GENERATED from knowledge/lessons/ — do not hand-edit.
     Rebuilt (whole file) by /wrapup, /task, /bugfix, /recover, and /config migrate,
     from each lesson's header lines only:
       grep -h '^# \|^| ID \|^| Tags \|^| Severity \|^| REQ \|^> \*\*STATUS: superseded' knowledge/lessons/LESSON-*.md
     This file carries merge=union in .adlc/.gitattributes: a parallel merge can leave a
     duplicated row. That is expected — the next rebuild clears it. A merge conflict here
     is resolved by rebuilding, never by hand. -->

One row per lesson file. Title is the H1 without its `^L…` anchor. Superseded lessons render as `~~ID~~` with `→ LESSON-…` after the title. Order: legacy `LESSON-NNN` ascending, then `LESSON-<WORK_ID>-<n>` by work ID, then `<n>`.

| ID | Title | Tags | Severity | REQ |
|---|---|---|---|---|
| LESSON-REQ-fs-001-1 | A passing build says nothing about SQL strings | dal, sql, testing | trap (cost real time before) | REQ-fs-001 |
| LESSON-REQ-fs-001-2 | Before fixing code that never ran, list what it was hiding | dal, auth, api, scope | trap (cost real time before) | REQ-fs-001 |
| LESSON-REQ-fs-001-3 | After renaming a DTO field, check every place a request body is passed straight through | api, controllers, dto, rename | guideline (a rule to follow) | REQ-fs-001 |
| LESSON-REQ-fs-001-4 | Before adding joined columns to a read, check whether the method logs its rows | dal, logging, privacy, joins | guideline (a rule to follow) | REQ-fs-001 |
| LESSON-REQ-fs-002-1 | Type a Query method that returns `rows[0]` as "row or undefined" | dal, types, not-found, controllers | trap (cost real time before) | REQ-fs-002 |
| LESSON-REQ-fs-002-2 | A secret column is kept out of responses by the SQL column list, not by a type | dal, auth, password, sql, types | critical (must never repeat) | REQ-fs-002 |
| LESSON-REQ-fs-002-3 | When a change adds a shared helper, convert every existing inline copy in the same change | api, controllers, auth, helpers, scope | guideline (a rule to follow) | REQ-fs-002 |
| LESSON-REQ-fs-002-4 | Refuse null and empty values before turning an id into a number | api, auth, owner-check, javascript | trap (cost real time before) | REQ-fs-002 |
| LESSON-REQ-fs-003-1 | Write the API check from the spec and the schema, not from the code | testing, api, check-script, contract | trap (cost real time before) | REQ-fs-003 |
| LESSON-REQ-fs-003-2 | When the code cannot be run here, run its pure expressions alone | dal, api, escaping, testing, regex | trap (cost real time before) | REQ-fs-003 |
| LESSON-REQ-fs-003-3 | One resource, one answer shape: route every write and every read through the same joined query | dal, api, contract, joins, shared-types | guideline (a rule to follow) | REQ-fs-003 |
| LESSON-REQ-fs-003-4 | A check must be able to fail: build the case the code could get wrong | testing, check-script, deletes, concurrency | guideline (a rule to follow) | REQ-fs-003 |
| LESSON-REQ-fs-003-5 | Never log a whole database error: its detail can hold the failing row | api, errors, logging, password, privacy | critical (must never repeat) | REQ-fs-003 |
| LESSON-REQ-fs-003-6 | When an endpoint changes, change its shared request and response types in the same change | shared-types, api, contract, controllers | guideline (a rule to follow) | REQ-fs-003 |
| LESSON-REQ-fs-003-7 | Plan a tighter helper signature in the same task as its callers | planning, tasks, types, dal | guideline (a rule to follow) | REQ-fs-003 |
| LESSON-REQ-fs-004-1 | Router state is not one-shot: it survives a reload, so clear it after you use it | routing, react-router, focus, state | guideline (a rule to follow) | REQ-fs-004 |
| LESSON-REQ-fs-004-2 | A rule that several guards must agree on lives in one function in `lib/`, where the check script can reach it | guards, session, lib, checks | guideline (a rule to follow) | REQ-fs-004 |
| LESSON-REQ-fs-004-3 | Give a call separate flags for "a 401 here is not a session end" and "send no token", and a time limit when its failure path is the only way out | api-client, auth, axios, session | trap (cost real time before) | REQ-fs-004 |
| LESSON-REQ-fs-004-4 | Check keyboard focus with a real Tab key, on every background it can sit on, and at the ends of a list | accessibility, focus, ui, checks | trap (cost real time before) | REQ-fs-004 |
| LESSON-REQ-fs-004-5 | Before any browser check, find out what listens on the API port; check against a mock with no proxy | browser-checks, proxy, database, safety | critical (must never repeat) | REQ-fs-004 |
| LESSON-REQ-fs-004-6 | A check that reads only tracked files, or only the output, can pass for the wrong reason: prove it finds something | checks, git, verification, build | guideline (a rule to follow) | REQ-fs-004 |
| LESSON-REQ-fs-004-7 | When a REQ deletes a module, close every mention of it in the same REQ | vault, legacy, cleanup, docs | guideline (a rule to follow) | REQ-fs-004 |
| LESSON-REQ-fs-005-1 | A "Save is off until something changed" button has three traps: the create case, focus, and Discard | forms, accessibility, focus, frontend | trap (cost real time before) | REQ-fs-005 |
| LESSON-REQ-fs-005-2 | State kept in a store atom outlives the page: clear it on close and never trust a matching key | state, jotai, frontend, stale-data | trap (cost real time before) | REQ-fs-005 |
| LESSON-REQ-fs-005-3 | Build a mailto: or other link from stored text only after checking and encoding it | security, links, frontend, input | guideline (a rule to follow) | REQ-fs-005 |
| LESSON-REQ-fs-005-4 | A layer check must encode every sentence of the layer rule, and a rule moved into lib/ brings its cases | layers, checks, lib, frontend | guideline (a rule to follow) | REQ-fs-005 |
| LESSON-REQ-fs-005-5 | Before the architecture says "no change needed" to a reused part, check it can carry everything the design asks | architecture, reuse, components, exploration | guideline (a rule to follow) | REQ-fs-005 |
| LESSON-REQ-fs-006-1 | A guard that refuses before any call must return its own result kind, never a borrowed HTTP status | store, errors, frontend, guards | guideline (a rule to follow) | REQ-fs-006 |
| LESSON-REQ-fs-006-2 | An async answer may only change the state it was sent from, and every branch of the answer has to check | state, async, focus, frontend, dialogs | trap (cost real time before) | REQ-fs-006 |
| LESSON-REQ-fs-006-3 | A list total that is patched locally and also reloaded needs a log of the local changes | store, paging, state, frontend | guideline (a rule to follow) | REQ-fs-006 |
| LESSON-REQ-fs-006-4 | When a fix moves or removes a rule, grep the docs and the header comments for the old wording in the same round | docs, review, process, comments | guideline (a rule to follow) | REQ-fs-006 |
| LESSON-REQ-fs-006-5 | Build a component so the dev page can show every state without copying it | dev-page, components, css, frontend | guideline (a rule to follow) | REQ-fs-006 |
