# Follow-up issue A — Preview harness: stale pooled HTTP connection to the Firebase Auth emulator

**Source:** CI-CONT-007H/007I/007L (see the [canonical CI-CONT report](11THONUS-CI-CONT-001-temporary-ci-continuity-assessment-2026-10-15.md)). **Owners:** preview-tooling owners of PR #312 / PR #307 (`tests/preview`). **Status:** open; **not fixed**; a CI-only mitigation exists. **This document proposes no fix and implements none.**

## Observed failure
Hosted pipeline #6 (job `044e5ee7-8206-45f5-add0-ad41e511ac90`, tested code `73575800…`): the cross-project acceptance step failed with `UND_ERR_SOCKET` on the first `accounts:signUp` request to the Auth emulator. Local reproduction in the real `cimg/node:20.19` image against the real Auth emulator (firebase-tools 15.24.0): original request failed 3 of 3; the same request with `Connection: close` succeeded at 8 s and 20 s of idle time.

## Mechanism (confirmed by reproduction; one narrow claim is an inference, marked)
1. The Auth emulator advertises `Keep-Alive: timeout=5` and closes idle connections after about 5 s.
2. The preview CLI (`tests/preview/cli.mjs`) runs its reference-data seed scripts with `spawnSync` (e.g. line 132, `node tests/e2e/emulator/<script>`), which **blocks the Node event loop** of the parent for the whole child run.
3. The global `fetch` (undici) pool keeps a keep-alive socket opened by an earlier readiness probe (`tests/preview/lib/emulatorClient.mjs:95`). While the event loop is blocked the client cannot observe the server-side close, so the next request (`accounts:signUp`, `emulatorClient.mjs:33`) is written to a dead socket.
4. Gap observed: ≈ 2.6 s on GitHub-hosted-class machines (below 5 s) versus ≥ 6.6 s on the CPU-capped CircleCI executor (above 5 s). *Inference:* a slow GitHub runner or a heavily loaded developer machine can cross the same threshold, so this is latent, not CircleCI-specific.

## Interfaces needing review
- `tests/preview/cli.mjs` (`spawnSync` use, seed orchestration order, probe-then-seed sequence).
- `tests/preview/lib/emulatorClient.mjs` (every `fetch` to `urls.auth`: `signUp`, `signInWithPassword`, account list/delete, `sendOobCode`, `oobCodes`, `accounts:update`; the readiness probes).
- `tests/preview/lib/runtime.mjs`, `lib/postgres.mjs`, `lib/processes.mjs` (other synchronous child-process use).
- `tests/preview/cross-project-acceptance.mjs` (sequence `start → status → verify → reset → verify → e2e`; each step is a separate `pnpm` process, so the stale-socket window is per process).

## Permanent options to compare (no option is selected here)
| | A1 — asynchronous seed execution (`spawn`/promisified child process instead of `spawnSync`) | A2 — explicitly managed non-pooled emulator requests (per-request `Connection: close`, or a dedicated undici dispatcher with a keep-alive timeout below the emulator's 5 s / pipelining off) |
|---|---|---|
| Addresses the root cause | Removes the loop blocking, so the client sees socket closes and replaces dead sockets; staleness windows remain possible but are detected. | Removes reuse of idle sockets to this server; independent of blocking. |
| Scope of change | Seed orchestration (sync→async ripple through `cli.mjs` call chain). | One client module plus any other direct `fetch` to the emulator. |
| Risks / unknowns | Behavioural change in ordering, output interleaving and error propagation; needs the owners' tests. | Slight per-request overhead; must cover every call site (including probes) or the pool returns; scoped to Auth only vs all emulator ports is a design choice. |
| Evidence needed | Repro with the original request after an async seed of ≥ 7 s. | Repro with the idle gap raised to 20 s+. |
They are not mutually exclusive. The owners should decide, and add a regression test that forces an idle gap longer than the emulator timeout.

## Current temporary mitigation (not the repair)
`.circleci/config.yml` at `49c08c2…` (acceptance step only): a `NODE_OPTIONS` preload wrapping `globalThis.fetch` adds `Connection: close` **only** for `http://127.0.0.1:<emulators.auth.port from firebase.json>` and only when the caller set no Connection header; deleted on exit and asserted absent before `pnpm emulators:validate`. GitHub Actions does not use it. It must not be treated as the permanent repair, and it should be removed once the harness is fixed.

## Acceptance criteria for closing this issue
The acceptance sequence passes on a CPU-capped (4-CPU) executor with the preload removed; a test proves a request issued after an idle gap > 5 s succeeds; no behavioural change to emulator semantics or test expectations.
