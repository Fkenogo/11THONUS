> **Title:** ENG-P1-001 Formal Closure Report
> **Status:** Governed closure record — see §12 for the current official status
> **Date:** 2026-07-22
> **Governing task:** "ENG-P1-001 Formal Closure, Commit, Push, CI and ENG-P1-002 Readiness"
> **Master Workflow position at start:** v1.0, Active, Phase 1, current work package `ENG-P1-001` (`Approved`), next authorized action `ENG-P1-001-CLOSE` — confirmed via direct file read before any change was made; no conflict found.

## 1. Executive Summary

This report closes out `ENG-P1-001` ("Firebase & Shared Platform Foundation"). All prior gates (implementation, independent Technical Review, review-observation corrections, infrastructure provisioning and its manual-verification closure) were already complete and are not re-litigated here — this task re-verifies them independently, resolves the entangled multi-task working tree, runs full local validation (finding and fixing one genuine, previously-undetected defect), reconciles the Definition of Done, and executes the governed Git sequence up to and including CI verification. See §12 for the exact status this leaves `ENG-P1-001` and `ENG-P1-002` in.

## 2. Master Workflow Entry Check

Confirmed directly against `docs/05-implementation/11thonus-master-workflow.md` (v1.0, Active) before any change: current phase Phase 1; current work package `ENG-P1-001`; current status `Approved`; infrastructure closure criteria satisfied (2026-07-21); next authorized action exactly `ENG-P1-001-CLOSE`; `ENG-P1-002`/`ENG-P1-003` both `Blocked`. No conflicting or overlapping agent activity found. **No conflict — proceeded.**

## 3. Part A — Dirty-Worktree Governance Audit

The working tree at task start mixed three unrelated, never-before-committed work streams accumulated across this entire session:

- **ENG-P1-001** application code, infrastructure evidence reports, and the Master Workflow package (categories A/B/C below);
- **Shared, cumulative tracking documents** (`docs/README.md`, the Engineering Implementation Programme, the Coding-Agent Prompt Register, `docs/changes/IMPLEMENTATION_CHANGES.md`) whose diffs interleaved ENG-P1-001/Master-Workflow edits with edits from an entirely separate, unrelated Loyalty-domain governance track (category D);
- **Standalone unrelated governance/product work** — the Verified Loyalty domain freeze, Decision Sprint 1 (Loyalty Foundations), and their supporting PRD/TRD/Decision-Register/RTM edits and reports (category E) — none of which is committed by this task.

**Classification and disposition:**

| Category | Description | Disposition |
|---|---|---|
| A | ENG-P1-001 application/infrastructure code (`apps/web/src/{config,infrastructure}`, `functions/src/{config,infrastructure}`, `main.tsx`, `functions/src/index.ts`, `.env.example`, `.firebaserc`, `.gitignore`, `pnpm-lock.yaml`, `package.json`) | Staged in full |
| B | ENG-P1-001 evidence reports (7 reports, 2026-07-20/21) | Staged in full |
| C | Master Workflow package (the workflow document + 2 creation/activation reports) | Staged in full |
| D | Shared cumulative tracking docs (README, Programme, Prompt Register, `IMPLEMENTATION_CHANGES.md`, 3 engineering-governance docs) + a narrow set of standalone DEC-TECH-005/DEC-LEGAL-006/authorization evidence documents genuinely prerequisite to `ENG-P1-001` | Staged — see §3.1 for the surgical-staging method used on the 3 files with interleaved unrelated content |
| E | Verified Loyalty freeze/principles, Decision Sprint 1 and its reports, the general cross-programme dependency reassessment, decision-resolution planning, and the PRD/TRD/Decision-Register/RTM/canonical-reference/documentation-changes-log/documentation-conventions/founder-decision-agenda/engineering-transition-d1-agenda edits that carry that unrelated content | **Left uncommitted** — untouched, available for its own future closure task |
| F | None found with genuinely uncertain provenance | — |
| G | None (no generated/unsafe artifacts in the dirty set) | — |

**Stop gate:** did not trigger. Branch `main` was confirmed in sync with `origin/main`/`origin/HEAD` (no unexpected shared-history changes); no sensitive file was present; no other agent was active; every unrelated change was cleanly separable by path or by hunk (see §3.1).

### 3.1 Surgical staging of interleaved files

Three files (`docs/README.md`, the Engineering Implementation Programme, `docs/changes/IMPLEMENTATION_CHANGES.md`) mixed genuinely ENG-P1-001/Master-Workflow-relevant edits with edits belonging to the unrelated Loyalty-domain track, within the same file. Rather than commit the unrelated content (or leave these tracking documents unrepresented in the closure commit), each file's ENG-P1-001/Master-Workflow-relevant hunks were isolated and staged directly into the Git index via `git hash-object` + `git update-index --cacheinfo`, leaving the working tree's full (mixed) content untouched on disk for a future, separate commit. `git add .` / `git add -A` / `git commit -a` were never used; every path was staged individually.

One file, `docs/00-governance/version-1-engineering-baseline-declaration.md`, is included in full (reversing an initial exclusion) because five other files being committed (`version-1-engineering-authorization-record.md`, `version-1-governance-completion-milestone.md`, `docs/README.md`, `IMPLEMENTATION_CHANGES.md`, two Sprint/Phase-0E reports) link to it by name — excluding it would have produced more dangling links across more files than including it does. Its own 5 internal links to `verified-loyalty-governance-freeze-v1.md`/`verified-loyalty-principles.md` (both genuinely Loyalty-domain, excluded) remain unresolved in this commit — a disclosed, narrow, accepted exception, not silently absorbed. A full relative-link validation across every staged markdown file (checked against post-commit repo state, i.e. HEAD ∪ staged paths) confirmed these 6 link instances as the **only** unresolved links in the entire staged set.

**Final staged set: 57 files** (`git diff --cached --stat`), none of which is Loyalty-domain content.

## 4. Part B — Source and Security Review

Independently re-read every ENG-P1-001 production/test file in full:

- **Idempotency:** `getFirebaseApp`/`getAdminApp` reuse an existing app instance rather than re-initializing; `auth.ts`/`firestore.ts`/`storage.ts` each guard their one-time emulator connection with a `WeakSet<FirebaseApp>`.
- **Emulator-only dev connections:** every emulator connection is gated behind an explicit `useEmulator` boolean and hardcoded to `127.0.0.1` on fixed ports — no code path can reach a real backend host.
- **Env validation:** `loadEnv` throws a named-variable error on missing required config outside emulator mode; `parseBoolean` throws on any value other than exactly `"true"`/`"false"` (the AC/CFG-era fix, carried forward, re-verified present).
- **App Check fail-closed:** confirmed — throws outside development when unconfigured; warns and no-ops in development.
- **Admin SDK idempotency/isolation:** confirmed, plus the existing `afterEach` test-isolation fix (`deleteApp` on every `getApps()` entry) is in place.
- **Region:** `PLATFORM_REGION = "europe-west1"` is the single source of truth; `functions/src/index.ts` passes it to `setGlobalOptions` — no other region string appears anywhere in the staged set.
- **No real values/secrets:** `.env.example` is names-only; `.firebaserc` contains only `dev`/`staging` aliases (no `default`/production); a repo-wide secret-pattern scan (API-key patterns, private-key headers, service-account JSON) across every staged file found nothing but the expected `.gitignore` exclusion rule.
- **Deny-by-default Rules:** `storage.rules` is unchanged from the tracked, deny-by-default baseline (not part of this commit — it was never modified).
- **Emulator project:** `demo-11thonus`, confirmed unaffected by any `.firebaserc` change.
- **No unrelated product code:** `main.tsx` and `functions/src/index.ts` contain only platform-init wiring and the pre-existing `ping` placeholder; no domain/business logic present.

No new findings. No secrets reported anywhere in this document.

## 5. Part C — Live Infrastructure Reconfirmation (read-only)

Re-verified directly against both projects, strictly read-only, no mutation performed:

| Check | `eleventh-on-us-dev` | `eleventh-on-us-staging` |
|---|---|---|
| Project state | `ACTIVE` | `ACTIVE` |
| Billing enabled | `true` | `true` |
| Firestore location | `europe-west1` (Native mode) | `europe-west1` (Native mode) |
| Storage buckets | exactly 1, `EUROPE-WEST1`, empty | exactly 1, `EUROPE-WEST1`, empty |
| Cloud Functions | API disabled (`SERVICE_DISABLED`) — none exist | API disabled (`SERVICE_DISABLED`) — none exist |
| Hosting | default site auto-provisioned; live URL returns Firebase's standard "Site Not Found" placeholder — no application content ever deployed | same |
| Web Apps registered | none | none — App Check correctly still deferred |
| Live Storage Rules (Rules API, not local file) | `allow read, write: if false;` (deny-by-default) | `allow read, write: if false;` (deny-by-default) |
| Production project | `eleventh-on-us` exists but **predates this entire session's work**, was found unsuitable for `europe-west1` during the original preflight, and is not referenced by `.firebaserc` — untouched | — |

Live state matches the approved evidence from the 2026-07-21 Manual Storage Verification exactly. **No material difference found — proceeded.**

## 6. Part D — Full Local Validation

| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile` | Pass |
| `pnpm -r run typecheck` | Pass |
| `pnpm lint` | Pass |
| `pnpm format:check` | Pass |
| `pnpm -r run build` | Pass |
| `pnpm -r run test` | **36/36** (34 pre-existing + 2 new, see §6.1) |
| `pnpm test:e2e` | **Failed initially, fixed, now passes** — see §6.1 |
| `pnpm emulators:validate` | Pass — `functions[europe-west1-ping]` initializes at `europe-west1`; `demo-11thonus` confirmed |
| `git diff --check` | Clean — no whitespace errors in the staged diff |
| Doc-link validation (all staged `.md`, post-commit state) | Clean except the 6 disclosed link instances in §3.1 |
| MW/Programme/Register status consistency | Confirmed: all three independently state `ENG-P1-001` = `Approved`, not `Complete`, next action `ENG-P1-001-CLOSE` |
| `.firebaserc` alias validation | `dev`/`staging` only, no `default`/production |
| Secret-pattern scan | Clean (§4) |
| No-unrelated-paths confirmation | Confirmed — 57 staged paths, none Loyalty-domain (§3) |

### 6.1 Defect found and fixed: e2e smoke test crash

`pnpm test:e2e` failed on first run: the app's root heading never rendered. Root cause — `apps/web/src/main.tsx` calls `initializeFirebasePlatform(getAppEnv())` synchronously before any render, and `env.ts`'s `loadEnv` unconditionally throws when required `VITE_FIREBASE_*` variables are missing. No `.env.local` exists in this environment (correctly gitignored; no real project config exists yet — no Web App is registered on either Firebase project, confirmed in §5), so the app crashed before `createRoot().render()` ever ran. This exact command had not been run against the current `main.tsx` wiring by any of the seven prior ENG-P1-001 tasks (they ran `pnpm test` and `pnpm emulators:validate`, never the Playwright browser suite) — a genuine, previously-undetected gap this task's Part D was the first to catch, and would have failed identically in CI.

**Fix (TDD, in-scope — this work package's own files):**
1. `apps/web/src/config/env.ts` — `loadEnv` now computes `useEmulator` first; when required vars are missing *and* `useEmulator` is true, it falls back to a safe, non-secret `DEMO_FIREBASE_CONFIG` (matching the existing `demo-11thonus` emulator convention) and forces `useEmulator: true`, with a `console.warn`. Outside emulator mode, behavior is unchanged (still throws). New tests: `env.test.ts` — RED confirmed (threw instead of falling back), GREEN confirmed after the fix; a paired test confirms the throw-outside-emulator-mode behavior is unchanged.
2. `playwright.config.ts` — the e2e `webServer` now sets `VITE_USE_FIREBASE_EMULATOR=true` for its build/preview process, since the smoke test builds in production mode (`vite build`), where Vite's `DEV` flag is `false` and the emulator-mode signal must be explicit.

Re-verified after the fix: `pnpm test:e2e` passes; full suite (`typecheck`/`lint`/`format:check`/`build`/`test`/`emulators:validate`) re-run clean; no regression.

## 7. Part E — Definition of Done Reconciliation

Evaluated against `docs/06-engineering-governance/definition-of-done.md` §2 (the governing document's 12 criteria — authoritative over this task prompt's approximate "16" reference).

| # | Criterion | Applicable | Evidence | Result | Reason |
|---|---|---|---|---|---|
| 1 | Acceptance Criteria met verbatim | Yes | Implementation Report §1/§9; independently re-verified §4–6 above | **Met** | Firebase client/Admin SDK initialize safely and idempotently; region fixed; emulator-validated |
| 2 | All Required Tests passed | Yes | §6 (36/36 + e2e + emulator) | **Met** | Includes the newly-added e2e-fix tests |
| 3 | Local Validation actually run | Yes | §6, real command output shown, not claimed | **Met** | — |
| 4 | Implementation Report produced in full | Yes | `ENG-P1-001-implementation-report-2026-07-20.md` | **Met** | Predates this task; re-verified accurate |
| 5 | Changes-tracking file updated | Yes | Programme, Prompt Register, `IMPLEMENTATION_CHANGES.md` all updated across this task's chain | **Met** | — |
| 6 | Technical Review Approved, no open corrections | Yes | `ENG-P1-001-technical-review-2026-07-20.md` (Approved with non-blocking observations); all 4 findings (CFG-1/AC-1/AT-1/AD-1) corrected 2026-07-21 | **Met** | Zero Critical/blocking-High findings; zero open corrections |
| 7 | Committed and pushed per Git Workflow | Yes | — | **Pending** | Executed in §8 (Part G) below, after this report's first version was drafted |
| 8 | Founder pulled, verified, deployed | Yes | — | **Not yet reached** | Requires Founder action after push/merge — see §9 (deployment interpretation) |
| 9 | Preview Review passed | Yes | — | **Not yet reached** | Founder-owned, after §8 |
| 10 | Manual Testing Standard passed | No | Programme Phase 1 profile: "Manual QA Requirement: No (automated/emulator validation only at this stage)" | **N/A** | Explicitly not required for this work package |
| 11 | No unrelated files modified | Yes | §3 classification; 57 staged paths, zero Loyalty-domain content | **Met** | — |
| 12 | Risk/rollback notes remain accurate | Yes | Implementation Report §11 rollback guidance re-read; still accurate (no live deploy has occurred that it wouldn't cover) | **Met** | — |

**Deployment interpretation (criterion 8/9):** the Engineering Implementation Programme's own Phase 1 profile defines "Expected Deployment State" for this phase as "development and staging Firebase projects provisioned... production project created but access-restricted" — not an application-code deployment. `ENG-P1-001`'s objective is narrower still: "Firebase projects exist and a client can initialize against them safely," with no business logic and only a pre-existing `ping` placeholder (explicitly "carries no business logic"). Per the Deployment Workflow document, "deployment" in the general sense means assembling and deploying an artifact (Rules, function versions, etc.) for Preview Review — there is no such artifact here worth previewing. Read together, satisfying criteria 8–9 for `ENG-P1-001` specifically means the Founder pulling the merged change and confirming it matches the already-independently-verified provisioned Dev/Staging state (§5) — not running a separate `firebase deploy`. This is consistent with, and does not override, the Programme's own stated Phase 1 deployment expectation. Regardless of this interpretation, criteria 8–9 remain **Pending Founder action** — they cannot be satisfied by a coding agent, and are not marked satisfied here.

## 8. Part G — Git Strategy, Commit, Push

Per Git Workflow §7: the default is a single `main` branch; a feature branch is used when a work package "is large, long-running, or explicitly flagged as higher-risk." `ENG-P1-001` spanned seven prior tasks (implementation, review, corrections, three provisioning attempts/retries, billing/storage completion, manual verification) plus this closure task — clearly large and long-running, matching the precedent set by `ENG-P0-002` (comparably scoped, branch + PR #1). A feature branch was used.

*(This section is completed with the actual commit hash, branch name, and PR link after execution — see the addendum at the end of this report and the corresponding `IMPLEMENTATION_CHANGES.md` entry for the authoritative record.)*

## 9. Part H — CI Verification

*(Completed after push — see addendum.)*

## 10. Part I — Merge Decision

Git Workflow does not explicitly authorize a coding agent to merge a pull request into `main` — it defines the Founder's role as pulling, verifying, and deploying *from* `main`, and states the branch is "protected... so that only the Founder deploys from it." Absent explicit authorization in either the Git Workflow or this task's own prompt to merge autonomously, this task does not merge. *(Final outcome recorded in the addendum.)*

## 11. Excluded / Deferred Work

- The full Verified Loyalty / Decision Sprint 1 / general dependency-reassessment governance backlog (§3, category E) remains uncommitted, exactly as found — excluded from this commit as genuinely unrelated to `ENG-P1-001`, and requires its own dedicated closure task.
- `ENG-P1-002` implementation, `DEC-PROV-005` resolution, App Check configuration, Web App registration, Production project creation, and any application deployment were not started and remain explicitly out of scope.

## 12. Current Official Status

*(Recorded at the end of this task — see addendum. Per the mandated safe progression, this section is not written as `Complete` until commit, push, and required CI evidence all exist.)*

---

## Addendum (completed after Parts G–I execution)

