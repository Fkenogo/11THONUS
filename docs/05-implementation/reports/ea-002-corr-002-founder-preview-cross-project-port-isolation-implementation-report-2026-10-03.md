# EA-002-CORR-002 — Founder Preview Cross-Project Port Isolation

**Date:** 2026-10-03  
**Status:** Implemented; PR #297 open and unmerged.  
**Base:** `main` at `014554a81642336d2b2a7a5c28acff9999618f69`.  
**Implementation commit:** `0496be735e18ca6be746345887f5507c2f962260`.  
**PR:** [#297 — EA-002-CORR-002 — Founder Preview Cross-Project Port Isolation](https://github.com/Fkenogo/11THONUS/pull/297).

## 1. Root cause

EA-002-CORR-001 moved only the Emulator UI to 4001. Auth, Functions and Firestore still used Firebase's common ports 9099, 5001 and 8080; Hub and logging used their defaults 4400 and 4500. The web client also hard-coded its Auth, Functions, Firestore and Storage emulator endpoints. Vite and the Founder Preview database used 5173 and 54329. When another project occupied several of these ports, EA-002 correctly protected it but could not start the Founder Preview.

## 2. Fix strategy

Reserve one deterministic 11thONUS block below the usual dynamic/ephemeral range and assign every local preview service within it. Keep the Firebase Emulator Suite's single-project configuration and the existing guarded local runtime. Pass Firebase SDK emulator ports through the guarded Vite environment so the client follows the same allocation only when emulator mode is enabled. Expand bind-only collision checks to Hub/logging, remove the web server's connect-based availability probe, and only make readiness requests after process ownership has been verified.

The CI acceptance now holds test-owned listeners on legacy ports 4000, 4001 and 9099 while it runs the full Founder Preview lifecycle and desktop/mobile browser journeys.

## 3. Old and new port maps

| Service | Previous Founder Preview port | New port |
| --- | ---: | ---: |
| Auth emulator | 9099 | 28101 |
| Functions emulator | 5001 | 28102 |
| Firestore emulator | 8080 | 28103 |
| Storage emulator | 9199 | 28104 |
| Hosting emulator | 5050 | 28105 |
| Emulator UI | 4001 | 28106 |
| Emulator Hub | 4400 (Firebase default) | 28107 |
| Emulator logging | 4500 (Firebase default) | 28108 |
| Vite web app | 5173 | 28109 |
| PostgreSQL | 54329 | 28110 |

All other code that requests ports 4000, 4001, 9099, 5001, 8080, 5173 or 54329 is outside this Founder Preview port map. The generic `postgres:up` workflow retains its 54329 default; Founder Preview passes `PREVIEW_POSTGRES_PORT=28110` and an explicit guarded database URL.

## 4. Consumers and configuration updated

- `firebase.json`: Auth, Functions, Firestore, Storage, Hosting, UI, Hub and logging ports.
- `tests/preview/lib/config.mjs`: the canonical Founder Preview map, generated URLs, Firebase web emulator environment, and emulator preflight list.
- `tests/preview/lib/guards.mjs`: pins all four browser SDK emulator ports alongside the existing demo-project and safety values.
- `apps/web/src/infrastructure/firebase/emulatorPorts.ts` and the Auth/Functions/Firestore/Storage SDK adapters: reads validated Vite emulator-port settings with matching dedicated defaults.
- `tests/preview/lib/ports.mjs` and `runtime.mjs`: bind-only preflight for emulator/Hub/logging and web ports; readiness probes require a positively owned preview process.
- `tests/preview/lib/postgres.mjs` and `docker-compose.postgres.yml`: Founder Preview passes the port to Compose; Compose binds the selected port to loopback.
- `tests/preview/cli.mjs`: status, seed, reset and reuse checks avoid probing emulator endpoints unless the recorded preview process is owned.
- `playwright.config.ts`, the emulator seed script, and the Terms/Team emulator spec: use the configured web, Firestore and callable URLs.
- `.github/workflows/ci.yml`: the PostgreSQL service uses 28110, and the isolation acceptance script runs the requested preview lifecycle and browser journeys with legacy ports occupied.
- `docs/runbooks/founder-preview-runbook.md`: documents the dedicated map and collision behavior.

## 5. Files modified

1. `.github/workflows/ci.yml`
2. `apps/web/src/infrastructure/firebase/auth.test.ts`
3. `apps/web/src/infrastructure/firebase/auth.ts`
4. `apps/web/src/infrastructure/firebase/emulatorPorts.test.ts`
5. `apps/web/src/infrastructure/firebase/emulatorPorts.ts`
6. `apps/web/src/infrastructure/firebase/firestore.ts`
7. `apps/web/src/infrastructure/firebase/functions.ts`
8. `apps/web/src/infrastructure/firebase/storage.ts`
9. `docker-compose.postgres.yml`
10. `docs/runbooks/founder-preview-runbook.md`
11. `firebase.json`
12. `playwright.config.ts`
13. `tests/e2e/emulator/seedCommerceKnowledge.mjs`
14. `tests/e2e/emulator/terms-and-team.spec.ts`
15. `tests/preview/cli.mjs`
16. `tests/preview/cross-project-acceptance.mjs`
17. `tests/preview/guards.test.mjs`
18. `tests/preview/lib/config.mjs`
19. `tests/preview/lib/guards.mjs`
20. `tests/preview/lib/ports.mjs`
21. `tests/preview/lib/postgres.mjs`
22. `tests/preview/lib/runtime.mjs`
23. `tests/preview/ports.test.mjs`

This report and the repository change-tracking entries are added in the documentation follow-up commit on the same PR.

## 6. Code diff summary

The correction replaces scattered defaults with a deterministic local block, makes SDK emulator ports configurable only on the emulator path, covers Hub/logging in preflight, removes the web listener HTTP probe, and gates service readiness reads on process ownership. Port drift checks cover Firebase CLI JSON, browser SDK fallbacks and overrides, Playwright, seed tooling, Docker Compose, CI and generated URLs. No unrelated process management was added.

## 7. Commands and validation

Executed in the clean isolated worktree `/tmp/11thonus-ea002-corr002`:

- `node --test tests/preview/guards.test.mjs tests/preview/ports.test.mjs` — **44 passed, 0 failed**. Socket fixtures used ephemeral ports only; legacy ports were not contacted.
- Focused Firebase client tests (`auth`, `functions`, `firestore`, `storage`, `emulatorPorts`) — **15 passed**.
- Web TypeScript check (`tsc -p apps/web/tsconfig.app.json --noEmit`) — passed.
- Functions TypeScript check (`tsc -p functions/tsconfig.json --noEmit`) — passed.
- ESLint on modified code and Prettier check on all modified code/config/docs — passed.
- `node --check` on changed JavaScript modules and `git diff --check` — passed.
- `pnpm install --offline --frozen-lockfile` — succeeded from cache; no dependency manifest or lockfile changed.

The broader web unit suite was started but interrupted after timing failures appeared in unchanged UI/auth test files under the concurrent local checks. The focused Firebase suite passed; exact-head CI runs the normal complete suite. The full runtime/browser acceptance is configured in CI and was not run locally.

## 8. Cross-project coexistence proof

The preview tooling test models 4000, 4001 and 9099 as occupied and asserts preflight probes only its configured emulator ports. CI goes further: it opens its own listeners on all three legacy ports, runs `preview:start`, `preview:status`, `preview:verify`, `preview:reset`, `preview:verify`, and `test:e2e:preview`, then asserts the legacy listeners remained open and received no connections. The CI result for the final PR head remains authoritative.

## 9. Process-safety proof

Availability checks only attempt IPv4 loopback binds and release them immediately. They do not connect to or identify the listener. Emulator/web readiness requests require the corresponding recorded process to pass EA-002's PID plus start-time ownership check. Stop and restart operations still target only that positively owned process group. No code inspects, signals or modifies Tiizi or any other unowned process.

## 10. Dependencies, schema and configuration

- Dependencies: none added or changed; `package.json` and lockfile unchanged.
- Schema/migrations: none changed.
- Local configuration: dedicated Firebase emulator, Hub/logging, web and Founder Preview PostgreSQL ports; loopback-only PostgreSQL host mapping.
- CI configuration: test service PostgreSQL host port and URLs aligned to 28110; new cross-project acceptance wrapper.
- `PREVIEW_POSTGRES_URL` remains the documented optional loopback override; preview database/project guards are unchanged.

## 11. Product and governance boundaries

The only application-source changes are the four Firebase client emulator endpoint selectors and their tests. They are used when `useEmulator` is true; deployed Firebase endpoints and product behavior are unchanged. `functions/src`, routes, Product Truth, Commercial logic, schema and Experience Assembly are unchanged. `PURCHASE_ADMISSION_GATE_MODE` remains OFF/default and the preview still strips an inherited gate setting. Existing EA-002 guards remain in place. No deployment occurred.

## 12. Risks and rollback

The block is deterministic, not exclusive: another process could occupy a newly allocated port. The preview then fails closed and names the Firebase/web port, or Docker reports the PostgreSQL bind collision; no listener is terminated. Generic PostgreSQL commands continue to default to 54329 unless overridden.

Rollback by reverting the EA-002-CORR-002 implementation and documentation commits (or closing PR #297 before merge). Restore the prior Firebase/client ports and CI PostgreSQL mapping together; do not stop any process to perform rollback.

## 13. PR state

PR #297 is open and unmerged against `main`; exact-head CI is running. PR #295 / EA-003 remains open and untouched. Do not merge this PR until exact-head CI and automated review are complete.
