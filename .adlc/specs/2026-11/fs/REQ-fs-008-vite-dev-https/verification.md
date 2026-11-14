# Verification — REQ-fs-008-vite-dev-https (task, round 2)

Reviewed commits 84088f4a (the change) and fc3831d2 (the fix) on `feat/REQ-fs-008-vite-dev-https` (base `main`). Full reviewer text for both rounds: `review-log.md`.

## Findings at a glance

| ID | Severity | Finding (one line) | Where | Effort | Fix |
|----|----------|--------------------|-------|--------|-----|
| t3 | trivial | Two docs say "http when a file is missing"; a present but broken pair also gives http (the README has the full rule) | `CLAUDE.md` (Environment), `docs/frontend-patterns.md` (dev proxy line) | small | yes, at wrap-up |
| t4 | trivial | The bare `catch` does not say which problem occurred; the notice names both causes | `frontend/vite.config.ts` `devHttps` | — | no change |
| t1 | trivial | The notice can print again when Vite reloads the config | `frontend/vite.config.ts` | — | no change |

Resolved in round 2: M1 (preview inherited https; CR-1, REFL-001), m1 (unreadable or broken file; CR-2), t2 (README folder step; CR-4) — fixed in fc3831d2, confirmed by both reviewers. m2 (function-form export; REFL-002) — recorded in gotcha G61. REFL2-1 and REFL2-2 (shape and wording of G61) — corrected in the uncommitted vault draft.

Reviewed by: correctness · reflector (the past-mistakes check), two rounds each; round 2 ran one after the other. UI review: n/a — no UI surface (dev server config and docs only).

Note: the past-mistakes check's round 1 section of `review-log.md` and its candidates CAND-R01..R03 were overwritten by a write at the same moment. Its round 1 findings are known from its hand-back report (REFL-001, REFL-002) and it re-checked both in round 2.

## Open, by severity

### Trivial (3)

- t3 (REFL2-3): make the two sentences say "missing or not a working pair". Docs only.
- t4 (CR2-1): no change needed. If wanted later, print `error.code` only, never the message.
- t1 (CR-3): no change.

## Acceptance

- AC1 ✓ — both files: Vite prints `https://localhost:5173/`; `GET /` 200 through the Windows trust store (`curl.exe --ssl-no-revoke`), also on `[::1]` (round 1); a CA bundle without the mkcert root is refused. Repeated after the fix: https 200.
- AC2 ✓ — after the fix: key missing → http 200 and the info line; certificate not PEM → http 200 and the warn line; certificate path is a folder → http 200 and the warn line. `npm run build` and `npm run check:frontend` (565 cases) exit 0. A build prints no notice.
- AC3 ✓ — `git check-ignore -v` matches both files (`.gitignore:8`); `git ls-files frontend/.cert` is empty. The test moved the files inside `frontend/.cert/` and put them back; they are byte-identical to the originals.
- Preview (the M1 fix): `vite preview` with the pair → `http://localhost:4173/`, 200.
- `tsc -p frontend/tsconfig.node.json --noEmit` exits 0 (correctness reviewer); the build runs `tsc -b`.
- Not run: ESLint (`npx eslint` fails loading `frontend/eslint.config.js`, before any file is linted; the repo has no lint script).
- No `.env` file was read or written. No request went to `/api`.
