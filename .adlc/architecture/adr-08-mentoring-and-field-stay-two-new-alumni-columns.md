# ADR-08 — Mentoring and field stay in the design; `alumni` gets two new columns ^ADR-08

| Field | Value |
|---|---|
| Status | accepted |
| Decided | 2026-10-06 |
| Author | farhansadik10-ai (owner) |
| Supersedes | (none) |
| Superseded by | (none) |
| Based on | `docs/design/README.md` (approved by the owner on 2026-10-06), sections 1, 5, 6 and 8; the owner's answers of 2026-10-06 (final names, default, nullable, who runs the migration) |

## Context

The approved screens show two things the database cannot store today:

- **Mentoring**: an "Open to mentoring" tag, a checkbox on My profile, and a directory filter.
- **Field**: a tag on alumni cards and profiles, and a directory filter.

The `alumni` table in `db/schema.md` has no column for either. Two standing rules apply: "Screens show only fields that exist in `db/schema.md`" and "No schema change without the owner's approval" ([[context/conventions]]).

The question was whether to drop mentoring and field from the design or to add the columns.

## Considered options

### Option 1 — Keep both; add two columns to `alumni`

`mentorship_available` (boolean) and `field` (text).

**Pros:**
- The directory can be filtered by what people look for: a field, and someone willing to mentor.
- The screens stay as approved.

**Cons:**
- The first schema change of the redesign. It needs a migration, which only the owner runs.
- Backend work in every layer: Query, DTO, shared types, and the alumni search.

### Option 2 — Drop mentoring and field

**Pros:**
- No schema change. The existing rule holds with no extra step.

**Cons:**
- The directory loses two of its four filters.
- The screens would need to be redrawn.

## Decision

**We chose Option 1.**

Mentoring and field stay. The owner approves adding two columns to `alumni`:

| Column | Type | Rule |
|---|---|---|
| `mentorship_available` | boolean | default `false` |
| `field` | text | nullable |

The column names are final (confirmed by the owner, 2026-10-06).

The rule "screens show only fields that exist in `db/schema.md`" still holds. It is met by adding the columns first: the columns go into the database and into `db/schema.md` before any screen shows them. The owner runs the migration himself, in a later REQ.

This does not change [[architecture/adr-06-deleting-rows-that-other-rows-reference|ADR-06]], which rules out a migration for deletes only.

## Consequences

| Consequence | Type |
|---|---|
| A migration adds the two columns, in a later REQ. The owner runs it; Claude does not change the database | new work |
| `db/schema.md` is refreshed from the real database after the migration, and the schema summary in [[context/architecture]] is updated | new work |
| `AlumniQuery`, `AlumniDTO` and the `@alumni/shared` alumni types gain the two fields | new work |
| Alumni search gains filters for field and mentoring, beside department and graduation year | new work |
| My profile gains a mentoring checkbox and a field input; the directory and profile show the tags | new work |
| Until the columns exist, the mentoring and field parts of the screens cannot be built | follow-up |
| Existing alumni rows start with mentoring `false` and no field until their owners fill them in | trade-off |

## Open questions

- [ ] Where does the directory's field filter get its choices from? `field` is a free text column.
- [ ] A length limit for `field` in the form.

## Related

- Concepts: [[knowledge/concepts/user-join-read-shape]]
- Components: [[knowledge/components/dal-query-classes]]
- Gotchas: (none)
- Lessons: (none)
- ADRs: [[architecture/adr-03-one-alumni-profile-per-user-created-by-that-user|ADR-03]], [[architecture/adr-06-deleting-rows-that-other-rows-reference|ADR-06]], [[architecture/adr-07-design-direction-oak-ink-band|ADR-07]]
- Context: [[context/design-system]]
