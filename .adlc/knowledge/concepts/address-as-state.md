# The address is the state: search, filters and page live in the URL

| Field | Value |
|---|---|
| Concept | address-as-state |
| Status | built in REQ-fs-005 (2026-10-08); browser-checked on a mock API |
| Created | 2026-10-08 |
| Decided by | no ADR; pattern 24 in `docs/frontend-patterns.md` |

## The rule

The directory's search text, filters, mentoring switch and page number are kept in the address (\`?q=&department=&graduation_year=&field=&mentoring=true&page=\`), so a link can be shared and Back steps through earlier states. The page reads the address, never a copy of it in state.

## How it is built

1. **Pure reader and writer.** \`readDirectoryQuery\` and \`writeDirectoryQuery\` in \`frontend/src/lib/directoryQuery.ts\`, with library-check cases: bad values fall back to defaults, defaults and page 1 are left out, the same query gives the same text. A key sent twice counts as absent; \`department\` and \`field\` are stripped of spaces only ([[knowledge/gotchas#^g51|G51]]).
2. **The page writes through one function** (\`writeControl\`): a filter change resets the page to 1; a waiting search text goes out with the next change; typing replaces the history entry and the other controls push one (review item m10 asks whether Enter should push).
3. **Debounce.** The search box has its own text and a 300 ms timer; "the last committed value" is kept in a ref, not state, because the address is written through the router and a state copy could render before the new location.
4. **Focus.** After the user changes page, focus goes to the count line (a live region that is always in the page) from the page's own effect, which runs after \`Pagination\`'s effect.
5. **Phone filters** need no script: the button is drawn only under the phone query, and the closed panel is \`display: none\`. In the DOM the panel comes after the controls it sits with, so Tab order equals screen order on both layouts.
6. **Back from a profile** returns to the same filters through router state set by the card link (\`lib/directoryReturn.ts\`, read defensively because router state survives a reload).

## Related

- Concepts: [[knowledge/concepts/latest-request-wins]], [[knowledge/concepts/paged-list-query]]
- Lessons: [[knowledge/lessons/LESSON-REQ-fs-004-1-router-state-survives-a-reload|L-REQ-fs-004-1]]
- Gotchas: [[knowledge/gotchas#^g51|G51]]
- Components: [[knowledge/components/frontend-app]]
