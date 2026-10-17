# Follow-up issue B — Preview / E2E robustness and timing sensitivity

**Source:** CI-CONT-007G/007J/007K/007L. **Owners:** preview/E2E owners of PR #312 / PR #307 (`playwright.config.ts`, `tests/e2e/preview`). **Status:** open; no test, timeout, retry or application change has been made by CI-CONT. These are observations to be triaged, not a verdict that the tests are wrong.

## Evidence
| Run | Preview Playwright workers | Result |
|---|---|---|
| Pipeline #7 (config `6f3a3a8…`) | 18 (50 % of 36 visible cores, cgroup limit 4 CPUs) | 21 passed, 7 failed, 12 flaky, 16 not run; `page.goto` and 20 s assertion timeouts |
| Local amd64 emulation (CI-CONT-007K), 2 workers, retries 0 | 2 | 22 passed, 6 failed, 28 not run; pages stuck on "Loading…" (emulation slowness; not a hosted result) |
| Pipeline #8 (config `49c08c2…`, workers capped at 2) | 2 | **56 passed, 0 flaky, 0 retries, 0 not run** |
Pipeline #7 versus #8 (same code, executor class and resources; only the worker count differs) supports the worker-oversubscription explanation. It is an inference, since other variables (timing, seed state) were not controlled.

## Findings to triage
1. **Worker oversubscription:** `playwright.config.ts` sets no `workers`; Playwright defaults to 50 % of logical cores, which a container sees as the host's cores (36) rather than its CPU quota (4). The CI-CONT pilot caps this externally with a step-scoped wrapper; On GitHub Actions the default depends on the runner's size (50 % of its vCPUs: 2 workers on a 4-vCPU runner, 1 on a 2-vCPU runner); the repository's actual runner size was not verified by CI-CONT. Consider an explicit, environment-aware setting.
2. **Nested web-server startup:** the top-level `webServer` array (production build + two dev servers on 4173/5183/5184) applies to **every** project, including `chromium-preview*`, whose comment says "no webServer is started here on purpose". The preview run therefore builds and starts servers it does not use, adding CPU load and a 60 s startup timeout that was exceeded under emulation.
3. **Serial behaviour:** `tests/e2e/preview/counter.spec.ts` uses `describe.configure({ mode: "serial" })`; one failure marks the rest of that block "did not run", which hides the true extent of a failure (28 not run in the local emulation run).
4. **Shared seeded data:** both `chromium-preview` and `chromium-preview-mobile` run the same specs against one seeded dataset and `fullyParallel: true`; tests that record purchases mutate state other tests read. Order/interference was not demonstrated; recorded as a risk to review.
5. **Timing-sensitive assertions:** `expect` 20 s and test 60 s timeouts with pages that show "Loading your loyalty experience…" / "Loading the counter…" while callables cold-start; a slow Functions emulator (it logged "Failed to load function definition … Timeout after 10000" locally) turns latency into failures.

## Separate acceptance observation — three disclosed emulator skips
`pnpm emulators:validate` passed with 877 passed and **3 skipped** (pipeline #8). They are pre-existing committed `it.skip("DISCLOSED FINDING (not proven here): …")` tests documenting that a concurrent write during a held-open transaction did not force a Firestore-emulator retry:
- `functions/src/domains/business/services/acceptBusinessTermsCommand.emulator.test.ts` (line 844 at `73575800…`)
- `functions/src/domains/business/services/businessActivationCommand.emulator.test.ts` (line 434)
- `functions/src/domains/business/repositories/businessTermsConfigRepository.emulator.test.ts` (line 128)
They are unrelated to CI-CONT and are not a CircleCI artefact. Founder/engineering acceptance should consciously accept or schedule them; this document does not.
The preview-tooling suite also reports 1 skip ("an IPv6-only listener does not block…", because the CircleCI executor has no IPv6 loopback): an environment limitation.

## Out of scope here
No change to tests, timeouts, retry policy (`retries: 2` under CI), worker count in the repository, or application code.
