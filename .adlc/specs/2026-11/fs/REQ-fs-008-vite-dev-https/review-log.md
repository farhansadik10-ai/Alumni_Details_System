# Review log: REQ-fs-008

## Correctness review

Summary: the change does what AC1-AC3 ask for dev. One real defect: Vite's `vite preview` also runs with `command === 'serve'` and inherits `server.https`, so with the files present preview serves https and with them missing it prints the "dev server" notice; the docs say the opposite. Two minor robustness gaps (unreadable or malformed file). The key is correctly ignored and untracked. Types, paths and the proxy are fine.

### CR-1 (major): `vite preview` reads the files and goes https; docs say it does not
| Field | Value |
|---|---|
| File | frontend/vite.config.ts:79-80; frontend/README.md (last line of "https in development") |
| Evidence | Vite 5.4 `resolvePreviewOptions`: `https: preview?.https ?? server.https` (node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js:66213). Preview resolves config with `command: 'serve'`. |

With both files present, `vite preview` serves the built app over https (the README says "A build and `vite preview` do not use the files", and the REQ says preview stays as it is). With either file missing, preview prints "Dev server: https is off", which is wrong there. Not verified by running preview (not needed; source is clear).
Fix: pass `isPreview` in the config env (`({ command, isPreview })`) and use `command === 'serve' && !isPreview` for both the read and the notice; or, if https in preview is wanted, change the README sentence and the notice wording.

### CR-2 (minor): an unreadable or malformed file breaks startup with an unclear error
| Field | Value |
|---|---|
| File | frontend/vite.config.ts:72-73 |

`existsSync` true plus `readFileSync` failing (EACCES, or a directory named like the file gives EISDIR) throws while loading the config. A present but malformed PEM fails later at server start with a raw OpenSSL error. The "fresh clone still starts" promise holds only for absent files.
Fix: wrap the read in try/catch and fall back to http with a notice naming the file; or leave it and add one README line ("if the server fails with a TLS error, regenerate the pair").

### CR-3 (trivial): notice printed on every config load in serve
| Field | Value |
|---|---|
| File | frontend/vite.config.ts:83-87 |

Vite re-runs the config when `vite.config.ts` changes (dev restart), so the line may print again; harmless. No change needed beyond CR-1.

### Checked and found fine
- Paths: `fileURLToPath(new URL(..., import.meta.url))` is correct on Windows and in Vite's bundled config (Vite replaces `import.meta.url` with the original file URL). Orchestrator run confirms.
- Types: `{ cert: Buffer; key: Buffer } | undefined` fits `https?: boolean | https.ServerOptions` in Vite 5.4; `exactOptionalPropertyTypes` is off in tsconfig.node.json. `https: undefined` behaves like omitting the key (`preview?.https ?? server.https`, and Vite's `resolveHttpsConfig(undefined)` returns undefined).
- Proxy: target stays `http://localhost:3000`; with `changeOrigin: true` no TLS to the backend is involved. HMR websocket follows the server scheme (wss) automatically; the cert covers localhost, 127.0.0.1, ::1 per the README command.
- Git: `git check-ignore -v frontend/.cert/localhost-key.pem` matches `.gitignore:8`; `git ls-files frontend/.cert` is empty.
- Nothing else assumes an http dev origin: scripts/api-check.mjs and scripts/start.sh use port 3000 only. Docs (CLAUDE.md, patterns, project-overview) match the code, apart from the preview sentence in CR-1. The mkcert command is valid mkcert syntax (`-cert-file`, `-key-file`, names); `mkcert` creates the target folder? It does not always: if `frontend/.cert/` does not exist, mkcert errors. Minor doc gap: add `mkdir frontend/.cert` before the command (CR-4, trivial).

### CR-4 (trivial): README mkcert command assumes the folder exists
| Field | Value |
|---|---|
| File | frontend/README.md (mkcert command block) |

On a fresh clone `frontend/.cert/` is not in git, so the command may fail with "no such file or directory".
Fix: add `mkdir frontend/.cert` (or `mkdir -p`) as the line before.

## Lesson candidates (correctness review)
- Vite `preview` runs with `command === 'serve'` and `preview.https` defaults to `server.https`; to limit behaviour to the dev server use `isPreview` from the config env.
- A config guard of the form "file exists, then read" covers absent files only; unreadable or malformed files still crash startup.
- Docs claims about what a tool "does not use" should be checked against the tool's source, not the author's intent.

## Round 2 — correctness review

Summary: CR-1, CR-2 and CR-4 are resolved. `isPreview` is declared on `ConfigEnv` in Vite 5.4.21 and `tsc -p frontend/tsconfig.node.json --noEmit` exits 0. The catch prints a fixed string only, so no key material can reach the console. One trivial new finding (CR2-1). No critical or major issues.

- CR-1 (major): RESOLVED. `https` is computed only for `command === 'serve' && !isPreview`; preview and build get `undefined`, and the notice lives inside `devHttps()`, so neither prints it. The orchestrator's preview run (http 200) agrees.
- CR-2 (minor): RESOLVED. A non-PEM file, a folder path (readFileSync throws) and a mismatched key (createSecureContext throws) all give one warn line and http. `createSecureContext({cert,key})` takes the same Buffer pair that Vite passes to `https.createServer`, so it rejects nothing Vite would accept.
- CR-4 (trivial): RESOLVED. README has `mkdir frontend/.cert` and the preview and fallback sentences match the code.

### CR2-1 (trivial): the warn line hides the reason
| Field | Value |
|---|---|
| File | frontend/vite.config.ts:87-91 |

A bare `catch {}` merges "unreadable" (permissions, folder) with "mismatched/not PEM", and an encrypted key also lands here. The message names both causes, so a developer can still act on it; this is a choice, not a defect.
Fix (optional): none needed. If wanted, print `error.code` only (never `error.message`, which can echo OpenSSL detail).

Checked and not a problem: a passphrase-protected key is rejected with the warn line (mkcert never makes one); the cert is not checked for the `localhost` name, which is out of scope; the config is evaluated again on a config-file restart, which just re-prints one line.

## Round 2 — reflector

Summary: REFL-001 and REFL-002 are resolved. The code, README, CLAUDE.md, patterns doc and requirement.md all say true things about preview (http) and the broken-pair fallback. Two small vault tidy-ups and one wording gap remain; nothing blocks merge.

| Item | Status |
|---|---|
| REFL-001 (preview inherits server.https) | Resolved. `command === 'serve' && !isPreview` in vite.config.ts; README says preview stays on http; the non-goal in requirement.md is true again; G61 point 2 matches the code. |
| REFL-002 (function-form export) | Resolved as a vault note: G61 point 3. |

Restated round 1 candidates: preview inherits server.https (now G61); function-form export (G61); docs claim checked against tool source (close to L-REQ-fs-006-4, discarded).

### REFL2-1
| Field | Value |
|---|---|
| Severity | trivial |
| Cites | gotcha shape (G60 and earlier entries are separated by `---`) |
| File | .adlc/knowledge/gotchas.md:1535-1536 |

G61 follows G60 with no `---` rule line between them; every neighbour has one. Fix: add a blank line, `---`, blank line before `## G61`.

### REFL2-2
| Field | Value |
|---|---|
| Severity | trivial |
| Cites | requirement.md STATUS marker rule (.adlc/CLAUDE.md "needs verification") |
| File | .adlc/knowledge/gotchas.md:1546 (G61 "What" point 1) |

G61 states as fact that the earlier https "was on one machine only". requirement.md line 23 marks the cause `STATUS: needs verification` (could have been an uncommitted edit, or Apache on 443). Fix: say "Nothing in git recorded an https setup before REQ-fs-008" and drop the cause.

### REFL2-3
| Field | Value |
|---|---|
| Severity | trivial |
| Cites | LESSON-REQ-fs-006-4 |
| File | CLAUDE.md:27; docs/frontend-patterns.md:269 |

Both say https is on when the two files exist / http when either is missing. After the fix a present-but-broken pair also gives http. Not false, but incomplete; README has the full rule. Fix: in CLAUDE.md add "or cannot be read as a matching pair". Optional.

### Checked and fine
- G61 links resolve (L-REQ-fs-004-5 file exists); Vite version in node_modules is 5.4.21, matching "Vite 5.4". Comment style in vite.config.ts follows conventions (why, cites G61). No ADR touches this.
- requirement.md Approach (one console.info in dev, none in build) still holds; its header is still "drafting / plan" and its AC2 says "one line", true for both cases. Header status is the pipeline's to update at wrap-up.
- Not stale: .adlc/knowledge/components/frontend-app.md and .adlc/context/architecture.md say nothing about the dev server scheme (architecture.md "Apache (HTTPS)" is production). project-overview.md line 57 is correct.
- hot.md entry still says "review round 1" and Status in index.md is "in review"; update at wrap-up to name round 2 and the fix.
