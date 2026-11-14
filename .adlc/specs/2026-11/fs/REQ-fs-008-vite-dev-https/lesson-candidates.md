# Lesson candidates: REQ-fs-008

## From correctness review
- Vite `preview` runs with `command === 'serve'` and `preview.https` defaults to `server.https`; to limit behaviour to the dev server use `isPreview` from the config env.
- A config guard of the form "file exists, then read" covers absent files only; unreadable or malformed files still crash startup.
- Check docs claims about what a tool "does not use" against the tool's source, not the author's intent.

## From the past-mistakes check

CAND-R01..R03 were written by the reflector but lost when the correctness reviewer wrote this file at the same moment. Its hand-back report names the content: preview inherits `server.https` (same as the first candidate above) and the function-form export (in G61).

## Candidate verdicts

Dedup basis: lessons and gotchas on this branch and on `origin/main` (01f75445, fetched 2026-11-14 21:17). No existing entry covers Vite preview or https.

| Candidate | Verdict | Why |
|---|---|---|
| Vite preview is `serve` and inherits `server.https`; use `isPreview` | demote-to-gotcha → G61 | A quirk of the tool in this config, not a habit |
| "exists, then read" guards a missing file only | discard | General knowledge; the case is finding m1 |
| Check a "does not use" claim against the tool's source | discard | Close to L-REQ-fs-006-4 (docs kept true to the code); the concrete fact is G61 |
| Function-form export and the mock-config recipe (REFL-002) | demote-to-gotcha → G61 | Same file, same entry |

## Round 2 — correctness
- Validate a TLS pair with `tls.createSecureContext({cert,key})` inside try/catch: it rejects non-PEM and mismatched keys before the server starts. Print a fixed message, never the error, so no key detail leaks. (Verdict suggestion: discard, narrow; covered by the config comment.)

## Round 2 — past-mistakes check
- Applied L-REQ-fs-006-4 to the fix: docs and the requirement were grepped for "preview" and "missing"; only the CLAUDE.md and patterns wording is incomplete (REFL2-3). The lesson held up; no new candidate.
- Candidate (discard): "state a cause only as firmly as the spec does" (REFL2-2); a one-off, already covered by the STATUS marker rule in .adlc/CLAUDE.md.
- Candidate (discard): "new gotcha entries need the `---` separator" (REFL2-1); template detail, not a lesson.
- Net: no new lessons; G61 already holds the reusable facts.

## Candidate verdicts — round 2

Same dedup basis as round 1 (this branch and `origin/main` 01f75445).

| Candidate | Verdict | Why |
|---|---|---|
| Check a TLS pair with `createSecureContext` in try/catch, print a fixed message | discard | Narrow; the comment in `vite.config.ts` says it |
| State a cause only as firmly as the spec does (REFL2-2) | discard | One-off; the STATUS marker rule already covers it; G61 reworded |
| New gotcha entries need the `---` separator (REFL2-1) | discard | Template detail; G61 corrected |

Net: one gotcha (G61), no lesson.
