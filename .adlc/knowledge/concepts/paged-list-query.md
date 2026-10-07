# Paged list query: one WHERE, a count and a page

| Field | Value |
|---|---|
| Concept | paged-list-query |
| Status | built in REQ-fs-003 (2026-10-07) |
| Created | 2026-10-07 |
| Decided by | [[architecture/adr-12-list-endpoints-answer-items-total-page-limit\|ADR-12]] |

Run against the real database by the owner on 2026-10-07.

## The rule

Every paged list answers `{ items, total, page, limit }`. `page` starts at 1 and defaults to 1; `limit` defaults to 12; above 50 it is treated as 50; a bad number is 400. A page past the end is 200 with no items and the right `total`. Every list has a fixed `ORDER BY`.

## How it is built

1. **Controller.** `parsePaging(req.query)` gives `{ page, limit, offset }`. Text filters come from `queryText` (trimmed; empty means not sent; a key sent twice is 400). Filters whose choices come from the database (`department`, `field`) use `queryFilterValue`, which strips outer spaces only, so the value `/filters` returned matches when sent back. A filter that was not sent is left out of the filter object, not set to `undefined` by hand.
2. **Query class.** Build `conditions` and `values` together: push the value first and use `values.length` as its `$n`. A filter with no value (a flag such as mentoring) pushes nothing. Then run two statements that share the same `WHERE` and `values`:
   - `SELECT COUNT(*)::int AS total FROM ... <where>`
   - `<read constant> <where> ORDER BY ... LIMIT $n OFFSET $n`, with `LIMIT` and `OFFSET` as `values.length + 1` and `+ 2`.
3. **Answer.** `{ items: rows, total, page, limit }`, with `limit` the value actually used.

## Traps

- **Cast every `COUNT(*)` to `::int`.** `pg` returns a bigint as a string; without the cast `total` reaches the client as `"12"` and TypeScript does not notice.
- **Search uses `likePattern` and plain `ILIKE $n`**, no `ESCAPE` clause.
- **Trim the same way on both sides.** SQL `btrim` strips spaces only; JavaScript `trim()` strips every kind of white space. A filter compared against `btrim(column)` must be stripped of spaces only.
- **Cap a number from the request at the column's range** (2147483647 for a PostgreSQL `integer`) before it reaches a query; "digits only" still lets through a value the database refuses.
- **The count and the page are two statements, not one snapshot.** A row added between them can make `total` one off for that request. Accepted.

## Where it is used

- `UserQuery.listUsers` — `q` on name or email, `role`; ordered by `id`.
- `AlumniQuery.listAlumni` — `q` on name, company, job title; `department`, `field`, `graduation_year`, mentoring; newest first.
- `PostQuery.listPosts` — no filter; newest first.

The three methods each write the pattern out; there is no shared builder (review finding m10, accepted). `GET /api/comments` is not paged.

## Related

- [[knowledge/gotchas#^g39|G39]] (order and filter rules differ per endpoint)
- [[knowledge/components/dal-query-classes]], [[knowledge/components/api-controllers-and-routes]]
- REQ-fs-003

## Backlinks

- REQ-fs-003
