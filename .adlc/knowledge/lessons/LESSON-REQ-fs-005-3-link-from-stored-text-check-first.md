# Build a mailto: or other link from stored text only after checking and encoding it ^L-REQ-fs-005-3

| Field | Value |
|---|---|
| ID | LESSON-REQ-fs-005-3 |
| Captured | 2026-10-08 |
| REQ | REQ-fs-005 |
| Component | `frontend/src/lib/mailtoLink.ts`, `AlumniProfilePage.tsx` |
| Tags | security, links, frontend, input |
| Severity | guideline (a rule to follow) |

## The lesson

If a link's address comes from text that a user stored, and the server does not validate that field, check it in a pure function before it becomes a link, encode it, and fall back to showing plain text when it fails. The sign-up route accepts any non-empty email string, so a `mailto:` built from it could carry `?cc=` or `&body=` into the visitor's mail draft. The same goes for a photo or LinkedIn link: accept only `http://` or `https://`.

## Saw it in

- `frontend/src/pages/AlumniProfilePage/AlumniProfilePage.tsx` — `mailto:${email}` from the raw email (review CORR-001); fixed with `mailtoHref` in `lib/mailtoLink.ts` (20 library-check cases).
- `frontend/src/lib/validation.ts` — `isWebLink` already guarded the avatar photo and the LinkedIn link.

## Related

- Originating REQ: REQ-fs-005
- See also: [[knowledge/gotchas#^g42|G42]], [[architecture/adr-04-profile-photo-is-a-url-field|ADR-04]]
