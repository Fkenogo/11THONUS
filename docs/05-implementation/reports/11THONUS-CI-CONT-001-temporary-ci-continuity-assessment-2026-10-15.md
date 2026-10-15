# 11THONUS-CI-CONT-001 — Temporary CI Continuity Assessment (GitHub Actions Billing Interruption)

**Date:** 2026-10-15 · **Type:** assessment + proposed configuration (documentation/configuration only) · **Authority:** Founder-authorised assessment.
**Scope statement:** this is a _temporary CI continuity assessment during a GitHub Actions billing interruption_. It is **not** a permanent provider selection and **not** a portfolio-wide decision. GitHub Actions remains the intended primary CI once service is restored.

**Disposition: READY FOR TEMPORARY CI PILOT** (bounded, Founder-authorised pilot only — see §12 for the pilot gates and the items that are _not yet proven_).

---

## 1. Entry repository state

| Item                 | Value                                                                                                                                                                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entry checkout       | `/Volumes/PRODUCTION/Projects/11THONUS`, branch `infra/slice-b-phone-preview`, HEAD `3ecf78e` (local-only docs commits ahead of PR #310 head `190b3a6`)                                                                                                       |
| `origin/main`        | `b3cb64eea2132dea661fbe8359a4894d5b9021ff`                                                                                                                                                                                                                   |
| Entry dirty state    | **Dirty, not ours:** `M docs/changes/IMPLEMENTATION_CHANGES.md`, `?? …post-phone-founder-ux-correction-assessment-2026-10-12.md` (another task's work; left untouched)                                                                                        |
| Other worktrees      | ~50 existing worktrees (`.claude/worktrees`, `11THONUS-worktrees`, `.codex`, …); none modified                                                                                                                                                              |
| Strategy             | (a) docs/config branch `docs/ci-cont-001-circleci-assessment` in new worktree `/Volumes/PRODUCTION/Projects/11THONUS-worktrees/ci-cont-001` from `origin/main`; (b) throw-away detached verification worktree at PR #312 head `7357580`, removed after use |
| Shared-resource note | Local PostgreSQL on `:28110` is the project's own long-running `11thonus-postgres-1` container (`postgres:16-alpine`, same as CI service image); used rather than started a second one                                                                        |

## 2. Existing CI architecture

One workflow, one job: `.github/workflows/ci.yml`.

| Attribute      | Value                                                                                                                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Workflow / job | `CI` / **`Build, Lint, Test, Emulator Validation`** (single job)                                                                                                                                                   |
| Triggers       | `push` to `main`; `pull_request` **with base `main` only**; `workflow_dispatch`. Concurrency group cancels superseded runs                                                                                         |
| Runner         | `ubuntu-latest` (migrating to Ubuntu 26 on 2026-10-19 per runner notice)                                                                                                                                           |
| Runtime        | Node 20, pnpm 9.15.9 (`packageManager`), frozen lockfile, JDK 21 (Temurin; firebase-tools refuses Java < 21), Playwright Chromium `--with-deps`                                                                     |
| Services       | `postgres:16-alpine` service container, host port **28110**, `postgres/postgres`, DB `eleventhonus_platform_test` (+ `eleventhonus_platform_local` created in-job)                                                  |
| Firebase       | Emulator Suite only, fake project `demo-11thonus`; ports 28101–28108 in `firebase.json`. **No secrets, no real cloud resources**                                                                                   |
| Secrets        | **None**                                                                                                                                                                                                           |
| Artifacts      | on failure only: `playwright-report/`, `test-results/`, `firebase-debug.log`, `firestore-debug.log`, `.preview/logs/` (7 days)                                                                                     |
| Steps (order)  | build → lint → format:check → typecheck → unit/component (`pnpm test`) → JDK → PostgreSQL integration (wrapped in Firestore emulator) → Playwright e2e → preview-tooling tests → cross-project acceptance → cleanup → `pnpm emulators:validate` |

**Observed GitHub duration** (last successful runs): 16m 32s (`023bf3e`, PR run), 16m 50s (`190b3a6`), 17m 41s. Largest steps on `190b3a6`: emulator validation 224 s, PostgreSQL 201 s, cross-project acceptance 195 s, Playwright e2e 134 s, unit tests 100 s.

### Required checks / branch protection (inspected, not inferred)

- `GET /branches/main/protection` → **404 "Branch not protected"**; `GET /rulesets` → `[]`.
- **No required status checks exist on `main`.** The check name `Build, Lint, Test, Emulator Validation` is a convention, not a GitHub-enforced gate. The "mandatory" status is therefore **repository process** (PR template checklist + Founder gate), not a platform rule.

## 3. Blocked PR inventory

GitHub Actions state: `workflow_dispatch` runs on `7357580` (ids 38527595581, 38530159868) completed `failure` in **~5 s with 0 steps**; annotation: _"The job was not started because your account is locked due to a billing issue."_ Never-started, not a code failure.

| PR                                  | Head SHA (GitHub)                          | Base                      | Mergeable | Actions state                                                                                      | Other blockers                                                                                                                                                                       | Class                                                                  |
| ----------------------------------- | ------------------------------------------ | ------------------------- | --------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| **#312** item-circle schema Pkg B   | `73575800df6dfada8980fef5d9c83b43d2af7464` | `feat/ea-bl-001-corr-002-b-staff-counter` (stacked) | CLEAN     | Pending, 2 check-runs **failed-to-start** (billing); no successful run at this SHA                 | 0 review threads, 0 reviews recorded; Codex review hit its usage limit. Founder approval outstanding; **depends on #307 merging first (stacked)**                                      | **Infrastructure-blocked** (and stack-gated)                           |
| #310 phone preview transport        | `190b3a6ece9af04a4210f34569260425b681f5f0` | same stacked base         | CLEAN     | **Green** `workflow_dispatch` run 38366723661 at this exact SHA (pre-interruption)                 | 9 threads, 0 unresolved; Founder disposition outstanding. Local branch has 3 unpushed docs commits (`3ecf78e`) — those would need push + a new run if they touch gated paths         | Not CI-blocked (has green exact-head run)                              |
| #307 Staff Counter                  | `023bf3ef599d27fcd998043c0bca6926aa82356e` | `main`                    | CLEAN     | **Green** PR run 38432391357 at this exact SHA                                                     | 4 threads, 0 unresolved; Founder Preview / UX-correction dispositions pending                                                                                                         | Not CI-blocked                                                         |
| #308 WEB-00 audit (draft)           | `4b25e9ce…`                                | `main`                    | CLEAN     | Green, 2026-10-08                                                                                  | Draft/review                                                                                                                                                                          | Not CI-blocked                                                         |
| #164, #34                           | `b5af3b6…`, `bf1dd40…`                     | `main`                    | DIRTY     | Green historically                                                                                 | Merge conflicts                                                                                                                                                                       | Genuine blockers, not CI                                               |

**Finding:** only **#312** is infrastructure-blocked at its current head. It is also a stacked PR (base is #307's branch), so even `pull_request` CI would not auto-trigger for it on GitHub (workflow filter is `branches: [main]`) — it has always been verified via `workflow_dispatch`. Any CircleCI pilot must follow the same checkpoint-style model.

## 4. Mandatory verification requirements

The PR template (`.github/PULL_REQUEST_TEMPLATE.md`) lists `pnpm build`, `lint`, `format:check`, `typecheck`, `test`, `test:e2e`, `emulators:validate`; `ci.yml` additionally runs PostgreSQL integration, preview-tooling tests and cross-project port-isolation acceptance. The CircleCI prototype mirrors the **full `ci.yml` list**, no subset.

## 5. Local verification (exact source: detached `73575800df6dfada8980fef5d9c83b43d2af7464`)

Node v20.20.0, pnpm 9.15.9, JDK 25 (≥21 OK), macOS arm64, a **loaded** workstation (other agents' dev servers running).

| Step                                  | Result                              | Duration | Notes                                                                                                                                                                                                                                  |
| ------------------------------------- | ----------------------------------- | -------: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| install (frozen lockfile)             | PASS                                |      22 s | warm store                                                                                                                                                                                                                             |
| build                                 | PASS                                |      29 s |                                                                                                                                                                                                                                        |
| lint                                  | PASS                                |      19 s |                                                                                                                                                                                                                                        |
| format:check                          | PASS                                |      11 s |                                                                                                                                                                                                                                        |
| typecheck                             | PASS                                |      12 s |                                                                                                                                                                                                                                        |
| unit/component (`pnpm test`)          | functions **2034/2034**; web 1150/1155 → **5 failed** (4× 5000 ms timeouts, 2 assertion-lookups) | 128 s | **Re-run of the 5 files in isolation: 119/119 PASS** (8 s). Load-induced; not re-run as a full suite                                                                                                    |
| PostgreSQL integration (+ emulator)   | 812/813; 1 failed (15 s timeout)    |    729 s | Single file re-run in isolation: **70/70 PASS** (135 s; the file is slow, ~135 s alone — exceeding per-test timeouts under load). GitHub did this step in 201 s                                                                      |
| Playwright e2e                        | **NOT VALID LOCALLY**               |    118 s | 149 failed with `browserType.launch: Executable doesn't exist … chromium_headless_shell-1228`; local cache has revision 1243. Requires `playwright install chromium` (a browser **download**, not performed without approval). Environment gap, not a code result |
| preview-tooling                       | PASS (guards + ports at this SHA)   |      <1 s | the script at this SHA lists only those two files                                                                                                                                                                                       |
| cross-project port-isolation acceptance | **NOT RUN**                         |        — | not executed locally                                                                                                                                                                                                                   |
| `emulators:validate`                  | PASS 877 passed / 3 skipped (67 files) |   245 s |                                                                                                                                                                                                                                        |

**Reading:** local evidence is supporting only. Reproduced green: build/lint/format/typecheck/functions unit/emulator validation, and the five web + one Postgres failures pass in isolation. **Not reproduced locally:** Playwright e2e and cross-project acceptance — precisely the part an independent CI must supply. Deterministic repeat of the full web suite on an unloaded machine was not performed; the timeouts indicate resource sensitivity on small executors (a reason to use `large`, §9).

## 6. CircleCI Free assessment (official docs consulted 2026-10-15)

| Topic                | Finding                                                                                                                                                                                                                          |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cost / card          | $0; pricing page states **no credit card required**                                                                                                                                                                              |
| Allowance            | **30,000 credits / month**, no rollover; up to **5 active users**; 30 concurrent jobs (Docker/Linux VM); 2 GB storage; self-hosted-runner network allowance 1 GB                                                                  |
| Executors included   | Docker small/medium/medium+/large; Linux VM and remote Docker medium/large. X-large+ not included. No Docker layer caching, no support tickets                                                                                  |
| Rates                | CircleCI's page gives one official anchor: Linux Medium = 10 credits/min (30,000 ≈ 3,000 min). Large rates are **not stated on the official page I could fetch**; third-party tables suggest Docker large ≈ 20/min, VM large possibly ≈ 40/min. **Verify in the CircleCI UI before pilot** |
| Hidden paid need     | None identified. Risks: exceeding allowance stops pipelines (no auto-charge on Free); Gen2 resource-class rates may be higher than Gen1 figures                                                                                   |
| Runtime              | `cimg/node:20.19` (Node 20, npm → pnpm 9.15.9 pin). JDK 21 via `apt` (not preinstalled; **to be proven in pilot**). Firebase CLI from repo devDependency (`pnpm exec firebase`). Playwright installs via the repo's own command    |
| Emulators            | Same ports/project (`demo-11thonus`); Java ≥ 21 mandatory; started by `firebase emulators:exec` (self-managed lifecycle, no background-process orchestration needed). No credentials, no production resources                      |
| PostgreSQL           | Secondary Docker image `postgres:16-alpine` with `command: ["postgres","-p","28110"]` keeps the identical URL/port. Must be pilot-proven (secondary images are reachable on `localhost`)                                         |
| Browser              | Playwright Chromium via `--with-deps` (needs sudo apt; available in cimg). `large` (4 vCPU/8 GB) chosen because the local run showed timeout sensitivity under load                                                                |
| Secrets              | **None required.** No new secrets introduced. (GitHub-side OAuth/App authorisation is a Founder action, not a repo secret)                                                                                                        |

## 7. Exact-head verification

Mechanism (in `.circleci/config.yml`, first step, before any install):

1. **Expected SHA** = `pipeline.event.github.pull_request.head.sha` (current GitHub App value; documented as _"The SHA of the head branch of the pull request"_). For push-type events (no PR object) fall back to `pipeline.event.github.after`.
2. **Checked-out SHA** = `git rev-parse HEAD` after `checkout`. (`pipeline.git.revision` is echoed for the log, but is documented as potentially differing from the triggering commit for GitHub App pipelines — so it is not the comparand.)
3. **Fail closed:** exit 1 if expected is empty or `checked-out ≠ expected`.
4. **Independent corroboration:** for PR events, unauthenticated `GET api.github.com/repos/Fkenogo/11THONUS/pulls/<n>` (public repo, no credential) — fail if the live PR head differs (stale pipeline after a force-push). If the API is unreachable the step warns, and the primary comparison still gates.
5. Output records expected SHA, source field, checked-out SHA, live SHA and RESULT lines in the job log (and in the check).

The deprecated `pipeline.trigger_parameters.github_app.*` values are **not used** (CircleCI states presence is not guaranteed after 2026-09-21). **No source commits** are created to prove SHA identity.

**Open item for the pilot (not provable offline):** confirm CircleCI checks out the PR _head_ commit rather than a merge ref for PR events. The config detects and rejects a mismatch, so the failure mode is "pipeline red", never "silently wrong tree". Also, stacked PRs (#312) require a trigger that CircleCI supports for non-default bases; confirm in the pilot.

## 8. GitHub Checks and merge protection (separate question)

1. Required status checks on `main`: **none** (no protection, no rulesets).
2. Existing name that process treats as the gate: `Build, Lint, Test, Emulator Validation` — a **GitHub Actions check-run** (app `github-actions`).
3. CircleCI GitHub App publishes checks/statuses as `ci/circleci: <job_name>` (e.g. `ci/circleci: circleci-continuity-verify`) plus workflow-level GitHub Checks. It will **not** produce a check named `Build, Lint, Test, Emulator Validation`, and we must not spoof that name.
4. GitHub will therefore **not** treat a CircleCI result as "the CI check"; the Actions check-run remains pending/failed-to-start for the SHA.
5. **Merge capability today:** because `main` has no required checks, a PR's mergeability (`CLEAN`) is not gated by CI status at all; the gate is Founder/process. A CircleCI pass is therefore _evidence for the Founder's disposition_, and the PR record must say "CircleCI continuity evidence (not GitHub Actions)". No branch-protection change is required or proposed. (If the Founder later enables required checks, that is a separate, manual, separately-authorised action; naming `ci/circleci: …` would then be needed and is out of scope.)

## 9. Consumption estimate

Assumptions (conservative): CircleCI wall time per full run ≈ **22 min** (GitHub: ~17 min; add JDK apt install + cold pnpm store + Chromium install without cache). Docker `large` ≈ 20 credits/min (unverified; use 40 as the VM-class worst case).

| Scenario                                                          | Credits/run | 
| ----------------------------------------------------------------- | ----------: |
| Docker large (20/min × 22 min)                                    |        ~440 |
| Worst-case rate (40/min × 22 min)                                 |        ~880 |

Checkpoint model: local validation during implementation; hosted run only at review-ready heads (`ready_for_review`/PR-comment trigger), ~2 runs per PR; ~4 live PRs in the stack; ~2 weeks:
**8 runs ≈ 3,520 credits (11.7 %)** — worst-case rate **7,040 (23.5 %)** of the 30,000 allowance. A full month of continuous use at 440/run is ~68 runs. Do **not** enable per-commit triggers.

## 10. Buildkite comparison (bounded)

Buildkite's free hosted-agent allowance and the need to operate a pipeline uploader/agent model add configuration surface (agent images, `pipeline.yml` upload, GitHub commit-status integration, `BUILDKITE_COMMIT`) without a technical advantage for this repo: the repo's only hard requirements (Node 20, JDK 21, Docker-compatible Postgres, Chromium) are met in the same way by CircleCI. Exact-head identity is available in both; neither can satisfy an Actions-named check. **No material advantage; keep as documented fallback only.** (Current Buildkite free-tier figures were not re-verified in this pass; do so only if CircleCI hits a blocker.)

## 11. Proposed configuration

- **Created (inactive prototype):** `.circleci/config.yml` — one job `circleci-continuity-verify`: exact-head gate → pnpm 9.15.9 → JDK 21 → `pnpm install --frozen-lockfile` → PostgreSQL readiness → the repository's own script steps in `ci.yml` order → cleanup (`when: always`) → artifacts (`playwright-report`, `test-results`, `.preview/logs`, `when: always`). Deploy steps: none. Secrets: none. Test exit codes preserved (each step is a plain command).
- The file lives only on `docs/ci-cont-001-circleci-assessment`. It does **nothing** until CircleCI is connected to the repository.
- Not validated with the CircleCI CLI (`circleci` not installed; YAML syntax parsed OK). First pilot run is the validation.

## 12. Founder / manual actions (after separate approval) — and pilot gates

**Coding-agent actions:** merge the prototype config to the pilot PR branch; run the pilot against one SHA; compare with local run; record credits; write the closure note.

**Founder/manual actions:**

1. Sign into CircleCI; connect GitHub; authorise **only** `Fkenogo/11THONUS`.
2. Select **Free** plan; confirm no card/paid resource; confirm credits and large-class rate in the UI.
3. Create the project using the **GitHub App** integration; set trigger to PR-comment / ready-for-review (not every push); enable GitHub Checks.
4. No environment variables/secrets to add.
5. Trigger one pilot against exact SHA of #312 (`73575800…`); verify the SHA log block, check reporting, and credit use.
6. **Stop** — do not touch branch protection.

**Pilot pass criteria:** exact-head log shows equal SHAs; JDK 21 install works; Postgres secondary image reachable on 28110; full step list passes (or fails with the same failures local reproduces); credits ≤ ~900 per run.

## 13. Risks

- Rates for `large` unverified → confirm before running.
- JDK install via `apt` and PR-head checkout semantics unproven (§7).
- Local flaky timeouts suggest resource sensitivity; CircleCI `large` may still be slower than GitHub's runner.
- Duplicated CI logic (inline SHA check + steps) can drift from `ci.yml`; mitigated by short lifetime.
- Public repo: SHA corroboration step uses an unauthenticated API (rate-limit 60/h).
- Evidence must not be mislabelled as GitHub Actions.

## 14. Rollback

Disconnect/uninstall the CircleCI GitHub App for the repository (Founder), delete the CircleCI project, delete `.circleci/` (single directory, one commit revert). No repo, branch-protection or application state changes to undo. GitHub Actions `ci.yml` is untouched throughout.

## 15. Files, diff, commands, dependencies

- **Added:** `.circleci/config.yml`; this report. **Modified:** `docs/changes/IMPLEMENTATION_CHANGES.md` (new top entry, on the isolated branch only).
- **Documentation/configuration only.** No application, test, schema, Firebase, or `ci.yml` change. **Dependencies added: none.**
- Commands executed: `git`/`gh` read-only queries (PRs, runs, protection, rulesets, check-runs, GraphQL threads); web lookups of CircleCI pricing/pipeline-value docs; local verification script (`pnpm install/build/lint/format:check/typecheck/test`, `firebase emulators:exec … test:postgres`, `pnpm test:e2e`, `pnpm test:preview-tooling`, `pnpm emulators:validate`) in a detached worktree; isolated vitest re-runs.
- Left running on the host (not started by this task): `11thonus-postgres-1` container.

## 16. Recommendation

**READY FOR TEMPORARY CI PILOT** — CircleCI Free can in principle run the full mandatory suite at zero cost with no new secrets, an explicit fail-closed exact-head gate using current GitHub App values, ~12 % (worst case ~24 %) of the free allowance, and a single-directory rollback. The pilot is the proof of the three unverified points (JDK install, head-vs-merge checkout, `large` rate). **Separately:** current `main` has no required checks, so no protection change is needed; a CircleCI pass is independent evidence for the Founder's merge decision and is **not** a GitHub Actions pass.

---

# Addendum — 11THONUS-CI-CONT-002: Pilot Execution & Validation (2026-10-15)

**Scope:** controlled temporary pilot of CircleCI Free against PR #312 head `73575800df6dfada8980fef5d9c83b43d2af7464`. Temporary and reversible; **not** a permanent provider selection. PR #312 is **not** merged.
**Disposition: PILOT INCOMPLETE — CORRECTION REQUIRED** (the hosted run has not executed: it requires Founder account/GitHub-App actions that the agent cannot and must not perform; see §C2-7).

## C2-1 Preflight

| Item | Result |
| --- | --- |
| PR #312 head | `73575800df6dfada8980fef5d9c83b43d2af7464` — unchanged; `refs/pull/312/head` resolves to the same SHA |
| Stack | Base `feat/ea-bl-001-corr-002-b-staff-counter` (= PR #307). #312 is exactly 2 commits above #307's head `023bf3ef599d27fcd998043c0bca6926aa82356e`. #307 still open (`CLEAN`, green GitHub run at its head). **#312 cannot merge to `main` before #307** |
| Review status | 0 review threads, 0 reviews; one Codex bot comment (usage-limit notice). No P1/P2 findings recorded; Founder approval outstanding |
| `ci.yml` at #312 | byte-identical to `main`'s → cross-project acceptance **is mandatory** (it is a step of the single gating job) |
| Worktrees | no existing worktree or branch of another task modified |

**Deficiencies found in the CONT-001 prototype (corrected):**

1. It assumed PR-event values; for a manual/checkpoint run `pipeline.event.github.pull_request.*` is **empty**, so the gate would have failed (or silently used a push SHA).
2. CircleCI reads `.circleci/config.yml` from the triggered commit. #312's head contains none, and committing config onto the PR is prohibited. → Config now lives on the pilot branch and the job **fetches and checks out the PR head by SHA** (`refs/pull/<n>/head`).
3. Pushes would have started the job → workflow now has a `when` gate that requires an expected SHA.
4. Invalid YAML (unquoted colon) — caught by the official CLI.
5. Live-head cross-check parsed multi-line JSON with `sed` and always failed → replaced with `node` (found by executing the step locally, not by inspection).

## C2-2 Local verification gaps — closed (exact source `73575800…`, Node 20.20.0, pnpm 9.15.9, lockfile unmodified)

| Check | Result | Duration |
| --- | --- | ---: |
| Playwright Chromium (lockfile `@playwright/test` 1.61.1 → headless shell rev 1228) | installed (93.5 MiB; disk: 378 GiB free on volume, 25 GiB on data volume); no dependency or lockfile change | 56 s |
| `pnpm test:e2e` | **149 passed** (previous run: 149 "failed" solely for the missing browser) | 3.2 min |
| `pnpm --filter web test` (full) | **140 files / 1155 tests passed** | 63 s |
| PostgreSQL integration (emulator-wrapped, full) | **22 files / 813 tests passed** | 234 s |
| Cross-project port-isolation acceptance | **NOT RUN locally** — fails at start: `EADDRINUSE 127.0.0.1:4000`; a different project's emulator (Klockit, `demo-klockit-local`, PID 62033) holds legacy ports 4000/9099 that this test must own. Not killed (another project's process). Must be validated in hosted CI, which is a clean host |

**Timeout investigation:** the earlier 5 web failures and 1 Postgres failure were 5 s/15 s timeouts while the host load average was ~20–28 on 8 cores with other agents' servers running; the same suites pass in full on a re-run (web 63 s, Postgres 234 s vs GitHub's 201 s). Classification: **environment/resource exhaustion on a shared workstation**, no assertion, threshold or test was changed. Implication for CircleCI: use `large` (4 vCPU/8 GB); do not use `medium`.

## C2-3 CircleCI configuration validation (official CLI `circleci 1.5.0`)

- `circleci config validate .circleci/config.yml` → **valid**; `config process` → OK; Prettier clean.
- Logic of the exact-head step was executed locally against the real PR ref: **match** (`expected = fetched = checked-out = live GitHub head = 73575800…`, rc 0); **stale SHA** `023bf3e` for PR 312 → `FAIL: fetched ref != expected`, rc 1; empty and malformed SHA → rc 1.
- Not provable without a hosted run: JDK 21 `apt` install on `cimg/node:20.19`, Postgres secondary-image networking on 28110, and the `large` credit rate.

## C2-4 Final pilot configuration (summary)

`.circleci/config.yml` on branch `docs/ci-cont-001-circleci-assessment`: parameters `expected_sha` (required for manual runs) and `pr_number`; fail-closed exact-head step; then the repository's own scripts in `ci.yml` order (build, lint, format:check, typecheck, test, PostgreSQL+emulator, Playwright, preview-tooling, cross-project acceptance, emulator validation); `no_output_timeout` on the long step; evidence file `exact-head-evidence.txt` plus Playwright/preview artifacts stored; **no secrets, no deploy, no production services**; workflow runs only if an expected SHA exists, so ordinary pushes cost no credits.

GitHub Checks note: because the pipeline is triggered on the config branch, CircleCI's GitHub Check/status attaches to **that branch's commit, not to `73575800…`**. The authoritative evidence is the pipeline's exact-head log block / `exact-head-evidence.txt`, which the report must quote with the CircleCI URL. It will not appear on PR #312's check list.

## C2-5 Founder / manual steps (exact)

1. Sign in at circleci.com with GitHub (Free plan; **do not** add a card or choose Performance/Scale).
2. Authorise the CircleCI GitHub App for **only** `Fkenogo/11THONUS` (not "All repositories").
3. Create project → GitHub App → repository `11THONUS` → config file `.circleci/config.yml`, **checkout/config branch `docs/ci-cont-001-circleci-assessment`**. In Project Settings → Triggers, create **no** push/PR trigger (manual only for the pilot).
4. Confirm on the plan page: Free, 30,000 credits, no card; note the Docker `large` credit/min.
5. In the project, **Trigger Pipeline** on branch `docs/ci-cont-001-circleci-assessment` with parameters `expected_sha=73575800df6dfada8980fef5d9c83b43d2af7464`, `pr_number=312`.
6. Send the pipeline URL (and plan-usage screenshot/credits) back. No API token needs to be shared.

## C2-6 Mandatory verification matrix (as of this addendum)

| Requirement | Local (this host) | CircleCI hosted |
| --- | --- | --- |
| Build / lint / format / typecheck | PASS | **not yet run** |
| Unit/component (functions 2034, web 1155) | PASS | not yet run |
| PostgreSQL integration (813) | PASS | not yet run |
| Playwright e2e (149) | PASS | not yet run |
| Preview-tooling tests | PASS | not yet run |
| Cross-project acceptance (mandatory) | **not runnable locally (port conflict)** | not yet run |
| Emulator validation (877/3 skipped) | PASS (prior run, same SHA) | not yet run |
| Exact-head verification | logic proven locally | not yet run |
| Credits consumed | — | **0 used; no hosted run** |
| GitHub Checks reporting | — | not yet observable |

## C2-7 PR #312 merge assessment (current)

| State | Value |
| --- | --- |
| CircleCI independently verified the exact head | **No** (not yet executed) |
| GitHub Actions passed at `73575800…` | **No** — never started (billing lock) |
| GitHub permits merging | Technically yes (`CLEAN`, no required checks), **but base is #307's branch**; merges into that branch, not `main` |
| Governance permits merging | **No** — Founder approval outstanding, #307 not merged, and independent verification incomplete |

Recommendation: do not merge. Complete the hosted pilot (§C2-5); the cross-project acceptance step is the only mandatory check with no passing evidence at this SHA anywhere.

## C2-8 Risks, rollback

Risks: unverified `large` rate; JDK/apt and secondary-image networking untested; one-off public-API call (60/h unauthenticated); GitHub Checks not on the PR head. Rollback unchanged from §14: delete the CircleCI project and revoke the GitHub App for the repository, then delete `.circleci/` (one commit) — and the pilot branch. No change to `ci.yml`, branch protection, or any PR.

## C2-9 Security review note (automated commit review, `cbca54e`)

Finding: PR-tree code (install/test scripts) executes in a job that still holds CircleCI's checkout credentials. **Addressed:** a step now removes `~/.ssh` and resets `origin` to the public HTTPS URL before any PR-tree script runs. Residual conditions (Founder setup): the CircleCI project must have **no** project/context environment variables and the checkout key must be read-only; the pilot only accepts a `pr_number` for PRs the Founder has named. Repository is public and the job holds no secrets, so exposure is limited to the read-only checkout key.
