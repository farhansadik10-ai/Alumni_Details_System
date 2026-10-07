# When the code cannot be run here, run its pure expressions alone ^L-REQ-fs-003-2

| Field | Value |
|---|---|
| ID | LESSON-REQ-fs-003-2 |
| Captured | 2026-10-07 |
| REQ | REQ-fs-003 |
| Component | `backend/src/dal/query/listHelpers.ts`, `backend/src/api/utils/requestHelpers.ts`, `scripts/` |
| Tags | dal, api, escaping, testing, regex |
| Severity | trap (cost real time before) |
| Supersedes | — |

## The lesson

"Checked by reading" is not a check for a regex, an escape or a parser. When the database or the server may not be touched, copy the one pure expression into a scratch file and run it in Node with real inputs; and check a script you must not run with `node --check` plus `tsc --allowJs --checkJs --noEmit`. A lost backslash, a wrong character class or a misspelled helper name all compile.

## Saw it in

- `backend/src/dal/query/listHelpers.ts:24` (`likePattern`) — saved as `/[\%_]/g` with `"\$&"`: one backslash where two were meant, so it escaped nothing and `q=%` matched every row. `tsc` passed and the task note said "checked by reading". Three later tasks found it independently; fixed before the first commit.
- `backend/src/api/utils/requestHelpers.ts` (`parseId`, `parsePaging`) — proven by running a copy of the logic, because importing the file loads the DAL and connects to the database ([[knowledge/gotchas#^g40|G40]]).
- The same quoting trap bit the checker: a `node -e` one-liner in Git Bash lost its backslashes too. Use a file, not a command-line string.
