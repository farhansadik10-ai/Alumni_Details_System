# ADR-12 — List endpoints answer `{ items, total, page, limit }` ^ADR-12

| Field | Value |
|---|---|
| Status | accepted |
| Decided | 2026-10-06 (accepted by the owner at the REQ-fs-003 design gate) |
| Author | Claude, for farhansadik10-ai (owner) |
| Supersedes | (none) |
| Superseded by | (none) |
| Based on | REQ-fs-003 (the owner's request of 2026-10-06 names the shape and "default 12, max 50"); `docs/design/README.md` (pagination with a total count) |

## Context

`GET /api/alumni`, `GET /api/users` and `GET /api/posts` return every row as a bare array. The approved screens page all three and show "Page 1 of 25", which needs a total. [[context/conventions]] has "Pagination: (not written down)".

The owner gave the shape and the limits for alumni and users in the REQ-fs-003 request. This ADR writes the rule down once so posts, and any later list, follow it.

## Considered options

### Option 1 — One shape and one set of rules for every paged list

`{ items, total, page, limit }`; `page` from 1, default 1; `limit` default 12, above 50 treated as 50; a bad number is 400; a page past the end is 200 with no items; every list has a fixed order.

**Pros:**
- The frontend needs one pagination component and one type.

**Cons:**
- Changes the answer of three existing endpoints from an array to an object.

### Option 2 — Keep arrays; send the total in a response header

**Pros:**
- Existing callers of the arrays keep working.

**Cons:**
- Nothing calls these three lists today, so there is nobody to protect; headers are easy to miss.

## Decision

**We chose Option 1.**

No screen reads these three lists yet, so the change costs nothing now and would cost a migration later. Cutting an oversized `limit` to 50 instead of refusing it keeps a careless caller working while still protecting the database.

## Consequences

| Consequence | Type |
|---|---|
| `GET /api/alumni`, `GET /api/users`, `GET /api/posts` answer an object, not an array | new work |
| Paging is parsed in one helper (`parsePaging`), not per controller | new work |
| Each list query runs a count and a page read | trade-off |
| A list that is small by nature stays a plain array: `GET /api/posts/:id/comments`, `GET /api/alumni/filters` | trade-off |
| `GET /api/comments` (every comment) is still a bare, unpaged array | follow-up |

## Open questions

- [ ] A `sort` parameter. Not needed by the approved screens.

## Related

- Concepts: (none)
- Components: [[knowledge/components/api-controllers-and-routes]], [[knowledge/components/dal-query-classes]]
- Gotchas: [[knowledge/gotchas#^g26|G26]]
- Lessons: (none)
- ADRs: [[architecture/adr-05-post-list-returns-author-name-and-photo|ADR-05]], [[architecture/adr-08-mentoring-and-field-stay-two-new-alumni-columns|ADR-08]]

## Update 2026-10-07 (REQ-fs-003)

Built for `GET /api/alumni`, `/api/users`, `/api/posts`; the pattern is written down in [[knowledge/concepts/paged-list-query]]. "A fixed order" does not mean one direction: [[knowledge/gotchas#^g39|G39]].
