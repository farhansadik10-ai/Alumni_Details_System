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
