# Partial update: write only the fields that were sent

| Field | Value |
|---|---|
| Concept | partial-update-sent-fields |
| Status | built in REQ-fs-002 (2026-10-06) |
| Created | 2026-10-06 |

> **STATUS: needs verification** — built and reviewed by reading; not yet run against the database. Remove this banner after the owner's manual check.

## The rule

An update endpoint changes only the columns whose keys are present in the request body.

- A key that is absent keeps its value.
- A nullable field sent as `null` is cleared.
- A NOT NULL field (`email`, `password`) sent as `null`, empty or only spaces is a 400.
- A field of the wrong type is a 400 (text fields: string or `null`; `graduation_year`: integer or `null`).
- A body with no updatable field is a 400 `{ error: "No fields to update" }`.

Decided by the owner at the REQ-fs-002 spec and design gates.

## How it is built

1. **Controller:** `pickSent(req.body, ALLOWED)` (`backend/src/api/utils/requestHelpers.ts`) returns only the allowed keys that are own properties of the body and not `undefined`. Type checks run on that object. `req.body` never goes to a Manager.
2. **Query class:** `buildUpdateSet(data, COLUMNS)` (`backend/src/dal/query/updateSet.ts`) walks the class's own fixed column list and returns `column = $n` pieces plus the values to bind. The method adds `updated_at = NOW()`, the `WHERE` and `RETURNING`. Column names never come from the request.

Used by `PUT /api/users/:id`, `PUT /api/posts/:id`, `PUT /api/alumni/:id`.

## Adding an updatable column

Change three things together: the controller's key list, its type check, and the Query's column list ([[knowledge/gotchas#^g30|G30]]). The column must be in `db/schema.md` first. The next ones due are `alumni.mentorship_available` and `alumni.field` ([[architecture/adr-08-mentoring-and-field-stay-two-new-alumni-columns|ADR-08]]); `mentorship_available` is a boolean, so it needs a new type check.

## Related

- [[knowledge/gotchas#^g02|G02]], [[knowledge/gotchas#^g09|G09]], [[knowledge/gotchas#^g10|G10]] (the problems this fixed), [[knowledge/gotchas#^g31|G31]] (DTO types and `null`)
- [[knowledge/components/dal-query-classes]], [[knowledge/components/api-controllers-and-routes]]
- REQ-fs-002

## Backlinks

- REQ-fs-002
