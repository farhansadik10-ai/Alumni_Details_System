# Joining "User" in a read: named columns, never password

| Field | Value |
|---|---|
| Concept | The read shape for any query that needs the person behind a row |
| Status | in use (alumni reads, since REQ-fs-001) |
| First captured | 2026-10-05 |
| Decided by | Owner — ADR-05 (posts), and the REQ-fs-001 request (alumni) |

## The rule

When a read needs the user who owns a row, join `"User"` in the Query class and name the user columns one by one. Never `SELECT *` across the join and never `u.*`: `"User"` holds `password`, and no endpoint may return it.

```sql
SELECT a.*, u.name, u.email, u.photo_url
FROM alumni a
LEFT JOIN "User" u ON u.id = a.user_id
```

- `a.*` is safe: it is the base table only, so `id` and `updated_at` stay the base row's and do not clash with the user's.
- `"User"` is always double-quoted.
- `LEFT JOIN` keeps base rows that have no user; their user fields come back as `null`.
- A write (`INSERT` / `UPDATE … RETURNING *`) cannot join, so it returns the base columns only. Callers re-read ([[knowledge/gotchas#^g25|G25]]).

## Where it is used

- `backend/src/dal/query/AlumniQuery.ts` — `getAllAlumni`, `findAlumniById`, `findAlumniByEmail` (REQ-fs-001). The text is written out in each method.

## Not yet applied

- `PostQuery.getAllPosts` — decided in ADR-05, not built.
- Comments — not decided (ADR-05, open question).

## Open

- Field names. Alumni uses `name`, `email`, `photo_url`. ADR-05 left the author field names for posts open. `STATUS: needs verification` — the owner has not said whether posts must use the same names.

## Related

- ADRs: [[architecture/adr-05-post-list-returns-author-name-and-photo|ADR-05]]
- Gotchas: [[knowledge/gotchas#^g05|G05]], [[knowledge/gotchas#^g17|G17]], [[knowledge/gotchas#^g25|G25]]
- Components: [[knowledge/components/dal-query-classes]]
- REQ: REQ-fs-001

## Backlinks

- [[knowledge/gotchas]] (G05, G25)
