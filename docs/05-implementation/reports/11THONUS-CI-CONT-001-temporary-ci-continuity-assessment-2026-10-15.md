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

---

# Addendum — 11THONUS-CI-CONT-002C: HOLD Disposition and Handover (2026-10-16)

**Disposition: TEMPORARY CI PILOT — HOLD.** Founder decision. This is a temporary CI continuity pilot during a GitHub Actions billing interruption; GitHub Actions remains the intended primary CI provider. Nothing here is a permanent provider selection.

## C2C-1 Why the pilot is on hold

CircleCI onboarding is **blocked by an unresolved account/organization discovery issue. No root cause is confirmed.**

| Evidence (reported by Founder, 2026-10-16) | Source |
| --- | --- |
| The `github/Fkenogo` organization is visible in the CircleCI browser UI | Browser |
| `circleci org list` returns `No organizations found` under the authenticated CLI session | CLI |
| `circleci onboard --scan --org gh/Fkenogo` does not discover the existing organization and offers to **create a new one** | CLI |
| The Founder **cancelled** onboarding; no organization was created | Founder |
| Earlier (CONT-002A): Fastest setup modal cannot select a config branch, Set Up Project stays disabled, refresh does not help; Project Setup → Add Pipeline unreachable because the unconfigured repo routes back to the setup modal | Browser |
| Earlier (CONT-002B): docs direct `github/` orgs to `circleci onboard`; `circleci project create` and `circleci pipeline create` do not bootstrap an uninitialised GitHub OAuth project | Official docs / CLI help |

Hypotheses only (none confirmed): the CLI session authenticated to a different CircleCI identity or token scope than the browser session; the OAuth-type org is not enumerated by the CLI's org listing; or the OAuth app's repository/organization access differs from the GitHub App's. Creative Engine's separate execution-time HTTP 403 may or may not share a cause; this is unproven.

## C2C-2 State confirmation (2026-10-16)

| Item | Status |
| --- | --- |
| New CircleCI organization / project / paid resource created by the agent | **None.** The agent has no CircleCI account access; the Founder confirms onboarding was cancelled before creating an organization |
| CircleCI checks/statuses on pilot head `1d928ac` | **0 check-runs, 0 statuses** (GitHub API) |
| CircleCI credits used | **0** |
| `main` | unchanged (`b3cb64ee…`); no branch protection or permission change |
| `.github/workflows/ci.yml`, application code, dependencies, lockfile | unchanged |
| PR #312 head | **`73575800df6dfada8980fef5d9c83b43d2af7464`** — unchanged, `OPEN`, `CLEAN`, base `feat/ea-bl-001-corr-002-b-staff-counter`; **not merged** |
| PR #307 | `OPEN`, head `023bf3ef599d27fcd998043c0bca6926aa82356e` — unchanged; #312 depends on it |
| GitHub Actions at the #312 head | still never started (two `workflow_dispatch` runs failed in ~5 s: billing lock) |

## C2C-3 Preserved artifacts

- `.circleci/config.yml` on branch `docs/ci-cont-001-circleci-assessment` @ `1d928ac`: **validated** with the official CLI (`circleci config validate`), exact-head logic exercised locally (match / stale SHA / non-numeric PR / empty / malformed), credentials scrubbed before PR-tree execution, pipeline values passed through `environment:`. Not modified in this step.
- Local evidence at `73575800…` (§C2-2): e2e 149/149, web 1155/1155, PostgreSQL 813/813, emulator validation 877 passed / 3 skipped, build/lint/format/typecheck pass; earlier timeouts classified as host-load exhaustion.

## C2C-4 Remaining verification gaps

1. **Independent hosted CI has not run** at `73575800…` (CircleCI blocked; GitHub Actions blocked by billing).
2. **Cross-project port-isolation acceptance (mandatory step of `ci.yml`) has no passing evidence at this SHA anywhere.** Locally it fails at start with `EADDRINUSE 127.0.0.1:4000` because another project's Firebase emulator holds legacy ports 4000/9099. It can be run locally once those ports are free (a Founder decision: stop the other project's emulator), or hosted.
3. The merge assessment in §C2-7 is unchanged: CircleCI exact-head verification **No**; GitHub Actions pass **No**; GitHub permits merging technically (into #307's branch) but **governance does not permit** it.

## C2C-5 Resume procedure (if the account issue is resolved)

Preconditions: GitHub Actions still unavailable; Founder re-authorises the pilot; #312 head re-checked.

1. Re-check #312 head; if it is not `73575800…`, restart from the new SHA.
2. Resolve account discovery: confirm the CLI is authenticated as the same identity that owns the `github/Fkenogo` organization in the browser (`circleci org list` must list it). If it cannot, contact CircleCI support with the evidence in §C2C-1. Do not create a second organization.
3. Initialise the project with the documented route for `github/` organizations (`circleci onboard --scan --org gh/Fkenogo` from the pilot-branch worktree), or the web setup if branch selection works. Do **not** run any printed git commit/push commands (the config is already committed), and remove any all-pushes trigger immediately.
4. Trigger **one** manual run: branch `docs/ci-cont-001-circleci-assessment`, parameters `expected_sha=73575800df6dfada8980fef5d9c83b43d2af7464`, `pr_number=312`.
5. Collect pipeline URL, `exact-head-evidence.txt`, per-step results, cross-project acceptance result, and credits; complete the matrix in §C2-6; issue a final disposition.

Alternative if still blocked and time-critical: free GitHub Actions minutes returning (billing resolution) supersedes the pilot entirely, and a single run of `ci.yml` via `workflow_dispatch` at the #312 SHA provides the authoritative check.

## C2C-6 Remaining risks

Unproven hosted assumptions (JDK 21 apt install, Postgres secondary image on 28110, `large` credit rate, branch handling for manual runs); CircleCI account/org mismatch unresolved; the stacked-PR dependency on #307; the pilot branch is unmerged and the prototype must not drift from `ci.yml`.

## C2C-7 Rollback

Nothing needs rollback in CircleCI (no project/org created). To remove the prototype: delete `.circleci/` and this branch (`docs/ci-cont-001-circleci-assessment`), or simply do not merge it. If a CircleCI project is later created: delete its trigger and pipeline, revoke the GitHub App repository access, then remove `.circleci/`.

---

# Addendum — 11THONUS-CI-CONT-003: Temporary CircleCI OAuth Activation Preparation (2026-10-16)

**Status:** CI-CONT remains on **HOLD** until Founder authorisation. This addendum prepares — and does not execute — one hosted run. It is a temporary CI continuity pilot, not a permanent provider selection; GitHub Actions remains the intended primary CI. Earlier HOLD history (§C2C) is preserved.

**Disposition: GO — Ready for one Founder-authorised hosted run** (hosted-only unknowns listed in §C3-9 are what the run exists to prove).

## C3-1 Directive and entry state

Miledge's central CircleCI organisation `gh/Fkenogo` is operational, and Miledge Creative Engine completed an independent hosted pilot with the GitHub OAuth API-trigger model (build #2: 321 Python tests, 7 JSON Schemas, exact commit verified, non-default config branch, no deployment, free plan). That proves central feasibility only. 11thONUS workload compatibility (Node/pnpm/JDK/Firestore emulator/PostgreSQL/Playwright) is unproven until a hosted run.

Entry: worktree `/Volumes/PRODUCTION/Projects/11THONUS-worktrees/ci-cont-001`, branch `docs/ci-cont-001-circleci-assessment`, clean, head `0bf306c`. The main checkout has unrelated uncommitted work (left untouched). `ci.yml` identical to `main`.

## C3-2 PR state (re-queried 2026-10-16)

| PR | Head | Branch → base | State | Threads |
| --- | --- | --- | --- | --- |
| #312 | `73575800df6dfada8980fef5d9c83b43d2af7464` (**unchanged**; `refs/pull/312/head` identical) | `feat/loy-item-circle-pkg-b-schema` → `feat/ea-bl-001-corr-002-b-staff-counter` | OPEN / CLEAN | 0 / 0 unresolved |
| #307 | `023bf3ef599d27fcd998043c0bca6926aa82356e` (unchanged) | `feat/ea-bl-001-corr-002-b-staff-counter` → `main` | OPEN / CLEAN | 4 / 0 unresolved |

#312 is stacked on #307 (2 commits above its head). Neither is merged; nothing was merged.

## C3-3 GitHub App → OAuth API-trigger corrections

| Previous (CONT-002) | Problem under the OAuth API model | Correction |
| --- | --- | --- |
| `pipeline.event.github.pull_request.head.sha` / `.number` / `pipeline.event.name` fallbacks | GitHub-App-only values; empty/unavailable on OAuth API triggers | **Removed.** Only `pipeline.parameters.expected_sha` and `.pr_number` (+ `pipeline.id`, `.number`, `.git.*` for evidence) remain |
| Workflow `when: or:[expected_sha, event head sha]` | depends on App event | `when: << pipeline.parameters.expected_sha >>` — verified: with no parameters `config process` yields `jobs: {}` and no workflow, so any plain push starts nothing and spends no credits |
| `checkout` step (deploy-key SSH) then fetch via `origin` | would load a CircleCI checkout key into the job; credentials had to be scrubbed *after* load | **No `checkout` step.** The repo is public, so the job `git init`s and fetches `refs/pull/<n>/head` (depth 1) **anonymously over HTTPS** with git config/credential helpers disabled. No key is ever loaded; a first step asserts none is reachable |
| Optional PR number; no allowlist | any open PR could be run | `pr_number` required, `^[1-9][0-9]{0,6}$`, and **allowlisted to 312** for this pilot |
| Parameters in shell text (earlier) / `<<` in commands | injection risk | every pipeline value enters via quoted `environment:`; commands contain no `<<` |
| Free-text evidence | not machine-readable | structured JSON artifact `exact-head-evidence.json` (written on PASS and FAIL via `trap`) |
| `config.branch` vs `checkout.branch` | OAuth rejects differing values (Creative Engine finding) | trigger sets both to the pilot branch; irrelevant to the tested tree, which the job fetches itself |

CircleCI's own pipeline checkout/revision (`pipeline.git.revision`, the config commit) is recorded in the evidence as `config_revision_NOT_VERIFIED_AS_TESTED_CODE` — a check attached to the configuration commit is **not** verification of the application commit.

## C3-4 Exact-head proof and local validation

Order of checks (any failure exits 1 and writes a FAIL evidence record): (1) `expected_sha` is 40 lowercase hex; (2) `pr_number` valid and allowlisted; (3) live GitHub PR head (public API) exists, PR is **open**, and equals expected; (4) anonymous fetch of `refs/pull/<n>/head` equals expected; (5) after `checkout --detach FETCH_HEAD`, `git rev-parse HEAD` equals expected. Evidence JSON fields: `result`, `reason`, `pr_number`, `expected_sha`, `live_pr_head_sha`, `fetched_sha`, `checked_out_sha`, CircleCI `pipeline_id`/`pipeline_number`/`workflow_id`/`job`/`build_num`/`build_url`/config branch+revision, UTC timestamp. No credentials are read or written.

Executed locally against the real GitHub API/PR ref (step extracted from the validated YAML, run with `env -i` and a sandbox `HOME`):

| Case | Result |
| --- | --- |
| Positive: PR 312 + `73575800…` | **PASS** rc 0; evidence `expected = live = fetched = checked-out` |
| Stale SHA (`023bf3e`, PR 312) | FAIL rc 1: live PR head ≠ expected |
| Malformed SHA / uppercase SHA / empty | FAIL rc 1 |
| Invalid PR `0` / `312;touch /tmp/PWNED` / empty | FAIL rc 1; **no file created** |
| Injection in SHA (`…$(touch /tmp/PWNED2)`) | FAIL rc 1; no file created |
| Nonexistent PR 9999999 | FAIL rc 1 (cannot read PR) |
| PR 307 + its own head | not applied in the pilot: rejected by the new allowlist (PR 307 ≠ 312) |
| Credential-assert step: clean env / `MY_API_TOKEN` present / `CIRCLE_OIDC_TOKEN` only | OK / **FAIL** (names only printed) / OK (reserved) |

`circleci config validate` → **valid**; `config process` → OK; with `--pipeline-parameters` the substituted values appear correctly. Not locally testable: fetched-SHA ≠ live-SHA race, and CircleCI-side execution of any step.

## C3-5 Authentication and credential isolation

1. OAuth jobs normally use a deploy/user key for `checkout`. **This job does not call `checkout`**, so a checkout key is not required and, by design, not loaded. The repo is public, so anonymous HTTPS is sufficient; a read-only key would be the fallback if the repo becomes private.
2. Defence in depth: the first step runs `ssh-add -D`/`ssh-add -l` (fails if any identity is loaded), deletes `~/.ssh`, `~/.gitconfig`, `~/.git-credentials`, and git runs with `GIT_CONFIG_GLOBAL=/dev/null`, `GIT_CONFIG_SYSTEM=/dev/null`, `GIT_TERMINAL_PROMPT=0`.
3. Project/context environment variables: not visible to the agent (no CircleCI access). The first step **fails the job** if any environment variable name matching `TOKEN|SECRET|PASSWORD|PASSWD|API_KEY|PRIVATE|CREDENTIAL` (excluding CircleCI-reserved `CIRCLE_*`) exists. Founder should also confirm the project has no variables/contexts attached.
4. **Residual:** CircleCI injects reserved `CIRCLE_OIDC_TOKEN*` into jobs; they could be read by PR code. No cloud trust relationship exists for this org/project as far as the repo shows, so the token is inert, but the Founder should confirm no OIDC-trusting cloud role is configured for `gh/Fkenogo`.
5. Hosted PR code runs with no secrets by design; STOP if the assert step fails.

## C3-6 Mandatory equivalence matrix (source: `.github/workflows/ci.yml` @ `main`, identical at #312)

| GitHub Actions requirement | CircleCI equivalent | Method | Covered |
| --- | --- | --- | --- |
| Checkout of PR head | anonymous fetch + exact-head gate (§C3-4) | `git fetch refs/pull/312/head` | Yes (stricter) |
| pnpm 9.15.9 | `npm i -g pnpm@9.15.9` | install | Yes |
| Node 20 | `cimg/node:20.19` | image | Yes |
| `pnpm install --frozen-lockfile` | same | script | Yes |
| `pnpm build` | same | script | Yes |
| `pnpm lint` | same | script | Yes |
| `pnpm format:check` | same | script | Yes |
| `pnpm typecheck` | same | script | Yes |
| `pnpm test` (functions + web unit/component) | same | script | Yes |
| JDK 21 + `java -version` | `apt openjdk-21-jre-headless` (available on jammy and noble) + `java -version` | apt | Yes (apt install proven only hosted) |
| PostgreSQL service `postgres:16-alpine`:28110 | secondary image, `command: postgres -p 28110`, same creds/DB; readiness loop | container | Yes (networking proven only hosted) |
| PostgreSQL integration under Firestore emulator | identical `firebase emulators:exec` command | script | Yes |
| `playwright install --with-deps chromium` | same | script | Yes |
| `pnpm test:e2e` | same | script | Yes |
| `pnpm test:preview-tooling` | same | script | Yes |
| Cross-project port-isolation acceptance (+ `CREATE DATABASE …_local`) | same step, same env | script | Yes (**first-ever execution anywhere at this SHA is the hosted run**) |
| Stop Founder Preview (`if: always`) | `when: always` | script | Yes |
| `pnpm emulators:validate` | same | script | Yes |
| Failure diagnostics artifacts | `store_artifacts … when: always` (playwright-report, test-results, preview logs, evidence JSON) | artifacts | Yes (firebase-debug logs not collected) |
| Security/contract checks | none separate in `ci.yml`; Firestore rules/contract tests run inside `pnpm test` and `emulators:validate` | n/a | Covered via above |
| Concurrency cancel, `push`/PR triggers, `ubuntu-latest` | not replicated (manual single run) | — | Intentional |

Added vs GitHub: `CI=true` env, exact-head gate, credential assert. No test, assertion, threshold or timeout was weakened; only `no_output_timeout` (CircleCI's silence watchdog, default 10 min) was raised on long silent suites (unit 20m, PostgreSQL 25m, e2e/emulators 20m) — because the PostgreSQL suite ran 234–729 s locally.

## C3-7 Resources and credits

- **Docker `large`:** 4 vCPU / 8 GB, **20 credits/min (Gen1) or 24 (Gen2)** — CircleCI price list (circleci.com/product/features/resource-classes). Free plan includes Docker small–large and 30,000 credits/month (pricing page, CONT-001). Not verified in this pass (docs page 404): disk size, concurrency (30 on Free per pricing page) and whether secondary containers share the 8 GB (standard CircleCI behaviour: yes — assume shared).
- **Local peak memory (sum of RSS of each stage's process group, ps-sampled 2 s):** unit 1,693 MB; PostgreSQL+emulator 411 MB; e2e 715 MB; `emulators:validate` 898 MB. Caveat: this undercounts children that leave the process group (Chromium helpers, possibly the JVM) and double-counts shared pages. Stages run sequentially; add ~0.2 GB for the Postgres container and a generous 3× undercount factor ≈ 5 GB worst stage < 8 GB. **OOM risk judged low but not proven**; 4 vCPU means fewer vitest/Playwright workers than the 8-core host.
- **Runtime estimate:** GitHub 16.5–17.7 min; CircleCI add apt/JDK/pnpm install (no caching) ⇒ **~22 min (range 18–30)**.
- **Cost:** 22 min × 20 = **~440 credits**; at 24 = **~530**; 30 min × 24 = 720 worst case. Free allowance 30,000 ⇒ **1.5–2.4 %**.
- **Retry budget:** one initial run, plus at most **one** diagnosed retry (≤ ~1,440 credits worst case, ≤ 4.8 %). No automatic retries (workflow has none; do not enable "rerun").

## C3-8 PostgreSQL / Firebase / browser compatibility

- PostgreSQL `postgres:16-alpine` is the same image as GitHub's service container; `command: ["postgres","-p","28110"]` keeps `localhost:28110` (secondary containers share the primary's network namespace). Readiness via `pg_isready` loop (30×2 s). Database `eleventhonus_platform_test` from `POSTGRES_DB`; the `_local` database is created by the acceptance step as in `ci.yml`. Tests own migrations/fixtures. No managed database introduced.
- Firebase: Emulator Suite via repository `firebase-tools`, project `demo-11thonus`, ports 28101–28108 from `firebase.json`; no credentials or production resources. JDK 21 via apt.
- Browser: `playwright install --with-deps chromium` (apt via passwordless sudo in `cimg`); Playwright 1.61.1 pinned by lockfile — local run needed no dependency change.
- `cimg/node:20.19` is built on `cimg/base:2025.10` (OS release not confirmed; `openjdk-21-jre-headless` exists on both Ubuntu 22.04 and 24.04).

## C3-9 Remaining acceptance gaps and risks

1. **Cross-project acceptance: no pass anywhere at `73575800…`.** Still not runnable locally (another project's Firebase emulator holds ports 4000/9099); the hosted run is its first execution. If it fails there, diagnose (likely product/test) before retry.
2. Unproven until hosted: apt JDK install, secondary-container networking on 28110, Gen1-vs-Gen2 credit rate, memory headroom, the OAuth `pipeline/run` contract with `parameters` strings.
3. GitHub Checks: the pipeline attaches status to the **configuration branch commit**, never to PR #312's head; the evidence is the pipeline URL + `exact-head-evidence.json`.
4. OIDC token residual (§C3-5), unknown project env vars (guarded in-job).
5. Prototype drift from `ci.yml` (short lifetime). GitHub Actions at #312 still never started.

## C3-10 Proposed API trigger (NOT executed — Founder-run)

Prerequisites checked by the Founder before running: pilot-branch head matches the commit named at authorisation and is pushed; `gh/Fkenogo/11THONUS` OAuth pipeline exists; Project Settings shows **no environment variables and no contexts**; plan = Free; and #312 is still `73575800…` (`gh pr view 312 --json headRefOid`).

Obtain the pipeline definition ID read-only from Project Settings → Pipelines (or `circleci pipeline list --project gh/Fkenogo/11THONUS`). Put the token in a Founder-held variable without echoing it:

```bash
read -rs CIRCLE_TOKEN && export CIRCLE_TOKEN   # Founder-held personal API token; never paste into docs/chat
DEFINITION_ID="<pipeline-definition-uuid>"
curl --fail-with-body -sS -X POST \
  "https://circleci.com/api/v2/project/gh/Fkenogo/11THONUS/pipeline/run" \
  -H "Circle-Token: $CIRCLE_TOKEN" -H "content-type: application/json" \
  -d "{\"definition_id\":\"$DEFINITION_ID\",
       \"config\":{\"branch\":\"docs/ci-cont-001-circleci-assessment\"},
       \"checkout\":{\"branch\":\"docs/ci-cont-001-circleci-assessment\"},
       \"parameters\":{\"expected_sha\":\"73575800df6dfada8980fef5d9c83b43d2af7464\",\"pr_number\":\"312\"}}"
unset CIRCLE_TOKEN
```

Equivalent CLI (uses the CLI's own stored credential): `circleci pipeline run --project gh/Fkenogo/11THONUS --definition-id "$DEFINITION_ID" --branch docs/ci-cont-001-circleci-assessment --param expected_sha=73575800df6dfada8980fef5d9c83b43d2af7464 --param pr_number=312`.

Contract basis (CircleCI API v2 reference): `POST /project/{provider}/{organization}/{project}/pipeline/run`, `Circle-Token` header, body `definition_id`, `config`, `checkout`, `parameters`; endpoint supports `github_oauth` definitions; parameter limits 100 entries / 128-char keys / 512-char values (met). `config.branch` = `checkout.branch` follows the Creative Engine OAuth finding. GitHub App trigger syntax is not used.

## C3-11 STOP / GO criteria

- **GO to run:** all prerequisites above true; Founder explicit authorisation recorded in chat.
- **STOP before running:** #312 or #307 head moved; the pilot-branch head differs from the authorised commit; project has variables/contexts; plan is not Free.
- **STOP during/after:** evidence `result` is FAIL; the assert step fails; any step needs a paid resource; credits exceed 1,500 for one run. Do not re-run without a written diagnosis (classify: application/test defect, environment/config, resource exhaustion, transient, unknown).
- **A CircleCI pass** ⇒ "CircleCI independently verified exact head `73575800…`" — not "GitHub Actions passed", not "merge approved". Merge remains a separate Founder/governance decision; #312 additionally depends on #307.

## C3-12 Rollback

Delete `.circleci/` and the branch `docs/ci-cont-001-circleci-assessment` (or never merge it); remove the pipeline definition/trigger in CircleCI if created; revoke any token created for the pilot. Nothing in `main`, `ci.yml`, branch protection or the application changes.

---

# Addendum — 11THONUS-CI-CONT-003A: Final Security Preflight and Hosted Pilot Readiness (2026-10-16)

**Status:** CI-CONT remains on HOLD until Founder authorisation; nothing was executed on CircleCI and no credits were spent. Earlier sections are preserved; where §C3 conflicts with this addendum, this addendum governs.

**Recommendation: READY FOR ONE HOSTED RUN** (conditions in §C3A-8).

## C3A-1 Credential preflight vs. CircleCI built-ins — corrected

**Finding.** The CONT-003 preflight excluded every `CIRCLE_*` name from its credential check, so it did not reject the OIDC variables — but it was both too loose (any other `CIRCLE_*`-named credential passed) and only matched `TOKEN|SECRET|PASSWORD|PASSWD|API_KEY|PRIVATE|CREDENTIAL` (a project variable such as `DEPLOY_KEY_B64` or `AUTH_HEADER` would have passed).

**Facts established.** CircleCI documents 28 built-in variables (`CI`, `CIRCLECI`, `CIRCLE_BRANCH`, `CIRCLE_BUILD_NUM`, `CIRCLE_BUILD_URL`, `CIRCLE_JOB`, `CIRCLE_NODE_*`, `CIRCLE_OIDC_TOKEN`, `CIRCLE_OIDC_TOKEN_V2`, `CIRCLE_ORGANIZATION_ID`, `CIRCLE_PIPELINE_ID`, `CIRCLE_PR_*`, `CIRCLE_PROJECT_*`, `CIRCLE_PULL_REQUEST(S)`, `CIRCLE_REPOSITORY_URL`, `CIRCLE_SHA1`, `CIRCLE_TAG`, `CIRCLE_USERNAME`, `CIRCLE_WORKFLOW_*`, `CIRCLE_WORKING_DIRECTORY`). Only the two OIDC names contain a credential-like substring. The `cimg/node:20.19` image ENV (read from the registry config blob; names only) is `COMPOSE_SWITCH_VERSION, COMPOSE_VER, DEBIAN_FRONTEND, DOCKER_VERSION, LANG, LANGUAGE, LC_ALL, NODE_VERSION, PAGER, PATH, TERM`, user `circleci`, linux/amd64 — none credential-like.

**Change.** Pattern widened to `TOKEN|SECRET|PASS|KEY|CREDENTIAL|AUTH|PRIVATE|CERT`; the **only** exceptions are the exact names `CIRCLE_OIDC_TOKEN` and `CIRCLE_OIDC_TOKEN_V2` (matched with `grep -Fvx`); names (never values) of every variable are printed for audit; the OIDC variables are removed from all later steps by appending `unset …` to `$BASH_ENV` (CircleCI sources it in every step). A later step only **warns** if an OIDC variable is still visible (the project has no cloud trust, §C3A-3), so an unverifiable `BASH_ENV` behaviour cannot spend the run.

**Local tests** (`env -i`, sandbox `HOME`, step extracted from the validated YAML):

| Case | Result |
| --- | --- |
| All 28 built-ins + image ENV + both OIDC variables | **OK**, rc 0, `$BASH_ENV` gets the unset line, 0 secret values printed |
| + `NPM_TOKEN` / `AWS_ACCESS_KEY_ID` / `DEPLOY_KEY_B64` / `GH_PAT_AUTH` | **FAIL** rc 1, names only |
| + `CIRCLE_API_TOKEN` (non-OIDC `CIRCLE_*`) | **FAIL** rc 1 |
| + `SSH_AUTH_SOCK` | FAIL rc 1 (agent must not exist) |
| `BASH_ENV` unset effect (script-file and `-c` forms, `-eo pipefail`) | tokens gone in later shells and children |

Limitation: one earlier run in my test harness showed the unset not taking effect and I could not reproduce it in three subsequent runs; the job therefore treats a still-visible OIDC token as a warning, not a failure. Real CircleCI containers (Ubuntu bash 5) were not available locally.

## C3A-2 Privileged checkout access

GitHub (read-only API, 2026-10-16): **0 deploy keys, 0 repository webhooks, 0 Actions secrets** on `Fkenogo/11THONUS`; no CircleCI check-runs or commit statuses on any pilot commit or on #312/#307 heads. The pilot job uses no `checkout`/deploy key and fetches the public repo anonymously (§C3-5); it has no push, deploy or write path.

## C3A-3 OIDC trust relationships

- **Repository-accessible configuration:** `git grep` for `oidc.circleci`, workload-identity, `AssumeRoleWithWebIdentity`, `google_iam_workload`, `aws_iam_openid_connect_provider` and similar on `origin/main`, PR #312's head and the pilot branch found **no trust configuration**. The repository contains **no Terraform/Pulumi/CloudFormation/IAM files**; Firebase config is `firebase.json`/`.firebaserc` (projects `eleventh-on-us-dev`, `eleventh-on-us-staging`) and no deploy step exists in the pilot.
- **Confirmed trust: none found in the repository.**
- **Limits:** cloud-side IAM is not visible from the repository. A trust to CircleCI would live in Google Cloud (Workload Identity Federation) or AWS IAM (OIDC provider), keyed to issuer `https://oidc.circleci.com/org/080a287a-9598-4485-903b-128d09bd08b7`. I did not query any cloud account (not repository-accessible; not authorised). **Founder check:** in Google Cloud for `eleventh-on-us-dev` / `eleventh-on-us-staging` open IAM & Admin → Workload Identity Federation, and in any AWS account IAM → Identity providers; confirm no provider uses that issuer or `oidc.circleci.com`. If none exists, the OIDC token is inert even if read. The job additionally unsets it for all PR-code steps.

## C3A-4 Project secrets, contexts and permissions (read-only CircleCI CLI, Founder's authenticated session)

| Item | Result |
| --- | --- |
| Organisation | `Fkenogo` (`080a287a-9598-4485-903b-128d09bd08b7`, github) |
| Project | `gh/Fkenogo/11THONUS`, id `1492ff55-d8ea-4321-9e04-d8c4088c4b72`; CircleCI's recorded default branch is `master` (the repository's is `main`) — not relied on, both branches are passed explicitly |
| Project environment variables | **0** (names listed only; no values read) |
| Org contexts | **0** |
| Pipeline runs ever | **0** (`circleci run list`: none; no credits spent) |
| Deployment permissions | none: no deploy key, no contexts, no cloud credentials, no deploy step in the config |
| Project settings of note | `set-github-status` true; `build-forked-pull-requests` false; `forks-receive-secret-env-vars` true (moot: no secrets); `disable-ssh` false |
| **Existing OAuth trigger** | one `github_oauth` trigger, event preset **all-pushes**, enabled. Currently inert (no runs; no webhook visible), and on any push the pilot config starts **no workflow** (`when: expected_sha`), so it cannot spend credits or run tests. Other branches have no config. |

**Founder-side checks (not verifiable by the agent):** (1) the above env/context state is still current at run time; (2) optionally disable the all-pushes trigger or accept that other branches may later show CircleCI "no config" statuses; (3) confirm the CircleCI plan is Free and the credit balance; (4) if SSH-rerun is not wanted, set `disable-ssh` (not required for the run).

## C3A-5 Pipeline definition, config branch and checkout branch

`circleci pipeline list` (read-only) returns **one** definition: id **`3302b753-a65d-53a6-88f4-a745357e1dc1`**, name `11THONUS`, "Implicit pipeline definition associated with an OAuth-based project", config source `github_oauth` `Fkenogo/11THONUS` path `.circleci/config.yml`, checkout source `github_oauth` same repository. The documented API endpoint supports `github_oauth` definitions. OAuth requires `config.branch` = `checkout.branch` (Creative Engine finding); both are set to the pilot branch, whose `.circleci/config.yml` is the file CircleCI compiles. The tested tree is independently fetched by the job, so the checkout branch never determines the tested code. Because the project has a single definition, `definition_id` is unambiguous. This **supersedes the placeholder in §C3-10**:

```bash
read -rs CIRCLE_TOKEN && export CIRCLE_TOKEN   # Founder-held personal API token; never paste into chat/docs
curl --fail-with-body -sS -X POST \
  "https://circleci.com/api/v2/project/gh/Fkenogo/11THONUS/pipeline/run" \
  -H "Circle-Token: $CIRCLE_TOKEN" -H "content-type: application/json" \
  -d '{"definition_id":"3302b753-a65d-53a6-88f4-a745357e1dc1",
       "config":{"branch":"docs/ci-cont-001-circleci-assessment"},
       "checkout":{"branch":"docs/ci-cont-001-circleci-assessment"},
       "parameters":{"expected_sha":"73575800df6dfada8980fef5d9c83b43d2af7464","pr_number":"312"}}'
unset CIRCLE_TOKEN
```

CLI alternative (stored CLI credential): `circleci pipeline run --project gh/Fkenogo/11THONUS --definition-id 3302b753-a65d-53a6-88f4-a745357e1dc1 --branch docs/ci-cont-001-circleci-assessment --param expected_sha=73575800df6dfada8980fef5d9c83b43d2af7464 --param pr_number=312`. A `200` response means CircleCI ignored the request; `201` means a pipeline was created.

Note (CircleCI docs): a pipeline value that is empty when placed in `environment:` becomes `<nil>`. An empty `pr_number` would therefore arrive as `<nil>` and fail the numeric check (tested), which is fail-closed.

## C3A-6 Revalidation

`circleci config validate` → valid; `config process` → OK; with no parameters the output contains no workflow. Exact-head cases re-run against the real GitHub API with the revised config:

| Case | Result |
| --- | --- |
| 312 + `73575800…` | **PASS**, evidence `fetched = checked-out = 7357580` |
| same with an OIDC variable still visible | PASS with a WARNING line |
| stale SHA `023bf3e` for 312 | FAIL (live head ≠ expected) |
| PR 307 + its own head | FAIL (not allowlisted) |
| malformed / uppercase / empty SHA; PR `0` / empty / `<nil>` | FAIL |
| `312;touch /tmp/PWNED`, `…$(touch /tmp/PWNED2)` | FAIL; **no file created** |
| nonexistent PR | FAIL |

All mandatory verification steps are unchanged from §C3-6.

## C3A-7 Heads (re-queried 2026-10-16)

PR #312: `73575800df6dfada8980fef5d9c83b43d2af7464` (unchanged; open, clean, base `feat/ea-bl-001-corr-002-b-staff-counter`). PR #307: `023bf3ef599d27fcd998043c0bca6926aa82356e` (unchanged; open, clean). Configuration branch: `docs/ci-cont-001-circleci-assessment` — the commit that contains this addendum is the one to name at authorisation (see the completion report for its hash); it must equal the remote head when the Founder triggers the run.

## C3A-8 Conditions, risks and rollback

**Run only if:** #312 and #307 heads unchanged; remote config-branch head equals the authorised commit; env vars and contexts still 0; Free plan. **STOP/diagnose-before-retry** rules in §C3-11 stand (one initial run, at most one diagnosed retry, ≤ ~1,440 credits worst case).

**Residual risks:** the first step now fails on any unknown credential-like variable name — a legitimate-but-unlisted built-in would cost ~1 minute (~25 credits) and be visible in the printed name list; OIDC variables are removed best-effort; cloud-side OIDC trust unverified (Founder check §C3A-3); cross-project acceptance still has no pass at this SHA (first execution is hosted); JDK apt install, Postgres networking and memory remain hosted-only unknowns.

**Rollback:** unchanged — delete `.circleci/` and the pilot branch (or never merge); no CircleCI resources were created in this task; revoke any API token used for the run.

---

# Addendum — 11THONUS-CI-CONT-003B: OIDC Isolation Correction and Final Pilot Release (2026-10-16)

**Status:** CI-CONT remains on HOLD until Founder authorisation; nothing was executed on CircleCI, no credits were spent. This addendum **supersedes** the OIDC handling in §C3-5 item 4 and §C3A-1/§C3A-8 (which treated a still-visible OIDC variable as a warning). Earlier sections are preserved as history.

**Recommendation: READY FOR HOSTED PILOT.**

## C3B-1 Inspection of the prior design (`b880a4f`)

The assert step appended `unset CIRCLE_OIDC_TOKEN CIRCLE_OIDC_TOKEN_V2` to `$BASH_ENV`, tolerating a missing `BASH_ENV` (`${BASH_ENV:-/dev/null}`), and the exact-head step only **warned** if a variable was still visible. Fetched application code (`pnpm install` lifecycle scripts onward) therefore could have started with an OIDC token present if the unset had not taken effect. That is not fail-closed and is corrected here. Application code first executes at `pnpm install --frozen-lockfile`; steps before it (git fetch, `npm i -g pnpm`, apt) run no PR code.

## C3B-2 Corrections (all in `.circleci/config.yml`)

1. **Self-verifying `BASH_ENV` isolation.** The assert step now **fails the job** if `BASH_ENV` is unset or not writable, and appends a block that (a) unsets both variables and (b) immediately re-checks and `exit 1`s if either survives (e.g. read-only). Because CircleCI sources `BASH_ENV` in the shell of every step before its command, no step starts with the variables set. (Written with `echo`, not a heredoc: `<<` is CircleCI template syntax.)
2. **Mandatory gate before application code.** A reusable command `oidc_guard` (static message, no values) is inserted **immediately before every step that runs fetched code** — 13 gates: install dependencies, build, lint, format check, typecheck, unit/component tests, PostgreSQL integration, Playwright install, Playwright e2e, preview-tooling tests, cross-project acceptance, preview cleanup, emulator validation. It fails the job if `CIRCLE_OIDC_TOKEN` or `CIRCLE_OIDC_TOKEN_V2` is non-empty. Verified by processing the config with parameters: the gate is step 4, directly before step 5 (install dependencies).
3. **Cleanup step.** `pnpm preview:stop` runs under `when: always` (so a skipped gate cannot protect it); it carries its **own inline** OIDC check.
4. The soft **warning** in the exact-head step was removed.
5. Unchanged: OAuth API-trigger model, `expected_sha`/`pr_number` validation and the #312 allowlist, anonymous HTTPS fetch (no `checkout`, no key), exact-head evidence artifact, credential-name audit (allowing the two OIDC names by exact match only), all mandatory verification steps and commands, `no_output_timeout` values, resource class.

Names of the two variables are the only strings the isolation logic prints; their **values are never read, printed, or written** (no `set -x`, no `env` dump; only variable names are listed).

## C3B-3 Built-ins are not rejected

CircleCI documents 28 built-in variables; the credential audit matches `TOKEN|SECRET|PASS|KEY|CREDENTIAL|AUTH|PRIVATE|CERT` and exempts exactly `CIRCLE_OIDC_TOKEN` and `CIRCLE_OIDC_TOKEN_V2`. No other built-in or `cimg/node:20.19` image variable matches. `BASH_ENV`'s unset of the OIDC pair is a no-op when they are absent and does not touch other `CIRCLE_*` variables. The `CIRCLE_*` variables used by the evidence step (`CIRCLE_WORKFLOW_ID`, `CIRCLE_JOB`, `CIRCLE_BUILD_NUM`, `CIRCLE_BUILD_URL`) remain available.

## C3B-4 Validation

Official CLI: `circleci config validate` → valid. **Important correction to earlier validation:** with no parameters the workflow is removed by its `when`, so `config process` previously expanded **no job body**. Validation is now performed with `config process --pipeline-parameters` (expected_sha, pr_number), which compiles the full job — this exposed (and I fixed) a `<<` heredoc collision that `validate` alone did not report. The processed job has 36 steps, `pipeline` values fully substituted, no stray `<<`.

Isolation tests (`bash -eo pipefail <step file>` with `BASH_ENV`, dummy values `DUMMY-OIDC-VALUE-AAA111/BBB222`, all 28 built-ins and the image ENV present):

| Case | Result |
| --- | --- |
| 1. Built-ins + image ENV + both OIDC dummies, isolation active | assert OK; gate OK; a stand-in application script ran and saw **0** OIDC variables in its shell and in a child `node` process |
| 2. Isolation not applied (empty `BASH_ENV`, assert skipped) | gate **FAIL** rc 1; application script **never ran** |
| 3. Variable survives the unset (pre-seeded read-only) | `BASH_ENV` check **aborts the step** rc 1; application script never ran |
| 4. Built-ins only, no OIDC | assert OK, gate OK, application ran (no false rejection) |
| 5. Unexpected credential name (`NPM_TOKEN`) | assert **FAIL** (name only printed) |
| `BASH_ENV` unset / unwritable | assert **FAIL** rc 1 |
| Cleanup step with an OIDC variable present | inline gate **FAIL** rc 1 |
| Dummy values appearing anywhere in any output | **0** |

Exact-head cases re-run against the real GitHub API with the revised config: positive 312 + `73575800…` **PASS** (fetched = checked-out = `7357580`); stale SHA, wrong/non-allowlisted/invalid PR numbers, malformed/uppercase/empty SHA, `<nil>`, nonexistent PR all **FAIL closed**; injection attempts created no files.

## C3B-5 Remaining risks

- **Same-user process access.** Unsetting removes the variables from the step's environment, not from other same-user processes (e.g. the CircleCI agent), so deliberately hostile PR code could in principle read them from `/proc`. The assert step logs (counts only, never values) how many process environments hold them. This is bounded by: no cloud trust to CircleCI is configured in the repository, PR #312 is the Founder's own change reviewed through the PR process, and the Founder check of Google Cloud/AWS federation (§C3A-3) closes the residual. The OIDC token is inert without such a trust.
- Real CircleCI containers were not available locally; hosted-only unknowns remain (apt JDK install, Postgres networking, memory, cross-project acceptance has no pass at this SHA, first-step failure on an unlisted credential-like variable name costs ~1 minute).
- GitHub Checks attach to the configuration-branch commit, not to PR #312's head.

## C3B-6 Heads and release

PR #312 `73575800df6dfada8980fef5d9c83b43d2af7464` (unchanged, open, clean, base `feat/ea-bl-001-corr-002-b-staff-counter`); PR #307 `023bf3ef599d27fcd998043c0bca6926aa82356e` (unchanged). The API request in §C3A-5 (definition `3302b753-a65d-53a6-88f4-a745357e1dc1`, `config.branch` = `checkout.branch` = `docs/ci-cont-001-circleci-assessment`, parameters `expected_sha=73575800…`, `pr_number=312`) is unchanged and remains **not executed**. The configuration commit to name at authorisation is the final config SHA recorded in the completion report. Rollback is unchanged: delete `.circleci/` and the pilot branch; revoke any token created for the run.

---

# Addendum — 11THONUS-CI-CONT-004: Hosted Run Pre-Execution Checks (2026-10-16)

**Disposition: PILOT BLOCKED — SECURITY OR INFRASTRUCTURE.** The hosted pipeline was **not triggered**; **0 CircleCI credits** were used; no run exists. The Founder's STOP rule applies: two security prerequisites could not be confirmed with authoritative access. Earlier sections are preserved.

## C4-1 Prerequisite results

| # | Prerequisite | Result | Evidence |
| --- | --- | --- | --- |
| 1 | Configuration branch at `f76e95c9b87c0801445c235193ffdc3349eec760` | **Confirmed** | remote head = local head = `f76e95c…`; working tree clean; `ci.yml` unchanged vs `main` |
| 2 | PR #312 at `73575800df6dfada8980fef5d9c83b43d2af7464` | **Confirmed** | open, `CLEAN`, base `feat/ea-bl-001-corr-002-b-staff-counter` |
| 3 | PR #307 remains the stacked dependency | **Confirmed** | head `023bf3ef599d27fcd998043c0bca6926aa82356e`, open; it is #312's base branch |
| 4 | CircleCI Free active, no paid resources | **NOT CONFIRMED** | the CircleCI CLI exposes no plan/billing command; org advanced settings list no plan; the plan page is web-UI only. (Earlier public pricing: Free = $0, 30,000 credits.) |
| 5 | Zero project secrets and contexts | **Confirmed** | `circleci envvar list`: 0; `circleci context list --org gh/Fkenogo`: none; no deploy keys, webhooks or Actions secrets on GitHub |
| 6 | No cloud OIDC trust to CircleCI | **PARTIAL** — see §C4-2 | Google Cloud confirmed clean; AWS not accessible |
| 7 | OAuth pipeline definition and approved request | **Confirmed** | one definition `3302b753-a65d-53a6-88f4-a745357e1dc1`, `github_oauth`, path `.circleci/config.yml`; 0 runs so far; the §C3A-5 request (config.branch = checkout.branch = the pilot branch, `expected_sha`, `pr_number=312`) is unchanged |
| 8 | Job covers all mandatory tests incl. cross-project acceptance | **Confirmed** | processed config (with parameters) has 36 steps: install, build, lint, format, typecheck, unit/component, PostgreSQL+emulator, Playwright install + e2e, preview-tooling, **cross-project acceptance**, preview cleanup, emulator validation, with 13 OIDC gates; unchanged since `f76e95c` |

## C4-2 Cloud-side OIDC trust (authoritative queries, read-only)

**Google Cloud** (authenticated `gcloud`; projects `eleventh-on-us-dev`, `eleventh-on-us-staging`, `eleventh-on-us`): `iam workload-identity-pools list --location=global --show-deleted` returns **[] for all three** (no pools, including deleted); project IAM bindings contain **no** `principal://`/`principalSet://`, `circleci`/`oidc` or public principals (members: 16/6/9); the projects have **no folder or organisation ancestor**, so no inherited bindings. Confirmed: **no Google Cloud trust to CircleCI** for the 11thONUS projects. (Only these three projects were queried; the account lists other, unrelated projects.)

**AWS:** the AWS MCP server and CLI have **no credentials** on this host (`No AWS credentials found`; `~/.aws` has no credential files), so IAM OIDC providers (`oidc.circleci.com/org/080a287a-9598-4485-903b-128d09bd08b7`) **could not be queried**. No AWS dependency exists in 11thONUS (Firebase/Google Cloud only; no IaC or AWS configuration), but absence of AWS trust is **inferred, not verified**, which the directive forbids.

## C4-3 Minimum Founder actions to unblock

1. **AWS:** for each AWS account owned by Miledge (or confirm none exist), run `aws iam list-open-id-connect-providers` (read-only) and confirm none lists `oidc.circleci.com`. Alternatively state in chat that Miledge has no AWS accounts. Do not paste credentials.
2. **CircleCI plan:** in CircleCI → Organization Settings → Plan, confirm **Free**, no payment card, no paid add-on, and note the remaining credits.
3. Reply with explicit confirmation of 1 and 2. The run then needs no further change: it uses the Founder-held CLI session (`circleci pipeline run … --definition-id 3302b753-… --branch docs/ci-cont-001-circleci-assessment --param expected_sha=73575800df6dfada8980fef5d9c83b43d2af7464 --param pr_number=312`), so no token is displayed or stored.

Re-check heads immediately before triggering; STOP if any differs from §C4-1.

## C4-4 Branch pin

This documentation was committed **locally only and not pushed**, so the remote configuration branch remains exactly `f76e95c…` as authorised. Push the documentation commit after the run (it changes no configuration).

## C4-5 Status of PR #312 verification

Unchanged: **not independently verified by CircleCI** (no run), **GitHub Actions never started**, local evidence only (e2e 149/149, web 1155/1155, PostgreSQL 813/813, emulators 877/3 skipped); cross-project acceptance has no pass at `73575800…`. No PR was merged; no branch protection, billing, application or infrastructure change was made.

## C4-6 Rollback

Nothing to roll back in CircleCI (no run, no resources created). Local documentation commit can be dropped with `git reset --hard f76e95c` on the worktree. Pilot removal is unchanged: delete `.circleci/` and the pilot branch.

---

# Addendum — 11THONUS-CI-CONT-004 (resume): MILEDGE-CI-SEC-001 and Trigger Attempt (2026-10-16)

**Disposition: PILOT BLOCKED — SECURITY OR INFRASTRUCTURE.** One trigger attempt was made; CircleCI answered **HTTP 403 `Permission denied`**. **No pipeline was created, no job ran, 0 credits were consumed by the attempt.** Earlier sections (including §C4 and its 'BLOCKED' record) are preserved.

## C4R-1 MILEDGE-CI-SEC-001 (recorded)

The Founder accepted Miledge's AWS OIDC security disposition **MILEDGE-CI-SEC-001**: no AWS account has been created or used across Miledge Ventures or its projects, and Miledge's infrastructure records identify no AWS IAM OIDC provider or role trust associated with the CircleCI issuer. The AWS concern in §C4-2 is treated as **provisionally resolved, subject to contrary evidence**; no AWS resources were created and no further AWS investigation was performed. The Google Cloud findings of §C4-2 (no workload identity pools, no federated/public IAM principals, no inherited bindings for the three 11thONUS projects) stand as authoritative.

## C4R-2 Preflight (re-run immediately before the attempt)

| Check | Result |
| --- | --- |
| Remote configuration branch | `f76e95c9b87c0801445c235193ffdc3349eec760` (pinned; unchanged) |
| Local documentation commit | `a003718` preserved (no reset or overwrite); the worktree's `.circleci/config.yml` equals `f76e95c` |
| PR #312 | `73575800df6dfada8980fef5d9c83b43d2af7464`, open, clean, base `feat/ea-bl-001-corr-002-b-staff-counter` |
| PR #307 (stacked base) | `023bf3ef599d27fcd998043c0bca6926aa82356e`, open |
| CircleCI plan | **Current plan: Free** (Plan → overview, read in the Founder's signed-in browser, read-only): 30,000 credits/mo, resource classes S–L, 5 users; **7 of 30,000 credits used** this cycle (to Nov 15). The \$15 "subscription summary" on that page is the unsubmitted Performance-upgrade calculator, not an active subscription |
| Project environment variables / contexts | 0 / none |
| Pipeline definition | single `github_oauth` definition `3302b753-a65d-53a6-88f4-a745357e1dc1` |
| Existing trigger | one `github_oauth` all-pushes trigger (unchanged, not enabled by this task, cannot start a workflow with this config) |
| Runs before the attempt | none |

## C4R-3 The attempt and its result

Command (CLI, using the Founder's stored CircleCI session — no token read, displayed or stored): `circleci pipeline run --project gh/Fkenogo/11THONUS --definition-id 3302b753-a65d-53a6-88f4-a745357e1dc1 --branch docs/ci-cont-001-circleci-assessment --param expected_sha=73575800df6dfada8980fef5d9c83b43d2af7464 --param pr_number=312`.

Result: `API returned 403: {"message":"Permission denied."}` (exit 4). A follow-up `circleci run list` shows **no runs**. The attempt did not execute any tests, so there is no application result and no exact-head evidence.

## C4R-4 Diagnosis (read-only; no retry)

- **Classification: environment/infrastructure — CircleCI authorisation boundary. Not an application, test or configuration-content failure.**
- The session identity is the repository owner (`Fkenogo`) and the stored token is a *personal* token, so this is not the known "project tokens cannot trigger pipelines" limitation. Read-only calls with the same session succeed (org list, project get, pipeline list, env vars, contexts, run list, trigger list); only the pipeline-trigger write is denied.
- GitHub shows the CircleCI OAuth app authorised for the Founder account (last used within the week); the repository is user-owned, so organisation third-party-app restrictions and SAML do not apply.
- The same 403 class was reported for Miledge Creative Engine's trigger, and the project-setup branch picker stayed empty earlier. These three symptoms are consistent with a shared **CircleCI-side authorisation issue for OAuth pipeline triggering by this CLI session**, but that is a **hypothesis, not a confirmed root cause**.
- No specific configuration/environment correction has been identified, so under the one-retry rule **no second attempt was made**.

## C4R-5 Minimum Founder actions to unblock

1. State which mechanism triggered Creative Engine build #2 successfully (CircleCI web "Trigger Pipeline" with a branch and parameters, or an API call with a personal API token created in the web UI under User Settings → Personal API Tokens). The same mechanism is expected to work here.
2. Either (a) trigger the run from the CircleCI web UI for `gh/Fkenogo/11THONUS` on branch `docs/ci-cont-001-circleci-assessment` with parameters `expected_sha=73575800df6dfada8980fef5d9c83b43d2af7464` and `pr_number=312`, or (b) run the §C3A-5 `curl` with a personal token created in the web UI and held only in a shell variable, or (c) re-authenticate the CLI (`circleci auth login`) and I will make one retry.
3. Send the pipeline URL; the review of the run (SHA evidence, per-step results, cross-project acceptance, credits) then proceeds as planned. Re-check heads before triggering; STOP if any differs from §C4R-2.

## C4R-6 Status, risks, rollback

PR #312 remains **not independently verified by CircleCI**; GitHub Actions never started; local evidence only. No PR was merged; no branch protection, billing, application, `ci.yml` or CircleCI configuration changed; nothing was created in CircleCI or AWS. The documentation commit is local and unpushed so the remote branch stays at `f76e95c` for the pinned run. Rollback: nothing to undo remotely; `git reset --hard f76e95c` drops the local documentation commits; pilot removal unchanged (delete `.circleci/` and the pilot branch).

---

# Addendum — 11THONUS-CI-CONT-005: Project Activation and HTTP 403 Assessment (2026-10-16)

**Status:** hosted CI remains on **HOLD**. Read-only diagnosis (authority MILEDGE-CI-AUTH-001, handover MILEDGE-CI-INFRA-006); nothing was followed, activated, triggered, changed, pushed or spent. Earlier addenda are preserved. **Disposition: CONDITIONAL GO** — a supported minimal activation exists; one account action needs Founder approval, and its side effects must be verified afterwards.

## C5-1 Reconciliation with the central handover

The handover assessed 11thONUS at the older config commit `0bf306c` and flagged GitHub-App `pipeline.event.*` references and the `checkout`+scrub design. Both are **already superseded** by `f76e95c`: no `pipeline.event.*` value remains (`expected_sha`/`pr_number` are authoritative; `when` depends on `expected_sha` only), there is **no `checkout` step** (anonymous HTTPS fetch of `refs/pull/312/head`, no key loaded), plus OIDC isolation (13 gates), credential-name audit, exact-head JSON evidence, and parameter validation. The handover's correct open points that still apply: the project is not followed, no checkout key exists, and a deploy key is "not assumed mandatory for a public repository". Its rule "do not push to a config branch while the project is followed" is honoured (documentation commits stay local).

## C5-2 Evidence: Creative Engine (MCE, succeeded) vs 11thONUS (403)

| Item | Creative Engine | 11thONUS |
| --- | --- | --- |
| Organisation | `gh/Fkenogo` (`080a287a…`) | same |
| Authenticated user / credential | `Fkenogo` (`63294a39…`), personal token in keychain | **same user, same CLI, same token** |
| Operation | `circleci pipeline run --branch <config-branch> --definition-id …` | same command shape |
| Project followed (`project list --following`) | **Yes** | **No** (followed: `klockit`, `miledge-creative-engine`) |
| CircleCI default-branch metadata | `main` (matches repo) | **`master` — stale; GitHub repo default is `main`** |
| GitHub deploy key | **"CircleCI", read-only, verified (id 166636156, added 2026-10-16)** | **none** |
| GitHub webhooks | none | none |
| Pipeline definition | implicit `github_oauth`, `.circleci/config.yml` | same (`3302b753-…`) |
| Triggers | **none** | one implicit `github_oauth` **all-pushes**, enabled |
| Project settings (`disable-running`, `build-prs-only`, …) | all default | identical |
| Env vars / contexts | 0 / none | 0 / none |
| Config / checkout branch | `--branch` sets both (handover §2.5) | identical design |
| Result | build #2 passed | **403 `Permission denied`** |

## C5-3 Root cause of the 403 (most strongly supported, not proven)

Because the **identity, token, CLI and command are identical** to the successful MCE run, a token/identity/permission-scope cause and a request-contract cause are effectively excluded (a contract or type error would also yield 400, not 403, and `disable-running` is false for both). The distinguishing facts are all **project-state**: 11THONUS was never set up/followed, has no CircleCI checkout (deploy) key, and carries stale `master` default-branch metadata. **Most consistent explanation: the project record is "discoverable" but not activated (no VCS checkout authorisation established), so CircleCI refuses to run a pipeline for it.** Documented vs inferred: CircleCI documents that setting up a GitHub OAuth project creates a read-only deploy key and (historically) a push hook, and that the CLI's `project follow` "enables builds"; its user guide separately describes following as a notification subscription. That `follow` performs full activation for an existing OAuth project, and that an unactivated project returns 403 on trigger, are **inferences**, not documented guarantees.

## C5-4 Incomplete setup ("Set up") and the empty branch selector

- The project record exists independently of activation (API returns project ID and an implicit OAuth definition); the browser's **Set up** state means the project is listed from GitHub but not followed/activated.
- The empty selector is **not explained by missing configuration on `main`** (MCE's `main` also has none and its branch-based config works). Candidate causes, none confirmable read-only: (1) the stale `master` default-branch record (the repo default is `main`; GitHub redirects `master`→`main`, so CircleCI's record is out of date); (2) the wizard's GitHub branch lookup runs before activation/with limited authorisation; (3) a large branch list (293 branches; the pilot branch is #60 alphabetically, so pagination alone is unlikely). The wizard is not required: the CLI `pipeline run --branch` selects the config branch directly (MCE precedent).

## C5-5 Following, checkout key and trigger effects

- **Is following required?** Not documented as required, but the only observed difference between a working and a failing project; treat it as the activation step.
- **`circleci project follow --project gh/Fkenogo/11THONUS`:** supported by the CLI for `gh/` OAuth projects ("enable builds"); no-op if already followed. Expected (documented for project setup, unverified for `follow`): CircleCI adds a **repository-scoped read-only deploy key** (admin permission on the GitHub repo is required — the Founder owns it) and possibly a push webhook; it does not touch `main`, the config branch or the existing definition.
- **Is a checkout key needed?** For *our job*: no — it fetches the public repo anonymously. For CircleCI's *own* retrieval of the config branch and pipeline start: unproven; the activation-created deploy key (same arrangement as MCE) is the minimal, documented answer. **Do not add a manual deploy key or any user-level SSH key.**
- **Automatic triggers:** an enabled `all-pushes` OAuth trigger already exists but cannot start a workflow with this config (workflow `when` requires `expected_sha`). After activation it may start pipelines on pushes to *any* branch; branches without config could receive failed or empty CircleCI statuses (no credits). MCE has no triggers; the CLI cannot delete one (`trigger` has only `create`/`list`), so removal is a **Founder UI action** after follow.
- **Credits:** following consumes none; a plain push starts no job.

## C5-6 Minimum corrective procedure (for Founder approval; not performed)

1. **Account action (Founder, as `Fkenogo`, who has admin on the repo):** run `circleci project follow --project gh/Fkenogo/11THONUS`. Affects: the CircleCI project (followed) and the GitHub repository's deploy-key list (one read-only key titled "CircleCI") and possibly its hooks. Reverse: unfollow, delete that key, delete any hook.
2. **Immediately verify (read-only; I can do it):** `circleci project list --following` includes 11THONUS; `gh api repos/Fkenogo/11THONUS/keys` shows only a read-only "CircleCI" key; hooks; project default branch metadata; `circleci run list` still empty.
3. **Remove the all-pushes trigger (Founder, UI):** Project Settings → Triggers/Project Setup → delete the implicit `all-pushes` trigger (to match MCE and prevent unintended builds). Do not push to any 11THONUS branch between steps 1 and 3 where avoidable; never push the local documentation commits to the config branch.
4. Re-read all heads (below), then run **one** pipeline.
5. If the 403 persists after activation: stop and report; do not retry blindly. Next diagnostic is the project's Settings → SSH Keys (checkout keys) and CircleCI support, not a configuration change.

## C5-7 Prepared one-run invocation (NOT executed)

```bash
circleci pipeline run \
  --project gh/Fkenogo/11THONUS \
  --definition-id 3302b753-a65d-53a6-88f4-a745357e1dc1 \
  --branch docs/ci-cont-001-circleci-assessment \
  --param expected_sha=73575800df6dfada8980fef5d9c83b43d2af7464 \
  --param pr_number=312 \
  --json
```

`--branch` is documented as "Branch for config fetch and checkout", i.e. it sets **both** the config and checkout branch, which OAuth requires to be equal (MCE precedent). Heads at this check: config branch `f76e95c9b87c0801445c235193ffdc3349eec760`; PR #312 `73575800df6dfada8980fef5d9c83b43d2af7464` (base `feat/ea-bl-001-corr-002-b-staff-counter`, open); PR #307 `023bf3ef599d27fcd998043c0bca6926aa82356e` (base `main`, open, #312's stacked base). Re-verify before any run.

## C5-8 Remaining uncertainties, risks, rollback

- Whether `follow` alone (vs the wizard) activates an OAuth project and creates the key; whether CircleCI needs the key to fetch the config branch; the cause of the empty selector (stale default-branch record vs lookup) and whether it self-heals after activation; whether the stale `master` metadata affects API runs (handover and design say no).
- Risks: a repository-scoped read-only key and possibly a hook are added to the public repo; push triggers until the all-pushes trigger is removed (no credits); statuses attach to the config commit, not PR #312's head. Cost: following 0 credits; the run ≈ 440–530 credits of 30,000 (7 used).
- Rollback: unfollow the project; delete the "CircleCI" deploy key and any hook in GitHub; delete the trigger if recreated; `circleci auth logout` and revoke the token when the arrangement is retired (handover §9).
- Not changed: configuration, application code, `ci.yml`, branch protection, billing, PRs.

---

# Addendum — 11THONUS-CI-CONT-006: Activate Existing CircleCI OAuth Project (2026-10-16)

**Disposition: ACTIVATED — AWAITING TRIGGER ISOLATION.** Only `circleci project follow --project gh/Fkenogo/11THONUS` was executed. **No hosted pipeline job ran; no credits were consumed by 11THONUS.** The all-pushes trigger is still **enabled**, so per instruction work stops until the Founder removes it. Earlier addenda are preserved.

## C6-1 Entry state (immediately before the action)

| Item | State |
| --- | --- |
| CLI identity / org | `Fkenogo` (`63294a39…`) / `Fkenogo` github (`080a287a…`) |
| Project | `gh/Fkenogo/11THONUS` (`1492ff55…`), CircleCI default branch `master`, **not followed** (followed: `klockit`, `miledge-creative-engine`) |
| Pipeline definition | `3302b753-a65d-53a6-88f4-a745357e1dc1`, `github_oauth` |
| Config branch (remote) | `f76e95c9b87c0801445c235193ffdc3349eec760`; local docs commits `a003718`, `f3f9bdb`, `1638050` intact, worktree clean |
| PR #312 / #307 | `73575800df6dfada8980fef5d9c83b43d2af7464` / `023bf3ef599d27fcd998043c0bca6926aa82356e`, both open |
| GitHub deploy keys / webhooks | none / none |
| Triggers | one `github_oauth` **all-pushes**, enabled |
| Env vars / contexts / runs | 0 / none / none |

Expected side effects (stated before execution): project becomes followed; CircleCI may add a read-only deploy key and a push webhook; definition and trigger unchanged; no job.

## C6-2 Result and verification

`✓ Now following gh/Fkenogo/11THONUS`.

| Check | Result |
| --- | --- |
| Followed | **Yes** (`11THONUS`, `klockit`, `miledge-creative-engine`) |
| CircleCI default-branch metadata | **now `main`** (the stale `master` record was corrected by activation) |
| Pipeline definition | **unchanged**: `3302b753-…`, `github_oauth`, `.circleci/config.yml`, checkout `github_oauth` |
| Deploy key | **created**: title "CircleCI", id `166647185`, `read_only: true`, `verified: true`, added by `Fkenogo` at 2026-10-16T10:03:02Z, last used never. Repository-scoped by GitHub design (same arrangement as Creative Engine, key `166636156`, unchanged) |
| Webhook | **created**: id `699006072`, active, target host `circleci.com`, events `fork, public, pull_request, push, repository` (notification-only; it delivers repository events to CircleCI and grants no repository access) |
| Wider access | none found: one collaborator (`Fkenogo`, admin); no organisation-wide change; no write-enabled key; branch protection still absent (unchanged); Creative Engine's key unchanged |
| Env vars / contexts | 0 / none |
| Plan | **Free** (30,000 credits) |
| Settings | `disable-running` false, `build-prs-only` false, `set-github-status` true (unchanged) |

## C6-3 Pipeline record created by activation (no job, no credits)

Activation immediately created pipeline `ff7d5802-fe47-44dc-9ac8-4f79343147f0` (10:03 UTC) on the repository default branch: phase `ended`, outcome **`not_run`**, error `config-fetch: No configuration was found in your project`, **0 workflows**. CircleCI posted GitHub commit status **`CircleCI Pipeline` = `error`** to `main`'s head `b3cb64eea2132dea661fbe8359a4894d5b9021ff` (GitHub Actions check on that commit remains `success`). `main` has no required checks, so this is cosmetic and was not caused by any change to `main`. **Credits:** the plan page shows 21 of 30,000 used this cycle (7 when last read); the per-project usage table lists only `klockit` and `miledge-creative-engine` — **11THONUS shows no compute**, so the increase belongs to those projects. No hosted job ran for 11THONUS.

## C6-4 Trigger status — STOP

The implicit **"All pushes on 11THONUS"** (`02b48f0a-731c-505d-b821-01a0666e71fd`, `github_oauth`, all-pushes) is **still enabled**. With the webhook now active, a push to any 11THONUS branch will create a pipeline: branches without config get a `not_run` pipeline and an `error` status (no credits); the pilot branch's config starts no workflow unless `expected_sha` is supplied. Creative Engine has no triggers. **Not modified by the agent.**

**Founder steps (UI, as `Fkenogo`):** CircleCI → Projects → `11THONUS` → Project Settings → **Project Setup** (`/settings/project/github/Fkenogo/11THONUS/setup`) → in the **Pipeline "11THONUS"** card find the trigger **"All pushes on 11THONUS"** → **Delete trigger** (or **Edit trigger** and disable, if offered) → confirm the card lists no triggers. Do not add another trigger; do not use "Add pipeline". Until done, avoid pushing to 11THONUS branches and **do not push the local documentation commits**. Then tell me; I will verify `circleci project trigger list` shows none and re-read all heads before any run.

## C6-5 Risks, rollback, next step

- Risks: read-only repo-scoped deploy key and an active webhook now exist on the public repo; push events create no-config pipelines and `error` statuses until the trigger is removed; the `error` status on `main`'s head is cosmetic. No secrets, contexts or write access.
- Rollback: Project Settings → **Unfollow Project**; delete the "CircleCI" deploy key (id `166647185`) and webhook (id `699006072`) in GitHub (Settings → Deploy keys / Webhooks); `circleci auth logout` when retired.
- Next (after trigger isolation is confirmed): the one-run command of §C5-7 with a final head re-check; hosted CI is **not** triggered yet. PR #312 remains unverified by CircleCI; GitHub Actions never ran; no PR merged; no configuration, `ci.yml`, application or branch-protection change.

---

# Addendum — 11THONUS-CI-CONT-006A: Trigger Isolation Verification (2026-10-16)

**Disposition: HOLD** (one unexpected change; everything else verified). Read-only; nothing was triggered, pushed or changed.

| # | Check | Result |
| --- | --- | --- |
| 1 | Project followed and operational | **Yes** — followed (`11THONUS`, `klockit`, `miledge-creative-engine`); CircleCI default branch `main`; `disable-running` false |
| 2 | Pipeline definition | **Unchanged**: single `3302b753-a65d-53a6-88f4-a745357e1dc1`, `github_oauth`, `.circleci/config.yml` |
| 3 | Automatic triggers | **None** (`circleci project trigger list`: "No triggers found") — isolation achieved |
| 4 | Deploy key and webhook as expected | **NO — both are gone.** GitHub: 0 deploy keys, 0 webhooks (key `166647185` and hook `699006072` return 404). CircleCI's SSH Keys page: "No checkout key is currently configured!" Who removed them is not known (Founder action when deleting the trigger, or CircleCI cleanup); the audit endpoint needs a scope not granted. Creative Engine's key (`166636156`, read-only) is unchanged |
| 5 | Config branch | `f76e95c9b87c0801445c235193ffdc3349eec760` (remote); local documentation commits `a003718`, `f3f9bdb`, `1638050`, `86b0f45` intact, worktree clean |
| 6 | PR heads | #312 `73575800df6dfada8980fef5d9c83b43d2af7464` (`feat/loy-item-circle-pkg-b-schema` → `feat/ea-bl-001-corr-002-b-staff-counter`, open, clean); #307 `023bf3ef599d27fcd998043c0bca6926aa82356e` (→ `main`, open); stack unchanged |
| 7 | Plan / credits | **Current plan: Free**; 21 of 30,000 credits used (all klockit/MCE; 11THONUS none) |
| 8 | Env vars / contexts | 0 / none |
| 9 | Additional hosted jobs | None; only the activation-time pipeline `ff7d5802-…` (`not_run`, 0 workflows) |
| 10 | CLI invocation | Unchanged and valid: `circleci pipeline run --project gh/Fkenogo/11THONUS --definition-id 3302b753-a65d-53a6-88f4-a745357e1dc1 --branch docs/ci-cont-001-circleci-assessment --param expected_sha=73575800df6dfada8980fef5d9c83b43d2af7464 --param pr_number=312 --json` (`--branch` = config + checkout branch) |

**Why HOLD.** The project is now in the same checkout-key state as when the 403 occurred (no key), with the only difference being that it is followed. Whether the 403 depended on the key or on following is still unproven. The Founder's pre-conditions listed the key as expected; it is not present.

**Options for Founder disposition:** (A) *probe once as-is*: a repeat 403 creates nothing and costs nothing; if it runs, the key was not needed (our job fetches the public repo anonymously). (B) *restore the Creative Engine arrangement first*: CircleCI → Project Settings → SSH Keys → **Deploy Key → Add Deploy Key** (creates a repo-scoped read-only key and nothing else; no webhook, no trigger needed); reverse by deleting the key in GitHub. Recommended: B only if A returns 403. Please also state whether the key and webhook were removed deliberately.

---

# Addendum — 11THONUS-CI-CONT-007: Controlled Hosted Pilot Attempt (2026-10-16)

**Disposition: PILOT BLOCKED — AUTHORIZATION OR CONFIGURATION (parameter-type contract).** CircleCI **accepted** the manual trigger (the earlier 403 is resolved), loaded the pinned configuration, and rejected the pipeline at configuration compilation because of a parameter-type mismatch. **No workflow or job ran; no application code was fetched or executed; no credits were consumed.** No retry was made. Earlier addenda are preserved.

## C7-1 Preflight (all passed immediately before the trigger)

CLI identity `Fkenogo`; project followed; single definition `3302b753-a65d-53a6-88f4-a745357e1dc1`; **no triggers**; 0 env vars, no contexts; Free plan (21 of 30,000 used at last read); remote config branch `f76e95c9b87c0801445c235193ffdc3349eec760` (worktree config identical); PR #312 `73575800df6dfada8980fef5d9c83b43d2af7464` open, based on PR #307's branch; PR #307 `023bf3ef599d27fcd998043c0bca6926aa82356e` open; config has no `checkout` step and uses the anonymous HTTPS fetch; MILEDGE-CI-SEC-001 recorded (§C4R-1); no runs other than the activation-time `not_run`; local documentation commits intact. (Deploy key and webhook remained absent, per §C6A and the Founder's go-ahead.)

## C7-2 Trigger outcome

The validated command was executed exactly once (`circleci pipeline run … --branch docs/ci-cont-001-circleci-assessment --param expected_sha=73575800… --param pr_number=312 --json`). Response: `triggered: true`, pipeline **`aa547115-3a54-42d6-8cc5-252779d1182b`** (number 2), created 2026-10-16T10:19:19Z, branch `docs/ci-cont-001-circleci-assessment`, **revision `f76e95c`** (so CircleCI fetched the configuration from the pinned non-default branch — the 403 blocker is resolved without a deploy key). CircleCI then ended the pipeline `not_run` with error: `Type error for argument pr_number: expected type: string, actual value: "312" (type integer)`. GitHub received commit status `CircleCI Pipeline` = `error` on the **configuration commit `f76e95c`** (cosmetic; not on PR #312's head, which has no CircleCI status).

## C7-3 Classification and diagnosis

**Configuration/contract issue, not an application, test, environment or resource failure.** The config declares `pr_number` as `string`, as intended; the CLI's `--param key=value` parses `312` as a JSON number and sends an integer. `expected_sha` is unaffected (contains letters, remains a string; a purely numeric SHA would be mis-typed the same way — not the case here). Nothing in the exact-head, OIDC or test logic was reached. Credits: none (0 workflows; the plan's compute is unchanged; 11THONUS has no compute).

State after the attempt: followed; definition unchanged; triggers none; keys 0; hooks 0; env vars 0; contexts none; config branch and both PR heads unchanged; two runs exist, both `ended/not_run`.

## C7-4 Proposed corrections (not implemented; Founder to choose)

- **A (recommended, no repository change):** supply the value as a JSON string so the CLI sends a string: `--param 'pr_number="312"'`. The pinned configuration and all local validation stay valid. A repeat type error would again create no job and cost nothing. Requires explicit authorisation as a new attempt.
- **B (configuration change):** declare `pr_number` as `integer` and keep the existing numeric regex — requires a new config commit on the pilot branch, a push (moving the pin from `f76e95c`), re-running the local validation suite (CLI validate/process with parameters, exact-head and OIDC isolation cases) and re-approval. Heavier; use only if A fails.
- **C:** trigger through the API with a JSON body (`"pr_number":"312"`) using a Founder-held token — not needed unless A fails.

Next action: Founder authorises one attempt with option A (also the first checkpoint for a post-follow 403 recurrence, which did not occur). All other conditions stand.

## C7-5 Status of PR #312

Still **not independently verified by CircleCI** (no job ran); GitHub Actions never ran; local evidence only (e2e 149/149, web 1155/1155, PostgreSQL 813/813, emulators 877 passed/3 skipped); cross-project acceptance has no pass at `73575800…`. No PR merged; no configuration, application, `ci.yml`, dependency or branch-protection change; no key, hook, trigger, project or organisation created. Rollback: none required; Unfollow Project and `circleci auth logout` when the arrangement is retired; local documentation commits can be dropped with `git reset --hard 5084430` if requested.

---

# Addendum — 11THONUS-CI-CONT-007A: Parameter Serialization Check (2026-10-16)

**Disposition: PILOT BLOCKED — TRIGGER OR CONFIGURATION.** The Founder-approved Option A syntax **cannot be verified and is refuted by the CLI source**, so the corrected trigger was **not executed** (per the STOP rule). No pipeline was created, no job ran, 0 credits. Earlier addenda are preserved.

## C7A-1 Preflight

Project followed; definition `3302b753-a65d-53a6-88f4-a745357e1dc1` unchanged; no triggers; 0 env vars, no contexts; Free plan (21 of 30,000 used at last read); remote config branch `f76e95c9b87c0801445c235193ffdc3349eec760`; PR #312 `73575800df6dfada8980fef5d9c83b43d2af7464` open and based on PR #307's branch; PR #307 `023bf3ef599d27fcd998043c0bca6926aa82356e`; runs: only the two earlier `not_run` pipelines.

## C7A-2 Why `--param 'pr_number="312"'` fails

The CLI documentation does not describe `--param` typing, and no dry-run exists. Source of the installed version (`circleci-cli` tag `v1.5.0`, `internal/cmdutil/params.go`, `ParseParams`): `key=value` is split at the first `=`; `true`/`false` become booleans; **any value accepted by `strconv.ParseInt` becomes an integer**; everything else is passed **verbatim as a string**. There is no JSON/YAML unquoting. Consequences: `pr_number=312` → integer (observed failure in CONT-007); `pr_number="312"` → the **five-character string `"312"` including the quote characters** — an actual string, but one the pilot's own check rejects (`^[1-9][0-9]{0,6}$` → "pr_number missing or not a positive integer"). That run would start a job and fail closed in the exact-head step (no application code reached) after about a minute of credits for nothing. No decoration of a numeric value (quotes, sign, zero-padding, spaces) yields a clean string, and the pinned configuration cannot be modified without leaving the `f76e95c` pin.

Verification attempts (all non-creating): `--debug` and loopback-mock probes against nonexistent definition IDs returned `400 uuid4 validation` / `404 Pipeline not found`; the CLI ignores host overrides. Runs remained 2. No token was displayed.

## C7A-3 Options (Founder approval required for either)

- **C′ (recommended): same authenticated CLI session, raw JSON body, no repository change, pin preserved.** `circleci api` sends `-d` verbatim with the stored token (no new token or credential):

```bash
circleci api api/v2/project/gh/Fkenogo/11THONUS/pipeline/run -X POST \
  -H 'content-type: application/json' \
  -d '{"definition_id":"3302b753-a65d-53a6-88f4-a745357e1dc1",
       "config":{"branch":"docs/ci-cont-001-circleci-assessment"},
       "checkout":{"branch":"docs/ci-cont-001-circleci-assessment"},
       "parameters":{"expected_sha":"73575800df6dfada8980fef5d9c83b43d2af7464","pr_number":"312"}}'
```

  (`api…` prefix is sent as given per its help; it matches the documented v2 `pipeline/run` contract and sets config and checkout branch equal as OAuth requires. Not executed. Unverified until used: the exact path handling of the `api` subcommand; a wrong path would return 404 without creating anything.)
- **B: configuration change.** Declare `pr_number` as `integer` (default `0`; the CLI then sends an int64 and the existing regex still applies). Requires a new config commit and push (the pinned SHA `f76e95c` is superseded), local re-validation (CLI validate/process with parameters, exact-head and OIDC isolation cases), and re-approval.
- Tracking: the earlier statement in §C7-4 that `--param 'pr_number="312"'` was a safe free retry is **superseded** by this finding.

## C7A-4 State and rollback

Unchanged: followed project, definition, no triggers/keys/hooks, config branch `f76e95c`, both PR heads, nothing merged; PR #312 remains unverified by CircleCI. Rollback: none required; local documentation commits can be dropped with `git reset --hard 7c9b00d` if requested.

---

# Addendum — 11THONUS-CI-CONT-007B: Typed JSON API Trigger (2026-10-16)

**Disposition: PILOT BLOCKED — API OR CONFIGURATION (credential-audit false positive).** The typed request was accepted and a real job ran, but it failed in its **first** step — before the exact-head check and before any fetched code. **No application code was fetched or executed; no application test result exists.** One request only; no retry.

## C7B-1 Pre-execution verification of `circleci api`

Source of the installed version (`circleci-cli` `v1.5.0`, `internal/cmd/api/api.go`): a path beginning with `api` is sent as given (so `api/v2/project/gh/Fkenogo/11THONUS/pipeline/run` is used verbatim); `-d` is a **raw body sent verbatim**, validated as JSON, `Content-Type: application/json` added, method defaults to POST; authentication is the stored token attached by the same HTTP client (`Circle-Token` header) used by `pipeline run`; only the response body is printed. No type coercion occurs, so `"pr_number":"312"` stays a JSON string (the payload was checked: both parameters `str`). No token was created, printed or logged. Preflight also passed: followed; definition `3302b753-…` unchanged; **no triggers**; 0 env vars; no contexts; **Free plan, 21 of 30,000 credits**; config branch `f76e95c9b87c0801445c235193ffdc3349eec760`; PR #312 `73575800df6dfada8980fef5d9c83b43d2af7464` based on PR #307's branch; PR #307 `023bf3ef599d27fcd998043c0bca6926aa82356e`.

## C7B-2 Run

Request (exactly the approved body) → HTTP success, pipeline **`a50df718-24ee-40ab-bc31-b11ff0b3d9cc`** (number 3), created 2026-10-16T10:32:07Z, revision (configuration) **`f76e95c9b87c0801445c235193ffdc3349eec760`**; workflow `temporary-ci-continuity` `833f60aa-90b7-4668-b474-5bb05ef78443`, job `circleci-continuity-verify` `ed5f7385-1725-4fbd-b827-ed9453ac3c16`. URL pattern: `https://app.circleci.com/pipelines/github/Fkenogo/11THONUS/3`. Duration: workflow 22 s (job 10:32:09–10:32:29).

| Step | Result |
| --- | --- |
| Spin up environment; Container postgres:16-alpine; Preparing environment variables | succeeded (**the secondary container started and the 28110 service container was created**) |
| 101 Assert no checkout credentials or secrets are reachable | **FAILED** (by design: fail-closed) |
| 102 Stop Founder Preview (cleanup) | failed — its own inline OIDC gate correctly refused to run because step 101 never reached the `BASH_ENV` isolation |
| 103 Final exact-head re-assertion; artifact uploads | succeeded (no exact-head evidence file exists: that step never ran) |
| Exact-head verification, install, build, lint, format, typecheck, unit, PostgreSQL+emulator, Playwright, preview tooling, **cross-project acceptance**, emulator validation | **not run** |

## C7B-3 Root cause and classification

Step 101's output: 45 environment-variable **names** (values not printed) and `FAIL: credential-like environment variable names are present: SSH_AUTH_SOCK`. `SSH_AUTH_SOCK` is a standard variable CircleCI sets in every job (the job's SSH-agent socket). My name audit matches `AUTH`, so it rejected a **legitimate built-in**. The real identity assertion in the same step (`ssh-add -l` must list no key) did **not** fail, i.e. no SSH identity was loaded. The run also showed the complete job environment: **no project or context variables**; only CircleCI/image variables, including `CIRCLE_INTERNAL_SCRATCH`, `CIRCLE_INTERNAL_TASK_DATA`, `CIRCLE_SHELL_ENV`, `container`, `HOSTNAME`, `NO_PROXY`, `_` (none credential-like). **Classification: configuration defect in my credential audit (false positive) — not an application, test, environment or resource failure, and not a security event.** My earlier local test deliberately treated `SSH_AUTH_SOCK` as an unwanted name; hosted reality differs.

**Offline check of the proposed rule against the real 45 names:** current rule flags only `SSH_AUTH_SOCK`; the proposed rule (additionally exempt the exact name `SSH_AUTH_SOCK`) flags nothing; a negative control with `NPM_TOKEN`, `DEPLOY_KEY`, `AUTH_HEADER` still flags all three.

## C7B-4 Cost and state

CircleCI plan: Free; credits **21 → 28 of 30,000 (about 7 credits for this 22-second job)** — the only compute used by 11THONUS so far. GitHub received `ci/circleci: circleci-continuity-verify` = `failure` and `CircleCI Pipeline` = `error` on the **configuration commit `f76e95c`**; PR #312's head has no CircleCI status. After the run: triggers none; deploy keys 0; webhooks 0; config branch `f76e95c`; #312 and #307 unchanged and unmerged; no configuration, application, `ci.yml` or branch-protection change.

## C7B-5 Proposed correction (not implemented — Founder approval and a new hosted attempt required)

1. In the assert step, add `-e SSH_AUTH_SOCK` to the exemption `grep -Fvx` list, **keep** the `ssh-add -l` empty-agent assertion, and append `unset SSH_AUTH_SOCK` to the `BASH_ENV` isolation block so PR code never sees the agent socket. Every other credential-like name (including all non-OIDC `CIRCLE_*`) still fails.
2. Re-validate locally: `circleci config validate` and `config process --pipeline-parameters`; rerun the isolation test matrix (including a case with `SSH_AUTH_SOCK` present and no identity → pass; with an identity → fail) and the exact-head matrix.
3. This is a configuration change on the pilot branch: it moves the pin from `f76e95c` and requires pushing the branch (including the local documentation commits) — Founder to approve the pin strategy. Then one further hosted attempt via the same typed `circleci api` request (that request itself worked as designed). Budget: ≤ ~540 credits for a full run.

## C7B-6 Status of PR #312 and rollback

PR #312 remains **not independently verified by CircleCI**; GitHub Actions never ran; local evidence only; cross-project acceptance still has no pass at `73575800…`. Rollback: none required; local documentation commits can be dropped with `git reset --hard fcd56c0` if requested; Unfollow Project / `circleci auth logout` when the arrangement is retired.
