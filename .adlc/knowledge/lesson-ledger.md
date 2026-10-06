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
