# Partial update: write only the fields that were sent

| Field | Value |
|---|---|
| Concept | partial-update-sent-fields |
| Status | stub — written at the REQ-fs-002 design gate; `/wrapup` fills in what was learned |
| Created | 2026-10-06 |

> **STATUS: needs verification** — describes the design of REQ-fs-002, not yet built.

An update endpoint changes only the columns whose keys are present in the request body. A key that is absent keeps its value. A nullable field sent as `null` is cleared. A NOT NULL field sent as `null` or empty is a 400. A body with no updatable field is a 400. (Owner, REQ-fs-002 spec gate, 2026-10-06.)

How: the controller picks the allowed keys from the body; the Query class builds its `SET` list from its own fixed column list and binds the values. Column names never come from the request.

## Related

- [[knowledge/gotchas#^g02|G02]], [[knowledge/gotchas#^g09|G09]], [[knowledge/gotchas#^g10|G10]]
- [[knowledge/components/dal-query-classes]]
- REQ-fs-002

## Backlinks

_(populated by /wrapup or manually)_
