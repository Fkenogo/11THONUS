# EA-002-CORR-001 — Founder Preview Emulator UI Port Collision — Implementation Report

**Date:** 2026-10-02 · **Entry `origin/main`:** `ae4f05f` · **Branch:** `claude/sleepy-babbage-6kxfof` · **Status:** implemented, pending Founder review. Not merged. Nothing deployed.

## 1. Root cause (confirmed from code)

- `firebase.json` set `emulators.ui.port` to **4000** (Firebase's default). `pnpm preview:start` launches `firebase emulators:start --project demo-11thonus --only auth,functions,firestore,ui` (`tests/preview/lib/runtime.mjs`), which reads that file.
- `tests/preview/lib/config.mjs` mirrored it (`emulatorUi: 4000`) for the summary URL.
- An explicitly configured emulator port is not auto-relocated by the Firebase CLI; if it is taken the CLI aborts ("Could not start Emulator UI, port taken"). Nothing in the tooling checked ports before launch.
- Node 20 vs 22 is unrelated and untouched.

## 2. Fix strategy and why

| Option | Verdict |
| --- | --- |
| **`firebase.json` + `config.mjs` (chosen)** | Already the declared architecture ("emulator ports are the repository's own"). One-value change, deterministic, benefits CI and the other emulator commands (the UI is not used by any test). A new drift test fails if the two files disagree. |
| Preview-generated config (`--config`) | Rejected: the CLI resolves rules/functions paths relative to the config file's directory, so a generated file would have to be at the repo root or duplicate every path. More moving parts, no benefit. |
| CLI argument | Not available: the Firebase CLI has no UI-port flag. |

Plus two safety additions so a clash is explicit rather than silent:
- **Port preflight** (`tests/preview/lib/ports.mjs`): before spawning, tries to *bind* 9099/5001/8080/4001 on IPv4 and IPv6 loopback and releases at once. Never connects to, signals or inspects the owner. A taken port throws `PortConflictError` naming each port and its purpose. It is skipped when our own emulators are already running (the existing "already running" error applies).
- **Readiness** (`emulatorUiReady`): the Emulator UI answers `/api/config` with `projectId === "demo-11thonus"`. Start now also requires our spawned emulators to still be alive, so a foreign responder can never count as ready if the CLI exited.

## 3. Port configuration

| Service | Before | After |
| --- | --- | --- |
| Emulator UI | 4000 | **4001** |
| Auth / Functions / Firestore | 9099 / 5001 / 8080 | unchanged |
| Web / PostgreSQL | 5173 / 54329 | unchanged |
| Storage / Hosting (in `firebase.json`, not started by the preview) | 9199 / 5050 | unchanged |

## 4. Files modified

`firebase.json` (1 line) · `package.json` (test script) · `tests/preview/lib/config.mjs` · `tests/preview/lib/runtime.mjs` · `tests/preview/lib/emulatorClient.mjs` · **new** `tests/preview/lib/ports.mjs` · **new** `tests/preview/ports.test.mjs` · `docs/runbooks/founder-preview-runbook.md` · `docs/changes/IMPLEMENTATION_CHANGES.md` · `docs/00-governance/documentation-changes-log.md` · this report.
No change to `apps/web/src`, `functions/src`, guards (`guards.mjs`), Product Truth, Commercial behaviour or the admission gate.

## 5. Tests added (`tests/preview/ports.test.mjs`, 15 new; suite now 39)

- Config: UI port is 4001, none of the launch ports is 4000; `config.mjs` and `firebase.json` agree on Auth/Functions/Firestore/UI.
- A real listener on **4000** is irrelevant: preflight does not probe or report 4000, and the listener is still listening and serving afterwards.
- Preflight passes when all ports are free.
- A real listener on the preview's own UI port → explicit `PortConflictError` naming the port, listener untouched.
- Multiple conflicts are all listed.
- `ports.mjs` contains no kill/signal/`lsof`/`child_process` code.
- Readiness: demo-project UI → ready; other project's UI, an unrelated web server, an HTTP 500, nothing listening → not ready.

## 6. Commands and results

| Command | Result |
| --- | --- |
| `pnpm test:preview-tooling` | 39/39 pass (24 existing guard tests unchanged) |
| `pnpm lint` | 0 errors (1 pre-existing warning in `apps/web`) |
| `pnpm format:check` | clean |
| **Runtime, with an unrelated listener on :4000** — `pnpm preview:start` | succeeded: Postgres, build, 27 migrations current, emulators (UI on 4001), seed, web app |
| `pnpm preview:status`; `preview:verify`; `preview:reset`; `preview:verify` | all OK; fingerprint matches both times |
| Browser journeys (`chromium-preview` + `chromium-preview-mobile`) | 18/18 pass |
| `pnpm preview:stop`, then listener on :4001, `pnpm preview:start` | refused: "4001 (needed by the Firebase Emulator UI)… does not stop or modify processes it did not start"; exit 1; no emulator left running |

**Environment deviations (honest disclosure):** the coding sandbox has no Docker daemon, so PostgreSQL 16 was a local cluster on 54329 used through the existing `PREVIEW_POSTGRES_URL` path (so `docker compose` startup was **not** exercised here — the Founder already confirmed it works); the sandbox proxy required the existing `PREVIEW_STRIP_PROXY=1`; Playwright's expected Chromium build was missing, so the journeys ran with a temporary, deleted config pointing at the pre-installed Chromium. The "other project" on 4000/4001 was a stand-in Python TCP listener, not Tiizi. Full unit/PostgreSQL/emulator product suites were not re-run: the change touches no product code, and the only shared-config change is the UI port. CI's existing preview job will exercise the full sequence.

## 7. Safety-guard verification

`guards.mjs` is byte-identical; its 24 tests pass. Environment, project ID, credential, emulator-host, database and admission-gate checks are unchanged and still run first (`pinTarget`). Preview still uses `demo-11thonus` and local emulators only. The preflight reads no credentials and binds loopback only.

## 8. Unrelated port-4000 process

Not terminated or modified. In the runtime run the stand-in on 4000 was the same PID (1516) before and after, still answering. The real Tiizi process was never present or accessed.

## 9. Dependencies / config

No dependencies. Config: `firebase.json` UI port 4000 → 4001. No migration.

## 10. Risks

- Anyone with a bookmark/habit for `http://localhost:4000` in 11thONUS now needs 4001 (it is local debugging only).
- Another project may use 4001: start now fails clearly; choose a different port by editing the single value in both files (the drift test keeps them aligned).
- The Firebase Hub (4400) and Logging (4500) emulators are not explicitly pinned; in this CLI version they auto-select a free port if taken, so they cannot cause this failure. Not changed.
- The preflight is a point-in-time check; a process that grabs a port between preflight and launch still makes the CLI fail (and the alive-check prevents a false "ready").
- The UI-identity check relies on `/api/config` returning `projectId` (verified against the bundled UI v1.15.0).

## 11. Rollback

`git revert <correction commit>` (restores 4000 and removes the preflight and tests). No data or runtime state to clean up.

## 12. Commit / PR

Commit SHA and PR are recorded in the hand-off message (a commit cannot contain its own SHA). Not merged; awaiting Founder approval.
