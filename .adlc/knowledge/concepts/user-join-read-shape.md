# Joining "User" in a read: named columns, never password

| Field | Value |
|---|---|
| Concept | The read shape for any query that needs the person behind a row |
| Status | in use for alumni (REQ-fs-001), posts and comments (REQ-fs-003) |
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
- A write (`INSERT` / `UPDATE … RETURNING`) cannot join. Since REQ-fs-003 each write returns `id` and then reads the row back through the same joined constant, so writes and reads answer one shape ([[knowledge/lessons/LESSON-REQ-fs-003-3]]).

## Where it is used

- `backend/src/dal/query/AlumniQuery.ts` — `getAllAlumni`, `findAlumniById`, `findAlumniByEmail` (REQ-fs-001). The text is written out in each method.

## Not yet applied

- Nothing: posts and comments use it since REQ-fs-003.

## Open

- Settled in REQ-fs-003: posts and comments use `name` and `photo_url`, the same names as alumni. Still open: whether every logged-in user should see an alumni's `email` ([[knowledge/gotchas#^g42|G42]]).

## Related

- ADRs: [[architecture/adr-05-post-list-returns-author-name-and-photo|ADR-05]]
- Gotchas: [[knowledge/gotchas#^g05|G05]], [[knowledge/gotchas#^g17|G17]], [[knowledge/gotchas#^g25|G25]]
- Components: [[knowledge/components/dal-query-classes]]
- REQ: REQ-fs-001

## Backlinks

- [[knowledge/gotchas]] (G05, G25)

## Update 2026-10-07 (REQ-fs-003)

The join text now lives in one constant per class: `ALUMNI_READ` (`a.*` plus `name`, `email`, `photo_url`), `POST_READ` (named post columns, `name`, `photo_url`, and `comment_count` as a counting sub-query; the stored column is left out on purpose), `COMMENT_READ` (`c.*` plus `name`, `photo_url`). Every read and every write of the resource uses it.
